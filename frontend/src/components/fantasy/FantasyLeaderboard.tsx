"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import MatchdayMenu from "@/components/standings/MatchdayMenu";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Flag from "@/components/ui/Flag";
import Skeleton from "@/components/ui/Skeleton";
import {
  ApiError,
  getFantasyLeagueStandings,
  getFantasyStandings,
  getMyFantasyLeagues,
  getMyFantasyTeam,
  leavePrivateLeague,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { buildDayMenu, resolveSelection } from "@/lib/dayMenu";
import type { FantasyLeague, FantasyStanding, FantasyTeam, TournamentDay } from "@/types";
import LeagueCodeCard from "./LeagueCodeCard";

const PAGE_SIZE = 50;

type Row = {
  id: number;
  team_name: string;
  country: string;
  points: number;
  rank: number;
};

const TYPE_LABEL: Record<FantasyLeague["type"], string> = {
  global: "Global league",
  region: "Region league",
  private: "Private league",
};

function guessType(slug: string): FantasyLeague["type"] {
  if (slug === "global") return "global";
  if (slug.startsWith("private-")) return "private";
  return "region";
}

function guessName(slug: string) {
  if (slug === "global") return "Global";
  if (slug.startsWith("private-")) return "Private league";
  return slug.replace(/-/g, " ").toUpperCase();
}

const leagueHref = (slug: string) => `/fantasy/leagues/${encodeURIComponent(slug)}`;

function LeagueChip({ league, active }: { league: FantasyLeague; active: boolean }) {
  return (
    <Link
      href={leagueHref(league.slug)}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 border px-3 py-2 font-stat text-xs font-bold uppercase tracking-wider transition-colors ${
        active
          ? "border-ember bg-ember text-char"
          : "border-bone/10 bg-char-2 text-ash hover:border-bone/30 hover:text-bone"
      }`}
    >
      {league.name}
    </Link>
  );
}

export default function LeagueLeaderboard({
  tournamentId,
  days,
  slug,
}: {
  tournamentId: number;
  days: TournamentDay[];
  slug: string;
}) {
  const router = useRouter();

  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [myTeam, setMyTeam] = useState<FantasyTeam | null>(null);
  const [leagues, setLeagues] = useState<FantasyLeague[]>([]);

  const [selectedDay, setSelectedDay] = useState("all");
  const [standings, setStandings] = useState<Record<string, FantasyStanding[]>>({});
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [leaveError, setLeaveError] = useState("");

  const daySections = useMemo(() => buildDayMenu(days, "Overall"), [days]);
  const selection = useMemo(() => resolveSelection(selectedDay, days), [selectedDay, days]);
  const keys = useMemo(
    () => (selection.scope === "all" ? ["all"] : selection.dayIds.map(String)),
    [selection],
  );

  /* who is looking: their team and leagues (only when logged in) */
  useEffect(() => {
    const hasToken = !!getToken();
    setLoggedIn(hasToken);
    if (!hasToken) return;

    let cancelled = false;
    Promise.allSettled([getMyFantasyTeam(tournamentId), getMyFantasyLeagues(tournamentId)]).then(
      ([team, mine]) => {
        if (cancelled) return;
        if (team.status === "fulfilled") setMyTeam(team.value);
        if (mine.status === "fulfilled") setLeagues(mine.value ?? []);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  /* standings: one request per day (or one for "overall"), cached once loaded.
     A week / phase is the sum of its days. */
  const cacheRef = useRef(standings);
  useEffect(() => {
    cacheRef.current = standings;
  }, [standings]);

  useEffect(() => {
    if (loggedIn === null) return;

    // Only Global is public; every other league needs a login.
    if (slug !== "global" && !loggedIn) {
      setError({ status: 401, message: "Log in to view this league." });
      return;
    }

    const missing = keys.filter((key) => !cacheRef.current[key]);
    if (missing.length === 0) {
      setError(null);
      return;
    }

    let cancelled = false;
    setError(null);

    Promise.allSettled(
      missing.map(async (key) => {
        const dayId = key === "all" ? undefined : Number(key);
        const rows =
          slug === "global"
            ? await getFantasyStandings(tournamentId, dayId)
            : await getFantasyLeagueStandings(tournamentId, slug, dayId);
        return [key, rows ?? []] as const;
      }),
    ).then((results) => {
      if (cancelled) return;

      const loaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      if (loaded.length > 0) {
        setStandings((prev) => ({ ...prev, ...Object.fromEntries(loaded) }));
      }

      const failed = results.find((r) => r.status === "rejected");
      if (failed && failed.status === "rejected") {
        const reason = failed.reason;
        setError({
          status: reason instanceof ApiError ? reason.status : 0,
          message: reason instanceof Error ? reason.message : "Failed to load standings",
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loggedIn, slug, keys, tournamentId, attempt]);

  const ready = keys.every((key) => standings[key]);

  const rows = useMemo<Row[]>(() => {
    if (!ready) return [];

    const totals = new Map<number, Omit<Row, "rank">>();
    for (const key of keys) {
      for (const r of standings[key]) {
        const current = totals.get(r.fantasy_team_id);
        if (current) current.points += r.points;
        else {
          totals.set(r.fantasy_team_id, {
            id: r.fantasy_team_id,
            team_name: r.team_name,
            country: r.country,
            points: r.points,
          });
        }
      }
    }

    const sorted = [...totals.values()].sort(
      (a, b) => b.points - a.points || a.team_name.localeCompare(b.team_name),
    );

    // ties share a rank (1, 2, 2, 4 ...)
    let lastPoints: number | null = null;
    let lastRank = 0;
    return sorted.map((row, index) => {
      if (row.points !== lastPoints) {
        lastRank = index + 1;
        lastPoints = row.points;
      }
      return { ...row, rank: lastRank };
    });
  }, [ready, keys, standings]);

  const current = leagues.find((l) => l.slug === slug);
  const type = current?.type ?? guessType(slug);
  const name = current?.name ?? guessName(slug);
  const mine = myTeam ? rows.find((r) => r.id === myTeam.id) : undefined;

  const query = search.trim().toLowerCase();
  const filtered = query ? rows.filter((r) => r.team_name.toLowerCase().includes(query)) : rows;
  const visible = filtered.slice(0, limit);

  const generalLeagues = leagues.filter((l) => l.type !== "private");
  const privateLeagues = leagues.filter((l) => l.type === "private");

  async function leave() {
    setLeaveError("");
    try {
      await leavePrivateLeague(tournamentId, slug);
      router.push("/fantasy/leagues");
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : "Failed to leave the league");
    }
  }

  /* ---------- states ---------- */
  const needsLogin = error?.status === 401 || (loggedIn === false && slug !== "global");

  let body: React.ReactNode;
  if (loggedIn === null || (!error && !ready)) {
    body = <Skeleton className="h-96" />;
  } else if (needsLogin) {
    body = (
      <div className="chamfer border border-bone/10 bg-char-2 px-6 py-14 text-center">
        <p className="font-display text-3xl font-black uppercase">Log in to view this league</p>
        <Link
          href="/login"
          className="mt-4 inline-block font-stat text-sm uppercase tracking-widest text-ember hover:underline"
        >
          Go to login →
        </Link>
      </div>
    );
  } else if (error?.status === 404) {
    body = (
      <EmptyState
        title="League not found"
        hint="It may not exist, or you are not a member of it."
      />
    );
  } else if (error?.status === 403) {
    body = <EmptyState title="League unavailable" hint={error.message} />;
  } else if (error) {
    body = (
      <div className="space-y-4">
        <ErrorState message={error.message} />
        <div className="text-center">
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="border border-ember px-4 py-2 font-stat text-xs uppercase tracking-wider text-ember"
          >
            Try again
          </button>
        </div>
      </div>
    );
  } else if (rows.length === 0) {
    body = <EmptyState title="No fantasy teams yet" hint="Teams appear here once they are created." />;
  } else {
    body = (
      <>
        {/* Your position */}
        {mine && (
          <div className="mb-4 flex items-center justify-between gap-4 chamfer border border-ember/40 bg-ember/10 px-5 py-4">
            <div>
              <p className="font-stat text-[0.625rem] uppercase tracking-[0.25em] text-ember">
                Your position
              </p>
              <p className="font-display text-3xl font-black uppercase leading-none">{mine.team_name}</p>
            </div>
            <div className="flex items-end gap-6 text-right">
              <div>
                <p className="font-stat text-[0.625rem] uppercase tracking-widest text-ash">Rank</p>
                <p className="font-display text-4xl font-black leading-none text-ember">#{mine.rank}</p>
              </div>
              <div>
                <p className="font-stat text-[0.625rem] uppercase tracking-widest text-ash">Points</p>
                <p className="font-display text-4xl font-black leading-none tabular-nums">{mine.points}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setLimit(PAGE_SIZE);
          }}
          placeholder="SEARCH TEAM..."
          className="mb-4 h-12 w-full chamfer border border-bone/10 bg-char-2 px-4 font-stat text-xs uppercase tracking-widest text-bone outline-none placeholder:text-ash focus:border-ember"
        />

        {filtered.length === 0 ? (
          <EmptyState title="No teams found" hint="Try another name." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[22rem] text-left">
              <thead>
                <tr className="border-b border-bone/15 font-stat text-[0.625rem] uppercase tracking-widest text-ash">
                  <th className="w-16 py-3 pr-3">#</th>
                  <th className="py-3">Team</th>
                  <th className="py-3 text-right text-ember">Points</th>
                </tr>
              </thead>

              <tbody>
                {visible.map((r) => {
                  const isMe = r.id === myTeam?.id;
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-bone/5 hover:bg-char-2 ${isMe ? "bg-ember/10" : ""}`}
                    >
                      <td
                        className={`py-3 pr-3 font-display text-3xl font-black tabular-nums ${
                          r.rank === 1
                            ? "text-amber"
                            : r.rank <= 3
                              ? "text-bone"
                              : "text-bone/50"
                        }`}
                      >
                        {r.rank}
                      </td>

                      <td className="py-3">
                        <Link
                          href={`/fantasy/${r.id}`}
                          className="flex items-center gap-3 font-display text-xl font-bold uppercase hover:text-ember sm:text-2xl"
                        >
                          <span className="truncate">{r.team_name}</span>
                          <Flag country={r.country} height={14} />
                          {isMe && (
                            <span className="shrink-0 font-stat text-[0.625rem] tracking-widest text-ember">
                              YOU
                            </span>
                          )}
                        </Link>
                      </td>

                      <td className="py-3 text-right font-stat text-lg font-bold tabular-nums text-ember">
                        {r.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > visible.length && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setLimit((n) => n + PAGE_SIZE)}
              className="border border-ember px-5 py-2 font-stat text-xs uppercase tracking-wider text-ember hover:bg-ember hover:text-char"
            >
              Show more ({filtered.length - visible.length} left)
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* My leagues */}
      {leagues.length > 0 && (
        <nav aria-label="My leagues" className="flex items-center gap-2 overflow-x-auto pb-1">
          {generalLeagues.map((l) => (
            <LeagueChip key={l.slug} league={l} active={l.slug === slug} />
          ))}
          {privateLeagues.length > 0 && generalLeagues.length > 0 && (
            <span aria-hidden="true" className="h-6 w-px shrink-0 bg-bone/20" />
          )}
          {privateLeagues.map((l) => (
            <LeagueChip key={l.slug} league={l} active={l.slug === slug} />
          ))}
        </nav>
      )}

      {/* League header + day selector */}
      <div className="flex flex-col gap-4 border border-bone/10 bg-char-2 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-stat text-[0.625rem] uppercase tracking-[0.3em] text-ember">
            {TYPE_LABEL[type]}
          </p>
          <h2 className="truncate font-display text-4xl font-black uppercase leading-none">{name}</h2>
          <p className="mt-2 font-stat text-xs uppercase tracking-widest text-ash">
            {ready && rows.length > 0
              ? `${rows.length} ${rows.length === 1 ? "team" : "teams"}`
              : current
                ? `${current.teams} ${current.teams === 1 ? "team" : "teams"}`
                : " "}
          </p>
        </div>

        <MatchdayMenu
          ariaLabel="Standings for"
          sections={daySections}
          value={selectedDay}
          onChange={(value) => {
            setSelectedDay(value);
            setLimit(PAGE_SIZE);
          }}
          disabled={days.length === 0}
          placeholder="Overall"
        />
      </div>

      {/* Invite code (private leagues you are in) */}
      {type === "private" && current?.code && (
        <LeagueCodeCard name={current.name} code={current.code} onLeave={leave} />
      )}
      {leaveError && <p className="font-stat text-xs text-danger">{leaveError}</p>}

      <section>{body}</section>

      <p className="text-center font-stat text-[0.625rem] uppercase tracking-widest text-ash">
        <Link href="/fantasy/leagues" className="hover:text-ember">
          Create or join a private league →
        </Link>
      </p>
    </div>
  );
}