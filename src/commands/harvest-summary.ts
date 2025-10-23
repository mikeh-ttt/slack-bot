import { App } from "@slack/bolt";
import {
  getActiveHarvestUsers,
  getUserHoursForRange,
} from "../services/harvest";
import { parseSummaryArgs } from "../utils";
import { COMMANDS } from "./constants";

export function registerHarvestSummary(app: App, allowed: Set<string>) {
  app.command(COMMANDS.harvestSummary, async ({ ack, body, respond }) => {
    await ack();
    console.log("calling harvest summary");
    if (allowed.size && !allowed.has(body.user_id)) {
      await respond({
        response_type: "ephemeral",
        text: "You're not allowed to run this command.",
      });
      return;
    }

    let from: string, to: string, target: number;
    try {
      const parsed = parseSummaryArgs(body.text);
      from = parsed.from;
      to = parsed.to;
      target = parsed.target;
    } catch {
      await respond({
        response_type: "ephemeral",
        text: "Format: `/harvest-summary YYYY-MM-DD, YYYY-MM-DD [targetHours]` (or leave empty for last week).",
      });
      return;
    }

    await respond({
      response_type: "ephemeral",
      text: `Generating summary for *${from} → ${to}* (target: *${target}h*)…`,
    });

    try {
      const users = await getActiveHarvestUsers();
      const BATCH = 12;
      const totals: Array<{ name: string; email: string; hours: number }> = [];
      for (let i = 0; i < users.length; i += BATCH) {
        const chunk = users.slice(i, i + BATCH);
        const got = await Promise.all(
          chunk.map(async (u) => ({
            name: u.first_name + " " + u.last_name,
            email: u.email,
            hours: await getUserHoursForRange(u.id, from, to),
          }))
        );
        totals.push(...got);
      }
      const lines = totals
        .slice()
        .sort((a, b) => a.hours - b.hours)
        .map((u) => {
          const h = u.hours.toFixed(2);
          if (u.hours < target) {
            return `• :warning: *${u.name} (${u.email})* — *${h}h*`;
          }
          return `• ${u.name} (${u.email}) — ${h}h`;
        })
        .join("\n");

      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Timesheet hours* (${from} → ${to}, target *${target}h*)\n${lines}`,
          },
        },
      ];

      await respond({
        response_type: "ephemeral",
        text: `Timesheet hours for ${from} → ${to}`,
        blocks,
      });
    } catch (err) {
      await respond({
        response_type: "ephemeral",
        text: `Something went wrong: ${err}`,
      });
    }
  });
}
