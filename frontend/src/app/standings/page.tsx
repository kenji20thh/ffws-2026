import PageHeader from "@/components/layout/PageHeader";
import StandingsTable from "@/components/standings/StandingsTable";
import ErrorState from "@/components/ui/ErrorState";
import { getStandings, getTeams, getTournament } from "@/lib/api";
import type { TeamStanding, Team } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Standings · FFWS 2026" };

export type StandingsRow = TeamStanding & {
logo_url: string;
country: string;
};

export default async function StandingsPage() {
let rows: StandingsRow[] = [];
let error: string | null = null;

try {
const t = await getTournament("ffws-2026");

const [standings, teams] = await Promise.all([
  getStandings(t.id),
  getTeams(t.id),
]);

const teamsById = new Map<number, Team>(
  teams.map((team) => [team.id, team])
);

rows = standings.map((standing) => {
  const team = teamsById.get(standing.team_id);

  return {
    ...standing,
    logo_url: team?.logo_url ?? "",
    country: team?.country ?? "",
  };
});

} catch (e) {
error = e instanceof Error ? e.message : "Failed to load standings";
}

return (
<> <PageHeader eyebrow="Tournament" title="Standings">
FFWS 2026 Global Finals </PageHeader>

  <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
    <div className="mb-8 overflow-x-auto border-b border-white/10">
      <div className="flex min-w-max">
        <button
          type="button"
          className="border-b-2 border-ember px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-bone"
        >
          Knockout Stage
        </button>

        <button
          type="button"
          className="border-b-2 border-transparent px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-bone/45 transition hover:text-bone"
        >
          Last Chance
        </button>

        <button
          type="button"
          className="border-b-2 border-transparent px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-bone/45 transition hover:text-bone"
        >
          Grand Final
        </button>
      </div>
    </div>

    {error ? (
      <ErrorState message={error} />
    ) : (
      <>
        <div className="mb-6">
          <h2 className="font-display text-2xl uppercase tracking-wide text-bone sm:text-3xl">
            Knockout Stage
          </h2>

          <p className="mt-2 text-sm text-bone/50">
            Current standings for the Knockout Stage.
          </p>
        </div>

        <StandingsTable rows={rows} />
      </>
    )}
  </div>
</>

);
}
