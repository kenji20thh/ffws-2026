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

const hasDeadline = (day: TournamentDay) =>
  !!day.deadline && !day.deadline.startsWith("0001");

const deadlinePassed = (day: TournamentDay) =>
  hasDeadline(day) && new Date(day.deadline).getTime() <= Date.now();

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="min-w-0 border-l border-white/10 pl-4 first:border-0 first:pl-0">
      <p className="font-stat text-[10px] uppercase tracking-[0.16em] text-ash sm:text-[11px]">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-black leading-none tabular-nums text-bone sm:text-4xl">
        {value}
      </p>
      {detail && (
        <p className="mt-2 font-stat text-[10px] uppercase tracking-wider text-ash/70">
          {detail}
        </p>
      )}
    </div>
  );
}

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
            if (e instanceof ApiError && e.status === 404) {
              return { day, detail: null };
            }
            throw e;
          }),
      ),
    )
      .then((loaded) => {
        if (cancelled) return;

        const lastStarted = loaded
          .map((r) => deadlinePassed(r.day))
          .lastIndexOf(true);

        const lastScored = loaded
          .map((r) => !!r.detail?.scored)
          .lastIndexOf(true);

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

        setError(
          e instanceof Error ? e.message : "Failed to load your predictions",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [loggedIn, days]);

  const count = rows?.length ?? 0;

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => Math.min(Math.max(i + dir, 0), Math.max(count - 1, 0)));
    },
    [count],
  );

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

  const summary = useMemo(() => {
    const scored = (rows ?? []).filter((r) => r.detail?.scored);
    const entries = scored.flatMap((r) => r.detail?.teams ?? []);

    const best = scored.reduce<DayRow | null>(
      (top, r) =>
        !top ||
        (r.detail?.total_points ?? 0) > (top.detail?.total_points ?? 0)
          ? r
          : top,
      null,
    );

    return {
      total: scored.reduce((sum, r) => sum + (r.detail?.total_points ?? 0), 0),
      daysScored: scored.length,
      exact: entries.filter(
        (e) =>
          e.actual_placement > 0 &&
          e.predicted_placement === e.actual_placement,
      ).length,
      picks: entries.length,
      best,
    };
  }, [rows]);

  if (!authChecked) return <Skeleton className="h-40" />;

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-md border border-white/10 bg-char-2 px-6 py-12 text-center sm:px-10">
        <p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">
          FFWS 2026 · Predictions
        </p>
        <h1 className="mt-4 font-display text-3xl font-black uppercase leading-tight">
          Your points.
          <br />
          Your performance.
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-ash">
          Log in to review your matchday scores and see how accurately you
          predicted the tournament.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex items-center justify-center bg-ember px-6 py-3 font-stat text-xs font-bold uppercase tracking-widest text-char transition hover:bg-bone"
        >
          Log in to continue <span className="ml-3">→</span>
        </Link>
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;
  if (!rows) return <Skeleton className="h-64" />;
  if (rows.length === 0) {
    return <EmptyState title="No tournament days yet" />;
  }

  const { day, detail } = rows[index];
  const isScored = !!detail?.scored;
  const bySession = detail ? groupEntriesBySession(detail.teams) : {};
  const sessions = sessionKeys(bySession);
  const multi = sessions.length > 1;
  const maxPoints = MAX_SESSION_POINTS * Math.max(sessions.length, 1);

  const dayExact = (detail?.teams ?? []).filter(
    (e) =>
      e.actual_placement > 0 &&
      e.predicted_placement === e.actual_placement,
  ).length;

  const completedPercent =
    rows.length > 0 ? Math.round((summary.daysScored / rows.length) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden border border-white/10 bg-char-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-ember/[0.07] blur-3xl"
        />

        <div className="relative px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember sm:text-xs">
              FFWS 2026 / Prediction centre
            </p>
            <span className="border border-white/10 px-2.5 py-1 font-stat text-[10px] uppercase tracking-widest text-ash">
              {summary.daysScored === rows.length
                ? "All days scored"
                : `${summary.daysScored}/${rows.length} days scored`}
            </span>
          </div>

          {/* Matchday selector: immediately below the Prediction centre label. */}
          <div className="mt-5 border-y border-white/10 py-4">
            <div className="flex flex-wrap justify-center gap-2">
              {rows.map((row, i) => {
                const selected = i === index;
                const scored = !!row.detail?.scored;
                const points = scored ? row.detail?.total_points : null;

                return (
                  <button
                    key={row.day.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={selected ? "step" : undefined}
                    className={`flex min-w-0 flex-1 basis-[140px] max-w-[190px] items-center gap-2 border px-3 py-2.5 text-left transition ${
                      selected
                        ? "border-ember/50 bg-ember/[0.09]"
                        : "border-white/10 hover:border-ember/40 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center font-stat text-xs font-bold tabular-nums ${
                        selected
                          ? "bg-ember text-char"
                          : scored
                            ? "bg-white/10 text-bone"
                            : "border border-white/10 text-ash"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate font-stat text-[10px] uppercase tracking-wide ${
                          selected ? "text-bone" : "text-ash"
                        }`}
                      >
                        {shortDayName(row.day.name)}
                      </span>
                      <span className="mt-1 block truncate font-stat text-[9px] uppercase tracking-wider text-ash/60">
                        {scored
                          ? "Scored"
                          : row.detail
                            ? "Submitted"
                            : deadlinePassed(row.day)
                              ? "No prediction"
                              : "Not submitted"}
                      </span>
                    </span>

                    <span
                      className={`shrink-0 font-display text-base font-black tabular-nums ${
                        scored ? "text-ember" : "text-ash/50"
                      }`}
                    >
                      {points ?? "–"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-7 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <h1 className="font-display text-4xl font-black uppercase leading-[0.92] tracking-tight sm:text-6xl">
                The points
                <br />
                <span className="text-ember">board.</span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-ash">
                Every placement counts. Review your predictions, track your
                accuracy, and see where you earned your points.
              </p>
            </div>

            <div className="sm:min-w-44 sm:border-l sm:border-white/10 sm:pl-6">
              <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
                Total points
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-6xl font-black leading-none tabular-nums text-ember sm:text-7xl">
                  {summary.total}
                </span>
                <span className="font-stat text-xs uppercase tracking-widest text-ash">
                  pts
                </span>
              </div>
            </div>
          </div>

          <div className="mt-7 h-1 overflow-hidden bg-white/10">
            <div
              className="h-full bg-ember transition-all duration-500"
              style={{ width: `${completedPercent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between gap-4 font-stat text-[9px] uppercase tracking-widest text-ash">
            <span>Scoring progress</span>
            <span>{completedPercent}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-white/10 px-5 py-5 sm:px-8 sm:py-6">
          <Stat
            label="Exact picks"
            value={summary.exact}
            detail={`of ${summary.picks} scored`}
          />
          <Stat
            label="Days scored"
            value={`${summary.daysScored}/${rows.length}`}
            detail="matchdays"
          />
          <Stat
            label="Best day"
            value={summary.best?.detail?.total_points ?? "–"}
            detail={
              summary.best
                ? shortDayName(summary.best.day.name)
                : "no score yet"
            }
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <aside className="order-2 space-y-4 lg:sticky lg:top-24 lg:order-1">
          <div className="border border-white/10 bg-char-2 p-4">
            <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
              Quick links
            </p>
            <Link
              href="/fantasy/predict/leaderboard"
              className="mt-4 flex items-center justify-between gap-2 border-b border-white/10 pb-3 font-stat text-[11px] uppercase tracking-wide text-bone transition hover:text-ember"
            >
              Prediction leaderboard <span>↗</span>
            </Link>
            <Link
              href="/fantasy/predict/make"
              className="mt-3 flex items-center justify-between gap-2 font-stat text-[11px] uppercase tracking-wide text-bone transition hover:text-ember"
            >
              Make a prediction <span>→</span>
            </Link>
          </div>
        </aside>

        <section className="order-1 min-w-0 lg:order-2">
          <div className="border border-white/10 bg-char-2">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-4 sm:px-5">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={index === 0}
                aria-label="Previous matchday"
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 text-xl transition hover:border-ember hover:text-ember disabled:cursor-not-allowed disabled:opacity-25"
              >
                ←
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p className="font-stat text-[9px] uppercase tracking-[0.2em] text-ash sm:text-[10px]">
                  Matchday {String(index + 1).padStart(2, "0")} / {rows.length}
                </p>
                <h2 className="mt-1 break-words font-display text-lg font-black uppercase leading-tight sm:text-2xl">
                  {day.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => go(1)}
                disabled={index >= rows.length - 1}
                aria-label="Next matchday"
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 text-xl transition hover:border-ember hover:text-ember disabled:cursor-not-allowed disabled:opacity-25"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/10">
              <div className="px-4 py-4 sm:px-5">
                <p className="font-stat text-[9px] uppercase tracking-[0.16em] text-ash">
                  Matchday score
                </p>
                <p className="mt-1 font-display text-3xl font-black leading-none tabular-nums text-ember sm:text-4xl">
                  {isScored ? detail?.total_points : "–"}
                  {isScored && (
                    <span className="ml-1 text-sm font-bold text-ash">
                      / {maxPoints}
                    </span>
                  )}
                </p>
              </div>
              <div className="px-4 py-4 sm:px-5">
                <p className="font-stat text-[9px] uppercase tracking-[0.16em] text-ash">
                  Exact placements
                </p>
                <p className="mt-1 font-display text-3xl font-black leading-none tabular-nums text-bone sm:text-4xl">
                  {isScored ? dayExact : "–"}
                  {isScored && (
                    <span className="ml-1 text-sm font-bold text-ash">
                      / {detail?.teams.length ?? 0}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 ${
                    isScored
                      ? "bg-emerald-400"
                      : detail
                        ? "bg-amber-400"
                        : "bg-white/25"
                  }`}
                />
                <span className="font-stat text-[10px] uppercase tracking-widest text-ash">
                  {isScored
                    ? "Results scored"
                    : detail
                      ? "Prediction submitted"
                      : "No prediction submitted"}
                </span>
              </div>
              {detail && (
                <Link
                  href={`/fantasy/predict/${detail.prediction.id}`}
                  className="font-stat text-[10px] uppercase tracking-widest text-ember transition hover:text-bone"
                >
                  Full prediction details ↗
                </Link>
              )}
            </div>
          </div>

          {!detail ? (
            <div className="mt-4 border border-dashed border-white/15 bg-char-2 px-5 py-12 text-center sm:px-8 sm:py-16">
              <span className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">
                Matchday {index + 1}
              </span>
              <h3 className="mt-3 font-display text-2xl font-black uppercase sm:text-3xl">
                {deadlinePassed(day)
                  ? "No prediction made"
                  : "Nothing submitted yet"}
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ash">
                {deadlinePassed(day)
                  ? "The deadline for this matchday has passed, and there is no prediction to score."
                  : "Your prediction will appear here once you submit your team placement picks."}
              </p>
              {!deadlinePassed(day) && (
                <Link
                  href="/fantasy/predict/make"
                  className="mt-6 inline-flex items-center gap-3 bg-ember px-5 py-3 font-stat text-[11px] font-bold uppercase tracking-widest text-char transition hover:bg-bone"
                >
                  Make your prediction <span>→</span>
                </Link>
              )}
            </div>
          ) : (
            <>
              {isScored && (
                <div className="mt-4 border border-white/10 bg-char-2 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
                        Scoring guide
                      </p>
                      <p className="mt-1 font-display text-lg font-black uppercase">
                        Points by accuracy
                      </p>
                    </div>
                    <Badge tone="done">Official results</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
                    {PREDICTION_LEGEND.map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0"
                          style={{ backgroundColor: item.tone.color }}
                        />
                        <span className="font-stat text-[10px] uppercase tracking-wide text-ash">
                          {item.label}
                        </span>
                        <span
                          className="font-stat text-xs font-bold tabular-nums"
                          style={{ color: item.tone.color }}
                        >
                          {item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
                      {isScored ? "Prediction results" : "Saved picks"}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-black uppercase">
                      Team placements
                    </h3>
                  </div>
                  <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
                    {detail.teams.length} teams
                  </p>
                </div>

                {multi && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {sessions.map((session) => (
                      <span
                        key={session}
                        className="border border-amber/30 bg-amber/[0.06] px-3 py-1.5 font-stat text-[10px] uppercase tracking-widest text-amber"
                      >
                        Session {session} · {bySession[session].length} teams
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-6">
                  {sessions.map((session) => (
                    <div key={session}>
                      {multi && (
                        <div className="mb-2 flex items-center gap-3">
                          <span className="font-stat text-[10px] uppercase tracking-[0.2em] text-amber">
                            Session {session}
                          </span>
                          <span className="h-px flex-1 bg-white/10" />
                        </div>
                      )}
                      <div className="space-y-2">
                        {bySession[session].map((entry) => (
                          <PredictionResultRow
                            key={entry.id}
                            entry={entry}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isScored && (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
                    Exact calls this matchday
                  </p>
                  <p className="font-display text-xl font-black tabular-nums text-ember">
                    {dayExact}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
