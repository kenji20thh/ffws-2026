import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import FantasyConsole from "@/components/fantasy/FantasyConsole";
import FantasyTeamViewer from "@/components/fantasy/FantasyTeamViewer";
import ErrorState from "@/components/ui/ErrorState";
import { ApiError, getFantasyTeamProfile, getTournament } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function FantasyTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fantasyTeamId = Number(id);
  if (!Number.isInteger(fantasyTeamId) || fantasyTeamId <= 0) notFound();

  try {
    const [tournament, profile] = await Promise.all([
      getTournament("ffws-2026"),
      getFantasyTeamProfile(fantasyTeamId),
    ]);

    return (
      <>
        <PageHeader eyebrow="Fantasy squad" title={profile.team.team_name}>
          {profile.team.country}
        </PageHeader>
        <FantasyTeamViewer tournamentId={tournament.id} fantasyTeamId={fantasyTeamId} teamName={profile.team.team_name} />
      </>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={e instanceof Error ? e.message : undefined} />
      </div>
    );
  }
}