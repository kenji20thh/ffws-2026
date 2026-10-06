"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getMyFantasyLeagues, getMyFantasyTeam, leavePrivateLeague } from "@/lib/api";
import { clearSession, getToken } from "@/lib/auth";
import { countryFlag } from "@/lib/flags";
import type { FantasyLeague, FantasyTeam, TournamentDay } from "@/types";
import FantasyLeaderboard from "./FantasyLeaderboard";
import LeagueCodeCard from "./LeagueCodeCard";
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
  days,
}: {
  tournamentId: number;
  days: TournamentDay[];
}) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [active, setActive] = useState<string>("");
  const [inviteCode, setInviteCode] = useState("");
  const [actionError, setActionError] = useState("");

  // An invite link looks like /fantasy/leagues?join=ABCD2345 and prefills the join form.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("join");
    if (code) setInviteCode(code);
  }, []);

  /** Reloads the league list (after creating, joining or leaving) and opens `select`. */
  async function refreshLeagues(select?: string) {
    try {
      const leagues = await getMyFantasyLeagues(tournamentId);
      setState((s) => (s.kind === "ready" ? { ...s, leagues } : s));
      setActive(
        select && leagues.some((l) => l.slug === select) ? select : (leagues[0]?.slug ?? ""),
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to refresh your leagues");
    }
  }

  async function leave(slug: string) {
    setActionError("");
    try {
      await leavePrivateLeague(tournamentId, slug);
      await refreshLeagues();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to leave the league");
    }
  }

  useEffect(() => {
    if (!getToken()) {
      setState({ kind: "logged-out" });
      return;
    }
    let cancelled = false;
    Promise.all([getMyFantasyTeam(tournamentId), getMyFantasyLeagues(tournamentId)])
      .then(([team, leagues]) => {
        if (cancelled) return;
        setState({ kind: "ready", team, leagues });
        setActive(leagues[0]?.slug ?? "");
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          clearSession();
          setState({ kind: "logged-out" });
        } else if (e instanceof ApiError && e.status === 404) {
          setState({ kind: "no-team" });
        } else {
          setState({
            kind: "error",
            message: e instanceof Error ? e.message : "Failed to load your leagues",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  if (state.kind === "loading") return <Skeleton className="h-64" />;
  if (state.kind === "error") return <ErrorState message={state.message} />;

  if (state.kind === "logged-out") {
    return (
      <div className="text-center">
        <EmptyState title="Log in to see your leagues" hint="You are placed in a league based on your country." />
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
  const hasRegion = leagues.some((l) => l.type === "region");
  const current = leagues.find((l) => l.slug === active) ?? leagues[0];

  return (
    <div className="space-y-6">
      <div className="chamfer border border-bone/10 bg-char-2 px-6 py-5">
        <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Your leagues</p>
        <p className="mt-2 text-bone/80">
          <span className="mr-2 text-lg">{countryFlag(team.country)}</span>
          {hasRegion ? (
            <>
              Playing from <strong>{team.country}</strong>, you&apos;re in the{" "}
              <strong>{leagues.find((l) => l.type === "region")?.name}</strong> league, plus Global.
            </>
          ) : (
            <>
              <strong>{team.country}</strong> isn&apos;t part of a region league yet, so you&apos;re competing in
              Global.
            </>
          )}
        </p>
      </div>

      <PrivateLeagueTools
        tournamentId={tournamentId}
        initialCode={inviteCode}
        onDone={(league) => {
          setInviteCode("");
          setActionError("");
          refreshLeagues(league.slug);
        }}
      />

      {actionError && (
        <p role="alert" className="text-sm text-red-400">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {leagues.map((l) => (
          <button
            key={l.slug}
            onClick={() => setActive(l.slug)}
            className={`chamfer-sm px-5 py-2 font-display text-lg font-bold uppercase tracking-wider ${
              current?.slug === l.slug
                ? "bg-ember text-char"
                : "border border-bone/20 text-bone/70 hover:text-ember"
            }`}
          >
            {l.type === "private" && <span aria-label="Private league" className="mr-2 text-base">🔒</span>}
            {l.name}
            <span className="ml-2 font-stat text-xs font-normal opacity-70">{l.teams}</span>
          </button>
        ))}
      </div>

      {current?.type === "private" && current.code && (
        <LeagueCodeCard
          key={`code-${current.slug}`}
          name={current.name}
          code={current.code}
          onLeave={() => leave(current.slug)}
        />
      )}

      {current && (
        <FantasyLeaderboard
          key={current.slug}
          tournamentId={tournamentId}
          days={days}
          leagueSlug={current.slug}
          highlightTeamId={team.id}
        />
      )}
    </div>
  );
}
