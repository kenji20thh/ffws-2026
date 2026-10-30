import PlayerFormTable from "@/components/fantasy/PlayerFormTable";
import ErrorState from "@/components/ui/ErrorState";
import { getPlayerFormTable, getTeams, getTournament } from "@/lib/api";
import type { Team } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Player Form · Fantasy · FFWS 2026" };

export default async function PlayerFormPage() {
  try {
    const tournament = await getTournament("ffws-2026");
    const [entries, teams] = await Promise.all([
      getPlayerFormTable(tournament.id),
      // logos are a nicety: the table still works without them
      getTeams(tournament.id).catch(() => [] as Team[]),
    ]);
    const logos: Record<number, string> = {};
    teams.forEach((t) => {
      if (t.logo_url) logos[t.id] = t.logo_url;
    });
    return <PlayerFormTable entries={entries} logos={logos} />;
  } catch (e) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={e instanceof Error ? e.message : undefined} />
      </div>
    );
  }
}
