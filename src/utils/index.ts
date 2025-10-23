import { addDays, startOfWeek, endOfWeek, format, parseISO } from "date-fns";
import { TZDate } from "@date-fns/tz";

export const PT_TZ = "America/Vancouver";
export const DEFAULT_TARGET_HOURS = 40;

export function lastWeekRangePT(now = new Date()) {
  const nowPT = new TZDate(now, PT_TZ);
  const monThisWeek = startOfWeek(nowPT, { weekStartsOn: 1 });
  const monLastWeek = addDays(monThisWeek, -7);
  const sunLastWeek = endOfWeek(monLastWeek, { weekStartsOn: 1 });
  return {
    from: format(monLastWeek, "yyyy-MM-dd"),
    to: format(sunLastWeek, "yyyy-MM-dd"),
  };
}

export function parseReportArgs(text = "") {
  const raw = text.trim();
  if (!raw) {
    const r = lastWeekRangePT();
    return { from: r.from, to: r.to, target: DEFAULT_TARGET_HOURS };
  }
  const parts = raw.split(/\s+/);
  const range = parts[0];
  const targetCandidate = parts[1] ? Number(parts[1]) : DEFAULT_TARGET_HOURS;
  const [from, to] = range.split(",").map((s) => s.trim());
  parseISO(from);
  parseISO(to);
  const target = Number.isFinite(targetCandidate)
    ? Math.max(0, targetCandidate)
    : DEFAULT_TARGET_HOURS;
  return { from, to, target };
}

export const parseSummaryArgs = parseReportArgs;

export function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(",")),
  ].join("\n");
}

export function buildManagerBlocks(
  list: Array<{ name: string; email: string; hours: number }>,
  from: string,
  to: string,
  target: number
) {
  if (!list.length) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `✅ All team members logged *≥ ${target}h* for *${from} → ${to}*.`,
        },
      },
    ];
  }
  const rows = list
    .sort((a, b) => a.hours - b.hours)
    .map(
      (u) =>
        `• *${u.name}* (${u.email || "no-email"}) — *${u.hours.toFixed(2)}h*`
    )
    .join("\n");
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `⏱ *Under ${target}h* (*${from} → ${to}*):\n${rows}`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "_Source: Harvest time entries. Range = Mon–Sun (Vancouver time)._",
        },
      ],
    },
  ];
}
