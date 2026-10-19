"use client";

import Image from "next/image";
import { Barlow_Condensed, Bebas_Neue } from "next/font/google";
import { useState, type CSSProperties } from "react";
import { cardArtwork, isCardTier, tierFromPrice } from "@/lib/cardTier";
import { countryFlag } from "@/lib/flags";
import type { Player, Team } from "@/types";

const condensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const numberFont = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export type FantasyCardPlayer = Pick<Player, "ign" | "role" | "country"> &
  Partial<Pick<Player, "photo_url">> & {
    fantasy_price?: number;
  };

export type FantasyCardTeam = Partial<Pick<Team, "name" | "tag" | "logo_url">>;

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

const GOLD = "#ffd98a";

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

/** Price -> power rating. 33 => 95. Change the offset to rescale. */
function powerFromPrice(price: number): number {
  return Math.min(99, Math.max(1, Math.round(price + 62)));
}

function statValue(value: number | undefined) {
  return value === undefined || Number.isNaN(value)
    ? "–"
    : String(Math.round(value));
}

/** Thin gold line that fades out at both ends. */
function GoldRule({ width = "100%" }: { width?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        opacity: 0.7,
      }}
    />
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <span
        className="font-extrabold tabular-nums leading-none text-white"
        style={{
          fontSize: "clamp(14px, 8cqw, 44px)",
          textShadow: "0 2px 4px rgba(0,0,0,.85)",
        }}
      >
        {value}
      </span>
      <span
        className="font-bold uppercase leading-none"
        style={{
          marginTop: "5%",
          fontSize: "clamp(6px, 2.7cqw, 12px)",
          letterSpacing: "0.22em",
          color: GOLD,
          textShadow: "0 1px 2px rgba(0,0,0,.9)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function FantasyPlayerCard({
  player,
  team,
  overall,
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

  const power =
    typeof overall === "number" && Number.isFinite(overall)
      ? Math.round(overall)
      : displayPrice !== undefined
        ? powerFromPrice(displayPrice)
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

  const nameSize =
    player.ign.length > 12 ? 6 : player.ign.length > 9 ? 7.2 : 8.6;

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

      {/* Large, subtle team logo watermark, centered */}
      {backgroundLogoSrc && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[1]"
          style={{
            left: "20%",
            top: "14%",
            width: "60%",
            height: "40%",
            opacity: 0.5,
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

      {/* Player portrait: centered, torso fades into the name plate */}
      {photoSrc && (
        <div
          className="pointer-events-none absolute z-[2]"
          style={{
            left: "12%",
            top: "6%",
            width: "76%",
            height: "62%",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 80%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, #000 80%, transparent 100%)",
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

      {/* Soft dark pool behind the text so it always reads well */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-[2]"
        style={{
          left: "6%",
          top: "58%",
          width: "88%",
          height: "34%",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 70%)",
        }}
      />

      {/* Left column: power · role · flag · club (evenly spread) */}
      <div
        className="absolute z-[3] flex flex-col items-center justify-between"
        style={{
          left: "15.5%",
          top: "11%",
          width: "14%",
          height: "46%",
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,.85))",
        }}
      >
        {power !== undefined && (
          <div
            className="flex flex-col items-center"
            aria-label={`Power ${power}`}
          >
            <span
              className={`${numberFont.className} leading-[0.85]`}
              style={{
                fontSize: "clamp(20px, 15cqw, 64px)",
                backgroundImage:
                  "linear-gradient(180deg, #ffffff 30%, #ffd98a 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
                letterSpacing: "0.01em",
              }}
            >
              {power}
            </span>
            <span
              className="font-bold uppercase leading-none"
              style={{
                marginTop: "6%",
                fontSize: "clamp(6px, 2.6cqw, 11px)",
                letterSpacing: "0.22em",
                color: GOLD,
              }}
            >
              PWR
            </span>
          </div>
        )}

        {roleImageSrc ? (
          <div
            className="relative aspect-square"
            style={{ width: "85%" }}
            title={player.role}
          >
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
        ) : (
          player.role && (
            <span
              className="font-bold uppercase leading-none text-white"
              style={{
                fontSize: "clamp(7px, 3cqw, 14px)",
                letterSpacing: "0.08em",
              }}
            >
              {player.role.slice(0, 3)}
            </span>
          )
        )}

        {flag && (
          <span
            role="img"
            aria-label={player.country}
            className="leading-none"
            style={{ fontSize: "clamp(12px, 7cqw, 34px)" }}
          >
            {flag}
          </span>
        )}

        {logoSrc && (
          <div className="relative aspect-square" style={{ width: "85%" }}>
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
      </div>

      {/* Name plate */}
      <div
        className="absolute z-[3] flex items-center justify-center"
        style={{
          left: "15%",
          top: "66.5%",
          width: "70%",
          height: "7.5%",
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,.85))",
        }}
      >
        <span
          title={player.ign}
          className="w-full min-w-0 truncate text-center font-black uppercase leading-none"
          style={{
            fontSize: `clamp(12px, ${nameSize}cqw, 48px)`,
            letterSpacing: "0.04em",
            backgroundImage: "linear-gradient(180deg, #ffffff 35%, #ffe3ad 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            paddingBottom: "0.08em",
          }}
        >
          {player.ign}
        </span>
      </div>

      {/* Divider with diamond */}
      <div
        aria-hidden="true"
        className="absolute z-[3] flex items-center justify-center"
        style={{ left: "22%", top: "74.8%", width: "56%", height: "1.6%" }}
      >
        <div className="absolute inset-x-0 top-1/2">
          <GoldRule />
        </div>
        <div
          className="relative"
          style={{
            width: "2.2cqw",
            height: "2.2cqw",
            background: GOLD,
            transform: "rotate(45deg)",
            boxShadow: "0 0 6px rgba(255,200,90,.8)",
          }}
        />
      </div>

      {/* Stats */}
      {showStats && (
        <div
          className="absolute z-[3] flex items-center"
          style={{ left: "20%", top: "77.5%", width: "60%", height: "9.5%" }}
        >
          <StatBlock value={statValue(stats?.kills)} label="Kills" />
          <div
            aria-hidden="true"
            style={{
              width: 1,
              height: "70%",
              background: `linear-gradient(180deg, transparent, ${GOLD}, transparent)`,
              opacity: 0.6,
            }}
          />
          <StatBlock value={statValue(stats?.fantasyPoints)} label="Points" />
        </div>
      )}

      {/* Captain marker */}
      {captain && (
        <span
          className="absolute z-[4] flex items-center justify-center rounded-full bg-amber font-black text-char"
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
    `relative isolate block overflow-hidden ${condensed.className} ${SIZE_CLASS[size]} ${
      selected ? "drop-shadow-[0_0_14px_rgba(255,170,40,.6)]" : ""
    } ${className}`.trim();

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