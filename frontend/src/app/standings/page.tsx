import PageHeader from "@/components/layout/PageHeader";
import PodiumTop3 from "@/components/standings/PodiumTop3";
import StandingsTable from "@/components/standings/StandingsTable";
import ErrorState from "@/components/ui/ErrorState";
import { getStandings, getTournament } from "@/lib/api";
import type { TeamStanding } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Standings · FFWS 2026" };

export default async function StandingsPage() {
  let rows: TeamStanding[] = [];
  let error: string | null = null;
  try {
    const t = await getTournament("ffws-2026");
    rows = await getStandings(t.id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load standings";
  }

  return (
    <>
      <PageHeader eyebrow="Overall" title="Standings">
        Placement points plus kills, summed across every room.
      </PageHeader>
      <div className="mx-auto max-w-5xl space-y-12 px-5 py-10">
        {error ? (
          <ErrorState message={error} />
        ) : (
          <>
            <PodiumTop3 top={rows.slice(0, 3)} />
            <StandingsTable rows={rows} />
          </>
        )}
      </div>
    </>
  );
}