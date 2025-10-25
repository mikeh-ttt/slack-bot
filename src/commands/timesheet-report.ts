import { App } from "@slack/bolt";
import {
  getActiveHarvestUsers,
  getProjectHours,
  getUserHoursForRange,
} from "../services/harvest";
import { buildManagerBlocks, parseReportArgs, toCsv } from "../utils";
import { COMMANDS } from "../utils/commands";

export function registerTimesheetReport(app: App, allowed: Set<string>) {
  app.command(
    COMMANDS.timesheetReport,
    async ({ ack, body, respond, client }) => {
      await ack();

      if (allowed.size && !allowed.has(body.user_id)) {
        await respond({
          response_type: "ephemeral",
          text: "You're not allowed to run this command.",
        });
        return;
      }

      let from: string, to: string, target: number;
      try {
        const parsed = parseReportArgs(body.text);
        from = parsed.from;
        to = parsed.to;
        target = parsed.target;
      } catch {
        await respond({
          response_type: "ephemeral",
          text: "Format: `/timesheet-report YYYY-MM-DD, YYYY-MM-DD [targetHours]` (or leave empty for last week).",
        });
        return;
      }

      await respond({
        response_type: "ephemeral",
        text: `Building report for *${from} → ${to}* (target: *${target}h*)…`,
      });

      try {
        const users = await getActiveHarvestUsers();

        const BATCH = 12;
        const totals: Array<{ name: string; email: string; hours: number }> =
          [];
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

        const under = totals.filter((t) => t.hours < target);
        const completed = totals.length - under.length;
        const completionRate = totals.length
          ? Math.round((completed / totals.length) * 100)
          : 100;

        await respond({
          response_type: "ephemeral",
          text: under.length
            ? `*Under ${target}h for ${from} → ${to}:* ${under.length}/${totals.length} (completion ${completionRate}%)`
            : `*All at/above ${target}h* for ${from} → ${to} (completion ${completionRate}%)`,
          blocks: buildManagerBlocks(under, from, to, target),
        });

        const usersCsv = toCsv(
          totals
            .slice()
            .sort((a, b) => a.hours - b.hours)
            .map((r) => ({
              name: r.name,
              email: r.email,
              hours: Number(r.hours.toFixed(2)),
            }))
        );

        const projects = await getProjectHours(from, to);
        const projectsCsv = toCsv(
          projects.map((p) => ({
            project: p.name,
            hours: Number(p.hours.toFixed(2)),
          }))
        );

        const dm = await client.conversations.open({ users: body.user_id });
        const chan = dm.channel!.id!;
        await client.files.uploadV2({
          channel_id: chan,
          filename: `timesheet-users_${from}_${to}.csv`,
          title: `Timesheet Users ${from} → ${to}`,
          initial_comment: "Timesheet user totals attached.",
          file: Buffer.from(usersCsv, "utf8"),
        });
        await client.files.uploadV2({
          channel_id: chan,
          filename: `timesheet-projects_${from}_${to}.csv`,
          title: `Timesheet Projects ${from} → ${to}`,
          initial_comment: "Timesheet project totals attached.",
          file: Buffer.from(projectsCsv, "utf8"),
        });
      } catch (err) {
        await respond({
          response_type: "ephemeral",
          text: `Something went wrong building the report: ${err}`,
        });
      }
    }
  );
}
