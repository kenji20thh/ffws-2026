"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getMyPrediction } from "@/lib/api";
import { clearSession, getToken } from "@/lib/auth";
import { shortDayName } from "@/lib/dayMenu";
import {
  MAX_SESSION_POINTS,
  groupEntriesBySession,
  sessionKeys,
} from "@/lib/predictionSessions";
import { PREDICTION_LEGEND } from "@/lib/predictionTone";
import type { PredictionDetail, TournamentDay } from "@/types";
import PredictionResultRow from "./PredictionResultRow";

interface DayRow {
  day: TournamentDay;
  detail: PredictionDetail | null;
}

const hasDeadline = (day: TournamentDay) => !!day.deadline && !day.deadline.startsWith("0001");
const deadlinePassed = (day: TournamentDay) =>
  hasDeadline(day) && new Date(day.deadline).getTime() <= Date.now();

export default function PredictionPoints({ days }: { days: TournamentDay[] }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [rows, setRows] = useState<DayRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setLoggedIn(!!getToken());
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    const sorted = [...days].sort((a, b) => a.day_order - b.day_order);

    Promise.all(
      sorted.map((day) =>
        getMyPrediction(day.id)
          .then((detail): DayRow => ({ day, detail }))
          .catch((e): DayRow => {
            // 404 just means "no prediction for this day yet"
            if (e instanceof ApiError && e.status === 404) return { day, detail: null };
            throw e;
          }),
      ),
    )
      .then((loaded) => {
        if (cancelled) return;
        // open on the latest day that has been played (or is in play right now)
        const lastStarted = loaded.map((r) => deadlinePassed(r.day)).lastIndexOf(true);
        const lastScored = loaded.map((r) => !!r.detail?.scored).lastIndexOf(true);
        setIndex(Math.max(lastStarted, lastScored, 0));
        setRows(loaded);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          clearSession();
          setLoggedIn(false);
          return;
        }
        setError(e instanceof Error ? e.message : "Failed to load your predictions");
      });

    return () => {
      cancelled = true;
    };
  }, [loggedIn, days]);

  const count = rows?.length ?? 0;
  const go = useCallback(
    (dir: -1 | 1) => setIndex((i) => Math.min(Math.max(i + dir, 0), Math.max(count - 1, 0))),
    [count],
  );

  // ← / → switch the day
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // totals over every scored day
  const summary = useMemo(() => {
    const scored = (rows ?? []).filter((r) => r.detail?.scored);
    const entries = scored.flatMap((r) => r.detail?.teams ?? []);
    const best = scored.reduce<DayRow | null>(
      (top, r) => (!top || (r.detail?.total_points ?? 0) > (top.detail?.total_points ?? 0) ? r : top),
      null,
    );
    return {
      total: scored.reduce((sum, r) => sum + (r.detail?.total_points ?? 0), 0),
      daysScored: scored.length,
      exact: entries.filter((e) => e.actual_placement > 0 && e.predicted_placement === e.actual_placement).length,
      picks: entries.length,
      best,
    };
  }, [rows]);

  if (!authChecked) return <Skeleton className="h-40" />;

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <p className="font-display text-3xl font-black uppercase">Log in to see your points</p>
        <Link href="/login" className="mt-4 inline-block font-stat text-sm uppercase tracking-widest text-ember hover:underline">
          Go to login →
        </Link>
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;
  if (!rows) return <Skeleton className="h-64" />;
  if (rows.length === 0) return <EmptyState title="No tournament days yet" />;

  const { day, detail } = rows[index];
  const isScored = !!detail?.scored;
  const bySession = detail ? groupEntriesBySession(detail.teams) : {};
  const sessions = sessionKeys(bySession);
  const multi = sessions.length > 1;
  const maxPoints = MAX_SESSION_POINTS * Math.max(sessions.length, 1);
  const dayExact = (detail?.teams ?? []).filter(
    (e) => e.actual_placement > 0 && e.predicted_placement === e.actual_placement,
  ).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[19rem_1fr] lg:items-start">
      {/* Totals */}
      <aside className="order-2 border border-white/10 bg-char-2 lg:sticky lg:top-24 lg:order-1">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-stat text-[0.6875rem] uppercase tracking-widest text-ash">Prediction points</p>
          <p className="mt-1 font-display text-6xl font-black leading-none tabular-nums text-ember">{summary.total}</p>
          <p className="mt-2 font-stat text-[0.6875rem] uppercase tracking-widest text-ash">
            {summary.daysScored} of {rows.length} days scored
          </p>
        </div>

        <div className="divide-y divide-white/10 border-b border-white/10">
          <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
            <p className="font-stat text-[0.6875rem] uppercase tracking-widest text-ash">Exact placements</p>
            <p className="font-display text-2xl font-black leading-none tabular-nums">
              {summary.exact}
              <span className="text-sm text-ash"> / {summary.picks}</span>
            </p>
          </div>

          <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
            <div className="min-w-0">
              <p className="font-stat text-[0.6875rem] uppercase tracking-widest text-ash">Best day</p>
              {summary.best && (
                <p className="truncate font-stat text-[0.625rem] text-ash/70">{shortDayName(summary.best.day.name)}</p>
              )}
            </div>
            <p className="shrink-0 font-display text-2xl font-black leading-none tabular-nums">
              {summary.best ? summary.best.detail?.total_points : "–"}
            </p>
          </div>
        </div>

        <div className="space-y-2 px-5 py-4">
          <Link href="/fantasy/predict/leaderboard" className="block font-stat text-xs uppercase tracking-widest text-ember hover:underline">
            Prediction leaderboard →
          </Link>
          <Link href="/fantasy/predict/make" className="block font-stat text-xs uppercase tracking-widest text-ash hover:text-ember">
            Make a prediction →
          </Link>
        </div>
      </aside>

      {/* Day + predictions */}
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
              Matchday {index + 1} of {rows.length}
            </p>
            <p className="mt-1 break-words font-display text-lg font-black uppercase sm:text-2xl">{day.name}</p>
          </div>

          <button
            onClick={() => go(1)}
            disabled={index >= rows.length - 1}
            aria-label="Next matchday"
            className="px-4 text-2xl transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
          >
            →
          </button>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="font-stat text-[10px] uppercase tracking-widest text-ash sm:text-xs">Your predictions</p>
            <h2 className="mt-1 flex flex-wrap items-center gap-3 font-display text-xl font-black uppercase sm:text-2xl">
              Matchday points
              {detail &&
                (isScored ? (
                  <Badge tone="done">Scored</Badge>
                ) : (
                  <Badge tone="ember">Submitted</Badge>
                ))}
            </h2>
          </div>

          <p className="font-display text-3xl font-black tabular-nums text-ember sm:text-4xl">
            {isScored ? detail?.total_points : "–"}
            {isScored && <span className="text-base text-ash"> / {maxPoints}</span>}
          </p>
        </div>

        {!detail ? (
          <div className="mt-5 border border-dashed border-white/15 bg-char-2 px-6 py-16 text-center">
            <p className="font-display text-2xl font-black uppercase">
              {deadlinePassed(day) ? "No prediction made" : "No prediction yet"}
            </p>
            <p className="mt-2 font-stat text-xs text-ash">
              {deadlinePassed(day)
                ? "The deadline for this day has passed."
                : "You haven't predicted this day yet."}
            </p>
            {!deadlinePassed(day) && (
              <Link
                href="/fantasy/predict/make"
                className="mt-5 inline-block bg-ember px-5 py-3 font-stat text-xs font-bold uppercase tracking-widest text-char transition hover:bg-bone"
              >
                Predict now →
              </Link>
            )}
          </div>
        ) : (
          <>
            {isScored && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Color legend">
                {PREDICTION_LEGEND.map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5 font-stat text-[0.625rem] uppercase tracking-wider text-ash">
                    <span aria-hidden="true" className="h-2.5 w-2.5" style={{ backgroundColor: item.tone.color }} />
                    {item.label} <span className="text-bone/70">{item.points}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-6">
              {sessions.map((session) => (
                <div key={session} className="space-y-2">
                  {multi && (
                    <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-amber">Session {session}</p>
                  )}
                  {bySession[session].map((entry) => (
                    <PredictionResultRow key={entry.id} entry={entry} />
                  ))}
                </div>
              ))}
            </div>

            {isScored && (
              <p className="mt-4 text-right font-stat text-[0.625rem] uppercase tracking-widest text-ash">
                {dayExact} exact {dayExact === 1 ? "placement" : "placements"} this day
              </p>
            )}

            <p className="mt-4 text-right">
              <Link
                href={`/fantasy/predict/${detail.prediction.id}`}
                className="font-stat text-[0.625rem] uppercase tracking-widest text-ash hover:text-ember"
              >
                Open prediction page →
              </Link>
            </p>
          </>
        )}
      </section>
    </div>
  );
}