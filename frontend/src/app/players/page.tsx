import PageHeader from "@/components/layout/PageHeader";
import KillLeaderboard from "@/components/players/KillLeaderboard";
import ErrorState from "@/components/ui/ErrorState";
import { getPlayerLeaderboard, getTournament } from "@/lib/api";
import type { PlayerLeaderboardEntry } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Players · FFWS 2026" };

export default async function PlayersPage() {
  let rows: PlayerLeaderboardEntry[] = [];
  let error: string | null = null;
  try {
    const t = await getTournament("ffws-2026");
    rows = await getPlayerLeaderboard(t.id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load players";
  }

  return (
    <>
      <PageHeader eyebrow="Kill leaders" title="Players">
        The deadliest hands in the lobby.
      </PageHeader>
      <div className="mx-auto max-w-5xl px-5 py-10">
        {error ? <ErrorState message={error} /> : <KillLeaderboard rows={rows} />}
      </div>
    </>
  );
}