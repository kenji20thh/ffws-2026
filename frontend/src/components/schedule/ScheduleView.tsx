"use client";

import { useEffect, useState } from "react";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { getDayTeams, getRoomResults, getRooms } from "@/lib/api";
import type { DayTeam, Room, RoomTeamSummary, TournamentDay } from "@/types";
import DayTabs from "./DayTabs";
import RoomCard from "./RoomCard";
import RoomResultsTable from "./RoomResultsTable";
import TeamsOfDay from "./TeamsOfDay";

export default function ScheduleView({ days }: { days: TournamentDay[] }) {
  const [dayId, setDayId] = useState(days[0]?.id ?? 0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dayTeams, setDayTeams] = useState<DayTeam[]>([]);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [results, setResults] = useState<RoomTeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // load rooms + teams when the day changes
  useEffect(() => {
    if (!dayId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getRooms(dayId), getDayTeams(dayId)])
      .then(([r, t]) => {
        if (cancelled) return;
        setRooms(r);
        setDayTeams(t);
        const live = r.find((x) => x.status === "live");
        setRoomId((live ?? r[0])?.id ?? null);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load day"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [dayId]);

  const room = rooms.find((r) => r.id === roomId) ?? null;
  const isLive = room?.status === "live";

  // load results when the room changes; poll every 10s while live
  useEffect(() => {
    if (!roomId) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const load = () =>
      getRoomResults(roomId)
        .then((r) => !cancelled && setResults(r))
        .catch(() => {});
    load();
    if (!isLive) return () => { cancelled = true; };
    const id = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [roomId, isLive]);

  if (days.length === 0) {
    return <EmptyState title="Schedule not announced" hint="Days and rooms will appear here soon." />;
  }

  return (
    <div className="space-y-10">
      <DayTabs days={days} activeId={dayId} onSelect={setDayId} />

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-4 font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Teams playing</h2>
            <TeamsOfDay teams={dayTeams} />
          </section>

          <section>
            <h2 className="mb-4 font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Rooms</h2>
            {rooms.length === 0 ? (
              <EmptyState title="No rooms yet" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {rooms.map((r) => (
                  <RoomCard key={r.id} room={r} active={r.id === roomId} onSelect={() => setRoomId(r.id)} />
                ))}
              </div>
            )}
          </section>

          {room && (
            <section>
              <h2 className="mb-4 font-display text-4xl font-extrabold uppercase">
                Room {room.room_number} results
              </h2>
              <RoomResultsTable rows={results} />
            </section>
          )}
        </>
      )}
    </div>
  );
}