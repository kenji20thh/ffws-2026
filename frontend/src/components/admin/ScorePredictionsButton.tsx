"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { ApiError, scorePredictionsForDay } from "@/lib/api";
import type { TournamentDay } from "@/types";

// Predictions only get points once this runs. It is safe to run again after correcting
// results: every prediction for the day is recomputed from the saved room results.
export default function ScorePredictionsButton({ day }: { day: TournamentDay }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await scorePredictionsForDay(day.id);
      const n = res.predictions_scored;
      setMessage(`Scored ${n} prediction${n === 1 ? "" : "s"} for ${day.name}.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to score predictions");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chamfer-sm flex flex-wrap items-center gap-3 border border-bone/15 bg-char-2 p-4">
      <div>
        <p className="font-stat text-[10px] uppercase tracking-widest text-ash">Predictions — {day.name}</p>
        <p className="text-sm text-bone/70">Enter all room results first, then score. Re-run after any correction.</p>
      </div>
      <Button type="button" onClick={run} disabled={busy} className="!px-5 !py-2 !text-base">
        {busy ? "Scoring…" : "Score predictions"}
      </Button>
      {message && <span className="font-stat text-xs text-ember">{message}</span>}
      {error && <span className="font-stat text-xs text-danger">{error}</span>}
    </div>
  );
}
