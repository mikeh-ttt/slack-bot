import pkg from "@slack/bolt";
import "dotenv/config";
import { registerAllCommands } from "./commands/index";
import { registerAllJobs } from "./jobs/index";
import { initializeDatabase, closeDatabase } from "./services/database";
const { App, LogLevel } = pkg;

const {
  SLACK_BOT_TOKEN,
  SLACK_SIGNING_SECRET,
  SLACK_APP_TOKEN, // required for socket mode
  HARVEST_ACCOUNT_ID,
  HARVEST_ACCESS_TOKEN,
  ALLOWED_INVOKERS,
} = process.env;

if (!SLACK_BOT_TOKEN) throw new Error("Missing SLACK_BOT_TOKEN");
if (!SLACK_SIGNING_SECRET) throw new Error("Missing SLACK_SIGNING_SECRET");
if (!SLACK_APP_TOKEN) throw new Error("Missing SLACK_APP_TOKEN");
if (!HARVEST_ACCOUNT_ID) throw new Error("Missing HARVEST_ACCOUNT_ID");
if (!HARVEST_ACCESS_TOKEN) throw new Error("Missing HARVEST_ACCESS_TOKEN");

const allowed = new Set<string>(
  ALLOWED_INVOKERS?.split(",")
    .map((s) => s.trim())
    .filter((s) => s) || []
);

console.log(
  `Allowed invokers: ${allowed.size ? Array.from(allowed) : "(none)"}`
);

const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
  appToken: SLACK_APP_TOKEN,
  socketMode: true,
  logLevel: LogLevel.INFO,
});

initializeDatabase();

registerAllCommands(app, allowed);
registerAllJobs(app, allowed);

// ---------- Start ----------
(async () => {
  try {
    await app.start();
    console.log("⚡ Harvest Slack Bot running.");
  } catch (error) {
    console.error("Failed to start Slack bot:", error);
    process.exit(1);
  }
})();

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  closeDatabase();
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  closeDatabase();
  process.exit(0);
});
