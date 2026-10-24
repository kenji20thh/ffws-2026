"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Flag from "@/components/ui/Flag";
import Skeleton from "@/components/ui/Skeleton";
import FantasyPlayerCard from "@/components/fantasy/FantasyPlayerCard";
import {
  getDays,
  getFantasyLeagueStandings,
  getFantasyStandings,
  getFantasyTeamProfile,
  getMyFantasyLeagues,
  getMyFantasyTeam,
  getTournament,
} from "@/lib/api";
import { getName, getToken } from "@/lib/auth";
import { shortDayName } from "@/lib/dayMenu";
import type { FantasyLeague, FantasyTeam, TournamentDay } from "@/types";

const dayLabel = (d: any): string =>
  d.name ?? d.label ?? d.title ?? `Day ${d.id}`;

const dayStarted = (d: any): boolean =>
  d.deadline ? new Date(d.deadline).getTime() <= Date.now() : false;

type CardData = {
  key: string | number;
  player: any;
  team?: any;
  kills?: number;
  points?: number;
  price?: number;
  captain: boolean;
};

function toCards(profile: any): CardData[] {
  const breakdown: any[] = profile?.breakdown ?? [];

  return (profile?.selections ?? []).map((s: any, i: number) => {
    const pid = s.player_id ?? s.player?.id;
    const b =
      breakdown.find((x) => (x.player_id ?? x.player?.id) === pid) ?? {};

    return {
      key: pid ?? i,
      player: s.player ?? s,
      team: s.team ??
        s.player?.team ?? {
          name: s.team_name,
          tag: s.team_tag,
          logo_url: s.team_logo_url,
        },
      kills: b.kills ?? b.total_kills ?? s.kills,
      points: b.points ?? b.total_points ?? b.fantasy_points ?? s.points,
      price: s.fantasy_price ?? s.price ?? s.player?.fantasy_price,
      captain: Boolean(s.is_captain ?? s.captain),
    };
  });
}

const dayPoints = (profile: any): number | undefined =>
  profile?.day_points ?? profile?.points ?? profile?.total_points;

type LeagueRow = {
  slug: string;
  name: string;
  type: FantasyLeague["type"];
  rank?: number;
  size: number;
};

type Overall = {
  points?: number;
  rank?: number;
  total: number;
};

const money = (value: number) =>
  `$${Number.isInteger(value) ? value : value.toFixed(1)}`;

