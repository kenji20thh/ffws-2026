import Image from "next/image";
import type { Player, Team } from "@/types";

type PlayerWithTeam = Player & {
  team: Team;
};

interface Props {
  players: PlayerWithTeam[];
}

export default function PlayersHeroMarquee({ players }: Props) {
  if (players.length === 0) return null;

  const byTeam = new Map<number, PlayerWithTeam>();

  for (const player of players) {
    if (!byTeam.has(player.team.id)) {
      byTeam.set(player.team.id, player);
    }
  }

  const featuredPlayers = Array.from(byTeam.values());

  if (featuredPlayers.length === 0) return null;

  const marqueePlayers = [...featuredPlayers, ...featuredPlayers];

  return (
    <div className="relative -mx-5 mt-7 overflow-hidden border-y border-bone/10 sm:-mx-6 lg:-mx-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-12 bg-gradient-to-r from-char to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-gradient-to-l from-char to-transparent sm:w-28" />

      <div className="flex items-center justify-between px-5 pb-2 pt-3 sm:px-8">
        <p className="font-stat text-[8px] font-bold uppercase tracking-[0.25em] text-ember">
          THE WORLD STAGE
        </p>
        <p className="font-stat text-[8px] uppercase tracking-widest text-ash">
          {featuredPlayers.length} TEAMS · FEATURED PLAYERS
        </p>
      </div>

      <div className="group overflow-hidden pb-4">
        <div
          className="flex w-max animate-players-marquee group-hover:[animation-play-state:paused]"
          style={{
            animationDuration: `${Math.max(
              35,
              featuredPlayers.length * 4,
            )}s`,
          }}
        >
          {marqueePlayers.map((player, index) => {
            const remote = /^https?:\/\//.test(player.photo_url ?? "");

            return (
              <div
                key={`${player.id}-${index}`}
                className="group/card relative mx-1.5 h-32 w-28 shrink-0 overflow-hidden border border-bone/10 bg-char-2 transition-colors hover:border-ember sm:mx-2 sm:h-36 sm:w-32"
              >
                {player.photo_url ? (
                  <Image
                    src={player.photo_url}
                    alt={player.ign}
                    fill
                    sizes="128px"
                    unoptimized={remote}
                    className="object-cover object-top opacity-75 transition duration-500 group-hover/card:scale-105 group-hover/card:opacity-100"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-4xl font-black text-bone/10">
                      {player.ign.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-char via-char/20 to-transparent" />

                {player.team.logo_url && (
                  <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center border border-bone/10 bg-char/80 p-1 backdrop-blur-sm">
                    <Image
                      src={player.team.logo_url}
                      alt=""
                      width={24}
                      height={24}
                      unoptimized
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="truncate font-display text-sm font-black uppercase leading-none text-bone">
                    {player.ign}
                  </p>
                  <p className="mt-1 truncate font-stat text-[7px] uppercase tracking-[0.16em] text-ember">
                    {player.team.tag}
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-ember/70" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}