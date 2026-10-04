"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { getDays, getFantasyTeamProfile, getMyFantasyTeam } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { FantasyTeamProfile, TournamentDay } from "@/types";
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
  const [daysLoaded, setDaysLoaded] = useState(false);
  const [dayId, setDayId] = useState<number | null>(null);
  const [profile, setProfile] = useState<FantasyTeamProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load the tournament days (and whether this is the viewer's own team)
  useEffect(() => {
    let cancelled = false;

    getDays(tournamentId)
      .then((d) => {
        if (cancelled) return;
        setDays(d);
        setDayId(defaultDay(d)?.id ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load tournament days");
      })
      .finally(() => {
        if (!cancelled) setDaysLoaded(true);
      });

    if (getToken()) {
      getMyFantasyTeam(tournamentId)
        .then((mine) => {
          if (!cancelled) setIsMine(mine.id === fantasyTeamId);
        })
        .catch(() => {
          if (!cancelled) setIsMine(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [tournamentId, fantasyTeamId]);

  // load the team's picks for the selected day; ignore answers that arrive after the day changed
  useEffect(() => {
    if (!dayId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    setError(null);

    getFantasyTeamProfile(fantasyTeamId, dayId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => {
        if (cancelled) return;
        setProfile(null); // never keep showing the previous day's data
        setError(e instanceof Error ? e.message : "Failed to load this team");
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fantasyTeamId, dayId]);

  const selectedDay = days.find((d) => d.id === dayId) ?? null;
  const dayIsFuture = (() => {
    if (!selectedDay) return false;
    const hasDeadline = selectedDay.deadline && !selectedDay.deadline.startsWith("0001");
    if (!hasDeadline) return true;
    return new Date(selectedDay.deadline).getTime() > Date.now();
  })();

  const loading = !daysLoaded || profileLoading;

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
      ) : error ? (
        <ErrorState message={error} />
      ) : days.length === 0 ? (
        <EmptyState title="No tournament days yet" hint="Picks will appear here once days are scheduled." />
      ) : profile ? (
        profile.hidden ? (
          <p className="font-stat text-xs uppercase tracking-widest text-ash">
            Picks stay hidden until this day locks
          </p>
        ) : (
          <div className="space-y-4">
            {profile.breakdown?.some((b) => b.final_points !== 0) && (
              <p className="text-center font-stat text-xs uppercase tracking-widest text-ash">
                Day score{" "}
                <span className="ml-2 text-3xl font-black tabular-nums text-ember">{profile.total_points ?? 0}</span>
              </p>
            )}
            <ReadOnlySelection selections={profile.selections ?? []} breakdown={profile.breakdown} />
          </div>
        )
      ) : (
        <EmptyState title="No data for this day" />
      )}
    </div>
  );
}
