import { redirect } from "next/navigation";

type LeaderboardPageProps = {
  searchParams: Promise<{ league?: string | string[] }>;
};

/** Old links like /leaderboard?league=global now go to /fantasy/leagues/global. */
export default async function LeaderboardRedirect({ searchParams }: LeaderboardPageProps) {
  const { league } = await searchParams;
  const raw = Array.isArray(league) ? league[0] : league;
  const slug = raw?.trim() || "global";

  redirect(`/fantasy/leagues/${encodeURIComponent(slug)}`);
}
