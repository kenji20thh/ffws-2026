import Image from "next/image";
import type { Player, Team } from "@/types";

type PlayerWithTeam = Player & {
  team: Team;
};

interface Props {
  players: PlayerWithTeam[];
}

export default function PlayersHeroMarquee({ players }: Props) {
  if (players.length === 0) {
    return null;
  }

  // Pick one player from each team.
  const byTeam = new Map<number, PlayerWithTeam>();

  for (const player of players) {
    if (!byTeam.has(player.team.id)) {
      byTeam.set(player.team.id, player);
    }
  }

  const featuredPlayers = Array.from(byTeam.values());

  if (featuredPlayers.length === 0) {
    return null;
  }

  // Duplicate the sequence for a seamless infinite loop.
  const marqueePlayers = [
    ...featuredPlayers,
    ...featuredPlayers,
  ];

  return (
    <div className="relative -mx-5 mt-8 overflow-hidden sm:-mx-6 lg:-mx-8">
      {/* Left fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 bg-gradient-to-r from-char via-char/80 to-transparent sm:w-32" />

      {/* Right fade */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 bg-gradient-to-l from-char via-char/80 to-transparent sm:w-32" />

      {/* Top line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-bone/10" />

      <div className="group overflow-hidden py-5">
        <div
          className="flex w-max animate-players-marquee group-hover:[animation-play-state:paused]"
          style={{
            animationDuration: `${Math.max(
              35,
              featuredPlayers.length * 4,
            )}s`,
          }}
        >
          {marqueePlayers.map((player, index) => (
            <div
              key={`${player.id}-${index}`}
              className="relative mx-2 h-32 w-28 shrink-0 overflow-hidden border border-bone/10 bg-char-2 sm:mx-3 sm:h-36 sm:w-32"
            >
              {/* Player photo */}
              {player.photo_url ? (
                <Image
                  src={player.photo_url}
                  alt={player.ign}
                  fill
                  sizes="128px"
                  className="object-cover object-top opacity-90 transition duration-500 group-hover:opacity-100"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-4xl font-black text-bone/10">
                    {player.ign.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Dark gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-char via-char/20 to-transparent" />

              {/* Team logo */}
              {player.team.logo_url && (
                <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center bg-char/75 p-1 backdrop-blur-sm">
                  <Image
                    src={player.team.logo_url}
                    alt=""
                    width={24}
                    height={24}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}

              {/* Player information */}
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p className="truncate font-display text-sm font-black uppercase leading-none text-bone">
                  {player.ign}
                </p>

                <p className="mt-1 truncate font-stat text-[7px] uppercase tracking-[0.16em] text-ember">
                  {player.team.name}
                </p>
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-0 h-[2px] w-full bg-ember/70" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-bone/10" />

      {/* Label */}
      <div className="pointer-events-none absolute bottom-2 left-5 z-30 hidden font-stat text-[7px] uppercase tracking-[0.3em] text-ash/60 sm:block">
        WORLD STAGE · PLAYERS
      </div>
    </div>
  );
}
