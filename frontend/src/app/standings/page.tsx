import { getTournament } from "@/lib/api";
import StandingsExperience from "@/components/standings/StandingsExperience";

export default async function StandingsPage() {
  const tournament = await getTournament("ffws-2026");

  if (!tournament) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="font-display text-4xl font-black uppercase text-bone">
          Placements
        </h1>
        <p className="mt-4 text-ash">Tournament data is unavailable.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="font-stat text-xs uppercase tracking-[0.25em] text-ember">
          FFWS 2026
        </p>
        <h1 className="mt-2 font-display text-4xl font-black uppercase text-bone sm:text-6xl">
          Placements
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-ash">
          Follow team standings by stage, phase, week, day, and session.
        </p>
      </div>

      <StandingsExperience tournamentId={tournament.id} />
    </main>
  );
}