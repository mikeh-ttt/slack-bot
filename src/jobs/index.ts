import { App } from "@slack/bolt";
import { registerTimesheetCheckJob } from "./timesheet-check";

export function registerAllJobs(app: App, allowed: Set<string>) {
  const CRON_SCHEDULE =
    process.env.TIMESHEET_CHECK_CRON || "0 */1 9-17 * * 1,2";
  registerTimesheetCheckJob(app, allowed, CRON_SCHEDULE);
}
