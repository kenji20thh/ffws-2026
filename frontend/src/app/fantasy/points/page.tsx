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

/* ------------------------------------------------------------------ */
/* ADAPTERS: the only place that touches field names I couldn't see.   */
/* If tsc/runtime shows a different name, fix it here and nowhere else. */
/* ------------------------------------------------------------------ */
const dayLabel = (d: any): string => d.name ?? d.label ?? d.title ?? `Day ${d.id}`;
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
    const b = breakdown.find((x) => (x.player_id ?? x.player?.id) === pid) ?? {};
    return {
      key: pid ?? i,
      player: s.player ?? s,
      team: s.team ?? s.player?.team ?? {
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

type Overall = { points?: number; rank?: number; total: number };

/** "$36.5" / "$36": prices can have decimals. */
const money = (value: number) => `$${Number.isInteger(value) ? value : value.toFixed(1)}`;

/* ------------------------------------------------------------------ */

export default function FantasyPointsPage() {
  const [status, setStatus] = useState<"loading" | "no-auth" | "no-team" | "ready">("loading");
  const [tournamentId, setTournamentId] = useState(0);
  const [team, setTeam] = useState<FantasyTeam | null>(null);
  const [days, setDays] = useState<TournamentDay[]>([]);
  const [index, setIndex] = useState(0);
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [username, setUsername] = useState("");
  const [overall, setOverall] = useState<Overall | null>(null);
  const [lastIdx, setLastIdx] = useState(-1); // last matchday that has started (-1 = none yet)
  const [profiles, setProfiles] = useState<Record<number, any>>({});
  const [dayLoading, setDayLoading] = useState(false);

  /* initial load */
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

        const sorted = [...allDays].sort((a: any, b: any) => a.id - b.id);
        const lastStarted = sorted.map((d) => dayStarted(d)).lastIndexOf(true);

        setTournamentId(t.id);
        setTeam(myTeam);
        setUsername(getName() ?? "");
        setDays(sorted);
        setLastIdx(lastStarted);
        setIndex(Math.max(lastStarted, 0));
        setStatus("ready");

        // overall points / rank / number of players: the global standings (all matchdays)
        getFantasyStandings(t.id)
          .then((all: any[]) => {
            const me = all.find((r) => r.fantasy_team_id === (myTeam as any).id);
            setOverall({
              points: me?.points,
              // ties share a rank: 1 + number of teams with strictly more points
              rank: me ? 1 + all.filter((r) => r.points > me.points).length : undefined,
              total: all.length,
            });
          })
          .catch(() => setOverall({ total: 0 }));

        // rank per league: find my row in each league's standings
        const rows = await Promise.all(
          myLeagues.map(async (l: any): Promise<LeagueRow> => {
            try {
              const st: any[] = await getFantasyLeagueStandings(t.id, l.slug);
              const i = st.findIndex(
                (r) => (r.fantasy_team_id ?? r.team_id ?? r.id) === (myTeam as any).id,
              );
              return {
                slug: l.slug,
                name: l.name,
                type: l.type,
                rank: i >= 0 ? (st[i].rank ?? i + 1) : undefined,
                size: st.length,
              };
            } catch {
              return { slug: l.slug, name: l.name, type: l.type, size: l.teams ?? 0 };
            }
          }),
        );
        setLeagues(rows);
      } catch {
        setStatus("no-team");
      }
    })();
  }, []);

  /* load the selected day's picks */
  const day = days[index];
  useEffect(() => {
    if (status !== "ready" || !team || !day || profiles[day.id]) return;
    setDayLoading(true);
    getFantasyTeamProfile((team as any).id, day.id)
      .then((p) => setProfiles((prev) => ({ ...prev, [day.id]: p })))
      .catch(() => setProfiles((prev) => ({ ...prev, [day.id]: { selections: [], breakdown: [] } })))
      .finally(() => setDayLoading(false));
  }, [status, team, day, profiles]);

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

  const profile = day ? profiles[day.id] : undefined;
  const cards = useMemo(() => toCards(profile), [profile]);
  const total = dayPoints(profile);

  const lastDay = lastIdx >= 0 ? days[lastIdx] : undefined;
  const lastMatchdayPoints = lastDay ? dayPoints(profiles[lastDay.id]) : undefined;

  const generalLeagues = leagues.filter((l) => l.type !== "private");
  const privateLeagues = leagues.filter((l) => l.type === "private");

  // value of the squad shown on screen (sum of the four picked players' prices)
  const squadValue = cards.length > 0 && cards.some((c) => c.price !== undefined)
    ? cards.reduce((sum, c) => sum + (c.price ?? 0), 0)
    : undefined;

  /* states */
  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <Skeleton className="h-24" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[17.5rem_1fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (status === "no-auth") {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="font-display text-3xl font-black uppercase">Log in to see your points</p>
        <Link href="/login" className="mt-4 inline-block font-stat text-sm uppercase tracking-widest text-ember hover:underline">
          Go to login →
        </Link>
      </div>
    );
  }

  if (status === "no-team" || !team) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="font-display text-3xl font-black uppercase">No fantasy team yet</p>
        <p className="mt-2 font-stat text-xs uppercase tracking-widest text-ash">Create one and start picking.</p>
        <Link href="/fantasy/pick-team" className="mt-4 inline-block font-stat text-sm uppercase tracking-widest text-ember hover:underline">
          Pick your team →
        </Link>
      </div>
    );
  }

  const teamName = (team as any).team_name ?? (team as any).name;

  const leagueList = (items: LeagueRow[], empty: React.ReactNode) =>
    items.length === 0 ? (
      <div className="px-5 py-3 font-stat text-xs text-ash">{empty}</div>
    ) : (
      <ul className="divide-y divide-white/10">
        {items.map((l) => (
          <li key={l.slug}>
            <Link
              href={`/leaderboard?league=${encodeURIComponent(l.slug)}`}
              className="flex items-center justify-between gap-3 px-5 py-2.5 transition hover:bg-white/5"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-base font-black uppercase leading-tight">{l.name}</p>
                {l.size > 0 && <p className="font-stat text-[0.6875rem] text-ash">{l.size} players</p>}
              </div>
              <p className={`shrink-0 font-display text-xl font-black ${l.rank && l.rank <= 3 ? "text-ember" : ""}`}>
                {l.rank ? `#${l.rank}` : "–"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    );

  const statRow = (label: string, value: React.ReactNode, hint?: string) => (
    <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
      <div className="min-w-0">
        <p className="font-stat text-[0.6875rem] uppercase tracking-widest text-ash">{label}</p>
        {hint && <p className="truncate font-stat text-[0.625rem] text-ash/70">{hint}</p>}
      </div>
      <p className="shrink-0 font-display text-2xl font-black leading-none tabular-nums">{value}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="grid gap-8 lg:grid-cols-[19rem_1fr] lg:items-start">
        {/* Profile, standings, leagues and squad value */}
        <aside className="order-2 border border-white/10 bg-char-2 lg:sticky lg:top-24 lg:order-1">
          {/* Team */}
          <div className="border-b border-white/10 px-5 py-5">
            <h1 className="break-words font-display text-4xl font-black uppercase leading-none">{teamName}</h1>
            <p className="mt-2 flex items-center gap-2 font-stat text-sm text-ash">
              {username && <span className="truncate">{username}</span>}
              <Flag country={(team as any).country} height={14} />
            </p>
          </div>

          {/* Overall numbers */}
          <div className="divide-y divide-white/10 border-b border-white/10">
            <div className="px-5 py-4">
              <p className="font-stat text-[0.6875rem] uppercase tracking-widest text-ash">Overall points</p>
              <p className="mt-1 font-display text-5xl font-black leading-none tabular-nums text-ember">
                {overall?.points ?? "–"}
              </p>
            </div>
            {statRow("Overall rank", overall?.rank ? `#${overall.rank}` : "–")}
            {statRow("Total players", overall ? overall.total : "–")}
            {statRow(
              "Last matchday",
              lastMatchdayPoints ?? "–",
              lastDay ? shortDayName(dayLabel(lastDay)) : "No matchday played yet",
            )}
          </div>

          {/* Leagues */}
          <div className="border-b border-white/10">
            <h2 className="px-5 pt-4 font-stat text-[0.6875rem] uppercase tracking-widest text-ash">General leagues</h2>
            {leagueList(generalLeagues, "No general league yet.")}

            <h2 className="mt-1 border-t border-white/10 px-5 pt-4 font-stat text-[0.6875rem] uppercase tracking-widest text-ash">
              Private leagues
            </h2>
            {leagueList(
              privateLeagues,
              <>
                No private league yet.{" "}
                <Link href="/fantasy/leagues" className="text-ember hover:underline">
                  Create or join one →
                </Link>
              </>,
            )}
          </div>

          {/* Squad value */}
          <div className="flex items-baseline justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-stat text-[0.6875rem] uppercase tracking-widest text-ash">Squad value</p>
              <p className="font-stat text-[0.625rem] text-ash/70">Matchday {index + 1}</p>
            </div>
            <p className="font-display text-3xl font-black leading-none tabular-nums">
              {squadValue !== undefined ? money(squadValue) : "–"}
            </p>
          </div>

          <div className="border-t border-white/10 px-5 py-3">
            <Link href="/fantasy/pick-team" className="font-stat text-xs uppercase tracking-widest text-ember hover:underline">
              Edit this pick →
            </Link>
          </div>
        </aside>

        {/* Matchday + cards */}
        <section className="order-1 lg:order-2">
          <div className="flex items-stretch border border-white/10">
            <button
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Previous matchday"
              className="px-5 text-2xl transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ←
            </button>
            <div className="flex-1 px-4 py-3 text-center">
              <p className="font-stat text-xs uppercase tracking-widest text-ash">
                Matchday {index + 1} of {days.length}
              </p>
              <p className="font-display text-xl font-black uppercase sm:text-2xl">
                {day ? dayLabel(day) : ""}
              </p>
            </div>
            <button
              onClick={() => go(1)}
              disabled={index >= days.length - 1}
              aria-label="Next matchday"
              className="px-5 text-2xl transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              →
            </button>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <p className="font-stat text-xs uppercase tracking-widest text-ash">Points this matchday</p>
            <p className="font-display text-3xl font-black text-ember">{total ?? "–"}</p>
          </div>

          {dayLoading && !profile ? (
            <Skeleton className="mt-4 h-96" />
          ) : cards.length === 0 ? (
            <div className="mt-4 border border-dashed border-white/10 px-6 py-16 text-center">
              <p className="font-display text-2xl font-black uppercase">No selection for this day</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {cards.map((c) => (
                <FantasyPlayerCard
                  key={c.key}
                  player={c.player}
                  team={c.team}
                  price={c.price}
                  captain={c.captain}
                  stats={{ kills: c.kills, fantasyPoints: c.points }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}