import axios from "axios";
import { HarvestUser } from "../types/harvest";

const { HARVEST_ACCOUNT_ID, HARVEST_ACCESS_TOKEN } = process.env;

if (!HARVEST_ACCOUNT_ID || !HARVEST_ACCESS_TOKEN) {
  throw new Error(
    "Missing Harvest env vars (HARVEST_ACCOUNT_ID, HARVEST_ACCESS_TOKEN)."
  );
}

export const harvest = axios.create({
  baseURL: "https://api.harvestapp.com/v2",
  headers: {
    Authorization: `Bearer ${HARVEST_ACCESS_TOKEN}`,
    "Harvest-Account-Id": HARVEST_ACCOUNT_ID!,
    "User-Agent": "Harvest-Slack-Bot",
  },
});

// ----- simple in-memory cache (per process) -----
const cache = new Map<string, { expires: number; data: any }>();
const DEFAULT_TTL_SEC = Number(process.env.HARVEST_CACHE_TTL_SEC || "300");

async function cachedGet(
  url: string,
  params: Record<string, any>,
  ttlSec = DEFAULT_TTL_SEC
) {
  const key = `${url}_${JSON.stringify(params)}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) {
    return hit.data;
  }
  const { data } = await harvest.get(url, { params });
  cache.set(key, { data, expires: now + ttlSec * 1000 });
  return data;
}

// Fetch all active Harvest users
export async function getActiveHarvestUsers(): Promise<Array<HarvestUser>> {
  const users: Array<HarvestUser> = [];
  let page = 1;
  for (;;) {
    const data = await cachedGet("/users", {
      is_active: true,
      page,
      per_page: 100,
    });
    for (const u of data.users) {
      users.push(u);
    }
    if (!data.next_page) break;
    page = data.next_page;
  }
  return users;
}

// Total hours logged by a user in range
export async function getUserHoursForRange(
  userId: number,
  from: string,
  to: string
) {
  let page = 1,
    total = 0;
  for (;;) {
    const data = await cachedGet("/time_entries", {
      user_id: userId,
      from,
      to,
      page,
      per_page: 100,
    });
    for (const te of data.time_entries) total += te.hours || 0;
    if (!data.next_page) break;
    page = data.next_page;
  }
  return total;
}

// Project hours report for range
export async function getProjectHours(from: string, to: string) {
  const projects: Array<{ id: number; name: string; hours: number }> = [];
  let page = 1;
  for (;;) {
    const data = await cachedGet("/reports/time/projects", {
      from,
      to,
      page,
      per_page: 100,
    });
    for (const p of data.results) {
      projects.push({
        id: p.project_id,
        name: p.project_name,
        hours: p.occupied_hours || p.total_hours || 0,
      });
    }
    if (!data.next_page) break;
    page = data.next_page;
  }
  return projects;
}
