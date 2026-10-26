"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { getDays, getFantasyStandings, getFantasyTeamProfile, getMe, getMyFantasyTeam, getTeams } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { chipName } from "@/lib/chips";
import type { FantasyStanding, FantasyTeamProfile, Team, TournamentDay } from "@/types";
import FantasyDayPlayerDetails from "./FantasyDayPlayerDetails";
import FantasyPlayerCard from "./FantasyPlayerCard";
import FantasyTeamSummary from "./FantasyTeamSummary";

const hasDeadline = (d: TournamentDay) => Boolean(d.deadline) && !d.deadline.startsWith("0001");
const isOpen = (d: TournamentDay) => !hasDeadline(d) || new Date(d.deadline).getTime() > Date.now();

/** First day still open; if every day is locked, the last one. */
function defaultIndex(sorted: TournamentDay[]): number {
  if (sorted.length === 0) return 0;
  const open = sorted.findIndex(isOpen);
  return open >= 0 ? open : sorted.length - 1;
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
  const [index, setIndex] = useState(0);
  const [profile, setProfile] = useState<FantasyTeamProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamsById, setTeamsById] = useState<Map<number, Team>>(new Map());
  const [standings, setStandings] = useState<FantasyStanding[] | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [myUsername, setMyUsername] = useState<string | undefined>();

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

  // real-team info (name / logo) for the cards; the picks themselves only carry team_id
  useEffect(() => {
    let cancelled = false;
    getTeams(tournamentId)
      .then((teams) => {
        if (!cancelled) setTeamsById(new Map(teams.map((t) => [t.id, t])));
      })
      .catch(() => {
        /* cards still render without the team badge */
      });
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  // overall standings (all days) -> total points, placement and world percentile
  useEffect(() => {
    let cancelled = false;
    setStandingsLoading(true);
    getFantasyStandings(tournamentId)
      .then((st) => {
        if (!cancelled) setStandings(st);
      })
      .catch(() => {
        if (!cancelled) setStandings(null);
      })
      .finally(() => {
        if (!cancelled) setStandingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  // the public profile has no username, but for your own team we know it
  useEffect(() => {
    if (!isMine || !getToken()) {
      setMyUsername(undefined);
      return;
    }
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled) setMyUsername(me.username);
      })
      .catch(() => {
        /* username is optional */
      });
    return () => {
      cancelled = true;
    };
  }, [isMine]);

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
  const scores = new Map((profile?.breakdown ?? []).map((b) => [b.player_id, b]));
  const scored = (profile?.breakdown ?? []).some((b) => b.final_points !== 0);
  const loading = !daysLoaded || profileLoading;

  // ties share a rank (1, 2, 2, 4 ...), same as the leaderboard
  const mineStanding = standings?.find((x) => x.fantasy_team_id === fantasyTeamId);
  const overallRank = mineStanding && standings ? 1 + standings.filter((x) => x.points > mineStanding.points).length : undefined;
  const ownerName = profile?.team.username ?? myUsername;

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

      <div>
        <section className="min-w-0 space-y-4">
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
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                  <FantasyTeamSummary
                    username={ownerName}
                    teamName={profile.team.team_name}
                    country={profile.team.country}
                    points={mineStanding?.points}
                    rank={overallRank}
                    total={standings?.length}
                    loading={standingsLoading}
                  />
                  <div className="min-w-0 flex-1">
                    {(profile.selections ?? []).length === 0 ? (
                      <EmptyState title="No selection made for this day" />
                    ) : (
                      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 lg:grid-cols-4">
                        {(profile.selections ?? []).map((sel) => {
                          const score = scored ? scores.get(sel.player_id) : undefined;
                          const realTeam = teamsById.get(sel.player.team_id);
                          return (
                            <FantasyPlayerCard
                              key={sel.player_id}
                              player={sel.player}
                              team={realTeam}
                              price={(sel.player as typeof sel.player & { fantasy_price?: number }).fantasy_price}
                              captain={sel.is_captain}
                              stats={score ? { kills: score.kills, fantasyPoints: score.final_points } : undefined}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {dayId && (
                  <FantasyDayPlayerDetails
                    dayId={dayId}
                    selections={profile.selections ?? []}
                    breakdown={profile.breakdown ?? []}
                    scored={scored}
                    chipName={profile.chip ? chipName(profile.chip) : undefined}
                  />
                )}
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