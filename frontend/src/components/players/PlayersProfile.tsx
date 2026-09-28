import Image from "next/image";
import type { PlayerProfile as PlayerProfileData } from "@/types";

type PlayerProfileProps = {
  player: PlayerProfileData["player"];
  team: PlayerProfileData["team"];
};

const roleIcons: Record<string, string> = {
  Rusher:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_rusher_role_player.png",
  Bomber:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_bomber_role_player.png",
  Support:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_support_role_player.png",
  Sniper:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_sniper_role_player.png",
};

export default function PlayerProfile({
  player,
  team,
}: PlayerProfileProps) {
  const roleIcon = roleIcons[player.role];

  return (
    <section className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-8 md:px-8 md:py-10">
        {/* Player photo */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-[#f1f1ef] md:h-40 md:w-40">
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={player.ign}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 112px, 160px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-black/20">
              {player.ign.charAt(0)}
            </div>
          )}
        </div>

        {/* Player information */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.12em] text-black/45">
            {roleIcon && (
              <Image
                src={roleIcon}
                alt=""
                width={22}
                height={22}
                className="object-contain"
                unoptimized
              />
            )}
            <span>{player.role || "Player"}</span>
          </div>

          <h1 className="truncate text-4xl font-black uppercase tracking-tight md:text-6xl">
            {player.ign}
          </h1>

          {player.real_name && (
            <p className="mt-1 text-base text-black/55 md:text-lg">
              {player.real_name}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            {team.logo_url && (
              <div className="relative h-10 w-10 shrink-0">
                <Image
                  src={team.logo_url}
                  alt={team.name}
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-bold uppercase">{team.name}</p>
              <p className="text-sm uppercase tracking-wider text-black/45">
                {team.tag}
              </p>
            </div>
          </div>
        </div>

        {/* Country / region */}
        <div className="hidden shrink-0 text-right md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/40">
            Country
          </p>
          <p className="mt-1 font-bold uppercase">{player.country}</p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-black/40">
            Region
          </p>
          <p className="mt-1 font-bold uppercase">{player.region}</p>
        </div>
      </div>
    </section>
  );
}