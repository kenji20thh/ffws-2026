"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import Flag from "@/components/ui/Flag";
import type { Player, Team } from "@/types";

export type FantasyCardPlayer = Pick<Player, "ign" | "role" | "country"> &
  Partial<Pick<Player, "photo_url">>;

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
const textShadow = "0 2px 5px rgba(0,0,0,.95)";

function statValue(value: number | undefined) {
  return value === undefined || Number.isNaN(value) ? "" : String(Math.round(value));
}

export default function FantasyPlayerCard({
  player,
  team,
  stats,
  selected = false,
  captain = false,
  onClick,
  disabled = false,
  size = "fluid",
  className = "",
}: FantasyPlayerCardProps) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);

  const photo = player.photo_url || undefined;
  const photoSrc = photo && failedPhoto !== photo ? photo : undefined;
  const logo = team?.logo_url || undefined;
  const logoSrc = logo && failedLogo !== logo ? logo : undefined;
  const clickable = typeof onClick === "function";

  const rootStyle: CSSProperties = {
    containerType: "inline-size",
    aspectRatio: `${ART_WIDTH} / ${ART_HEIGHT}`,
  };

  const content = (
    <>
      {/* Card artwork: place the new A-tier background at public/cards/bronze-card.png. */}
      <Image
        src="/cards/bronze-card.png"
        alt=""
        fill
        priority
        sizes="(max-width: 640px) 50vw, 320px"
        draggable={false}
        className="pointer-events-none select-none object-fill"
      />

      {/* Team logo sits behind the player's cut-out portrait. */}
      {logoSrc && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[1]"
          style={{
            left: "17%",
            top: "10%",
            width: "66%",
            height: "48%",
            opacity: 0.2,
            filter: "drop-shadow(0 3px 8px rgba(0,0,0,.9))",
          }}
        >
          <Image
            src={logoSrc}
            alt=""
            fill
            unoptimized
            sizes="240px"
            onError={() => setFailedLogo(logoSrc)}
            draggable={false}
            className="object-contain"
          />
        </div>
      )}

      {/* Player photo occupies the upper section, above the nameplate. */}
      {photoSrc && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[2]"
          style={{
            left: "12%",
            top: "7%",
            width: "76%",
            height: "59%",
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

      {/* Middle nameplate: nationality flag and IGN. */}
      <div
        className="absolute z-[3] flex items-center justify-center gap-[3%] px-[8%]"
        style={{
          left: "12%",
          top: "65.3%",
          width: "76%",
          height: "6.8%",
          textShadow,
        }}
      >
        <Flag
          country={player.country}
          height="clamp(10px, 4cqw, 28px)"
        />
        <span
          title={player.ign}
          className="min-w-0 truncate text-center font-display font-black uppercase leading-none text-bone"
          style={{
            fontSize: `clamp(10px, ${player.ign.length > 12 ? 4.1 : player.ign.length > 9 ? 4.8 : 5.7}cqw, 46px)`,
            letterSpacing: "0.025em",
          }}
        >
          {player.ign}
        </span>
      </div>

      {/* Bottom panel: kills on the left, total points on the right. */}
      <div
        className="absolute z-[3] flex items-center justify-center font-stat font-black tabular-nums text-bone"
        style={{
          left: "22%",
          top: "80.5%",
          width: "20%",
          height: "5.2%",
          fontSize: "clamp(12px, 6.4cqw, 52px)",
          lineHeight: 1,
          textShadow,
        }}
      >
        {statValue(stats?.kills)}
      </div>
      <div
        className="absolute z-[3] flex items-center justify-center font-stat font-black tabular-nums text-bone"
        style={{
          left: "59%",
          top: "80.5%",
          width: "20%",
          height: "5.2%",
          fontSize: "clamp(12px, 6.4cqw, 52px)",
          lineHeight: 1,
          textShadow,
        }}
      >
        {statValue(stats?.fantasyPoints)}
      </div>

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

  const rootClass = `relative isolate block overflow-hidden ${SIZE_CLASS[size]} ${className}`.trim();

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        data-selected={selected || undefined}
        data-captain={captain || undefined}
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
      style={rootStyle}
      className={`${rootClass} ${disabled ? "opacity-45 saturate-50" : ""}`.trim()}
    >
      {content}
    </div>
  );
}
