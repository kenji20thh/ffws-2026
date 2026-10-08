 "use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { cardArtwork, tierFromPrice, type CardTier } from "@/lib/cardTier";
import { countryFlag } from "@/lib/flags";
import { roleIcon, roleLabel } from "@/lib/roles";
import type { Player, Team } from "@/types";
import { CARD_ART_HEIGHT, CARD_ART_WIDTH, cq } from "./fantasyCardLayout";

/** Anything shaped like a Player (or a FantasyPlayerOption plus a photo) can be shown. */
export type FantasyCardPlayer = Pick<Player, "ign" | "role" | "country"> &
  Partial<Pick<Player, "photo_url">>;

/** Anything shaped like a Team; every field is optional. */
export type FantasyCardTeam = Partial<Pick<Team, "name" | "tag" | "logo_url">>;

export interface FantasyCardStats {
  kills?: number;
  placements?: number;
  /** average team placement per room (lower is better) */
  avgPlacement?: number;
  avgKills?: number;
}

export type FantasyCardSize = "sm" | "md" | "lg" | "fluid";

export interface FantasyPlayerCardProps {
  player: FantasyCardPlayer;
  team?: FantasyCardTeam;
  /** overall rating; shown as a dash when it is not provided */
  overall?: number;
  stats?: FantasyCardStats;
  /** fantasy price */
  price?: number;
  /** artwork tier; defaults to the tier derived from `price`, or "basic" without a price */
  tier?: CardTier;
  selected?: boolean;
  captain?: boolean;
  /** make the card a button */
  onClick?: () => void;
  disabled?: boolean;
  /** width preset. "fluid" (default) fills its container, so size it from the parent. */
  size?: FantasyCardSize;
  /** show the four stats; defaults to false for size "sm" and true otherwise */
  showStats?: boolean;
  className?: string;
}

const SIZE_CLASS: Record<FantasyCardSize, string> = {
  sm: "w-40",
  md: "w-60",
  lg: "w-80",
  fluid: "w-full",
};

const STAT_COLUMNS = [
  { key: "kills", short: "Kills", full: "Kills", digits: 0 },
  { key: "placements", short: "Place", full: "Placements", digits: 0 },
  {
    key: "avgPlacement",
    short: "Avg Pl",
    full: "Average placement per room",
    digits: 1,
  },
  {
    key: "avgKills",
    short: "Avg K",
    full: "Average kills per room",
    digits: 1,
  },
] as const;

function formatStat(value: number | undefined, digits: number): string {
  if (value === undefined || Number.isNaN(value)) return "–";
  return digits > 0 ? value.toFixed(digits) : String(Math.round(value));
}

/**
 * The new artwork has a large gold portrait area and a large black lower panel.
 * These zones are intentionally defined here instead of relying on the previous
 * artwork's zones, so every dynamic element stays inside the new card artwork.
 *
 * All values are percentages of the card itself.
 */
const CARD_LAYOUT = {
  portrait: {
    left: 9,
    top: 4,
    width: 82,
    height: 47,
  },

  // Upper-left / upper-right identity information.
  overall: {
    left: 10,
    top: 7,
    width: 17,
    height: 11,
  },
  role: {
    left: 10,
    top: 18,
    width: 17,
    height: 8,
  },

  // Small metadata row immediately above the lower panel.
  meta: {
    left: 23,
    top: 49,
    width: 54,
    height: 5,
  },

  // Player name sits on the central divider, where the artwork already has
  // a natural horizontal separation between portrait and stats.
  name: {
    left: 17,
    top: 53,
    width: 66,
    height: 7,
  },

  // Main lower panel. This is deliberately much larger than the old stats zone.
  stats: {
    left: 11,
    top: 62,
    width: 78,
    height: 29,
  },

  captainBadge: {
    right: 10,
    top: 7,
    width: 7,
    height: 7,
  },
} as const;

function cardZone(zone: {
  left?: number;
  right?: number;
  top?: number;
  width?: number;
  height?: number;
}): CSSProperties {
  return {
    position: "absolute",
    ...(zone.left !== undefined ? { left: `${zone.left}%` } : {}),
    ...(zone.right !== undefined ? { right: `${zone.right}%` } : {}),
    ...(zone.top !== undefined ? { top: `${zone.top}%` } : {}),
    ...(zone.width !== undefined ? { width: `${zone.width}%` } : {}),
    ...(zone.height !== undefined ? { height: `${zone.height}%` } : {}),
  };
}

