"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import {
  ApiError, getDays, getFantasyPlayerPool, getMyFantasySelection, getMyFantasyTeam, getPlayers, getTeams,
} from "@/lib/api";
import { clearSession, getToken } from "@/lib/auth";
import type { FantasySelectionResponse, FantasyTeam, Player, PoolPlayer, TournamentDay } from "@/types";
import CreateFantasyTeamForm from "./CreateFantasyTeamForm";
import SelectionBuilder from "./SelectionBuilder";

function pickNextOpenDay(days: TournamentDay[]): TournamentDay | null {
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

// The price list from the API has no artwork, so merge in player photos and team logos.
// If that extra lookup fails the pick screen still works (it falls back to monograms).
async function loadPool(tournamentId: number): Promise<PoolPlayer[]> {
  const options = await getFantasyPlayerPool(tournamentId);
  try {
    const teams = await getTeams(tournamentId);
    const lists = await Promise.all(teams.map((t) => getPlayers(t.id).catch(() => [] as Player[])));
    const photos = new Map<number, string>();
    lists.flat().forEach((p) => {
      if (p.photo_url) photos.set(p.id, p.photo_url);
    });
    const logos = new Map<number, string>();
    teams.forEach((t) => {
      if (t.logo_url) logos.set(t.id, t.logo_url);
    });
    return options.map((o) => ({
      ...o,
      photo_url: photos.get(o.player_id),
      team_logo_url: logos.get(o.team_id),
    }));
  } catch {
    return options;
  }
}

export default function FantasyConsole({ tournamentId }: { tournamentId: number }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [team, setTeam] = useState<FantasyTeam | null | undefined>(undefined);
  const [day, setDay] = useState<TournamentDay | null>(null);
  const [pool, setPool] = useState<PoolPlayer[]>([]);
  const [poolLoaded, setPoolLoaded] = useState(false);
  const [sel, setSel] = useState<FantasySelectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoggedIn(!!getToken());
    setAuthChecked(true);
  }, []);

  // An expired or invalid token (401) ends the session and shows the "log in" prompt.
  const expireSession = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      clearSession();
      setLoggedIn(false);
      return true;
    }
    return false;
  }, []);

  const fail = useCallback(
    (e: unknown) => {
      if (expireSession(e)) return;
      setError(e instanceof Error ? e.message : "Something went wrong");
    },
    [expireSession]
  );

  const loadTeam = useCallback(() => {
    getMyFantasyTeam(tournamentId)
      .then(setTeam)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setTeam(null);
        else fail(e);
      });
  }, [tournamentId, fail]);

  useEffect(() => {
    if (!loggedIn) return;
    setError(null);
    loadTeam();
    getDays(tournamentId).then((d) => setDay(pickNextOpenDay(d))).catch(fail);
    loadPool(tournamentId)
      .then((p) => {
        setPool(p);
        setPoolLoaded(true);
      })
      .catch(fail);
  }, [loggedIn, tournamentId, loadTeam, fail]);

  const loadSelection = useCallback(() => {
    if (!day) return;
    setLoading(true);
    getMyFantasySelection(tournamentId, day.id)
      .then(setSel)
      .catch((e) => {
        if (!expireSession(e)) setSel(null);
      })
      .finally(() => setLoading(false));
  }, [tournamentId, day, expireSession]);

  useEffect(() => {
    if (team && day) loadSelection();
    else setLoading(false);
  }, [team, day, loadSelection]);

  if (!authChecked) return <div className="mx-auto max-w-3xl px-5 py-10"><Skeleton className="h-40" /></div>;

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="font-display text-3xl font-black uppercase">Log in to play</p>
        <Link href="/login" className="mt-4 inline-block font-stat text-sm uppercase tracking-widest text-ember hover:underline">
          Go to login →
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <ErrorState message={error} />
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

  // The server decides whether the day is locked (deadline passed, or play already started).
  const locked = sel?.locked ?? false;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-10">
      <div className="chamfer border border-bone/10 bg-char-2 p-6">
        <p className="font-stat text-[10px] uppercase tracking-widest text-ash">Your fantasy team</p>
        <p className="font-display text-3xl font-black uppercase">{team.team_name}</p>
      </div>

      {!day ? (
        <p className="font-stat text-sm uppercase tracking-widest text-ash">No tournament days scheduled yet.</p>
      ) : loading || !poolLoaded ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className="chamfer-sm border border-bone/15 bg-char-2 px-5 py-3">
            <p className="font-stat text-[10px] uppercase tracking-widest text-ash">Building for</p>
            <p className="font-display text-2xl font-black uppercase text-ember">{day.name}</p>
          </div>
          <SelectionBuilder
            key={day.id}
            lockTime={sel?.lock_time ?? null}
            chip={sel?.chip || null}
            chipsUsed={sel?.chips_used ?? []}
            tournamentId={tournamentId}
            dayId={day.id}
            pool={pool}
            existing={sel?.selections ?? []}
            locked={locked}
            onSaved={() => router.push(`/fantasy/${team.id}`)}
          />
        </>
      )}
    </div>
  );
}
