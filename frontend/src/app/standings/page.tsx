import { getTournament } from "@/lib/api";
import StandingsExperience from "@/components/standings/StandingsExperience";
import type { Tournament } from "@/types";

// Fetches live data from the API, so render per request instead of at build time.
export const dynamic = "force-dynamic";
export const metadata = { title: "Placements · FFWS 2026" };

export default async function StandingsPage() {
  let tournament: Tournament | null = null;
  try {
    tournament = await getTournament("ffws-2026");
  } catch {
    tournament = null;
  }

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
      <div className="mb-5">
        <p className="font-stat text-xs uppercase tracking-[0.25em] text-ember">
          FFWS 2026
        </p>
        <h1 className="mt-1 font-display text-3xl font-black uppercase text-bone sm:text-5xl">
          Placements
        </h1>
      </div>

      <StandingsExperience tournamentId={tournament.id} />
    </main>
  );
}