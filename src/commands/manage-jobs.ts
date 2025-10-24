import { App } from "@slack/bolt";
import { getAllJobs, updateJob } from "../services/database";
import { restartTimesheetCheckJob } from "../jobs/timesheet-check";
import { COMMANDS } from "./constants";

export function registerManageJobs(app: App, allowed: Set<string>) {
  app.command(COMMANDS.manageJobs, async ({ ack, body, client, respond }) => {
    console.log("[JOBS] Command invoked by user:", body.user_id);

    if (allowed.size && !allowed.has(body.user_id)) {
      await ack();
      await respond({
        response_type: "ephemeral",
        text: "You're not allowed to run this command.",
      });
      return;
    }

    await ack();

    const jobs = getAllJobs();

    if (jobs.length === 0) {
      await respond({
        response_type: "in_channel",
        text: "No scheduled jobs found.",
      });
      return;
    }

    const blocks = [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: "*Scheduled Jobs*\nClick *Edit* to modify a job's schedule or status.",
        },
      },
      { type: "divider" as const },
    ];

    jobs.forEach((job) => {
      const descText = job.description ? `\n${job.description}` : "";
      blocks.push({
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `*${job.name}*${descText}\nSchedule: \`${
            job.schedule
          }\`\nStatus: ${job.active ? "🟢 Active" : "🔴 Inactive"}`,
        },
        accessory: {
          type: "button" as const,
          text: { type: "plain_text" as const, text: "Edit" },
          action_id: "edit_job",
          value: JSON.stringify({ jobId: job.id }),
        },
      });
    });

    await respond({
      response_type: "in_channel",
      blocks,
    });
  });

  // Handle edit button click
  app.action("edit_job", async ({ ack, body, client }) => {
    await ack();

    const btn = body as any;
    const { jobId } = JSON.parse(btn.actions[0].value || "{}");

    const jobs = getAllJobs();
    const job = jobs.find((j) => j.id === jobId);

    if (!job) {
      console.log("[JOBS] Job not found:", jobId);
      return;
    }

    const trigger_id = (body as any).trigger_id;
    await client.views.open({
      trigger_id,
      view: {
        type: "modal",
        callback_id: "edit_job_modal",
        title: { type: "plain_text", text: "Edit Job" },
        submit: { type: "plain_text", text: "Update" },
        close: { type: "plain_text", text: "Cancel" },
        private_metadata: JSON.stringify({ jobId: job.id }),
        blocks: [
          {
            type: "input",
            block_id: "job_name",
            label: { type: "plain_text", text: "Job Name" },
            element: {
              type: "plain_text_input",
              action_id: "name_input",
              initial_value: job.name,
            },
          },
          {
            type: "input",
            block_id: "job_description",
            optional: true,
            label: { type: "plain_text", text: "Description" },
            element: {
              type: "plain_text_input",
              action_id: "description_input",
              initial_value: job.description || "",
              placeholder: {
                type: "plain_text",
                text: "Optional description of what this job does",
              },
            },
          },
          {
            type: "input",
            block_id: "job_schedule",
            label: { type: "plain_text", text: "Cron Schedule" },
            element: {
              type: "plain_text_input",
              action_id: "schedule_input",
              initial_value: job.schedule,
              placeholder: {
                type: "plain_text",
                text: "e.g., 0 */1 9-17 * * 1,2",
              },
            },
            hint: {
              type: "plain_text",
              text: "Use cron format. See https://crontab.cronhub.io/ for help.",
            },
          },
          {
            type: "section" as const,
            block_id: "job_active",
            text: {
              type: "mrkdwn" as const,
              text: "*Status*",
            },
            accessory: {
              type: "radio_buttons" as const,
              action_id: "active_input",
              options: [
                {
                  text: { type: "plain_text" as const, text: "Active" },
                  value: "true",
                },
                {
                  text: { type: "plain_text" as const, text: "Inactive" },
                  value: "false",
                },
              ],
              initial_option: {
                text: {
                  type: "plain_text" as const,
                  text: job.active ? "Active" : "Inactive",
                },
                value: job.active ? "true" : "false",
              },
            },
          },
        ],
      },
    });
  });

  // Handle modal submission
  app.view("edit_job_modal", async ({ ack, body, view }) => {
    const { jobId } = JSON.parse(view.private_metadata || "{}");
    const schedule =
      (view.state.values["job_schedule"]?.["schedule_input"] as any)?.value ||
      "";
    const description =
      (view.state.values["job_description"]?.["description_input"] as any)
        ?.value || "";
    const activeValue =
      (view.state.values["job_active"]?.["active_input"] as any)
        ?.selected_option?.value || "true";
    const active = activeValue === "true";

    if (!schedule.trim()) {
      await ack({
        response_action: "errors",
        errors: {
          job_schedule: "Schedule cannot be empty",
        },
      });
      return;
    }

    await ack();

    try {
      updateJob(jobId, undefined, description || undefined, schedule, active);
      console.log("[JOBS] Updated job:", jobId);

      // If this is the timesheet-check job, restart it with the new schedule
      const jobs = getAllJobs();
      const job = jobs.find((j) => j.id === jobId);
      if (job && job.name === "timesheet-check" && active) {
        restartTimesheetCheckJob(app, allowed, schedule);
      }
    } catch (err) {
      console.log("[JOBS] Error updating job:", err);
    }
  });
}
