"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";
import {
  ApiError, getDays, getFantasyPlayerPool, getMyFantasySelection, getMyFantasyTeam,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { FantasyPlayerOption, FantasySelectionResponse, FantasyTeam, TournamentDay } from "@/types";
import CreateFantasyTeamForm from "./CreateFantasyTeamForm";
import DayScoreCard from "./DayScoreCard";
import SelectionBuilder from "./SelectionBuilder";

export default function FantasyConsole({ tournamentId }: { tournamentId: number }) {
  const [team, setTeam] = useState<FantasyTeam | null | undefined>(undefined); // undefined = loading
  const [days, setDays] = useState<TournamentDay[]>([]);
  const [dayId, setDayId] = useState<number | null>(null);
  const [pool, setPool] = useState<FantasyPlayerOption[]>([]);
  const [sel, setSel] = useState<FantasySelectionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTeam = useCallback(() => {
    getMyFantasyTeam(tournamentId)
      .then(setTeam)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setTeam(null);
      });
  }, [tournamentId]);

  useEffect(() => {
    if (!getToken()) return;
    loadTeam();
    getDays(tournamentId).then((d) => {
      setDays(d);
      setDayId(d[0]?.id ?? null);
    });
    getFantasyPlayerPool(tournamentId).then(setPool);
  }, [tournamentId, loadTeam]);

  const loadSelection = useCallback(() => {
    if (!dayId) return;
    setLoading(true);
    getMyFantasySelection(tournamentId, dayId)
      .then(setSel)
      .catch(() => setSel(null))
      .finally(() => setLoading(false));
  }, [tournamentId, dayId]);

  useEffect(() => {
    if (team) loadSelection();
  }, [team, dayId, loadSelection]);

  if (!getToken()) {
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

      {days.length > 0 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Day">
          {days.map((d) => (
            <button
              key={d.id}
              onClick={() => setDayId(d.id)}
              className={`chamfer-sm px-5 py-2 font-display text-lg font-bold uppercase tracking-wider transition-colors ${
                dayId === d.id ? "bg-ember text-char" : "border border-bone/20 text-bone/70 hover:text-ember"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64" />
      ) : dayId ? (
        <>
          {sel && sel.breakdown.length > 0 && <DayScoreCard breakdown={sel.breakdown} total={sel.total_points} />}
          <SelectionBuilder
            tournamentId={tournamentId}
            dayId={dayId}
            pool={pool}
            existing={sel?.selections ?? []}
            locked={locked}
            onSaved={loadSelection}
          />
        </>
      ) : null}
    </div>
  );
}