
"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { cardArtwork, isCardTier, tierFromPrice } from "@/lib/cardTier";
import { countryFlag } from "@/lib/flags";
import type { Player, Team } from "@/types";

export type FantasyCardPlayer = Pick<
  Player,
  "ign" | "role" | "country"
> &
  Partial<Pick<Player, "photo_url">> & {
    fantasy_price?: number;
  };

export type FantasyCardTeam = Partial<
  Pick<Team, "name" | "tag" | "logo_url">
>;

export interface FantasyCardStats {
  kills?: number;
  fantasyPoints?: number;
}

export type FantasyCardSize = "sm" | "md" | "lg" | "fluid";

export interface FantasyPlayerCardProps {
  player: FantasyCardPlayer;
  team?: FantasyCardTeam;
  overall?: number;
  stats?: FantasyCardStats;
  price?: number;
  tier?: string;
  selected?: boolean;
  captain?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: FantasyCardSize;
  showStats?: boolean;
  className?: string;
}

const SIZE_CLASS: Record<FantasyCardSize, string> = {
  sm: "w-40",
  md: "w-60",
  lg: "w-80",
  fluid: "w-full",
};

const ART_WIDTH = 1024;
const ART_HEIGHT = 1536;

const ROLE_ICONS: Record<string, string> = {
  rusher:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_rusher_role_player.png",
  bomber:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_bomber_role_player.png",
  support:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_support_role_player.png",
  sniper:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_sniper_role_player.png",
};

function roleIcon(role: string): string | undefined {
  return ROLE_ICONS[role.trim().toLowerCase()];
}

function statValue(value: number | undefined) {
  return value === undefined || Number.isNaN(value)
    ? ""
    : String(Math.round(value));
}

