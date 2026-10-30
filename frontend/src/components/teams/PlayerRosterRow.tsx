import Image from "next/image";
import Flag from "@/components/ui/Flag";
import { roleIcon, roleLabel } from "@/lib/roles";
import Monogram from "@/components/ui/Monogram";
import CaptainBadge from "@/components/ui/CaptainBadge";
import type { TeamPlayerStats } from "@/types";

// Puts the captain in the middle of the lineup; everyone else keeps their order.
function captainInMiddle(players: TeamPlayerStats[]): TeamPlayerStats[] {
  const captain = players.find((p) => p.is_captain);
  if (!captain) return players;
  const others = players.filter((p) => p !== captain);
  others.splice(Math.floor(players.length / 2), 0, captain);
  return others;
}

export default function PlayerRosterRow({
  players,
}: {
  players: TeamPlayerStats[];
}) {
  if (players.length === 0) {
    return (
      <p className="font-stat text-xs uppercase tracking-widest text-ash">
        Roster not announced
      </p>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {captainInMiddle(players).map((p) => {
        const icon = roleIcon(p.role);
        return (
          <a
            key={p.player_id}
            href={`/players/${p.player_id}`}
            className={`group chamfer block w-[calc(50%-0.5rem)] border bg-char-2 transition-colors hover:border-ember sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(20%-0.8rem)] ${
              p.is_captain ? "border-ember" : "border-bone/10"
            }`}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-char-3">
              {p.is_captain && (
                <CaptainBadge className="absolute left-0 top-0 z-10" />
              )}
              {p.photo_url ? (
                <Image
                  src={p.photo_url}
                  alt={p.ign}
                  fill
                  quality={90}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Monogram label={p.ign} size={72} />
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="truncate font-display text-xl font-extrabold uppercase leading-none">
                {p.ign}
              </p>
              <div className="mt-2 flex items-center justify-between font-stat text-[10px] uppercase tracking-widest">
                <span className="flex items-center gap-1 text-ember">
                  {icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={icon}
                      alt=""
                      className="h-3.5 w-3.5 object-contain"
                    />
                  )}
                  {roleLabel(p.role)}
                </span>
                <Flag country={p.country} height={16} />
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}