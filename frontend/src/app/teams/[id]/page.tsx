import Link from "next/link";
import { notFound } from "next/navigation";
import CoachingStaff from "@/components/teams/CoachingStaff";
import KillParticipationChart from "@/components/teams/KillParticipationChart";
import MapStats from "@/components/teams/MapStats";
import PlayerRosterRow from "@/components/teams/PlayerRosterRow";
import TeamHeader from "@/components/teams/TeamHeader";
import TeamStatsOverview from "@/components/teams/TeamStatsOverview";
import ErrorState from "@/components/ui/ErrorState";
import { ApiError, getTeam, getTeamProfile, getTeamStaff } from "@/lib/api";
import type { Team, TeamProfile, TeamStaff } from "@/types";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamId = Number(id);
  if (!Number.isInteger(teamId) || teamId <= 0) notFound();

  let team: Team;
  let profile: TeamProfile;
  let staff: TeamStaff[] = [];

  try {
    team = await getTeam(teamId);
    profile = await getTeamProfile(teamId);
    staff = await getTeamStaff(teamId).catch(() => []);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={e instanceof Error ? e.message : undefined} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <Link href="/teams" className="font-stat text-[11px] uppercase tracking-widest text-ash hover:text-ember">
        ← All teams
      </Link>

      <div className="mt-6"><TeamHeader team={team} /></div>

      <section className="mt-14">
        <h2 className="mb-6 font-display text-4xl font-extrabold uppercase">Roster</h2>
        <PlayerRosterRow players={profile.players} />
      </section>

      {staff.length > 0 && (
        <section className="mt-12"><CoachingStaff staff={staff} /></section>
      )}

      <section className="mt-14">
        <h2 className="mb-6 font-display text-4xl font-extrabold uppercase">Team stats</h2>
        <TeamStatsOverview overall={profile.overall} />
      </section>

      <section className="mt-12">
        <h2 className="mb-6 font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Kill participation</h2>
        <KillParticipationChart players={profile.players} />
      </section>

      <section className="mt-14">
        <h2 className="mb-6 font-display text-4xl font-extrabold uppercase">Map performance</h2>
        <MapStats maps={profile.maps} />
      </section>
    </div>
  );
}