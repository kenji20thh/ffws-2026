"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getMyPrediction } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  MAX_SESSION_POINTS,
  groupEntriesBySession,
  sessionKeys,
} from "@/lib/predictionSessions";
import type { PredictionDetail, TournamentDay } from "@/types";
import PredictionResultRow from "./PredictionResultRow";

type DayState = PredictionDetail | null; // null = no prediction for that day

export default function PredictionPoints({ days }: { days: TournamentDay[] }) {
  const sortedDays = useMemo(
    () => [...days].sort((a, b) => a.day_order - b.day_order),
    [days],
  );

  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [index, setIndex] = useState(0);
  const [details, setDetails] = useState<Record<number, DayState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoggedIn(!!getToken());
    setAuthChecked(true);
  }, []);

  const day = sortedDays[index];

  useEffect(() => {
    if (!loggedIn || !day || day.id in details) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    getMyPrediction(day.id)
      .then((d) => {
        if (!cancelled) setDetails((prev) => ({ ...prev, [day.id]: d }));
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setDetails((prev) => ({ ...prev, [day.id]: null }));
        } else {
          setError(
            e instanceof Error ? e.message : "Failed to load your prediction",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loggedIn, day, details]);

  const go = useCallback(
    (dir: -1 | 1) =>
      setIndex((i) => Math.min(Math.max(i + dir, 0), sortedDays.length - 1)),
    [sortedDays.length],
  );

  if (!authChecked) {
    return <Skeleton className="h-40" />;
  }

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
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

  if (sortedDays.length === 0) {
    return <EmptyState title="No matchdays yet" />;
  }

  const detail = day ? details[day.id] : undefined;
  const bySession = detail ? groupEntriesBySession(detail.teams) : {};
  const sessions = sessionKeys(bySession);
  const scored = !!detail && detail.scored && !detail.hidden;

  return (
    <div className="space-y-6">
      <div className="flex items-stretch border border-bone/10 bg-char-2">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Previous matchday"
          className="px-4 text-2xl transition hover:bg-bone/5 disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
        >
          ←
        </button>

        <div className="min-w-0 flex-1 px-3 py-4 text-center sm:px-4">
          <p className="font-stat text-[10px] uppercase tracking-widest text-ash sm:text-xs">
            Matchday {index + 1} of {sortedDays.length}
          </p>
          <p className="mt-1 break-words font-display text-lg font-black uppercase sm:text-2xl">
            {day?.name}
          </p>
        </div>

        <button
          onClick={() => go(1)}
          disabled={index >= sortedDays.length - 1}
          aria-label="Next matchday"
          className="px-4 text-2xl transition hover:bg-bone/5 disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
        >
          →
        </button>
      </div>

      <div className="flex items-end justify-between gap-4 border-b border-bone/10 pb-4">
        <div>
          <p className="font-stat text-[10px] uppercase tracking-widest text-ash sm:text-xs">
            Your performance
          </p>
          <h2 className="mt-1 font-display text-xl font-black uppercase sm:text-2xl">
            Prediction points
          </h2>
        </div>

        <p className="font-display text-3xl font-black tabular-nums text-ember sm:text-4xl">
          {scored ? detail!.total_points : "–"}
          {scored && (
            <span className="ml-1 font-stat text-xs font-normal text-ash">
              / {MAX_SESSION_POINTS * Math.max(sessions.length, 1)}
            </span>
          )}
        </p>
      </div>

      {error ? (
        <p className="font-stat text-xs uppercase tracking-widest text-ash">
          {error}
        </p>
      ) : loading && detail === undefined ? (
        <Skeleton className="h-96" />
      ) : detail === null || detail === undefined ? (
        <div className="space-y-4">
          <EmptyState
            title="No prediction for this day"
            hint="Rank the lobby to start earning points."
          />
          <div className="text-center">
            <Link
              href="/fantasy/predict/make"
              className="font-stat text-sm uppercase tracking-widest text-ember hover:underline"
            >
              Make a prediction →
            </Link>
          </div>
        </div>
      ) : detail.hidden ? (
        <p className="font-stat text-xs uppercase tracking-widest text-ash">
          Predictions stay hidden until this day locks
        </p>
      ) : !detail.scored ? (
        <EmptyState
          title="Not scored yet"
          hint="Points appear after the organizers enter the day's results."
        />
      ) : (
        <div
          className={
            sessions.length > 1
              ? "grid gap-6 lg:grid-cols-2 lg:items-start"
              : "space-y-2"
          }
        >
          {sessions.map((sn) => (
            <div key={sn} className="space-y-2">
              {sessions.length > 1 && (
                <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-amber">
                  Session {sn}
                </p>
              )}
              {bySession[sn].map((e) => (
                <PredictionResultRow key={e.id} entry={e} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}