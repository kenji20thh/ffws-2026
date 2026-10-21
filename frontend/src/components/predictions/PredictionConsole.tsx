"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CreateFantasyTeamForm from "@/components/fantasy/CreateFantasyTeamForm";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getDayTeams, getDays, getMyFantasyTeam, getMyPrediction, submitPrediction } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  MAX_SESSION_POINTS,
  SESSION_SIZE,
  groupEntriesBySession,
  groupTeamsBySession,
  sessionKeys,
} from "@/lib/predictionSessions";
import type { FantasyTeam, PredictionDetail, Team, TournamentDay } from "@/types";
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
  const [team, setTeam] = useState<FantasyTeam | null | undefined>(undefined);
  const [day, setDay] = useState<TournamentDay | null>(null);
  // Teams per session (a day can have several lobbies of 12), the user's current order
  // for each, and which sessions the user has already looked at / arranged.
  const [sessionTeams, setSessionTeams] = useState<Record<number, Team[]>>({});
  const [orders, setOrders] = useState<Record<number, Team[]>>({});
  const [reviewed, setReviewed] = useState<Record<number, boolean>>({});
  const [activeSession, setActiveSession] = useState(1);
  const [existing, setExisting] = useState<PredictionDetail | null | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoggedIn(!!getToken());
    setAuthChecked(true);
  }, []);

  const loadTeam = useCallback(() => {
    getMyFantasyTeam(tournamentId)
      .then(setTeam)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setTeam(null);
      });
  }, [tournamentId]);

  useEffect(() => {
    if (!loggedIn) return;
    loadTeam();
    getDays(tournamentId).then((d) => setDay(pickOpenDay(d)));
  }, [loggedIn, tournamentId, loadTeam]);

  const loadDayData = useCallback(() => {
    if (!day || !team) return;
    setLoading(true);
    Promise.all([
      getDayTeams(day.id),
      getMyPrediction(day.id).catch((e) => {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }),
    ])
      .then(([dayTeams, mine]) => {
        const grouped = groupTeamsBySession(dayTeams);
        const keys = sessionKeys(grouped);
        const savedBySession = mine ? groupEntriesBySession(mine.teams) : {};

        const nextOrders: Record<number, Team[]> = {};
        const nextReviewed: Record<number, boolean> = {};
        for (const s of keys) {
          const teams = grouped[s];
          const saved = savedBySession[s] ?? [];
          let restored: Team[] = [];
          if (saved.length === SESSION_SIZE) {
            const byId = new Map(teams.map((t) => [t.id, t]));
            restored = saved
              .map((e) => byId.get(e.team_id))
              .filter((t): t is Team => !!t);
          }
          const useSaved = restored.length === SESSION_SIZE;
          nextOrders[s] = useSaved ? restored : teams;
          nextReviewed[s] = useSaved;
        }

        setSessionTeams(grouped);
        setOrders(nextOrders);
        setReviewed(nextReviewed);
        setActiveSession(keys[0] ?? 1);
        setExisting(mine);
      })
      .catch(() => setError("Failed to load this day's teams"))
      .finally(() => setLoading(false));
  }, [day, team]);

  useEffect(() => {
    loadDayData();
  }, [loadDayData]);

  const sessions = sessionKeys(sessionTeams);

  async function handleSubmit() {
    if (!day) return;
    setBusy(true);
    setError("");
    try {
      const saved = await submitPrediction(
        day.id,
        sessions.flatMap((sn) =>
          (orders[sn] ?? []).map((t, i) => ({ team_id: t.id, session: sn, placement: i + 1 }))
        )
      );
      router.push(`/fantasy/predict/${saved.id}`);
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

  if (team === undefined) return <div className="mx-auto max-w-3xl px-5 py-10"><Skeleton className="h-40" /></div>;

  if (team === null) {
    return (
      <div className="px-5 py-16">
        <CreateFantasyTeamForm tournamentId={tournamentId} onCreated={loadTeam} />
      </div>
    );
  }

  if (!day) {
    return <div className="mx-auto max-w-3xl px-5 py-20"><EmptyState title="No tournament days available" /></div>;
  }

  // Prefer the server's verdict; before the first prediction exists, fall back to the day's deadline.
  const hasDeadline = !!day.deadline && !day.deadline.startsWith("0001");
  const deadlinePassed = hasDeadline && new Date(day.deadline).getTime() < Date.now();
  const locked = existing?.locked ?? deadlinePassed;

  if (loading) {
    return <div className="mx-auto max-w-3xl px-5 py-10"><Skeleton className="h-96" /></div>;
  }

  const incomplete = sessions.filter((sn) => sessionTeams[sn].length !== SESSION_SIZE);
  if (sessions.length === 0 || incomplete.length > 0) {
    const hint =
      sessions.length === 0
        ? "Check back once the lobby is set."
        : `${incomplete
            .map((sn) => `Session ${sn} has ${sessionTeams[sn].length}/${SESSION_SIZE} teams`)
            .join(" · ")}. Check back once every lobby is set.`;
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <EmptyState title={`${day.name} doesn't have all its teams assigned yet`} hint={hint} />
      </div>
    );
  }

  const multi = sessions.length > 1;

  if (existing?.scored) {
    const bySession = groupEntriesBySession(existing.teams);
    const resultSessions = sessionKeys(bySession);
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-5 py-10">
        <div className="chamfer border border-bone/10 bg-char-2 p-6">
          <p className="font-stat text-[10px] uppercase tracking-widest text-ash">{day.name} — results</p>
          <p className="font-display text-4xl font-black tabular-nums text-ember">
            {existing.total_points} / {MAX_SESSION_POINTS * Math.max(resultSessions.length, 1)}
          </p>
        </div>
        {resultSessions.map((sn) => (
          <div key={sn} className="space-y-2">
            {resultSessions.length > 1 && (
              <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-amber">Session {sn}</p>
            )}
            {bySession[sn].map((e) => (
              <PredictionResultRow key={e.id} entry={e} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const allReviewed = sessions.every((sn) => reviewed[sn]);
  const currentOrder = orders[activeSession] ?? [];

  function reorder(sn: number, next: Team[]) {
    setOrders((o) => ({ ...o, [sn]: next }));
    setReviewed((r) => ({ ...r, [sn]: true }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-10">
      <div className="chamfer-sm border border-bone/15 bg-char-2 px-5 py-3">
        <p className="font-stat text-[10px] uppercase tracking-widest text-ash">Predicting as</p>
        <p className="font-display text-2xl font-black uppercase text-ember">{team.team_name}</p>
        <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">for {day.name}</p>
      </div>

      {locked ? (
        <p className="border-l-2 border-danger pl-3 font-stat text-xs uppercase tracking-widest text-danger">
          Predictions are locked for this day — awaiting results
        </p>
      ) : (
        <p className="font-stat text-xs uppercase tracking-widest text-ash">
          {multi
            ? `Rank the teams in each of the ${sessions.length} sessions. 1st at the top. Drag to reorder, or use the arrow buttons.`
            : "Drag to reorder, or use the arrow buttons. 1st at the top."}
        </p>
      )}

      {confirming ? (
        <>
          {sessions.map((sn) => (
            <PredictionSummary
              key={sn}
              order={orders[sn] ?? []}
              heading={multi ? `Session ${sn} — confirm before submitting` : undefined}
            />
          ))}
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
          {multi && (
            <div role="tablist" className="flex gap-2">
              {sessions.map((sn) => {
                const active = sn === activeSession;
                return (
                  <button
                    key={sn}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveSession(sn)}
                    className={`chamfer-sm flex-1 border px-4 py-2.5 font-stat text-xs uppercase tracking-widest transition-colors sm:flex-none ${
                      active
                        ? "border-ember bg-ember/10 text-ember"
                        : "border-bone/15 bg-char-2 text-ash hover:border-bone/40"
                    }`}
                  >
                    Session {sn}
                    {!locked && <span className="ml-2">{reviewed[sn] ? "✓" : "•"}</span>}
                  </button>
                );
              })}
            </div>
          )}

          <TeamRankBuilder
            key={activeSession}
            order={currentOrder}
            onReorder={(next) => reorder(activeSession, next)}
            disabled={locked}
          />

          {!locked && !reviewed[activeSession] && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReviewed((r) => ({ ...r, [activeSession]: true }))}
              className="w-full sm:w-auto"
            >
              Keep this order
            </Button>
          )}

          {!locked && (
            <div className="space-y-2">
              <Button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={!allReviewed}
                className="w-full sm:w-auto"
              >
                Review & submit
              </Button>
              {!allReviewed && (
                <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
                  Set an order for every session to continue
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
