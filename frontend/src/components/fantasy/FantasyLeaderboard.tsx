import type { TournamentDay } from "@/types";
import LeagueLeaderboard from "./LeagueLeaderboard";

/**
 * League table used inside the /fantasy/leagues tabs. Same table as the full league
 * pages (/fantasy/leagues/<slug>), without the league chips / invite card, which that
 * page already shows.
 */
export default function FantasyLeaderboard({
  tournamentId,
  days,
  leagueSlug = "global",
  highlightTeamId,
}: {
  tournamentId: number;
  days: TournamentDay[];
  /** Which league to show ("global", a region slug or "private-<id>"). */
  leagueSlug?: string;
  /** Marks the logged-in player's own row. */
  highlightTeamId?: number;
}) {
  return (
    <LeagueLeaderboard
      tournamentId={tournamentId}
      days={days}
      slug={leagueSlug}
      highlightTeamId={highlightTeamId}
      embedded
    />
  );
}
