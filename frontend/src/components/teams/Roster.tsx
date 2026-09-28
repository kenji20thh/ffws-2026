import EmptyState from "@/components/ui/EmptyState";
import type { Player } from "@/types";
import PlayerCard from "./PlayerCard";

export default function Roster({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return <EmptyState title="Roster not announced" hint="Players will be listed here soon." />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((p) => (
        <PlayerCard key={p.id} player={p} />
      ))}
    </div>
  );
}