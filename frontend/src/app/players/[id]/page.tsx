import { notFound } from "next/navigation";
import PlayerProfile from "@/components/players/PlayerProfile";
import PlayerOverallStats from "@/components/players/PlayerOverallStats";
import PlayerDayStats from "@/components/players/PlayerDayStats";
import { getPlayerProfile } from "@/lib/api";

type PlayerPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params,
}: PlayerPageProps) {
  const { id } = await params;

  const playerId = Number(id);

  if (!Number.isInteger(playerId) || playerId <= 0) {
    notFound();
  }

  try {
    const profile = await getPlayerProfile(playerId);

    return (
      <main>
        <PlayerProfile
          player={profile.player}
          team={profile.team}
        />

        <PlayerOverallStats overall={profile.overall} />

        <PlayerDayStats days={profile.days} />
      </main>
    );
  } catch {
    notFound();
  }
}