export default function FantasyPointsPage() {
  const [status, setStatus] = useState<
    "loading" | "no-auth" | "no-team" | "ready"
  >("loading");
  const [tournamentId, setTournamentId] = useState(0);
  const [team, setTeam] = useState<FantasyTeam | null>(null);
  const [days, setDays] = useState<TournamentDay[]>([]);
  const [index, setIndex] = useState(0);
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [username, setUsername] = useState("");
  const [overall, setOverall] = useState<Overall | null>(null);
  const [lastIdx, setLastIdx] = useState(-1);
  const [profiles, setProfiles] = useState<Record<number, any>>({});
  const [dayLoading, setDayLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setStatus("no-auth");
      return;
    }

    (async () => {
      try {
        const t = await getTournament("ffws-2026");

        const [myTeam, allDays, myLeagues] = await Promise.all([
          getMyFantasyTeam(t.id),
          getDays(t.id),
          getMyFantasyLeagues(t.id),
        ]);

        const sorted = [...allDays].sort(
          (a: any, b: any) => a.id - b.id,
        );
        const lastStarted = sorted.map((d) => dayStarted(d)).lastIndexOf(true);

        setTournamentId(t.id);
        setTeam(myTeam);
        setUsername(getName() ?? "");
        setDays(sorted);
        setLastIdx(lastStarted);
        setIndex(Math.max(lastStarted, 0));
        setStatus("ready");

        getFantasyStandings(t.id)
          .then((all: any[]) => {
            const me = all.find(
              (r) => r.fantasy_team_id === (myTeam as any).id,
            );

            setOverall({
              points: me?.points,
              rank: me
                ? 1 + all.filter((r) => r.points > me.points).length
                : undefined,
              total: all.length,
            });
          })
          .catch(() => setOverall({ total: 0 }));

        const rows = await Promise.all(
          myLeagues.map(async (l: any): Promise<LeagueRow> => {
            try {
              const st: any[] = await getFantasyLeagueStandings(
                t.id,
                l.slug,
              );

              const i = st.findIndex(
                (r) =>
                  (r.fantasy_team_id ?? r.team_id ?? r.id) ===
                  (myTeam as any).id,
              );

              return {
                slug: l.slug,
                name: l.name,
                type: l.type,
                rank: i >= 0 ? (st[i].rank ?? i + 1) : undefined,
                size: st.length,
              };
            } catch {
              return {
                slug: l.slug,
                name: l.name,
                type: l.type,
                size: l.teams ?? 0,
              };
            }
          }),
        );

        setLeagues(rows);
      } catch {
        setStatus("no-team");
      }
    })();
  }, []);

  const day = days[index];

  useEffect(() => {
    if (status !== "ready" || !team || !day || profiles[day.id]) {
      return;
    }

    setDayLoading(true);

    getFantasyTeamProfile((team as any).id, day.id)
      .then((p) =>
        setProfiles((prev) => ({ ...prev, [day.id]: p })),
      )
      .catch(() =>
        setProfiles((prev) => ({
          ...prev,
          [day.id]: { selections: [], breakdown: [] },
        })),
      )
      .finally(() => setDayLoading(false));
  }, [status, team, day, profiles]);

  const go = useCallback(
    (dir: -1 | 1) =>
      setIndex((i) =>
        Math.min(Math.max(i + dir, 0), days.length - 1),
      ),
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

  const profile = day ? profiles[day.id] : undefined;
  const cards = useMemo(() => toCards(profile), [profile]);
  const total = dayPoints(profile);

  const lastDay = lastIdx >= 0 ? days[lastIdx] : undefined;
  const lastMatchdayPoints = lastDay
    ? dayPoints(profiles[lastDay.id])
    : undefined;

  const generalLeagues = leagues.filter((l) => l.type !== "private");
  const privateLeagues = leagues.filter((l) => l.type === "private");

  const squadValue =
    cards.length > 0 && cards.some((c) => c.price !== undefined)
      ? cards.reduce((sum, c) => sum + (c.price ?? 0), 0)
      : undefined;

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <Skeleton className="h-24" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[19rem_1fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (status === "no-auth") {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="font-display text-3xl font-black uppercase">
          Log in to see your points
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block font-stat text-sm uppercase tracking-widest text-ember hover:underline"
        >
          Go to login →
        </Link>
      </div>
    );
  }

  if (status === "no-team" || !team) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="font-display text-3xl font-black uppercase">
          No fantasy team yet
        </p>
        <p className="mt-2 font-stat text-xs uppercase tracking-widest text-ash">
          Create one and start picking.
        </p>
        <Link
          href="/fantasy/pick-team"
          className="mt-4 inline-block font-stat text-sm uppercase tracking-widest text-ember hover:underline"
        >
          Pick your team →
        </Link>
      </div>
    );
  }

  const teamName =
    (team as any).team_name ?? (team as any).name;

  const leagueList = (
    items: LeagueRow[],
    empty: React.ReactNode,
  ) =>
    items.length === 0 ? (
      <div className="px-3 py-4 font-stat text-xs leading-relaxed text-ash">
        {empty}
      </div>
    ) : (
      <ul className="divide-y divide-white/10">
        {items.map((l) => (
          <li key={l.slug}>
            <Link
              href={`/leaderboard?league=${encodeURIComponent(l.slug)}`}
              className="flex items-center justify-between gap-3 px-3 py-3 transition hover:bg-white/[0.04]"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold uppercase leading-tight">
                  {l.name}
                </p>
                {l.size > 0 && (
                  <p className="mt-1 font-stat text-[10px] text-ash">
                    {l.size} {l.size === 1 ? "manager" : "managers"}
                  </p>
                )}
              </div>

              <span
                className={`flex h-9 min-w-9 shrink-0 items-center justify-center border px-2 font-display text-sm font-black tabular-nums ${
                  l.rank && l.rank <= 3
                    ? "border-ember/40 bg-ember/10 text-ember"
                    : "border-white/10 bg-white/[0.03] text-bone"
                }`}
              >
                {l.rank ? `#${l.rank}` : "–"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <div className="grid items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-8">
        {/* Sidebar */}
        <aside className="order-2 space-y-4 lg:sticky lg:top-24 lg:order-1">
          {/* Profile */}
          <section className="overflow-hidden border border-white/10 bg-char-2">
            <div className="h-1 bg-ember" />

            <div className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">
                  Fantasy manager
                </p>
                <span className="h-2 w-2 shrink-0 bg-ember" />
              </div>

              <h1 className="break-words font-display text-3xl font-black uppercase leading-tight">
                {teamName}
              </h1>

              <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
                {username && (
                  <span className="max-w-full truncate border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-stat text-xs text-ash">
                    {username}
                  </span>
                )}
                <Flag country={(team as any).country} height={14} />
              </div>
            </div>
          </section>

          {/* Overall performance */}
          <section className="border border-white/10 bg-char-2">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <h2 className="font-display text-lg font-black uppercase">
                Performance
              </h2>
              <span className="font-stat text-[10px] uppercase tracking-widest text-ash">
                Overall
              </span>
            </div>

            <div className="p-5">
              <p className="font-stat text-[10px] uppercase tracking-[0.18em] text-ash">
                Total fantasy points
              </p>

              <p className="mt-2 font-display text-5xl font-black leading-none tabular-nums text-ember">
                {overall?.points ?? "–"}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="border border-white/10 bg-white/[0.025] p-3">
                  <p className="font-stat text-[10px] uppercase tracking-wider text-ash">
                    Overall rank
                  </p>
                  <p className="mt-2 font-display text-2xl font-black tabular-nums">
                    {overall?.rank ? `#${overall.rank}` : "–"}
                  </p>
                </div>

                <div className="border border-white/10 bg-white/[0.025] p-3">
                  <p className="font-stat text-[10px] uppercase tracking-wider text-ash">
                    Managers
                  </p>
                  <p className="mt-2 font-display text-2xl font-black tabular-nums">
                    {overall ? overall.total : "–"}
                  </p>
                </div>

                <div className="col-span-2 flex items-center justify-between gap-3 border border-white/10 bg-white/[0.025] p-3">
                  <div className="min-w-0">
                    <p className="font-stat text-[10px] uppercase tracking-wider text-ash">
                      Last matchday
                    </p>
                    <p className="mt-1 truncate font-display text-sm font-bold uppercase">
                      {lastDay
                        ? shortDayName(dayLabel(lastDay))
                        : "Not played yet"}
                    </p>
                  </div>

                  <p className="shrink-0 font-display text-2xl font-black tabular-nums text-ember">
                    {lastMatchdayPoints ?? "–"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Leagues */}
          <section className="border border-white/10 bg-char-2">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-black uppercase">
                  My Leagues
                </h2>
                <span className="border border-white/10 px-2 py-1 font-stat text-[10px] tabular-nums text-ash">
                  {leagues.length}
                </span>
              </div>
              <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">
                Your competitive standings
              </p>
            </div>

            <div className="space-y-3 p-4">
              <div className="overflow-hidden border border-white/10">
                <div className="flex items-center justify-between gap-3 bg-white/[0.04] px-3 py-3">
                  <span className="font-stat text-[10px] uppercase tracking-widest text-ash">
                    General leagues
                  </span>
                  <span className="font-stat text-xs tabular-nums text-ash">
                    {generalLeagues.length}
                  </span>
                </div>

                {leagueList(
                  generalLeagues,
                  "You haven't joined a general league yet.",
                )}
              </div>

              <div className="overflow-hidden border border-white/10">
                <div className="flex items-center justify-between gap-3 bg-white/[0.04] px-3 py-3">
                  <span className="font-stat text-[10px] uppercase tracking-widest text-ash">
                    Private leagues
                  </span>
                  <span className="font-stat text-xs tabular-nums text-ash">
                    {privateLeagues.length}
                  </span>
                </div>

                {leagueList(
                  privateLeagues,
                  <>
                    No private leagues yet.{" "}
                    <Link
                      href="/fantasy/leagues"
                      className="font-semibold text-ember hover:underline"
                    >
                      Join or create one →
                    </Link>
                  </>,
                )}
              </div>

              <Link
                href="/fantasy/leagues"
                className="flex items-center justify-center gap-2 border border-white/10 px-3 py-3 font-stat text-[10px] uppercase tracking-widest text-ash transition hover:border-ember/40 hover:text-ember"
              >
                Manage leagues <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>

          {/* Squad value */}
          <section className="border border-ember/30 bg-char-2">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-stat text-[10px] uppercase tracking-[0.18em] text-ash">
                    Your lineup
                  </p>
                  <h2 className="mt-1 font-display text-xl font-black uppercase">
                    Squad value
                  </h2>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-ember/30 bg-ember/10 font-display text-xl font-black text-ember">
                  $
                </div>
              </div>

              <p className="mt-4 font-display text-4xl font-black leading-none tabular-nums">
                {squadValue !== undefined ? money(squadValue) : "–"}
              </p>

              <p className="mt-2 font-stat text-[10px] uppercase tracking-widest text-ash">
                Matchday {index + 1}
              </p>

              <div className="mt-5 border-t border-white/10 pt-4">
                <Link
                  href="/fantasy/pick-team"
                  className="flex w-full items-center justify-center gap-2 bg-ember px-4 py-3 font-stat text-xs font-bold uppercase tracking-widest text-white transition hover:bg-ember/80"
                >
                  Edit your pick <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </section>
        </aside>

        {/* Matchday and player cards */}
        <section className="order-1 min-w-0 lg:order-2">
          <div className="flex items-stretch border border-white/10 bg-char-2">
            <button
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Previous matchday"
              className="px-4 text-2xl transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
            >
              ←
            </button>

            <div className="min-w-0 flex-1 px-3 py-4 text-center sm:px-4">
              <p className="font-stat text-[10px] uppercase tracking-widest text-ash sm:text-xs">
                Matchday {index + 1} of {days.length}
              </p>
              <p className="mt-1 break-words font-display text-lg font-black uppercase sm:text-2xl">
                {day ? dayLabel(day) : ""}
              </p>
            </div>

            <button
              onClick={() => go(1)}
              disabled={index >= days.length - 1}
              aria-label="Next matchday"
              className="px-4 text-2xl transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
            >
              →
            </button>
          </div>

          <div className="mt-5 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="font-stat text-[10px] uppercase tracking-widest text-ash sm:text-xs">
                Your performance
              </p>
              <h2 className="mt-1 font-display text-xl font-black uppercase sm:text-2xl">
                Matchday points
              </h2>
            </div>

            <p className="font-display text-3xl font-black tabular-nums text-ember sm:text-4xl">
              {total ?? "–"}
            </p>
          </div>

          {dayLoading && !profile ? (
            <Skeleton className="mt-5 h-96" />
          ) : cards.length === 0 ? (
            <div className="mt-5 border border-dashed border-white/15 bg-char-2 px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center border border-white/10 font-display text-2xl text-ash">
                —
              </div>
              <p className="mt-4 font-display text-2xl font-black uppercase">
                No selection for this day
              </p>
              <p className="mt-2 font-stat text-xs text-ash">
                Your selected players will appear here when a lineup is available.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {cards.map((c) => (
                <FantasyPlayerCard
                  key={c.key}
                  player={c.player}
                  team={c.team}
                  price={c.price}
                  captain={c.captain}
                  stats={{
                    kills: c.kills,
                    fantasyPoints: c.points,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
