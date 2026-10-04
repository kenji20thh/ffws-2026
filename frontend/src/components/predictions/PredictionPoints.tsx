"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getMyPrediction } from "@/lib/api";
import { clearSession, getToken } from "@/lib/auth";
import type { PredictionDetail, TournamentDay } from "@/types";

interface DayRow {
  day: TournamentDay;
  detail: PredictionDetail | null;
}

const MAX_DAY_POINTS = 144;

function deadlinePassed(day: TournamentDay) {
  const hasDeadline = !!day.deadline && !day.deadline.startsWith("0001");
  return hasDeadline && new Date(day.deadline).getTime() < Date.now();
}

export default function PredictionPoints({ days }: { days: TournamentDay[] }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [rows, setRows] = useState<DayRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          })
      )
    )
      .then((r) => {
        if (!cancelled) setRows(r);
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

  const scored = rows.filter((r) => r.detail?.prediction.scored_at);
  const total = scored.reduce((sum, r) => sum + (r.detail?.prediction.total_points ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="chamfer border border-bone/10 bg-char-2 p-6">
        <p className="font-stat text-[10px] uppercase tracking-widest text-ash">Your prediction points</p>
        <p className="font-display text-5xl font-black tabular-nums text-ember">{total}</p>
        <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">
          {scored.length} of {rows.length} days scored
        </p>
      </div>

      <div className="space-y-3">
        {rows.map(({ day, detail }) => {
          const isScored = !!detail?.prediction.scored_at;
          const content = (
            <div className="chamfer flex items-center justify-between gap-4 border border-bone/10 bg-char-2 p-5 transition-colors hover:border-ember/40">
              <div>
                <p className="font-display text-2xl font-extrabold uppercase leading-none">{day.name}</p>
                <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">
                  {detail ? "View your prediction →" : deadlinePassed(day) ? "No prediction made" : "Predict now →"}
                </p>
              </div>
              <div className="text-right">
                {isScored ? (
                  <>
                    <p className="font-display text-3xl font-black tabular-nums text-ember">
                      {detail?.prediction.total_points}
                      <span className="text-base text-ash"> / {MAX_DAY_POINTS}</span>
                    </p>
                    <Badge tone="done">Scored</Badge>
                  </>
                ) : detail ? (
                  <Badge tone="ember">Submitted</Badge>
                ) : (
                  <Badge tone="neutral">{deadlinePassed(day) ? "Missed" : "Not predicted"}</Badge>
                )}
              </div>
            </div>
          );

          const href = detail ? `/fantasy/predict/${detail.prediction.id}` : "/fantasy/predict/make";
          return (
            <Link key={day.id} href={href} className="block">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
