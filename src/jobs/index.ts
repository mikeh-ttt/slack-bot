import { App } from "@slack/bolt";
import { registerTimesheetCheckJob } from "./timesheet-check";
import { getActiveJobs } from "../services/database";

export function registerAllJobs(app: App, allowed: Set<string>) {
  const activeJobs = getActiveJobs();
  const timesheetJob = activeJobs.find((job) => job.name === "timesheet-check");

  if (timesheetJob) {
    console.log(
      `[CRON] Registering timesheet-check job with schedule: ${timesheetJob.schedule}`
    );
    registerTimesheetCheckJob(app, allowed, timesheetJob.schedule);
  } else {
    console.log(
      "[CRON] timesheet-check job not found in database or is inactive."
    );
  }
}
