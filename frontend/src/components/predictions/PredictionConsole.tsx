"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
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

/** One slim bar: who is predicting, for which day, plus the page's main action(s). */
function StatusBar({
  team,
  day,
  children,
}: {
  team: FantasyTeam;
  day: TournamentDay;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden chamfer-sm border border-bone/10 bg-char-2">
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-ember/[0.07] to-transparent" />

      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center chamfer-sm border border-ember/25 bg-ember/10">
            <span className="font-display text-base font-black text-ember">
              {team.team_name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-stat text-[8px] uppercase tracking-[0.2em] text-ash">
              Predicting as
            </p>
            <p className="truncate font-display text-lg font-black uppercase leading-tight">
              {team.team_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:border-l sm:border-bone/10 sm:pl-6">
          <div className="flex h-10 min-w-10 items-center justify-center chamfer-sm border border-ember/30 bg-ember/10 px-1">
            <span className="font-stat text-[11px] font-black uppercase text-ember">
              D{day.day_order}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-stat text-[8px] uppercase tracking-[0.2em] text-ash">
              Prediction for
            </p>
            <p className="truncate font-display text-lg font-black uppercase leading-tight">
              {day.name}
            </p>
          </div>
        </div>

        {children && (
          <div className="hidden items-center gap-3 lg:ml-auto lg:flex">{children}</div>
        )}
      </div>
    </section>
  );
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
  // Two sessions sit side by side on desktop, so give them more room; one session stays centred.
  const widthClass = multi ? "max-w-[87.5rem]" : "max-w-5xl";
  const pageClass = `mx-auto ${widthClass} min-w-0 space-y-3 overflow-x-clip px-3 py-3 sm:px-5 lg:px-6 lg:py-4`;
  const gridClass = multi
    ? "grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2 lg:items-start"
    : "grid grid-cols-[minmax(0,1fr)] gap-3";
  const twoCol =
    "grid grid-cols-1 gap-1.5 sm:grid-flow-col sm:grid-cols-[repeat(2,minmax(0,1fr))] sm:grid-rows-6 sm:gap-x-3";

  // ───────────────────────── Results ─────────────────────────
  if (existing?.scored) {
    const bySession = groupEntriesBySession(existing.teams);
    const resultSessions = sessionKeys(bySession);
    const resultMulti = resultSessions.length > 1;
    return (
      <div className={`mx-auto ${resultMulti ? "max-w-[87.5rem]" : "max-w-5xl"} min-w-0 space-y-3 overflow-x-clip px-3 py-3 sm:px-5 lg:px-6 lg:py-4`}>
        <StatusBar team={team} day={day}>
          <div className="text-right">
            <p className="font-stat text-[8px] uppercase tracking-[0.2em] text-ash">Your result</p>
            <p className="font-display text-2xl font-black leading-none tabular-nums text-ember">
              {existing.total_points}
              <span className="text-ash/50"> / {MAX_SESSION_POINTS * Math.max(resultSessions.length, 1)}</span>
            </p>
          </div>
        </StatusBar>

        {/* the points total is hidden inside the bar below lg, so repeat it here */}
        <div className="flex items-center justify-between chamfer-sm border border-bone/10 bg-char-2 px-3 py-2 lg:hidden">
          <p className="font-stat text-[9px] uppercase tracking-widest text-ash">Your result</p>
          <p className="font-display text-xl font-black leading-none tabular-nums text-ember">
            {existing.total_points}
            <span className="text-ash/50"> / {MAX_SESSION_POINTS * Math.max(resultSessions.length, 1)}</span>
          </p>
        </div>

        <div className={resultMulti ? "grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2 lg:items-start" : "grid grid-cols-[minmax(0,1fr)] gap-3"}>
          {resultSessions.map((sn) => (
            <section key={sn} className="min-w-0 overflow-hidden chamfer-sm border border-bone/10 bg-char-2">
              {resultMulti && (
                <div className="border-b border-bone/10 px-3 py-2">
                  <p className="font-display text-lg font-black uppercase leading-none">Session {sn}</p>
                </div>
              )}
              <div className={`${twoCol} p-2 sm:p-3`}>
                {bySession[sn].map((e) => (
                  <PredictionResultRow key={e.id} entry={e} compact />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  // ───────────────────────── Builder ─────────────────────────
  const allReviewed = sessions.every((sn) => reviewed[sn]);
  const setCount = sessions.filter((sn) => reviewed[sn]).length;

  function reorder(sn: number, next: Team[]) {
    setOrders((o) => ({ ...o, [sn]: next }));
    setReviewed((r) => ({ ...r, [sn]: true }));
  }

  // The main action(s). Shown in the top bar on desktop and in a fixed bottom bar below lg.
  const actions = locked ? null : confirming ? (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setConfirming(false)}
        disabled={busy}
        className="!px-4 !py-2 !text-base"
      >
        Back to edit
      </Button>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={busy}
        className="min-w-[9rem] flex-1 !px-5 !py-2 !text-base lg:flex-none"
      >
        {busy ? "Submitting…" : "Confirm & submit"}
      </Button>
    </>
  ) : (
    <>
      {!allReviewed && (
        <span className="hidden font-stat text-[9px] uppercase tracking-widest text-ash xl:block">
          {multi ? `${setCount}/${sessions.length} sessions set` : "Set your order to continue"}
        </span>
      )}
      <Button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={!allReviewed}
        className="min-w-[9rem] flex-1 !px-5 !py-2 !text-base lg:flex-none"
      >
        {allReviewed || !multi ? "Review & submit" : `Review & submit (${setCount}/${sessions.length})`}
      </Button>
    </>
  );

  return (
    <div className={`${pageClass} ${actions ? "pb-24 lg:pb-4" : ""}`}>
      <StatusBar team={team} day={day}>
        {locked ? (
          <div className="flex items-center gap-2 border border-danger/25 bg-danger/[0.06] px-3 py-2">
            <span aria-hidden="true">🔒</span>
            <p className="font-stat text-[10px] font-bold uppercase tracking-widest text-danger">
              Locked · awaiting results
            </p>
          </div>
        ) : (
          actions
        )}
      </StatusBar>

      {locked && (
        <p className="flex items-center gap-2 border-l-2 border-danger pl-3 font-stat text-[10px] uppercase tracking-widest text-danger lg:hidden">
          Predictions are locked for this day — awaiting results
        </p>
      )}

      {!locked && !confirming && (
        <p className="font-stat text-[10px] uppercase leading-snug tracking-widest text-ash">
          Rank {multi ? "each session" : "the teams"} 1st → 12th · drag a team (on touch, use the
          <span className="text-ember"> ⇅ </span>handle) or use ▲ ▼
        </p>
      )}

      <p aria-live="polite" className="font-stat text-xs text-danger empty:hidden">
        {error}
      </p>

      {confirming ? (
        <div className={gridClass}>
          {sessions.map((sn) => (
            <PredictionSummary
              key={sn}
              compact
              order={orders[sn] ?? []}
              heading={multi ? `Session ${sn} — confirm before submitting` : "Confirm before submitting"}
            />
          ))}
        </div>
      ) : (
        <div className={gridClass}>
          {sessions.map((sn) => (
            <section key={sn} className="min-w-0 overflow-hidden chamfer-sm border border-bone/10 bg-char-2">
              <div className="flex items-center justify-between gap-2 border-b border-bone/10 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_10px_rgba(255,100,40,.8)]" />
                  <p className="font-display text-lg font-black uppercase leading-none">
                    {multi ? `Session ${sn}` : "Your ranking"}
                  </p>
                </div>

                {!locked &&
                  (reviewed[sn] ? (
                    <span className="font-stat text-[10px] uppercase tracking-widest text-ember">
                      ✓ Order set
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReviewed((r) => ({ ...r, [sn]: true }))}
                      className="chamfer-sm border border-bone/25 px-2.5 py-1 font-stat text-[9px] font-bold uppercase tracking-widest text-bone transition hover:border-ember hover:text-ember"
                    >
                      Keep this order
                    </button>
                  ))}
              </div>

              <div className="p-2 sm:p-3">
                <TeamRankBuilder
                  order={orders[sn] ?? []}
                  onReorder={(next) => reorder(sn, next)}
                  disabled={locked}
                />
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Below lg the action bar is fixed to the bottom so it is always reachable */}
      {actions && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-bone/15 bg-char/95 px-3 pt-2.5 backdrop-blur-md lg:hidden"
          style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-2xl items-center gap-2">{actions}</div>
        </div>
      )}
    </div>
  );
}
