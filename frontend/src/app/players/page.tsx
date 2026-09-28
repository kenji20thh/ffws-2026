import PageHeader from "@/components/layout/PageHeader";
import PlayersDirectory from "@/components/players/PlayersDirectory";
import ErrorState from "@/components/ui/ErrorState";
import { getPlayerLeaderboard, getPlayers, getTeams, getTournament } from "@/lib/api";
import type { PlayerLeaderboardEntry, Team } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Players · FFWS 2026",
};

export default async function PlayersPage() {
  try {
    const tournament = await getTournament("ffws-2026");

    const [teams, leaderboard] = await Promise.all([
      getTeams(tournament.id),
      getPlayerLeaderboard(tournament.id),
    ]);

    const playersByTeam = await Promise.all(
      teams.map(async (team) => {
        const players = await getPlayers(team.id);

        return {
          team,
          players,
        };
      }),
    );

    const players = playersByTeam.flatMap(({ team, players }) =>
      players.map((player) => {
        const stats = leaderboard.find(
          (entry) => entry.player_id === player.id,
        );

        return {
          ...player,
          team,
          total_kills: stats?.total_kills ?? 0,
          rooms_played: stats?.rooms_played ?? 0,
        };
      }),
    );

    return (
      <>
        <PageHeader eyebrow="World stage" title="Players">
          Meet the players competing at the FFWS World Cup.
        </PageHeader>

        <PlayersDirectory
          players={players}
          teams={teams}
        />
      </>
    );
  } catch (e) {
    return (
      <>
        <PageHeader eyebrow="World stage" title="Players">
          Meet the players competing at the FFWS World Cup.
        </PageHeader>

        <div className="mx-auto max-w-6xl px-5 py-10">
          <ErrorState
            message={e instanceof Error ? e.message : "Failed to load players"}
          />
        </div>
      </>
    );
  }
}