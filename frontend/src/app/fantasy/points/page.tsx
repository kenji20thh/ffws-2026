"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Skeleton from "@/components/ui/Skeleton";
import FantasyPlayerCard from "@/components/fantasy/FantasyPlayerCard";
import {
  getDays,
  getFantasyLeagueStandings,
  getFantasyTeamProfile,
  getMyFantasyLeagues,
  getMyFantasyTeam,
  getTournament,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { FantasyTeam, TournamentDay } from "@/types";

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

type LeagueRow = { slug: string; name: string; rank?: number; size: number };

/* ------------------------------------------------------------------ */

export default function FantasyPointsPage() {
  const [status, setStatus] = useState<"loading" | "no-auth" | "no-team" | "ready">("loading");
  const [tournamentId, setTournamentId] = useState(0);
  const [team, setTeam] = useState<FantasyTeam | null>(null);
  const [days, setDays] = useState<TournamentDay[]>([]);
  const [index, setIndex] = useState(0);
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
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
        setDays(sorted);
        setIndex(Math.max(lastStarted, 0));
        setStatus("ready");

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
                rank: i >= 0 ? (st[i].rank ?? i + 1) : undefined,
                size: st.length,
              };
            } catch {
              return { slug: l.slug, name: l.name, size: 0 };
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

  /* states */
  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <Skeleton className="h-24" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
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
  const teamTotal = (team as any).total_points ?? (team as any).points;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="flex items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="font-stat text-xs uppercase tracking-widest text-ash">Your fantasy team</p>
          <h1 className="font-display text-4xl font-black uppercase">{teamName}</h1>
        </div>
        <div className="flex items-end gap-6">
          {teamTotal !== undefined && (
            <div className="text-right">
              <p className="font-stat text-xs uppercase tracking-widest text-ash">Total points</p>
              <p className="font-display text-4xl font-black text-ember">{teamTotal}</p>
            </div>
          )}
          <Link href="/fantasy/pick-team" className="font-stat text-xs uppercase tracking-widest text-ember hover:underline">
            Edit this pick →
          </Link>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Leagues */}
        <aside className="order-2 lg:order-1">
          <h2 className="font-stat text-xs uppercase tracking-widest text-ash">My leagues</h2>
          {leagues.length === 0 ? (
            <p className="mt-3 border border-white/10 p-4 font-stat text-sm text-ash">
              You haven&apos;t joined any league yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-white/10 border border-white/10">
              {leagues.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/leaderboard?league=${encodeURIComponent(l.slug)}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-black uppercase">{l.name}</p>
                      {l.size > 0 && <p className="font-stat text-xs text-ash">{l.size} players</p>}
                    </div>
                    <p className={`shrink-0 font-display text-2xl font-black ${l.rank && l.rank <= 3 ? "text-ember" : ""}`}>
                      {l.rank ? `#${l.rank}` : "–"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
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