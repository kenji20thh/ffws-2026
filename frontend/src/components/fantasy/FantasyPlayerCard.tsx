
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
const TEXT_SHADOW = "0 2px 5px rgba(0,0,0,.95)";

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
  const clickable = typeof onClick === "function";

  const rootStyle: CSSProperties = {
    containerType: "inline-size",
    aspectRatio: `${ART_WIDTH} / ${ART_HEIGHT}`,
  };

  const content = (
    <>
      {/* 1. Card artwork */}
      <Image
        src={artwork}
        alt=""
        fill
        priority
        sizes="(max-width: 640px) 50vw, 320px"
        draggable={false}
        className="pointer-events-none select-none object-fill"
      />

      {/* 2. Large faded team logo behind the player's portrait */}
      {backgroundLogoSrc && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[1]"
          style={{
            left: "23%",
            top: "12%",
            width: "57%",
            height: "43%",
            opacity: 0.2,
            filter: "drop-shadow(0 3px 8px rgba(0,0,0,.8))",
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

      {/* 3. Player portrait */}
      {photoSrc && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-[2] overflow-hidden"
            style={{
              left: "17%",
              top: "7%",
              width: "70%",
              height: "54%",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 76%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 76%, transparent 100%)",
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

          {/* Soft fade at the portrait's lower edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-[2]"
            style={{
              left: "17%",
              top: "53%",
              width: "70%",
              height: "10%",
              background:
                "linear-gradient(to bottom, transparent, rgba(0,0,0,.5) 55%, rgba(0,0,0,.85))",
            }}
          />
        </>
      )}

      {/* 4. Player name and nationality flag */}
      <div
        className="absolute z-[3] flex items-center justify-center"
        style={{
          left: "19%",
          top: "61.5%",
          width: "74%",
          height: "7%",
          textShadow: TEXT_SHADOW,
        }}
      >
        {flag && (
          <span
            role="img"
            aria-label={player.country}
            className="absolute left-[1%] shrink-0 leading-none"
            style={{
              fontSize: "clamp(12px, 5cqw, 38px)",
            }}
          >
            {flag}
          </span>
        )}

        <span
          title={player.ign}
          className="w-full min-w-0 truncate text-center font-display font-black uppercase leading-none text-white"
          style={{
            paddingLeft: flag ? "11%" : "2%",
            paddingRight: "2%",
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

      {/* 5. Separate team logo for clear team identification */}
      {logoSrc && (
        <div
          className="absolute z-[3]"
          style={{
            left: "21%",
            top: "70.5%",
            width: "12%",
            height: "6%",
          }}
        >
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

      {/* 6. Player role */}
      <div
        className="absolute z-[3] flex items-center justify-center"
        style={{
          left: "34%",
          top: "70.5%",
          width: "34%",
          height: "6%",
          fontSize: "clamp(9px, 3.3cqw, 28px)",
          textShadow: TEXT_SHADOW,
        }}
      >
        <span className="truncate text-center font-display font-bold uppercase leading-none text-white">
          {player.role || ""}
        </span>
      </div>

      {/* 7. Fantasy price */}
      <div
        className="absolute z-[3] flex items-center justify-center"
        style={{
          left: "69%",
          top: "70.5%",
          width: "19%",
          height: "6%",
          fontSize: "clamp(11px, 4.2cqw, 36px)",
          textShadow: TEXT_SHADOW,
        }}
      >
        <span className="font-stat font-black tabular-nums leading-none text-white">
          {displayPrice === undefined ? "" : displayPrice}
        </span>
      </div>

      {/* Optional stats: kills and fantasy points */}
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
              textShadow: TEXT_SHADOW,
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
              textShadow: TEXT_SHADOW,
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
