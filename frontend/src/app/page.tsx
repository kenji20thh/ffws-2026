import CompletedBanner from "@/components/home/CompletedBanner";
import Hero from "@/components/home/Hero";
import LiveHub from "@/components/home/LiveHub";
import ErrorState from "@/components/ui/ErrorState";
import { getDays, getRooms, getRoomResults, getStandings, getTournament } from "@/lib/api";
import type { Room, RoomTeamSummary, Tournament } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let tournament: Tournament;
  try {
    tournament = await getTournament("ffws-2026");
  } catch (err) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={err instanceof Error ? err.message : undefined} />
      </div>
    );
  }

  if (tournament.status === "upcoming") {
    return <Hero tournament={tournament} />;
  }

  const standings = await getStandings(tournament.id).catch(() => []);

  if (tournament.status === "completed") {
    return <CompletedBanner tournament={tournament} standings={standings} />;
  }

  // ongoing
  const days = await getDays(tournament.id).catch(() => []);
  const lastDay = [...days].sort((a, b) => b.day_order - a.day_order)[0] ?? null;
  const rooms: Room[] = lastDay ? await getRooms(lastDay.id).catch(() => []) : [];

  const liveRoom = rooms.find((r) => r.status === "live") ?? null;
  const nextRoom = rooms.find((r) => r.status === "upcoming") ?? null;
  const currentRoom = liveRoom ?? nextRoom ?? null;

  const completedRooms = rooms.filter((r) => r.status === "completed");
  const tickerRoom = completedRooms[completedRooms.length - 1] ?? null;
  const tickerResults: RoomTeamSummary[] = tickerRoom ? await getRoomResults(tickerRoom.id).catch(() => []) : [];

  return (
    <LiveHub
      tournament={tournament}
      standings={standings}
      currentRoom={currentRoom}
      tickerRoom={tickerRoom}
      tickerResults={tickerResults}
    />
  );
}