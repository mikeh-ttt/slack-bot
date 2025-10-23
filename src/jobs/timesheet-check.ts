import { App } from "@slack/bolt";
import cron from "node-cron";
import {
  getActiveHarvestUsers,
  getUserHoursForRange,
} from "../services/harvest";
import { lastWeekRangePT } from "../utils";

export function registerTimesheetCheckJob(
  app: App,
  allowed: Set<string>,
  schedule: string
) {
  console.log("[CRON] Schedule:", schedule);

  cron.schedule(schedule, async () => {
    console.log("[CRON] Running timesheet completeness check...");
    const { from, to } = lastWeekRangePT();
    try {
      const users = await getActiveHarvestUsers();
      const missing: Array<{ name: string; hours: number }> = [];
      for (const u of users) {
        const hours = await getUserHoursForRange(u.id, from, to);
        if (hours < 36)
          missing.push({ name: u.first_name + " " + u.last_name, hours });
      }
      if (missing.length === 0) {
        // Everyone completed – notify allowed invokers
        const text = `✅ All ${users.length} people logged ≥36h for last week (${from} → ${to}). Great job!`;
        for (const uid of allowed) {
          const dm = await app.client.conversations.open({ users: uid });
          await app.client.chat.postMessage({ channel: dm.channel!.id!, text });
        }
      } else {
        const text = `❌ ${missing.length} people logged <36h for last week (${from} → ${to}).`;
        for (const uid of allowed) {
          const dm = await app.client.conversations.open({ users: uid });
          await app.client.chat.postMessage({ channel: dm.channel!.id!, text });
        }
      }
    } catch (err) {
      console.log("[CRON] Error:", err);
    }
  });
}
