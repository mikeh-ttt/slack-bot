import { App } from "@slack/bolt";
import cron from "node-cron";
import {
  getActiveHarvestUsers,
  getUserHoursForRange,
} from "../services/harvest";
import { lastWeekRangePT } from "../utils";

let timesheetCheckTask: any = null;

export function registerTimesheetCheckJob(
  app: App,
  allowed: Set<string>,
  schedule: string
) {
  console.log("[CRON] Registering timesheet check with schedule:", schedule);

  // Stop existing task if running
  if (timesheetCheckTask) {
    timesheetCheckTask.stop();
    console.log("[CRON] Stopped previous timesheet check task");
  }

  try {
    timesheetCheckTask = cron.schedule(schedule, async () => {
      console.log("[CRON] Running timesheet completeness check...");
      const { from, to } = lastWeekRangePT();
      try {
        const users = await getActiveHarvestUsers();
        const missing: Array<{ name: string; hours: number }> = [];
        for (const u of users) {
          const hours = await getUserHoursForRange(u.id, from, to);
          if (hours < 35)
            missing.push({ name: u.first_name + " " + u.last_name, hours });
        }
        if (missing.length === 0) {
          const text = `✅ All ${users.length} people logged ≥35h for last week (${from} → ${to}). Great job!`;
          for (const uid of allowed) {
            const dm = await app.client.conversations.open({ users: uid });
            await app.client.chat.postMessage({
              channel: dm.channel!.id!,
              text,
            });
          }
        }
      } catch (err) {
        console.error("[CRON] Error running job:", err);
      }
    });
    console.log("[CRON] ✅ Cron job registered successfully");
  } catch (err) {
    console.error("[CRON] ❌ Failed to register cron job:", err);
  }
}

export function restartTimesheetCheckJob(
  app: App,
  allowed: Set<string>,
  schedule: string
) {
  console.log(
    "[CRON] Restarting timesheet check job with new schedule:",
    schedule
  );
  registerTimesheetCheckJob(app, allowed, schedule);
}
