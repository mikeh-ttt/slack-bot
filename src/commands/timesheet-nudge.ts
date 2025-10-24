import { App } from "@slack/bolt";
import { parseISO } from "date-fns";
import { getNudgeCountThisWeek } from "../services/database";
import {
  getActiveHarvestUsers,
  getUserHoursForRange,
} from "../services/harvest";
import { DEFAULT_TARGET_HOURS, lastWeekRangePT } from "../utils";
import { COMMANDS } from "../utils/commands";

async function slackIdByEmail(email: string | undefined, web: any) {
  if (!email) return undefined;
  try {
    const r = await web.users.lookupByEmail({ email });
    return r.user?.id;
  } catch {
    return undefined;
  }
}

export function registerTimesheetNudge(app: App, allowed: Set<string>) {
  app.command(
    COMMANDS.timesheetNudge,
    async ({ ack, body, client, respond }) => {
      console.log("[NUDGE] Command invoked by user:", body.user_id);

      if (allowed.size && !allowed.has(body.user_id)) {
        await ack();
        await respond({
          response_type: "ephemeral",
          text: "You're not allowed to run this command.",
        });
        return;
      }

      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          callback_id: "harvest_nudge_modal",
          title: { type: "plain_text", text: "Timesheet Nudges" },
          submit: { type: "plain_text", text: "Generate List" },
          close: { type: "plain_text", text: "Cancel" },
          private_metadata: JSON.stringify({ requester: body.user_id }),
          blocks: [
            {
              type: "input",
              block_id: "week",
              optional: true,
              element: {
                type: "plain_text_input",
                action_id: "from_to_input",
                placeholder: {
                  type: "plain_text",
                  text: "yyyy-mm-dd, yyyy-mm-dd (leave blank for last week)",
                },
              },
              label: { type: "plain_text", text: "Date range (optional)" },
              hint: {
                type: "plain_text",
                text: "Format: FROM, TO. If empty, uses last week (Mon-Sun, Vancouver time).",
              },
            },
            {
              type: "input",
              block_id: "threshold",
              optional: true,
              element: {
                type: "plain_text_input",
                action_id: "threshold_input",
                placeholder: {
                  type: "plain_text",
                  text: `${DEFAULT_TARGET_HOURS}`,
                },
              },
              label: { type: "plain_text", text: "Target hours (optional)" },
            },
          ],
        },
      });

      await ack();
    }
  );

  // View submission: harvest_nudge_modal
  app.view("harvest_nudge_modal", async ({ ack, body, view, client }) => {
    const requester =
      (JSON.parse(view.private_metadata || "{}") as { requester?: string })
        .requester || body.user.id;

    const rangeRaw =
      (view.state.values["week"]?.["from_to_input"] as any)?.value || "";
    const thresholdRaw =
      (view.state.values["threshold"]?.["threshold_input"] as any)?.value || "";

    console.log("[NUDGE] Processing modal submission");
    console.log("[NUDGE] Requester:", requester);

    let from: string, to: string;
    try {
      if (rangeRaw) {
        const [f, t] = rangeRaw.split(",").map((s: string) => s.trim());
        parseISO(f);
        parseISO(t);
        from = f;
        to = t;
      } else {
        const r = lastWeekRangePT();
        from = r.from;
        to = r.to;
      }
    } catch (err) {
      console.log("[NUDGE] Error parsing date range:", err);
      await ack({
        response_action: "errors",
        errors: {
          week: "Invalid date range. Use: YYYY-MM-DD, YYYY-MM-DD",
        },
      });
      return;
    }

    const targetHours = thresholdRaw?.trim()
      ? Math.max(0, Number(thresholdRaw))
      : DEFAULT_TARGET_HOURS;

    console.log("[NUDGE] Date range:", from, "→", to);
    console.log("[NUDGE] Target hours:", targetHours);

    await ack();

    const dm = await client.conversations.open({ users: requester });
    const dmChannel = dm.channel!.id!;

    await client.chat.postMessage({
      channel: dmChannel,
      text: `Generating timesheet report for *${from} → ${to}* (target: *${targetHours}h*)... this may take a moment.`,
    });

    try {
      console.log("[NUDGE] Fetching active Harvest users...");
      const harvestUsers = await getActiveHarvestUsers();
      console.log("[NUDGE] Found", harvestUsers.length, "active Harvest users");

      const BATCH = 12;
      const results: Array<{
        name: string;
        email: string;
        hours: number;
        slackId?: string;
      }> = [];

      for (let i = 0; i < harvestUsers.length; i += BATCH) {
        const chunk = harvestUsers.slice(i, i + BATCH);
        const got = await Promise.all(
          chunk.map(async (u) => {
            const hours = await getUserHoursForRange(u.id, from, to);
            const slackId = await slackIdByEmail(u.email, client);
            return {
              name: u.first_name + " " + u.last_name,
              email: u.email,
              hours,
              slackId,
            };
          })
        );
        results.push(...got);
      }

      console.log("[NUDGE] Processed", results.length, "users");
      const underTarget = results.filter(
        (r) => r.hours < targetHours && r.slackId
      );
      console.log(
        "[NUDGE] Found",
        underTarget.length,
        "users under target with Slack accounts"
      );

      if (underTarget.length === 0) {
        await client.chat.postMessage({
          channel: dmChannel,
          text: `✅ No users found under ${targetHours}h for *${from} → ${to}* with Slack accounts. Everyone's on track!`,
        });
        return;
      }

      const headerBlocks = [
        {
          type: "section" as const,
          text: {
            type: "mrkdwn" as const,
            text: `*Timesheet Report* | ${from} → ${to} (target: ${targetHours}h)\n_Found ${
              underTarget.length
            } ${
              underTarget.length === 1 ? "person" : "people"
            } under target with Slack accounts_`,
          },
        },
        {
          type: "context" as const,
          elements: [
            {
              type: "mrkdwn" as const,
              text: "Click *Send Nudge* to remind someone about their timesheet.",
            },
          ],
        },
        { type: "divider" as const },
      ];

      const sortedList = underTarget.sort((a, b) => a.hours - b.hours);
      const personBlocks = sortedList.flatMap((r) => {
        const nudgeCount = getNudgeCountThisWeek(r.slackId!);
        const nudgeText =
          nudgeCount > 0 ? ` • 📢 ${nudgeCount} nudges this week` : "";

        return [
          {
            type: "section" as const,
            text: {
              type: "mrkdwn" as const,
              text: `*${r.name}*\n${r.email || "no-email"} • ${r.hours.toFixed(
                2
              )}h logged${nudgeText}`,
            },
            accessory: {
              type: "button" as const,
              text: { type: "plain_text" as const, text: "Send Nudge" },
              style: "primary" as const,
              action_id: "nudge_send",
              value: JSON.stringify({
                slackId: r.slackId,
                name: r.name,
                email: r.email,
                hours: r.hours,
                from,
                to,
                targetHours,
              }),
            },
          },
        ];
      });

      const MAX_BLOCKS_PER_MESSAGE = 45;
      const allBlocks = [...headerBlocks, ...personBlocks];

      for (let i = 0; i < allBlocks.length; i += MAX_BLOCKS_PER_MESSAGE) {
        const chunk = allBlocks.slice(i, i + MAX_BLOCKS_PER_MESSAGE);
        await client.chat.postMessage({
          channel: dmChannel,
          text: `Timesheet nudges for ${from} → ${to}`,
          blocks: chunk,
        });
      }

      console.log("[NUDGE] DM with buttons sent successfully");
    } catch (err) {
      console.log("[NUDGE] Error generating report:", err);
      await client.chat.postMessage({
        channel: dmChannel,
        text: `❌ Error fetching data: ${err}\n\nPlease try again or contact support if the issue persists.`,
      });
    }
  });
}
