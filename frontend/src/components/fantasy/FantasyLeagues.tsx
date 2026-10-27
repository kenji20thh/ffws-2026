"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import {
  ApiError,
  getMyFantasyLeagues,
  getMyFantasyTeam,
  leavePrivateLeague,
} from "@/lib/api";
import { clearSession, getToken } from "@/lib/auth";
import Flag from "@/components/ui/Flag";
import type { FantasyLeague, FantasyTeam, TournamentDay } from "@/types";
import LeagueOverview from "./LeagueOverview";
import PrivateLeagueTools from "./PrivateLeagueTools";

type State =
  | { kind: "loading" }
  | { kind: "logged-out" }
  | { kind: "no-team" }
  | { kind: "error"; message: string }
  | { kind: "ready"; team: FantasyTeam; leagues: FantasyLeague[] };

const linkBtn =
  "mt-6 inline-flex items-center justify-center chamfer-sm border border-ember/40 bg-ember px-7 py-3 font-stat text-xs font-bold uppercase tracking-[0.18em] text-char transition hover:bg-bone";

export default function FantasyLeagues({
  tournamentId,
  days: _days,
}: {
  tournamentId: number;
  days: TournamentDay[];
}) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [inviteCode, setInviteCode] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("join");

    if (code) {
      setInviteCode(code);
    }
  }, []);

  async function refreshLeagues() {
    try {
      const leagues = await getMyFantasyLeagues(tournamentId);

      setState((current) =>
        current.kind === "ready" ? { ...current, leagues } : current,
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to refresh your leagues",
      );
    }
  }

  async function leave(slug: string) {
    setActionError("");

    try {
      await leavePrivateLeague(tournamentId, slug);
      await refreshLeagues();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to leave the league",
      );
    }
  }

  useEffect(() => {
    if (!getToken()) {
      setState({ kind: "logged-out" });
      return;
    }

    let cancelled = false;

    Promise.all([
      getMyFantasyTeam(tournamentId),
      getMyFantasyLeagues(tournamentId),
    ])
      .then(([team, leagues]) => {
        if (cancelled) return;

        setState({ kind: "ready", team, leagues });
      })
      .catch((error) => {
        if (cancelled) return;

        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          setState({ kind: "logged-out" });
        } else if (error instanceof ApiError && error.status === 404) {
          setState({ kind: "no-team" });
        } else {
          setState({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to load your leagues",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  if (state.kind === "loading") {
    return <Skeleton className="h-64" />;
  }

  if (state.kind === "error") {
    return <ErrorState message={state.message} />;
  }

  if (state.kind === "logged-out") {
    return (
      <div className="text-center">
        <EmptyState
          title="Log in to see your leagues"
          hint="You are placed in a league based on your country."
        />

        <Link href="/login" className={linkBtn}>
          Go to login <span className="ml-3 text-base">→</span>
        </Link>
      </div>
    );
  }

  if (state.kind === "no-team") {
    return (
      <div className="text-center">
        <EmptyState
          title="Create your fantasy team first"
          hint="Your country decides which league you play in."
        />

        <Link href="/fantasy/pick-team" className={linkBtn}>
          Create team <span className="ml-3 text-base">→</span>
        </Link>
      </div>
    );
  }

  const { team, leagues } = state;
  const hasRegion = leagues.some((league) => league.type === "region");
  const privateLeague = leagues.find((league) => league.type === "private");

  return (
    <div className="space-y-6">
      <div className="border border-bone/10 bg-char-2 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <Flag country={team.country} height={20} />

          <div className="min-w-0">
            <p className="font-stat text-[9px] uppercase tracking-[0.22em] text-ash">
              Competing from
            </p>

            <p className="mt-1 text-sm font-semibold text-bone">
              {team.country}
            </p>
          </div>

          <span className="ml-auto shrink-0 font-stat text-[9px] uppercase tracking-widest text-ash">
            {hasRegion ? "Regional + Global" : "Global"}
          </span>
        </div>
      </div>

      <LeagueOverview leagues={leagues} />

      <PrivateLeagueTools
        tournamentId={tournamentId}
        initialCode={inviteCode}
        onDone={(league) => {
          setInviteCode("");
          setActionError("");
          void refreshLeagues();
          window.location.assign(
            `/fantasy/leagues/${encodeURIComponent(league.slug)}`,
          );
        }}
      />

      {actionError && (
        <p role="alert" className="text-sm text-red-400">
          {actionError}
        </p>
      )}

      {privateLeague?.code && (
        <div className="border-t border-bone/10 pt-4">
          <p className="mb-3 font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
            Private league management
          </p>

          <button
            type="button"
            onClick={() => void leave(privateLeague.slug)}
            className="border border-bone/15 px-4 py-2 font-stat text-[10px] uppercase tracking-widest text-ash transition hover:border-red-400/60 hover:text-red-400"
          >
            Leave {privateLeague.name}
          </button>
        </div>
      )}
    </div>
  );
}