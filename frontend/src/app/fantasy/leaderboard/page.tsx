import PageHeader from "@/components/layout/PageHeader";
import LeagueLeaderboard from "@/components/fantasy/LeagueLeaderboard";
import ErrorState from "@/components/ui/ErrorState";
import { getDays, getTournament } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "League Leaderboard · FFWS 2026" };

type LeaderboardPageProps = {
  searchParams: Promise<{ league?: string | string[] }>;
};

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { league } = await searchParams;
  const raw = Array.isArray(league) ? league[0] : league;
  const slug = raw?.trim() || "global";

  try {
    const t = await getTournament("ffws-2026");
    const days = await getDays(t.id);

    return (
      <>
        <PageHeader eyebrow="Fantasy leagues" title="Leaderboard">
          See where you stand in Global, your region and your private leagues.
        </PageHeader>

        <div className="mx-auto max-w-4xl px-5 py-10">
          {/* key: switching league starts from a clean state */}
          <LeagueLeaderboard key={slug} tournamentId={t.id} days={days} slug={slug} />
        </div>
      </>
    );
  } catch (e) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={e instanceof Error ? e.message : undefined} />
      </div>
    );
  }
}
