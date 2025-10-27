import { App } from "@slack/bolt";
import { registerNudgeSend } from "../actions/nudge-send";
import { registerHarvestSummary } from "./harvest-summary";
import { registerLeaderboard } from "./leaderboard";
import { registerManageJobs } from "./manage-jobs";
import { registerTimesheetNudge } from "./timesheet-nudge";

export function registerAllCommands(app: App, allowed: Set<string>) {
  registerHarvestSummary(app, allowed);
  registerTimesheetNudge(app, allowed);
  registerNudgeSend(app);
  registerLeaderboard(app, allowed);
  registerManageJobs(app, allowed);
}
