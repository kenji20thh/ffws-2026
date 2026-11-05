"use client";

import { useState } from "react";
import type { TeamWeaponCategoryStat } from "@/types";

// One color per slice, in order of kills. Distinct enough to tell apart, but still
// warm / muted so they sit well on the dark site theme (ember first).
const SEGMENT_COLORS = [
  "#f05a28", // ember
  "#e0a526", // amber
  "#c94d26",
  "#8f8a7a", // ash
  "#a94327",
  "#d9d2c0", // bone
  "#704034",
  "#5f6b73",
];

export default function TeamWeaponCategoryChart({
  categories,
}: {
  categories: TeamWeaponCategoryStat[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const totalKills = categories.reduce((sum, c) => sum + c.kills, 0);

  if (totalKills === 0) {
    return (
      <p className="font-stat text-xs uppercase tracking-widest text-ash">
        No weapon kills recorded yet
      </p>
    );
  }

  const size = 260;
  const center = size / 2;
  const radius = 88;
  const strokeWidth = 30;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  // The API sends the biggest category first; sort anyway so the colors stay stable.
  const segments = [...categories]
    .sort((a, b) => b.kills - a.kills || a.category.localeCompare(b.category))
    .map((c, index) => {
      const percentage = (c.kills / totalKills) * 100;
      const length = (c.kills / totalKills) * circumference;

      const segment = {
        ...c,
        percentage,
        length,
        offset: -accumulated,
        color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      };

      accumulated += length;
      return segment;
    });

  const hoveredSegment = segments.find((s) => s.category === hovered);

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(260px,320px)_1fr]">
      {/* Donut */}
      <div className="relative mx-auto aspect-square w-full max-w-[300px]">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-full w-full -rotate-90"
          role="img"
          aria-label="Team kills by weapon category"
        >
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-char-3"
          />

          {segments.map((s) => {
            const isHovered = hovered === s.category;
            const isDimmed = hovered !== null && !isHovered;

            return (
              <circle
                key={s.category}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={isHovered ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={`${s.length} ${circumference}`}
                strokeDashoffset={s.offset}
                strokeLinecap="butt"
                className="cursor-pointer transition-all duration-300"
                style={{ opacity: isDimmed ? 0.2 : 1 }}
                onMouseEnter={() => setHovered(s.category)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>

        {/* Center */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {hoveredSegment ? (
            <>
              <span className="font-display text-xl uppercase tracking-wide text-bone">
                {hoveredSegment.category}
              </span>
              <span
                className="mt-1 font-stat text-sm uppercase tracking-widest"
                style={{ color: hoveredSegment.color }}
              >
                {hoveredSegment.percentage.toFixed(1)}%
              </span>
              <span className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">
                {hoveredSegment.kills} KILLS
              </span>
            </>
          ) : (
            <>
              <span className="font-stat text-[10px] uppercase tracking-[0.25em] text-ash">
                WEAPON KILLS
              </span>
              <span className="font-display text-4xl text-bone">{totalKills}</span>
            </>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-2">
        {segments.map((s, index) => {
          const isHovered = hovered === s.category;

          return (
            <div
              key={s.category}
              className={`flex items-center justify-between border-b border-char-3 py-3 transition-all duration-200 ${
                isHovered ? "border-ember/60" : ""
              }`}
              onMouseEnter={() => setHovered(s.category)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="w-5 shrink-0 font-stat text-[10px] tabular-nums text-ash">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200"
                  style={{
                    backgroundColor: s.color,
                    transform: isHovered ? "scale(1.3)" : "scale(1)",
                  }}
                />

                <span className="truncate font-stat text-xs uppercase tracking-widest text-bone">
                  {s.category}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-5">
                <span className="font-stat text-xs tabular-nums text-ash">{s.kills} KILLS</span>
                <span
                  className="w-14 text-right font-stat text-sm tabular-nums"
                  style={{ color: s.color }}
                >
                  {s.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}