import { App } from "@slack/bolt";
import { COMMANDS } from "./constants";

export function registerNudgeSend(app: App) {
  app.action(COMMANDS.nudgeSend, async ({ ack, body, action, client }) => {
    await ack();
    try {
      const btn = action as any;
      const payload = JSON.parse(btn.value || "{}") as {
        slackId?: string;
        name: string;
        email?: string;
        hours: number;
        from: string;
        to: string;
        targetHours: number;
      };

      if (!payload.slackId) {
        return;
      }

      const open = await client.conversations.open({ users: payload.slackId });
      const dmChannel = open.channel!.id!;
      await client.chat.postMessage({
        channel: dmChannel,
        text: `Hey ${payload.name}! You logged *${payload.hours.toFixed(
          2
        )}h* for ${payload.from} → ${payload.to} (target: *${
          payload.targetHours
        }h*). Please log more time if needed. Thanks!`,
      });
    } catch (err) {
      console.log("[NUDGE ACTION] Error handling nudge_send:", err);
    }
  });
}
