"use client";

import type { TeamPlayerStats } from "@/types";
import { useState } from "react";

export default function KillParticipationChart({
  players,
}: {
  players: TeamPlayerStats[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const totalKills = players.reduce(
    (sum, player) => sum + player.total_kills,
    0
  );

  if (totalKills === 0) {
    return (
      <p className="font-stat text-xs uppercase tracking-widest text-ash">
        No kills recorded yet
      </p>
    );
  }

  const size = 260;
  const center = size / 2;
  const radius = 88;
  const strokeWidth = 30;
  const circumference = 2 * Math.PI * radius;

  // Muted colors that stay within the site's ember / dark palette.
  const segmentColors = [
    "#f05a28",
    "#c94d26",
    "#a94327",
    "#8f4b35",
    "#704034",
  ];

  let accumulated = 0;

  const segments = players.map((player, index) => {
    const percentage = (player.total_kills / totalKills) * 100;
    const length = (player.total_kills / totalKills) * circumference;

    const segment = {
      ...player,
      index,
      percentage,
      length,
      offset: -accumulated,
      color: segmentColors[index % segmentColors.length],
    };

    accumulated += length;

    return segment;
  });

  const sortedPlayers = [...segments].sort(
    (a, b) => b.total_kills - a.total_kills
  );

  const hoveredPlayer = segments.find(
    (player) => player.player_id === hovered
  );

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(260px,320px)_1fr]">
      {/* Donut */}
      <div className="relative mx-auto aspect-square w-full max-w-[300px]">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 h-full w-full"
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

          {/* Player segments */}
          {segments.map((player) => {
            const isHovered = hovered === player.player_id;
            const isDimmed = hovered !== null && !isHovered;

            return (
              <circle
                key={player.player_id}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={player.color}
                strokeWidth={isHovered ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={`${player.length} ${circumference}`}
                strokeDashoffset={player.offset}
                strokeLinecap="butt"
                className="cursor-pointer transition-all duration-300"
                style={{
                  opacity: isDimmed ? 0.2 : 1,
                }}
                onMouseEnter={() => setHovered(player.player_id)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>

        {/* Center */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {hoveredPlayer ? (
            <>
              <span className="font-display text-xl uppercase tracking-wide text-bone">
                {hoveredPlayer.ign}
              </span>

              <span
                className="mt-1 font-stat text-sm uppercase tracking-widest"
                style={{ color: hoveredPlayer.color }}
              >
                {hoveredPlayer.percentage.toFixed(1)}%
              </span>

              <span className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">
                {hoveredPlayer.total_kills} KILLS
              </span>
            </>
          ) : (
            <>
              <span className="font-stat text-[10px] uppercase tracking-[0.25em] text-ash">
                TEAM KILLS
              </span>

              <span className="font-display text-4xl text-bone">
                {totalKills}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Player breakdown */}
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const isHovered = hovered === player.player_id;

          return (
            <div
              key={player.player_id}
              className={`flex items-center justify-between border-b border-char-3 py-3 transition-all duration-200 ${
                isHovered ? "border-ember/60" : ""
              }`}
              onMouseEnter={() => setHovered(player.player_id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="w-5 shrink-0 font-stat text-[10px] tabular-nums text-ash">
                  {String(index + 1).padStart(2, "0")}
                </span>

                {/* Matching donut color */}
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200"
                  style={{
                    backgroundColor: player.color,
                    transform: isHovered ? "scale(1.3)" : "scale(1)",
                  }}
                />

                <span className="truncate font-stat text-xs uppercase tracking-widest text-bone">
                  {player.ign}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-5">
                <span className="font-stat text-xs tabular-nums text-ash">
                  {player.total_kills} KILLS
                </span>

                <span
                  className="w-14 text-right font-stat text-sm tabular-nums"
                  style={{ color: player.color }}
                >
                  {player.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
