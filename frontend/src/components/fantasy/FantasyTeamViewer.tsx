"use client";

import { useCallback, useEffect, useState } from "react";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { getDays, getFantasyTeamProfile, getMyFantasyTeam } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { FantasyTeamProfile, TournamentDay } from "@/types";
import DayScoreCard from "./DayScoreCard";
import FantasyConsole from "./FantasyConsole";
import ReadOnlySelection from "./ReadOnlySelection";

export default function FantasyTeamViewer({
  tournamentId,
  fantasyTeamId,
  teamName,
}: {
  tournamentId: number;
  fantasyTeamId: number;
  teamName: string;
}) {
  const [checked, setChecked] = useState(false);
  const [isMine, setIsMine] = useState(false);
  const [days, setDays] = useState<TournamentDay[]>([]);
  const [dayId, setDayId] = useState<number | null>(null);
  const [profile, setProfile] = useState<FantasyTeamProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDays(tournamentId).then((d) => {
      setDays(d);
      setDayId(d[0]?.id ?? null);
    });

    if (!getToken()) {
      setChecked(true);
      return;
    }
    getMyFantasyTeam(tournamentId)
      .then((mine) => setIsMine(mine.id === fantasyTeamId))
      .catch(() => setIsMine(false))
      .finally(() => setChecked(true));
  }, [tournamentId, fantasyTeamId]);

  const loadProfile = useCallback(() => {
    if (!dayId) return;
    setLoading(true);
    getFantasyTeamProfile(fantasyTeamId, dayId)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [fantasyTeamId, dayId]);

  useEffect(() => {
    if (checked && !isMine) loadProfile();
  }, [checked, isMine, dayId, loadProfile]);

  if (!checked) return <div className="mx-auto max-w-3xl px-5 py-10"><Skeleton className="h-40" /></div>;

  // owner: hand off entirely to the real editable console
  if (isMine) return <FantasyConsole tournamentId={tournamentId} />;

  // read-only view for anyone else
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10">
      <div className="chamfer border border-bone/10 bg-char-2 p-6">
        <p className="font-stat text-[10px] uppercase tracking-widest text-ash">Viewing</p>
        <p className="font-display text-3xl font-black uppercase">{teamName}</p>
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
      ) : profile ? (
        <>
          {profile.breakdown && profile.breakdown.length > 0 && (
            <DayScoreCard breakdown={profile.breakdown} total={profile.total_points ?? 0} />
          )}
          <ReadOnlySelection selections={profile.selections ?? []} />
        </>
      ) : (
        <EmptyState title="No data for this day" />
      )}
    </div>
  );
}