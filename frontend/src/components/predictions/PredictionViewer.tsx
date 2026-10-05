"use client";

import { useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getPredictionById } from "@/lib/api";
import type { PredictionDetail } from "@/types";
import PredictionResultRow from "./PredictionResultRow";
import PredictionSummary from "./PredictionSummary";

// Client component so the logged-in owner's token is sent: picks are hidden from everyone
// else until the day locks.
export default function PredictionViewer({ predictionId }: { predictionId: number }) {
  const [detail, setDetail] = useState<PredictionDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPredictionById(predictionId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
        else setError(e instanceof Error ? e.message : "Failed to load this prediction");
      });
    return () => {
      cancelled = true;
    };
  }, [predictionId]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <EmptyState title="Prediction not found" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={error} />
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Skeleton className="h-64" />
      </div>
    );
  }

  const sorted = [...detail.teams].sort((a, b) => a.predicted_placement - b.predicted_placement);
  const scored = detail.scored && !detail.hidden;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-10">
      <div className="chamfer border border-bone/10 bg-char-2 p-6">
        <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
          {scored ? "Live score" : "Submitted prediction"}
        </p>
        {scored && (
          <p className="font-display text-4xl font-black tabular-nums text-ember">
            {detail.total_points} / 144
          </p>
        )}
      </div>

      {detail.hidden ? (
        <p className="font-stat text-xs uppercase tracking-widest text-ash">
          Predictions stay hidden until this day locks
        </p>
      ) : scored ? (
        <div className="space-y-2">
          {sorted.map((e) => (
            <PredictionResultRow key={e.id} entry={e} />
          ))}
        </div>
      ) : (
        <PredictionSummary order={sorted.map((e) => e.team)} />
      )}
    </div>
  );
}