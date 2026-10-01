"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import FantasyTeamViewer from "@/components/fantasy/FantasyTeamViewer";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getFantasyTeamProfile, getTournament } from "@/lib/api";
import type { Tournament } from "@/types";

export default function FantasyTeamPage() {
  const params = useParams();
  const fantasyTeamId = Number(params.id);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(fantasyTeamId) || fantasyTeamId <= 0) {
      setError("Invalid fantasy team.");
      setLoading(false);
      return;
    }

    Promise.all([
      getTournament("ffws-2026"),
      getFantasyTeamProfile(fantasyTeamId),
    ])
      .then(([tournamentData, profile]) => {
        setTournament(tournamentData);
        setTeamName(profile.team.team_name);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) {
          setError("Fantasy team not found.");
        } else {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        }
      })
      .finally(() => setLoading(false));
  }, [fantasyTeamId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={error ?? undefined} />
      </div>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Fantasy squad" title={teamName}>
        FFWS World Cup 2026
      </PageHeader>

      <FantasyTeamViewer
        tournamentId={tournament.id}
        fantasyTeamId={fantasyTeamId}
        teamName={teamName}
      />
    </>
  );
}