"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import {
  getDays,
  getFantasyLeagueStandings,
  getFantasyTeamProfile,
  getMyFantasyLeagues,
  getMyFantasyTeam,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { captainMultiplier, chipName } from "@/lib/chips";
import type { FantasyTeamProfile, TournamentDay } from "@/types";
import ReadOnlySelection from "./ReadOnlySelection";

const hasDeadline = (d: TournamentDay) => Boolean(d.deadline) && !d.deadline.startsWith("0001");
const isOpen = (d: TournamentDay) => !hasDeadline(d) || new Date(d.deadline).getTime() > Date.now();

/** First day still open; if every day is locked, the last one. */
function defaultIndex(sorted: TournamentDay[]): number {
  if (sorted.length === 0) return 0;
  const open = sorted.findIndex(isOpen);
  return open >= 0 ? open : sorted.length - 1;
}

type LeagueRow = { slug: string; name: string; rank?: number; size: number };

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
  const [index, setIndex] = useState(0);
  const [profile, setProfile] = useState<FantasyTeamProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);

  const selectedDay = days[index] ?? null;
  const dayId = selectedDay?.id ?? null;

  // tournament days + whether this is the viewer's own team
  useEffect(() => {
    let cancelled = false;

    getDays(tournamentId)
      .then((d) => {
        if (cancelled) return;
        const sorted = [...d].sort((a, b) => a.day_order - b.day_order);
        setDays(sorted);
        setIndex(defaultIndex(sorted));
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

  // leagues + placement: only for the owner
  useEffect(() => {
    if (!isMine) {
      setLeagues([]);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const mine = await getMyFantasyLeagues(tournamentId);
        const rows = await Promise.all(
          mine.map(async (l): Promise<LeagueRow> => {
            try {
              const standings: any[] = await getFantasyLeagueStandings(tournamentId, l.slug);
              const i = standings.findIndex(
                (r) => (r.fantasy_team_id ?? r.team_id ?? r.id) === fantasyTeamId,
              );
              return {
                slug: l.slug,
                name: l.name,
                rank: i >= 0 ? (standings[i].rank ?? i + 1) : undefined,
                size: standings.length,
              };
            } catch {
              return { slug: l.slug, name: l.name, size: 0 };
            }
          }),
        );
        if (!cancelled) setLeagues(rows);
      } catch {
        if (!cancelled) setLeagues([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isMine, tournamentId, fantasyTeamId]);

  // picks for the selected day; ignore answers that arrive after the day changed
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

  const go = useCallback(
    (dir: -1 | 1) => setIndex((i) => Math.min(Math.max(i + dir, 0), days.length - 1)),
    [days.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const dayIsFuture = selectedDay ? isOpen(selectedDay) : false;
  const loading = !daysLoaded || profileLoading;
  const showSidebar = isMine;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-10">
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

      <div className={showSidebar ? "grid gap-8 lg:grid-cols-[280px_1fr]" : ""}>
        {/* Leagues (owner only) */}
        {showSidebar && (
          <aside className="order-2 lg:order-1">
            <h2 className="font-stat text-xs uppercase tracking-widest text-ash">My leagues</h2>
            {leagues.length === 0 ? (
              <p className="mt-3 border border-bone/10 p-4 font-stat text-sm text-ash">
                You haven&apos;t joined any league yet.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-bone/10 border border-bone/10">
                {leagues.map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/leaderboard?league=${encodeURIComponent(l.slug)}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-bone/5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-display text-lg font-black uppercase">{l.name}</p>
                        {l.size > 0 && <p className="font-stat text-xs text-ash">{l.size} players</p>}
                      </div>
                      <p
                        className={`shrink-0 font-display text-2xl font-black ${
                          l.rank && l.rank <= 3 ? "text-ember" : ""
                        }`}
                      >
                        {l.rank ? `#${l.rank}` : "–"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}

        <section className="order-1 min-w-0 space-y-4 lg:order-2">
          {/* Matchday switcher */}
          {days.length > 0 && (
            <div className="chamfer flex items-stretch border border-bone/10 bg-char-2">
              <button
                onClick={() => go(-1)}
                disabled={index === 0}
                aria-label="Previous matchday"
                className="px-5 text-2xl transition-colors hover:text-ember disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-inherit"
              >
                ←
              </button>
              <div className="flex-1 px-4 py-3 text-center">
                <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
                  Matchday {index + 1} of {days.length}
                </p>
                <p className="font-display text-xl font-black uppercase sm:text-2xl">{selectedDay?.name}</p>
              </div>
              <button
                onClick={() => go(1)}
                disabled={index >= days.length - 1}
                aria-label="Next matchday"
                className="px-5 text-2xl transition-colors hover:text-ember disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-inherit"
              >
                →
              </button>
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
                {profile.chip && (
                  <p className="text-center font-stat text-xs uppercase tracking-widest text-ash">
                    Chip played{" "}
                    <span className="ml-2 bg-amber px-2 py-0.5 font-black text-char">{chipName(profile.chip)}</span>
                  </p>
                )}
                <ReadOnlySelection
                  selections={profile.selections ?? []}
                  breakdown={profile.breakdown}
                  captainMultiplier={captainMultiplier(profile.chip)}
                />
              </div>
            )
          ) : (
            <EmptyState title="No data for this day" />
          )}
        </section>
      </div>
    </div>
  );
}