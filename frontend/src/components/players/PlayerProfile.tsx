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

const countryFlags: Record<string, string> = {
  Morocco: "🇲🇦",
  Mexico: "🇲🇽",
  Indonesia: "🇮🇩",
  Vietnam: "🇻🇳",
  Thailand: "🇹🇭",
  Malaysia: "🇲🇾",
  Singapore: "🇸🇬",
  Philippines: "🇵🇭",
  India: "🇮🇳",
  Brazil: "🇧🇷",
  Pakistan: "🇵🇰",
  Bangladesh: "🇧🇩",
  Nepal: "🇳🇵",
};

export default function PlayerProfile({
  player,
  team,
}: PlayerProfileProps) {
  const roleIcon = roleIcons[player.role];
  const countryFlag = countryFlags[player.country] ?? "🌐";

  return (
    <section className="relative overflow-hidden bg-[#151515] text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-white/[0.035]" />

        <div className="absolute bottom-0 left-1/3 h-px w-2/3 bg-white/10" />

        <div className="absolute inset-0 opacity-[0.035]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(135deg, transparent 0%, transparent 49%, white 50%, transparent 51%, transparent 100%)",
              backgroundSize: "22px 22px",
            }}
          />
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[430px] max-w-[1440px] items-end px-5 md:px-10 lg:px-16">
        {/* Player photo */}
        <div className="relative h-[360px] w-[270px] shrink-0 self-end md:h-[450px] md:w-[340px] lg:h-[500px] lg:w-[390px]">
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={player.ign}
              fill
              priority
              className="object-contain object-bottom"
              sizes="(max-width: 768px) 270px, (max-width: 1024px) 340px, 390px"
            />
          ) : (
            <div className="flex h-full items-end justify-center pb-12 text-8xl font-black text-white/10">
              {player.ign.charAt(0)}
            </div>
          )}
        </div>

        {/* Player information */}
        <div className="min-w-0 flex-1 pb-12 md:pb-16 lg:pb-20">
          {/* Team */}
          <div className="mb-8 flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              {team.logo_url && (
                <Image
                  src={team.logo_url}
                  alt={team.name}
                  fill
                  className="object-contain"
                  sizes="56px"
                />
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                {team.tag}
              </p>

              <p className="font-bold uppercase tracking-wide">
                {team.name}
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-white/50">
            {roleIcon && (
              <Image
                src={roleIcon}
                alt=""
                width={25}
                height={25}
                className="object-contain"
                unoptimized
              />
            )}

            <span>{player.role || "Player"}</span>
          </div>

          {/* IGN */}
          <h1 className="max-w-5xl break-words text-[clamp(3rem,8vw,7.5rem)] font-black uppercase leading-[0.82] tracking-[-0.055em]">
            {player.ign}
          </h1>

          {/* Real name */}
          {player.real_name && (
            <p className="mt-5 text-lg font-medium text-white/45 md:text-xl">
              {player.real_name}
            </p>
          )}

          {/* Country + Region */}
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5">
            {/* Country */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                Country
              </p>

              <p className="mt-1 flex items-center gap-2 text-sm font-bold uppercase">
                <span className="text-lg leading-none">
                  {countryFlag}
                </span>

                {player.country}
              </p>
            </div>

            {/* Region */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                Region
              </p>

              <p className="mt-1 text-sm font-bold uppercase">
                {player.region}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}