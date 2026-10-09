"use client";

import Image from "next/image";

import { useState, type CSSProperties } from "react";

import { cardArtwork, tierFromPrice, type CardTier } from "@/lib/cardTier";

import { countryFlag } from "@/lib/flags";

import { roleIcon, roleLabel } from "@/lib/roles";

import type { Player, Team } from "@/types";

import {

  CARD_ART_HEIGHT,

  CARD_ART_WIDTH,

  CARD_ZONES,

  cq,

  zoneStyle,

} from "./fantasyCardLayout";

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

  /** First-blood count, when available. */
  firstBloods?: number;

  /** Total fantasy points, when available. */
  fantasyPoints?: number;

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

  /** show the six-cell, two-row stats grid; defaults to false for size "sm" and true otherwise */

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
  { key: "kills", short: "KILLS", full: "Kills", digits: 0 },
  { key: "placements", short: "PLACE", full: "Placements", digits: 0 },
  { key: "avgPlacement", short: "AVG PL", full: "Average placement per room", digits: 1 },
  { key: "avgKills", short: "AVG K", full: "Average kills per room", digits: 1 },
  { key: "firstBloods", short: "FB", full: "First bloods", digits: 0 },
  { key: "fantasyPoints", short: "PTS", full: "Fantasy points", digits: 0 },
] as const;

function formatStat(value: number | undefined, digits: number): string {

  if (value === undefined || Number.isNaN(value)) return "–";

  return digits > 0 ? value.toFixed(digits) : String(Math.round(value));

}

/** Longer names get a smaller font so they stay on one line. Sizes are in artwork pixels. */

function nameFontSize(name: string, compact: boolean): number {

  const base = compact ? 62 : 56;

  const length = name.length;

  if (length <= 9) return base;

  if (length <= 12) return base * 0.84;

  if (length <= 16) return base * 0.68;

  return base * 0.54;

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

  const resolvedTier: CardTier = tier ?? (price !== undefined ? tierFromPrice(price) : "basic");

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

  // metrics of the team / flag / price row; the compact version is larger

  const m = compact ? 1.5 : 1;

  const metaZone = compact ? CARD_ZONES.metaCompact : CARD_ZONES.meta;

  const content = (

    <>

      {/* 1. the artwork is the card; the selected glow follows its shape, not a rectangle */}

      <div

        aria-hidden="true"

        style={{

          position: "absolute",

          inset: 0,

          zIndex: 0,

          filter: isSelected ? `drop-shadow(0 0 ${cq(12)} rgba(255, 176, 0, 0.9))` : undefined,

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

      {/* 2. player photo: transparent cut-out standing on the lower plate, no box around it */}

      <div aria-hidden="true" style={{ ...zoneStyle(CARD_ZONES.portrait), zIndex: 1 }}>

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

        ) : null}

      </div>

      {/* 3. information, layered on top (DOM order is the reading order) */}

      <div

        style={{ ...zoneStyle(CARD_ZONES.name), zIndex: 2 }}

        className="flex items-center justify-center"

      >

        <span

          title={player.ign}

          className="block w-full truncate text-center font-display font-black uppercase leading-none text-bone"

          style={{ fontSize: cq(nameFontSize(player.ign, compact)), letterSpacing: "0.02em", textShadow }}

        >

          {player.ign}

        </span>

      </div>

      <div

        style={{ ...zoneStyle(metaZone), zIndex: 2 }}

        className="flex items-center justify-between"

      >

        {(logoSrc || teamLabel) && (

          <div className="flex min-w-0 items-center" style={{ gap: cq(10 * m) }}>

            {logoSrc && (

              <span

                aria-hidden="true"

                className="relative block shrink-0"

                style={{ width: cq(38 * m), height: cq(38 * m) }}

              >

                <Image

                  src={logoSrc}

                  alt=""

                  fill

                  unoptimized

                  sizes="64px"

                  draggable={false}

                  onError={() => setFailedLogo(logoSrc)}

                  className="object-contain"

                />

              </span>

            )}

            {teamLabel && (

              <span

                className="truncate font-display font-bold uppercase text-bone"

                style={{ fontSize: cq(26 * m), letterSpacing: "0.04em", lineHeight: 1, textShadow }}

              >

                {teamLabel}

              </span>

            )}

          </div>

        )}

        <div className="ml-auto flex shrink-0 items-center" style={{ gap: cq(14 * m) }}>

          {flag && (

            <span

              role="img"

              aria-label={player.country}

              style={{ fontSize: cq(34 * m), lineHeight: 1 }}

            >

              {flag}

            </span>

          )}

          <span

            className="font-stat font-bold tabular-nums text-ember"

            style={{ fontSize: cq(40 * m), lineHeight: 1, textShadow }}

          >

            <span className="sr-only">Price </span>

            {priceLabel}

          </span>

        </div>

      </div>

      {withStats && (

        <dl

          style={{

            ...zoneStyle(CARD_ZONES.stats),

            zIndex: 2,

            display: "grid",

            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gridTemplateRows: "repeat(2, minmax(0, 1fr))",

          }}

        >

          {STAT_COLUMNS.map((col, i) => (

            <div

              key={col.key}

              className={`flex min-h-0 flex-col items-center justify-center ${i % 3 !== 0 ? "border-l border-bone/10" : ""} ${i >= 3 ? "border-t border-bone/10" : ""}`}

            >

              <dt

                className="font-stat uppercase text-ash"

                style={{ fontSize: cq(18), letterSpacing: "0.08em", lineHeight: 1 }}

              >

                <span aria-hidden="true">{col.short}</span>

                <span className="sr-only">{col.full}</span>

              </dt>

              <dd

                className="font-stat font-bold tabular-nums text-bone"

                style={{ fontSize: cq(42), lineHeight: 1.05, marginTop: cq(5), textShadow }}

              >

                {formatStat(stats?.[col.key], col.digits)}

              </dd>

            </div>

          ))}

        </dl>

      )}

      <div

        style={{ ...zoneStyle(CARD_ZONES.overall), zIndex: 2 }}

        className="flex items-center justify-center"

      >

        <span

          className="font-display font-black tabular-nums leading-none text-bone"

          style={{ fontSize: cq(88), textShadow }}

        >

          <span className="sr-only">Overall </span>

          {overall !== undefined ? Math.round(overall) : "–"}

        </span>

      </div>

      <div

        style={{ ...zoneStyle(CARD_ZONES.role), zIndex: 2 }}

        className="flex flex-col items-center justify-start"

      >

        {icon && (

          <span

            aria-hidden="true"

            className="relative block"

            style={{ width: cq(42), height: cq(42) }}

          >

            <Image src={icon} alt="" fill unoptimized sizes="48px" className="object-contain" />

          </span>

        )}

        <span

          className="font-stat font-bold uppercase text-bone"

          style={{ fontSize: cq(18), letterSpacing: "0.14em", lineHeight: 1, marginTop: cq(4), textShadow }}

        >

          {roleLabel(player.role)}

        </span>

      </div>

      {captain && (

        <span

          style={{ ...zoneStyle(CARD_ZONES.captainBadge), zIndex: 3, fontSize: cq(66) }}

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
