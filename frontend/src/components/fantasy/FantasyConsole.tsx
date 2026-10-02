"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";
import {
  ApiError, getDays, getFantasyPlayerPool, getMyFantasySelection, getMyFantasyTeam,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { FantasyPlayerOption, FantasySelectionResponse, FantasyTeam, TournamentDay } from "@/types";
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

export default function FantasyConsole({ tournamentId }: { tournamentId: number }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [team, setTeam] = useState<FantasyTeam | null | undefined>(undefined);
  const [day, setDay] = useState<TournamentDay | null>(null);
  const [pool, setPool] = useState<FantasyPlayerOption[]>([]);
  const [sel, setSel] = useState<FantasySelectionResponse | null>(null);
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
    getDays(tournamentId).then((d) => setDay(pickNextOpenDay(d)));
    getFantasyPlayerPool(tournamentId).then(setPool);
  }, [loggedIn, tournamentId, loadTeam]);

  const loadSelection = useCallback(() => {
    if (!day) return;
    setLoading(true);
    getMyFantasySelection(tournamentId, day.id)
      .then(setSel)
      .catch(() => setSel(null))
      .finally(() => setLoading(false));
  }, [tournamentId, day]);

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

  if (team === undefined) return <div className="mx-auto max-w-3xl px-5 py-10"><Skeleton className="h-40" /></div>;

  if (team === null) {
    return (
      <div className="px-5 py-16">
        <CreateFantasyTeamForm tournamentId={tournamentId} onCreated={loadTeam} />
      </div>
    );
  }

  const locked = sel?.lock_time ? new Date(sel.lock_time).getTime() < Date.now() : false;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10">
      <div className="chamfer border border-bone/10 bg-char-2 p-6">
        <p className="font-stat text-[10px] uppercase tracking-widest text-ash">Your fantasy team</p>
        <p className="font-display text-3xl font-black uppercase">{team.team_name}</p>
      </div>

      {!day ? (
        <p className="font-stat text-sm uppercase tracking-widest text-ash">No tournament days scheduled yet.</p>
      ) : loading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className="chamfer-sm border border-bone/15 bg-char-2 px-5 py-3">
            <p className="font-stat text-[10px] uppercase tracking-widest text-ash">Building for</p>
            <p className="font-display text-2xl font-black uppercase text-ember">{day.name}</p>
          </div>
          <SelectionBuilder
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