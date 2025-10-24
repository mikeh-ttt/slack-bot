import pkg from "@slack/bolt";
import "dotenv/config";
import { registerAllCommands } from "./commands/index.js";
import { registerAllJobs } from "./jobs/index.js";
const { App, LogLevel } = pkg;

const {
  SLACK_BOT_TOKEN,
  SLACK_SIGNING_SECRET,
  SLACK_APP_TOKEN, // required for socket mode
  HARVEST_ACCOUNT_ID,
  HARVEST_ACCESS_TOKEN,
  ALLOWED_INVOKERS,
} = process.env;

if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET || !SLACK_APP_TOKEN) {
  throw new Error(
    "Missing Slack env vars (SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN)."
  );
}
if (!HARVEST_ACCOUNT_ID || !HARVEST_ACCESS_TOKEN) {
  throw new Error(
    "Missing Harvest env vars (HARVEST_ACCOUNT_ID, HARVEST_ACCESS_TOKEN)."
  );
}

const allowed = new Set<string>(
  (ALLOWED_INVOKERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
  appToken: SLACK_APP_TOKEN,
  socketMode: true,
  logLevel: LogLevel.INFO,
});

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
  process.exit(1);
});
