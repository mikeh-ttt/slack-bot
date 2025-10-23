import { getActiveHarvestUsers, getUserHoursForRange } from "./harvest";

export interface LeaderboardEntry {
  name: string;
  email: string;
  hours: number;
  rank: number;
}

// Get billable hours leaderboard for a week
export async function getWeeklyLeaderboard(from: string, to: string): Promise<LeaderboardEntry[]> {
  const users = await getActiveHarvestUsers();
  const leaderboard: LeaderboardEntry[] = [];

  for (const user of users) {
    const hours = await getUserHoursForRange(user.id, from, to);
    leaderboard.push({
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      hours,
      rank: 0,
    });
  }

  // Sort by hours descending and assign ranks
  leaderboard.sort((a, b) => b.hours - a.hours);
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}
