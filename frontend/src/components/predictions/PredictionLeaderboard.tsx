"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import MatchdayMenu from "@/components/standings/MatchdayMenu";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Flag from "@/components/ui/Flag";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getMyFantasyTeam, getPredictionStandings } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { buildDayMenu, resolveSelection } from "@/lib/dayMenu";
import type { PredictionStanding, TournamentDay } from "@/types";

const PAGE_SIZE = 50;

type Row = {
  id: number;
  team_name: string;
  country: string;
  points: number;
  rank: number;
  /** Only set when a single day is shown (a week / phase mixes several predictions). */
  predictionId?: number;
};

export default function PredictionLeaderboard({
  tournamentId,
  days,
  highlightTeamId,
}: {
  tournamentId: number;
  days: TournamentDay[];
  /** Marks this team's row even before (or without) loading the logged-in team. */
  highlightTeamId?: number;
}) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [myTeamId, setMyTeamId] = useState<number | undefined>(undefined);

  const [selectedDay, setSelectedDay] = useState("all");
  const [standings, setStandings] = useState<Record<string, PredictionStanding[]>>({});
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const daySections = useMemo(() => buildDayMenu(days, "Overall"), [days]);
  const selection = useMemo(() => resolveSelection(selectedDay, days), [selectedDay, days]);
  const keys = useMemo(
    () => (selection.scope === "all" ? ["all"] : selection.dayIds.map(String)),
    [selection],
  );

  /* who is looking: their team (only when logged in). The board itself is public. */
  useEffect(() => {
    const hasToken = !!getToken();
    setLoggedIn(hasToken);
    if (!hasToken) return;

    let cancelled = false;
    getMyFantasyTeam(tournamentId)
      .then((team) => {
        if (!cancelled) setMyTeamId(team.id);
      })
      .catch(() => {
        // no team yet: nothing to highlight
      });
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
        const rows = await getPredictionStandings(tournamentId, dayId);
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
  }, [keys, tournamentId, attempt]);

  const ready = keys.every((key) => standings[key]);

  const rows = useMemo<Row[]>(() => {
    if (!ready) return [];

    const totals = new Map<number, Omit<Row, "rank">>();
    for (const key of keys) {
      for (const r of standings[key]) {
        const current = totals.get(r.competitor_team_id);
        if (current) current.points += r.total_points;
        else {
          totals.set(r.competitor_team_id, {
            id: r.competitor_team_id,
            team_name: r.team_name,
            country: r.country,
            points: r.total_points,
            predictionId: r.prediction_id,
          });
        }
      }
    }

    const singleDay = keys.length === 1 && keys[0] !== "all";
    const sorted = [...totals.values()]
      .map((r) => (singleDay ? r : { ...r, predictionId: undefined }))
      .sort((a, b) => b.points - a.points || a.team_name.localeCompare(b.team_name));

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

  const myId = myTeamId ?? highlightTeamId;
  const mine = myId !== undefined ? rows.find((r) => r.id === myId) : undefined;

  const query = search.trim().toLowerCase();
  const filtered = query ? rows.filter((r) => r.team_name.toLowerCase().includes(query)) : rows;
  const visible = filtered.slice(0, limit);

  /* ---------- states ---------- */
  let body: React.ReactNode;
  if (loggedIn === null || (!error && !ready)) {
    body = <Skeleton className="h-96" />;
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
    body = (
      <EmptyState title="No predictions yet" hint="Predictions appear here once they are made." />
    );
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
                  const isMe = r.id === myId;
                  const content = (
                    <>
                      <span className="truncate">{r.team_name}</span>
                      <Flag country={r.country} height={14} />
                      {isMe && (
                        <span className="shrink-0 font-stat text-[0.625rem] tracking-widest text-ember">
                          YOU
                        </span>
                      )}
                    </>
                  );
                  const nameClass =
                    "flex items-center gap-3 font-display text-xl font-bold uppercase sm:text-2xl";

                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-bone/5 hover:bg-char-2 ${isMe ? "bg-ember/10" : ""}`}
                    >
                      <td
                        className={`py-3 pr-3 font-display text-3xl font-black tabular-nums ${
                          r.rank === 1 ? "text-amber" : r.rank <= 3 ? "text-bone" : "text-bone/50"
                        }`}
                      >
                        {r.rank}
                      </td>

                      <td className="py-3">
                        {r.predictionId ? (
                          <Link
                            href={`/fantasy/predict/${r.predictionId}`}
                            className={`${nameClass} hover:text-ember`}
                          >
                            {content}
                          </Link>
                        ) : (
                          <span className={nameClass}>{content}</span>
                        )}
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
      {/* Header + day selector */}
      <div className="flex flex-col gap-4 border border-bone/10 bg-char-2 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-stat text-[0.625rem] uppercase tracking-[0.3em] text-ember">
            Prediction league
          </p>
          <h2 className="truncate font-display text-4xl font-black uppercase leading-none">Global</h2>
          <p className="mt-2 font-stat text-xs uppercase tracking-widest text-ash">
            {ready && rows.length > 0
              ? `${rows.length} ${rows.length === 1 ? "team" : "teams"}`
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

      <section>{body}</section>
    </div>
  );
}