export default function FantasyPlayerCard({
  player,
  team,
  stats,
  price,
  tier,
  selected = false,
  captain = false,
  onClick,
  disabled = false,
  size = "fluid",
  showStats = true,
  className = "",
}: FantasyPlayerCardProps) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const [failedBackgroundLogo, setFailedBackgroundLogo] =
    useState<string | null>(null);
  const [failedRoleIcon, setFailedRoleIcon] = useState<string | null>(null);

  const photo = player.photo_url || undefined;
  const photoSrc = photo && failedPhoto !== photo ? photo : undefined;

  const logo = team?.logo_url || undefined;
  const logoSrc = logo && failedLogo !== logo ? logo : undefined;
  const backgroundLogoSrc =
    logo && failedBackgroundLogo !== logo ? logo : undefined;

  const flag = player.country ? countryFlag(player.country) : undefined;

  const playerPrice = price ?? player.fantasy_price;
  const displayPrice =
    typeof playerPrice === "number" && Number.isFinite(playerPrice)
      ? playerPrice
      : undefined;

  const selectedTier = isCardTier(tier)
    ? tier
    : tierFromPrice(displayPrice ?? 0);

  const artwork = cardArtwork(selectedTier);
  const roleImage = roleIcon(player.role || "");
  const roleImageSrc =
    roleImage && failedRoleIcon !== roleImage ? roleImage : undefined;

  const clickable = typeof onClick === "function";

  const rootStyle: CSSProperties = {
    containerType: "inline-size",
    aspectRatio: `${ART_WIDTH} / ${ART_HEIGHT}`,
  };

  const content = (
    <>
      {/* Rarity artwork */}
      <Image
        src={artwork}
        alt=""
        fill
        priority
        sizes="(max-width: 640px) 50vw, 320px"
        draggable={false}
        className="pointer-events-none select-none object-fill"
      />

      {/* Large, subtle team logo behind the player */}
      {backgroundLogoSrc && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[1]"
          style={{
            left: "20%",
            top: "12%",
            width: "60%",
            height: "42%",
            opacity: 0.18,
          }}
        >
          <Image
            src={backgroundLogoSrc}
            alt=""
            fill
            unoptimized
            sizes="240px"
            onError={() => setFailedBackgroundLogo(logo!)}
            draggable={false}
            className="object-contain"
          />
        </div>
      )}

      {/* Single, crisp player portrait. No blur or fade layers. */}
      {photoSrc && (
        <div
          className="pointer-events-none absolute z-[2]"
          style={{
            left: "12%",
            top: "7%",
            width: "76%",
            height: "55%",
          }}
        >
          <Image
            src={photoSrc}
            alt=""
            fill
            unoptimized
            sizes="320px"
            onError={() => setFailedPhoto(photoSrc)}
            draggable={false}
            className="select-none object-contain object-bottom"
          />
        </div>
      )}

      {/* Player name and nationality */}
      <div
        className="absolute z-[3] flex items-center justify-center"
        style={{
          left: "15%",
          top: "62%",
          width: "73%",
          height: "7%",
          textShadow: "0 2px 4px rgba(0,0,0,.9)",
        }}
      >
        {flag && (
          <span
            role="img"
            aria-label={player.country}
            className="absolute left-0 shrink-0 leading-none"
            style={{ fontSize: "clamp(12px, 5cqw, 38px)" }}
          >
            {flag}
          </span>
        )}

        <span
          title={player.ign}
          className="w-full min-w-0 truncate text-center font-display font-black uppercase leading-none text-white"
          style={{
            paddingLeft: flag ? "12%" : "2%",
            fontSize: `clamp(10px, ${
              player.ign.length > 12
                ? 3.6
                : player.ign.length > 9
                  ? 4.3
                  : 5.1
            }cqw, 44px)`,
            letterSpacing: "0.025em",
          }}
        >
          {player.ign}
        </span>
      </div>

      {/* Team logo, role icon, and fantasy price */}
      <div
        className="absolute z-[3] flex items-center justify-center"
        style={{
          left: "18%",
          top: "71%",
          width: "64%",
          height: "7%",
          gap: "8%",
        }}
      >
        {logoSrc && (
          <div className="relative h-full aspect-square shrink-0">
            <Image
              src={logoSrc}
              alt={team?.name ? `${team.name} logo` : "Team logo"}
              fill
              unoptimized
              sizes="48px"
              onError={() => setFailedLogo(logo!)}
              draggable={false}
              className="object-contain"
            />
          </div>
        )}

        {roleImageSrc && (
          <div className="relative h-[82%] aspect-square shrink-0">
            <Image
              src={roleImageSrc}
              alt={`${player.role} role`}
              fill
              unoptimized
              sizes="40px"
              onError={() => setFailedRoleIcon(roleImage!)}
              draggable={false}
              className="object-contain"
            />
          </div>
        )}

        {displayPrice !== undefined && (
          <span
            className="shrink-0 font-display font-black tabular-nums leading-none text-white"
            style={{
              fontSize: "clamp(12px, 5cqw, 40px)",
              textShadow: "0 2px 4px rgba(0,0,0,.9)",
            }}
            aria-label={`Fantasy price ${displayPrice}`}
          >
            {displayPrice}
          </span>
        )}
      </div>

      {/* Optional bottom stats */}
      {showStats && (
        <>
          <div
            className="absolute z-[3] flex items-center justify-center font-stat font-black tabular-nums text-white"
            style={{
              left: "22%",
              top: "81%",
              width: "20%",
              height: "5.5%",
              fontSize: "clamp(10px, 4.8cqw, 40px)",
              lineHeight: 1,
              textShadow: "0 2px 4px rgba(0,0,0,.9)",
            }}
          >
            {statValue(stats?.kills)}
          </div>

          <div
            className="absolute z-[3] flex items-center justify-center font-stat font-black tabular-nums text-white"
            style={{
              left: "58%",
              top: "81%",
              width: "20%",
              height: "5.5%",
              fontSize: "clamp(10px, 4.8cqw, 40px)",
              lineHeight: 1,
              textShadow: "0 2px 4px rgba(0,0,0,.9)",
            }}
          >
            {statValue(stats?.fantasyPoints)}
          </div>
        </>
      )}

      {/* Captain marker */}
      {captain && (
        <span
          className="absolute z-[4] flex items-center justify-center rounded-full bg-amber font-display font-black text-char"
          style={{
            right: "7%",
            top: "4%",
            width: "10%",
            aspectRatio: "1",
            fontSize: "clamp(12px, 5cqw, 36px)",
          }}
          aria-label="Captain"
        >
          C
        </span>
      )}
    </>
  );

  const rootClass =
    `relative isolate block overflow-hidden ${SIZE_CLASS[size]} ${className}`.trim();

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        data-selected={selected || undefined}
        data-captain={captain || undefined}
        data-tier={selectedTier}
        style={rootStyle}
        className={`${rootClass} appearance-none border-0 bg-transparent p-0 text-left transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber ${
          disabled
            ? "cursor-not-allowed opacity-45 saturate-50"
            : "cursor-pointer hover:-translate-y-1 motion-reduce:transition-none"
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={`${player.ign} player card`}
      data-selected={selected || undefined}
      data-captain={captain || undefined}
      data-tier={selectedTier}
      style={rootStyle}
      className={`${rootClass} ${disabled ? "opacity-45 saturate-50" : ""}`.trim()}
    >
      {content}
    </div>
  );
}
