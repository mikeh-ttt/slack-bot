import { App } from "@slack/bolt";
import { registerHarvestSummary } from "./harvest-summary";
import { registerNudgeSend } from "./nudge-send";
import { registerTimesheetNudge } from "./timesheet-nudge";
import { registerTimesheetReport } from "./timesheet-report";
import { registerLeaderboard } from "./leaderboard";

export function registerAllCommands(app: App, allowed: Set<string>) {
  registerHarvestSummary(app, allowed);
  registerTimesheetReport(app, allowed);
  registerTimesheetNudge(app, allowed);
  registerNudgeSend(app);
  registerLeaderboard(app, allowed);
}
