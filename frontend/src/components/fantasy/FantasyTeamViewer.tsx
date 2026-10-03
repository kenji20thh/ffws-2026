"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { getDays, getFantasyTeamProfile, getMyFantasyTeam } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { FantasyTeamProfile, TournamentDay } from "@/types";
import DayScoreCard from "./DayScoreCard";
import ReadOnlySelection from "./ReadOnlySelection";

function defaultDay(days: TournamentDay[]): TournamentDay | null {
  if (days.length === 0) return null;
  const sorted = [...days].sort((a, b) => a.day_order - b.day_order);
  const now = Date.now();

  const open = sorted.find((d) => {
    const hasDeadline = d.deadline && !d.deadline.startsWith("0001");
    if (!hasDeadline) return true;
    return new Date(d.deadline).getTime() > now;
  });

  if (open) return open;
  return [...sorted].reverse()[0];
}

export default function FantasyTeamViewer({
  tournamentId,
  fantasyTeamId,
  teamName,
}: {
  tournamentId: number;
  fantasyTeamId: number;
  teamName: string;
}) {
  const [isMine, setIsMine] = useState(false);
  const [days, setDays] = useState<TournamentDay[]>([]);
  const [dayId, setDayId] = useState<number | null>(null);
  const [profile, setProfile] = useState<FantasyTeamProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDays(tournamentId).then((d) => {
      setDays(d);
      setDayId(defaultDay(d)?.id ?? null);
    });

    if (!getToken()) return;
    getMyFantasyTeam(tournamentId)
      .then((mine) => setIsMine(mine.id === fantasyTeamId))
      .catch(() => setIsMine(false));
  }, [tournamentId, fantasyTeamId]);

  const loadProfile = useCallback(() => {
    if (!dayId) return;
    setLoading(true);
    getFantasyTeamProfile(fantasyTeamId, dayId)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [fantasyTeamId, dayId]);

  useEffect(() => {
    loadProfile();
  }, [dayId, loadProfile]);

  const selectedDay = days.find((d) => d.id === dayId) ?? null;
  const dayIsFuture = (() => {
    if (!selectedDay) return false;
    const hasDeadline = selectedDay.deadline && !selectedDay.deadline.startsWith("0001");
    if (!hasDeadline) return true;
    return new Date(selectedDay.deadline).getTime() > Date.now();
  })();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10">
      <div className="chamfer flex flex-wrap items-center justify-between gap-4 border border-bone/10 bg-char-2 p-6">
        <div>
          <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
            {isMine ? "Your fantasy team" : "Viewing"}
          </p>
          <p className="font-display text-3xl font-black uppercase">{teamName}</p>
        </div>
        {isMine && dayIsFuture && (
          <Link href="/fantasy/pick-team" className="font-stat text-xs uppercase tracking-widest text-ember hover:underline">
            Edit this pick →
          </Link>
        )}
      </div>

      {days.length > 0 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Day">
          {days.map((d) => (
            <button
              key={d.id}
              onClick={() => setDayId(d.id)}
              className={`chamfer-sm px-5 py-2 font-display text-lg font-bold uppercase tracking-wider transition-colors ${
                dayId === d.id ? "bg-ember text-char" : "border border-bone/20 text-bone/70 hover:text-ember"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64" />
      ) : profile ? (
        <>
          {profile.breakdown && profile.breakdown.length > 0 && (
            <DayScoreCard breakdown={profile.breakdown} total={profile.total_points ?? 0} />
          )}
          {profile.hidden ? (
            <p className="font-stat text-xs uppercase tracking-widest text-ash">
              Picks stay hidden until this day locks
            </p>
          ) : (
            <ReadOnlySelection selections={profile.selections ?? []} />
          )}
        </>
      ) : (
        <EmptyState title="No data for this day" />
      )}
    </div>
  );
}