"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getDayTeams, getDays, getMyPrediction, submitPrediction } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { PredictionDetail, Team, TournamentDay } from "@/types";
import PredictionResultRow from "./PredictionResultRow";
import PredictionSummary from "./PredictionSummary";
import TeamRankBuilder from "./TeamRankBuilder";

function pickOpenDay(days: TournamentDay[]): TournamentDay | null {
  if (days.length === 0) return null;
  const sorted = [...days].sort((a, b) => a.day_order - b.day_order);
  const now = Date.now();
  const open = sorted.find((d) => {
    const hasDeadline = d.deadline && !d.deadline.startsWith("0001");
    if (!hasDeadline) return true;
    return new Date(d.deadline).getTime() > now;
  });
  return open ?? sorted[sorted.length - 1];
}

export default function PredictionConsole({ tournamentId }: { tournamentId: number }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [day, setDay] = useState<TournamentDay | null>(null);
  const [dayTeams, setDayTeams] = useState<Team[]>([]);
  const [existing, setExisting] = useState<PredictionDetail | null | undefined>(undefined);
  const [order, setOrder] = useState<Team[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoggedIn(!!getToken());
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    getDays(tournamentId).then((d) => setDay(pickOpenDay(d)));
  }, [loggedIn, tournamentId]);

  const loadDayData = useCallback(() => {
    if (!day) return;
    setLoading(true);
    Promise.all([
      getDayTeams(day.id).then((dt) => dt.map((x) => x.team)),
      getMyPrediction(day.id).catch((e) => {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }),
    ])
      .then(([teams, mine]) => {
        setDayTeams(teams);
        setExisting(mine);
        if (mine && mine.teams.length === 12) {
          const byId = new Map(teams.map((t) => [t.id, t]));
          const ordered = [...mine.teams]
            .sort((a, b) => a.predicted_placement - b.predicted_placement)
            .map((pt) => byId.get(pt.team_id))
            .filter((t): t is Team => !!t);
          setOrder(ordered.length === 12 ? ordered : teams);
        } else {
          setOrder(teams);
        }
      })
      .catch(() => setError("Failed to load this day's teams"))
      .finally(() => setLoading(false));
  }, [day]);

  useEffect(() => {
    loadDayData();
  }, [loadDayData]);

  async function handleSubmit() {
    if (!day) return;
    setBusy(true);
    setError("");
    try {
      await submitPrediction(
        day.id,
        order.map((t, i) => ({ team_id: t.id, placement: i + 1 }))
      );
      router.push(`/predictions/${existing?.prediction.id ?? "me"}`);
      // fallback: reload mine if we don't have the id yet
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit prediction");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (!authChecked) return <div className="mx-auto max-w-3xl px-5 py-10"><Skeleton className="h-40" /></div>;

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="font-display text-3xl font-black uppercase">Log in to predict</p>
        <Link href="/login" className="mt-4 inline-block font-stat text-sm uppercase tracking-widest text-ember hover:underline">
          Go to login →
        </Link>
      </div>
    );
  }

  if (!day) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <EmptyState title="No tournament days available" />
      </div>
    );
  }

  const lockTime = existing?.lock_time;
  const locked = lockTime ? new Date(lockTime).getTime() < Date.now() : false;

  if (loading) {
    return <div className="mx-auto max-w-3xl px-5 py-10"><Skeleton className="h-96" /></div>;
  }

  if (dayTeams.length !== 12) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <EmptyState title="This day doesn't have 12 teams assigned yet" hint="Check back once the full lobby is set." />
      </div>
    );
  }

  // already scored: show the result breakdown instead of the builder
  if (existing?.prediction.scored_at) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-5 py-10">
        <div className="chamfer border border-bone/10 bg-char-2 p-6">
          <p className="font-stat text-[10px] uppercase tracking-widest text-ash">{day.name} — results</p>
          <p className="font-display text-4xl font-black tabular-nums text-ember">
            {existing.prediction.total_points} / 144
          </p>
        </div>
        <div className="space-y-2">
          {[...existing.teams].sort((a, b) => a.predicted_placement - b.predicted_placement).map((e) => (
            <PredictionResultRow key={e.id} entry={e} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-10">
      <div className="chamfer-sm border border-bone/15 bg-char-2 px-5 py-3">
        <p className="font-stat text-[10px] uppercase tracking-widest text-ash">Predicting for</p>
        <p className="font-display text-2xl font-black uppercase text-ember">{day.name}</p>
      </div>

      {locked ? (
        <p className="border-l-2 border-danger pl-3 font-stat text-xs uppercase tracking-widest text-danger">
          Predictions are locked for this day — awaiting results
        </p>
      ) : (
        <p className="font-stat text-xs uppercase tracking-widest text-ash">
          Drag to reorder, or use the arrow buttons. 1st at the top.
        </p>
      )}

      {confirming ? (
        <>
          <PredictionSummary order={order} />
          <p aria-live="polite" className="min-h-5 font-stat text-xs text-danger">{error}</p>
          <div className="flex gap-3">
            <Button type="button" onClick={handleSubmit} disabled={busy}>
              {busy ? "Submitting…" : "Confirm & submit"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
              Back to edit
            </Button>
          </div>
        </>
      ) : (
        <>
          <TeamRankBuilder order={order} onReorder={setOrder} disabled={locked} />
          {!locked && (
            <Button type="button" onClick={() => setConfirming(true)} className="w-full sm:w-auto">
              Review & submit
            </Button>
          )}
        </>
      )}
    </div>
  );
}