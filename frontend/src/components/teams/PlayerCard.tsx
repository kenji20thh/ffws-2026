import Monogram from "@/components/ui/Monogram";
import type { Player } from "@/types";

export default function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="chamfer border border-bone/10 bg-char-2 p-5">
      <div className="flex items-center gap-4">
        <Monogram label={player.ign} imageUrl={player.photo_url} size={56} />
        <div className="min-w-0">
          <p className="truncate font-display text-3xl font-extrabold uppercase leading-none">
            {player.ign}
          </p>
          {player.real_name && <p className="mt-1 truncate text-bone/70">{player.real_name}</p>}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between font-stat text-[11px] uppercase tracking-widest text-ash">
        <span className="text-ember">{player.role || "player"}</span>
        <span>{player.country}</span>
      </div>
    </div>
  );
}