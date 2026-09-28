"use client";

import { useState } from "react";
import type { PlayerProfile as PlayerProfileData } from "@/types";
import PlayerRoomStats from "./PlayerRoomStats";

type PlayerDayStatsProps = {
  days: PlayerProfileData["days"];
};

function formatNumber(value: number, decimals = 1) {
  return value.toFixed(decimals);
}

export default function PlayerDayStats({
  days,
}: PlayerDayStatsProps) {
  const [openDay, setOpenDay] = useState<number | null>(null);

  if (!days.length) {
    return null;
  }

  return (
    <section className="bg-[#f2f2f0] text-[#151515]">
      <div className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10 lg:px-16 lg:pb-20">
        <div className="mb-8 border-b border-black/10 pb-5">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-black/40">
            Tournament Breakdown
          </p>

          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] md:text-4xl">
            Performance by Day
          </h2>
        </div>

        <div className="border-t border-black/10">
          {days.map((day) => {
            const isOpen = openDay === day.day_id;

            return (
              <div
                key={day.day_id}
                className="border-b border-black/10"
              >
                {/* Day header */}
                <button
                  type="button"
                  onClick={() =>
                    setOpenDay(isOpen ? null : day.day_id)
                  }
                  className="group flex w-full items-center gap-5 py-6 text-left md:py-7"
                >
                  {/* Day number */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#151515] text-sm font-black text-white md:h-14 md:w-14">
                    {String(day.day_order).padStart(2, "0")}
                  </div>

                  {/* Day name */}
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black uppercase tracking-[-0.02em] md:text-xl">
                      {day.day_name}
                    </p>

                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-black/35">
                      {day.date}
                    </p>
                  </div>

                  {/* Day totals */}
                  <div className="hidden items-center gap-8 md:flex">
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
                        Kills
                      </p>
                      <p className="mt-1 text-lg font-black">
                        {day.total_kills}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
                        Placement Pts
                      </p>
                      <p className="mt-1 text-lg font-black">
                        {day.placement_points}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
                        Booyahs
                      </p>
                      <p className="mt-1 text-lg font-black">
                        {day.booyahs}
                      </p>
                    </div>
                  </div>

                  {/* Mobile kills */}
                  <div className="text-right md:hidden">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
                      Kills
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {day.total_kills}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center border border-black/10 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 5L7 9L11 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded day */}
                {isOpen && (
                  <div className="pb-7 pl-0 md:pl-[74px]">
                    {/* Mobile stats */}
                    <div className="mb-5 grid grid-cols-2 border-l border-t border-black/10 md:hidden">
                      <div className="border-b border-r border-black/10 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
                          Placement Pts
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {day.placement_points}
                        </p>
                      </div>

                      <div className="border-b border-r border-black/10 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
                          First Bloods
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {day.first_bloods}
                        </p>
                      </div>

                      <div className="border-b border-r border-black/10 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
                          Booyahs
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {day.booyahs}
                        </p>
                      </div>

                      <div className="border-b border-r border-black/10 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
                          Rooms
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {day.rooms_played}
                        </p>
                      </div>
                    </div>

                    {/* Room list */}
                    {day.rooms.length > 0 ? (
                      <PlayerRoomStats rooms={day.rooms} />
                    ) : (
                      <div className="border border-black/10 px-5 py-8 text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-black/35">
                          No room data available
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}