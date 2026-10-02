import { countryFlag } from "@/lib/flags";
import { roleIcon, roleLabel } from "@/lib/roles";
import Monogram from "@/components/ui/Monogram";
import type { TeamPlayerStats } from "@/types";

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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {players.map((p) => {
        const icon = roleIcon(p.role);
        return (
          <a
            key={p.player_id}
            href={`/players/${p.player_id}`}
            className="group chamfer block border border-bone/10 bg-char-2 transition-colors hover:border-ember"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-char-3">
              {p.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photo_url}
                  alt={p.ign}
                  className="h-full w-full object-cover object-top"
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
                <span title={p.country} className="text-lg leading-none">
                  {countryFlag(p.country)}
                </span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
