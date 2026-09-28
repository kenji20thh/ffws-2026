import PageHeader from "@/components/layout/PageHeader";
import TeamGrid from "@/components/teams/TeamGrid";
import ErrorState from "@/components/ui/ErrorState";
import { getTeams, getTournament } from "@/lib/api";
import type { Team } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Teams · FFWS 2026" };

export default async function TeamsPage() {
  let teams: Team[] = [];
  let error: string | null = null;

  try {
    const t = await getTournament("ffws-2026");
    teams = await getTeams(t.id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load teams";
  }

  return (
    <>
      <PageHeader eyebrow="The contenders" title="Teams">
        Every squad fighting for the last zone.
      </PageHeader>
      <div className="mx-auto max-w-7xl px-5 py-10">
        {error ? <ErrorState message={error} /> : <TeamGrid teams={teams} />}
      </div>
    </>
  );
}