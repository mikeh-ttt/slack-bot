import { App } from "@slack/bolt";
import {
  getNudgeCount,
  getNudgeCountThisWeek,
  recordNudge,
} from "../services/database";
import { ACTIONS } from "../utils/actions";

export function registerNudgeSend(app: App) {
  app.action(ACTIONS.nudgeSend, async ({ ack, body, action, client }) => {
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

      recordNudge(payload.slackId, payload.email, payload.name);
      const nudgeCount = getNudgeCount(payload.slackId);
      const nudgeCountThisWeek = getNudgeCountThisWeek(payload.slackId);

      const open = await client.conversations.open({ users: payload.slackId });
      const dmChannel = open.channel!.id!;

      let message = `Hey ${payload.name}! You logged *${payload.hours.toFixed(
        2
      )}h* for ${payload.from} → ${payload.to} (target: *${
        payload.targetHours
      }h*). Please log more time if needed. Thanks!`;

      if (nudgeCount > 1) {
        message += `\n\n_This is nudge #${nudgeCount} for you (${nudgeCountThisWeek} this week)._`;
      }

      await client.chat.postMessage({
        channel: dmChannel,
        text: message,
      });
    } catch (err) {
      console.log("[NUDGE ACTION] Error handling nudge_send:", err);
    }
  });
}
