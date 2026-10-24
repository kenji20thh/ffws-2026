import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import LeagueLeaderboard from "@/components/fantasy/LeagueLeaderboard";
import ErrorState from "@/components/ui/ErrorState";
import { getDays, getTournament } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "League · FFWS 2026" };

type LeaguePageProps = {
  params: Promise<{ slug: string }>;
};

/** /fantasy/leagues/global, /fantasy/leagues/ma, /fantasy/leagues/private-5 ... */
export default async function LeaguePage({ params }: LeaguePageProps) {
  const { slug: rawSlug } = await params;

  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    // keep the raw value
  }

  try {
    const t = await getTournament("ffws-2026");
    const days = await getDays(t.id);

    return (
      <>
        <PageHeader eyebrow="Fantasy leagues" title="Leaderboard">
          See where you stand in Global, your region and your private leagues.
        </PageHeader>

        <div className="mx-auto max-w-4xl px-5 py-10">
          <Link
            href="/fantasy/leagues"
            className="mb-6 inline-block font-stat text-xs uppercase tracking-widest text-ash hover:text-ember"
          >
            ← All leagues
          </Link>

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
