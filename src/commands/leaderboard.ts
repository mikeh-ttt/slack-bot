import { App } from "@slack/bolt";
import { getWeeklyLeaderboard } from "../services/analytics";
import { COMMANDS } from "../utils/commands";

const EMOJIS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export function registerLeaderboard(app: App, allowed: Set<string>) {
  app.command(COMMANDS.leaderboard, async ({ ack, body, respond }) => {
    await ack();

    if (allowed.size && !allowed.has(body.user_id)) {
      await respond({
        response_type: "ephemeral",
        text: "You're not allowed to run this command.",
      });
      return;
    }

    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - today.getDay());
      const weekEnd = new Date(today);

      const from = weekStart.toISOString().split("T")[0];
      const to = weekEnd.toISOString().split("T")[0];

      await respond({
        response_type: "ephemeral",
        text: `Fetching leaderboard for ${from} → ${to}…`,
      });

      const leaderboard = await getWeeklyLeaderboard(from, to);

      const lines = leaderboard
        .slice(0, 10)
        .map((entry) => {
          const emoji = EMOJIS[entry.rank - 1] || "•";
          const hours = entry.hours.toFixed(2);
          return `${emoji} *${entry.name}* — *${hours}h*`;
        })
        .join("\n");

      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Weekly Leaderboard* (${from} → ${to})\n\n${lines}`,
          },
        },
      ];

      await respond({
        response_type: "ephemeral",
        text: `Weekly leaderboard for ${from} → ${to}`,
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
