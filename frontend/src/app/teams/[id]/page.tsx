import Link from "next/link";
import { notFound } from "next/navigation";
import Roster from "@/components/teams/Roster";
import TeamHeader from "@/components/teams/TeamHeader";
import ErrorState from "@/components/ui/ErrorState";
import { ApiError, getTeam } from "@/lib/api";
import type { Team } from "@/types";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamId = Number(id);
  if (!Number.isInteger(teamId) || teamId <= 0) notFound();

  let team: Team;
  try {
    team = await getTeam(teamId);
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
      <Link
        href="/teams"
        className="font-stat text-[11px] uppercase tracking-widest text-ash hover:text-ember"
      >
        ← All teams
      </Link>

      <div className="mt-6">
        <TeamHeader team={team} />
      </div>

      <h2 className="mb-6 mt-14 font-display text-4xl font-extrabold uppercase">Roster</h2>
      <Roster players={team.players ?? []} />
    </div>
  );
}