/** Longer names get a smaller font so they stay on one line. */
function nameFontSize(name: string, compact: boolean): number {
  const base = compact ? 62 : 54;
  const length = name.trim().length;

  if (length <= 8) return base;
  if (length <= 11) return base * 0.9;
  if (length <= 14) return base * 0.78;
  if (length <= 18) return base * 0.66;
  if (length <= 22) return base * 0.56;
  return base * 0.48;
}

const textShadow = "0 1px 2px rgba(0,0,0,0.85)";

export default function FantasyPlayerCard({
  player,
  team,
  overall,
  stats,
  price,
  tier,
  selected,
  captain = false,
  onClick,
  disabled = false,
  size = "fluid",
  showStats,
  className = "",
}: FantasyPlayerCardProps) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);

  const resolvedTier: CardTier =
    tier ?? (price !== undefined ? tierFromPrice(price) : "basic");

  const withStats = showStats ?? size !== "sm";
  const compact = !withStats;
  const isSelected = !!selected;
  const clickable = typeof onClick === "function";

  const photo = player.photo_url || undefined;
  const photoSrc = photo && failedPhoto !== photo ? photo : undefined;

  const logo = team?.logo_url || undefined;
  const logoSrc = logo && failedLogo !== logo ? logo : undefined;

  const teamLabel = team?.name || team?.tag;
  const icon = roleIcon(player.role);
  const flag = player.country ? countryFlag(player.country) : undefined;
  const priceLabel = price !== undefined ? `$${price}` : "–";

  const content = (
    <>
      {/* Artwork is the actual card shape. Everything else is positioned over it. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          filter: isSelected
            ? `drop-shadow(0 0 ${cq(12)} rgba(255, 176, 0, 0.9))`
            : undefined,
        }}
      >
        <Image
          src={cardArtwork(resolvedTier)}
          alt=""
          width={CARD_ART_WIDTH}
          height={CARD_ART_HEIGHT}
          sizes="(max-width: 640px) 50vw, 320px"
          draggable={false}
          className="pointer-events-none block h-full w-full select-none"
        />
      </div>

      {/* Player photo: contained entirely inside the large upper portrait area. */}
      <div
        aria-hidden="true"
        style={{ ...cardZone(CARD_LAYOUT.portrait), zIndex: 1 }}
      >
        {photoSrc ? (
          <Image
            src={photoSrc}
            alt=""
            fill
            unoptimized
            sizes="320px"
            draggable={false}
            onError={() => setFailedPhoto(photoSrc)}
            className="select-none object-contain object-bottom"
          />
        ) : (
          <span
            className="flex h-full w-full items-end justify-center font-display font-black uppercase"
            style={{
              fontSize: cq(360),
              lineHeight: 0.8,
              color: "rgba(20, 14, 0, 0.16)",
            }}
          >
            {player.ign.charAt(0)}
          </span>
        )}
      </div>

      {/* Overall rating: upper-left, outside the main portrait center. */}
      <div
        style={{ ...cardZone(CARD_LAYOUT.overall), zIndex: 2 }}
        className="flex items-center justify-center"
      >
        <span
          className="font-display font-black tabular-nums leading-none text-bone"
          style={{
            fontSize: cq(76),
            textShadow,
          }}
        >
          <span className="sr-only">Overall </span>
          {overall !== undefined ? Math.round(overall) : "–"}
        </span>
      </div>

      {/* Role: directly beneath the overall rating. */}
      <div
        style={{ ...cardZone(CARD_LAYOUT.role), zIndex: 2 }}
        className="flex flex-col items-center justify-start"
      >
        {icon && (
          <span
            aria-hidden="true"
            className="relative block"
            style={{ width: cq(34), height: cq(34) }}
          >
            <Image
              src={icon}
              alt=""
              fill
              unoptimized
              sizes="40px"
              className="object-contain"
            />
          </span>
        )}

        <span
          className="font-stat font-bold uppercase text-bone"
          style={{
            fontSize: cq(15),
            letterSpacing: "0.12em",
            lineHeight: 1,
            marginTop: cq(3),
            textShadow,
          }}
        >
          {roleLabel(player.role)}
        </span>
      </div>

      {/* Team / flag / price metadata stays compact and above the stats panel. */}
      <div
        style={{ ...cardZone(CARD_LAYOUT.meta), zIndex: 2 }}
        className="flex min-w-0 items-center justify-center"
      >
        <div
          className="flex min-w-0 items-center justify-center"
          style={{ gap: cq(9) }}
        >
          {logoSrc && (
            <span
              aria-hidden="true"
              className="relative block shrink-0"
              style={{ width: cq(27), height: cq(27) }}
            >
              <Image
                src={logoSrc}
                alt=""
                fill
                unoptimized
                sizes="32px"
                draggable={false}
                onError={() => setFailedLogo(logoSrc)}
                className="object-contain"
              />
            </span>
          )}

          {teamLabel && (
            <span
              className="truncate font-display font-bold uppercase text-bone"
              style={{
                maxWidth: "55%",
                fontSize: cq(compact ? 23 : 21),
                letterSpacing: "0.04em",
                lineHeight: 1,
                textShadow,
              }}
            >
              {teamLabel}
            </span>
          )}

          {flag && (
            <span
              role="img"
              aria-label={player.country}
              style={{
                fontSize: cq(compact ? 28 : 25),
                lineHeight: 1,
              }}
            >
              {flag}
            </span>
          )}

          <span
            className="font-stat font-bold tabular-nums text-ember"
            style={{
              fontSize: cq(compact ? 32 : 29),
              lineHeight: 1,
              textShadow,
            }}
          >
            <span className="sr-only">Price </span>
            {priceLabel}
          </span>
        </div>
      </div>

      {/* Player name sits on the artwork's central divider. */}
      <div
        style={{ ...cardZone(CARD_LAYOUT.name), zIndex: 3 }}
        className="flex items-center justify-center"
      >
        <span
          title={player.ign}
          className="block w-full truncate text-center font-display font-black uppercase leading-none text-bone"
          style={{
            fontSize: cq(nameFontSize(player.ign, compact)),
            letterSpacing: "0.02em",
            textShadow,
          }}
        >
          {player.ign}
        </span>
      </div>

      {/* Large lower stats panel. Four columns remain readable at card size. */}
      {withStats && (
        <dl
          style={{
            ...cardZone(CARD_LAYOUT.stats),
            zIndex: 2,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            alignItems: "stretch",
          }}
        >
          {STAT_COLUMNS.map((col, i) => (
            <div
              key={col.key}
              className={`flex min-w-0 flex-col items-center justify-center ${
                i > 0 ? "border-l border-bone/10" : ""
              }`}
              style={{
                paddingInline: cq(8),
              }}
            >
              <dt
                className="font-stat uppercase text-ash"
                style={{
                  fontSize: cq(compact ? 14 : 18),
                  letterSpacing: "0.1em",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                <span aria-hidden="true">{col.short}</span>
                <span className="sr-only">{col.full}</span>
              </dt>

              <dd
                className="font-stat font-bold tabular-nums text-bone"
                style={{
                  fontSize: cq(compact ? 30 : 43),
                  lineHeight: 1,
                  marginTop: cq(6),
                  textShadow,
                }}
              >
                {formatStat(stats?.[col.key], col.digits)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {captain && (
        <span
          style={{
            ...cardZone(CARD_LAYOUT.captainBadge),
            zIndex: 3,
            fontSize: cq(42),
          }}
          className="flex items-center justify-center rounded-full bg-amber font-display font-black leading-none text-char"
        >
          <span aria-hidden="true">C</span>
          <span className="sr-only">Captain</span>
        </span>
      )}
    </>
  );

  // The container is the card itself: cqw units inside resolve against its width.
  const rootStyle = {
    containerType: "inline-size",
    aspectRatio: `${CARD_ART_WIDTH} / ${CARD_ART_HEIGHT}`,
  } as CSSProperties;

  const rootClass = `relative block ${SIZE_CLASS[size]} ${className}`.trim();

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        data-tier={resolvedTier}
        data-selected={isSelected || undefined}
        data-captain={captain || undefined}
        style={rootStyle}
        className={`${rootClass} appearance-none border-0 bg-transparent p-0 text-left transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber motion-reduce:transition-none ${
          disabled
            ? "cursor-not-allowed opacity-45 saturate-50"
            : "cursor-pointer hover:-translate-y-1 motion-reduce:hover:translate-y-0"
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={`${player.ign} fantasy card`}
      data-tier={resolvedTier}
      data-selected={isSelected || undefined}
      data-captain={captain || undefined}
      style={rootStyle}
      className={`${rootClass} ${disabled ? "opacity-45 saturate-50" : ""}`.trim()}
    >
      {content}
    </div>
  );
}
