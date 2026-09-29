"use client";

import { useState } from "react";
import type { PlayerProfile as PlayerProfileData } from "@/types";
import PlayerRoomStats from "./PlayerRoomStats";

type Props = { days: PlayerProfileData["days"] };

export default function PlayerDayStats({ days }: Props) {
  const [openDay, setOpenDay] = useState<number | null>(days[0]?.day_id ?? null);
  if (!days.length) return null;

  return (
    <section className="bg-char">
      <div className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-8 border-b border-bone/10 pb-5">
          <p className="mb-2 font-stat text-[10px] uppercase tracking-[0.3em] text-ember">Tournament breakdown</p>
          <h2 className="font-display text-4xl font-black uppercase">Performance by day</h2>
        </div>

        <div className="border-t border-bone/10">
          {days.map((day) => {
            const isOpen = openDay === day.day_id;
            return (
              <div key={day.day_id} className="border-b border-bone/10">
                <button
                  type="button"
                  onClick={() => setOpenDay(isOpen ? null : day.day_id)}
                  className="flex w-full items-center gap-5 py-6 text-left"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-char-3 font-display text-sm font-black text-ember">
                    {String(day.day_order).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl font-black uppercase">{day.day_name}</p>
                    <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">{day.date}</p>
                  </div>

                  <div className="hidden items-center gap-8 font-stat tabular-nums md:flex">
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest text-ash">Kills</p>
                      <p className="mt-1 text-lg font-black">{day.total_kills}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest text-ash">Place pts</p>
                      <p className="mt-1 text-lg font-black">{day.placement_points}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest text-ash">Booyahs</p>
                      <p className="mt-1 text-lg font-black text-amber">{day.booyahs}</p>
                    </div>
                  </div>

                  <div className="text-right font-stat tabular-nums md:hidden">
                    <p className="text-[9px] uppercase tracking-widest text-ash">Kills</p>
                    <p className="mt-1 text-lg font-black">{day.total_kills}</p>
                  </div>

                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center border border-bone/15 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="pb-7 md:pl-[74px]">
                    <div className="mb-5 grid grid-cols-2 border-l border-t border-bone/10 font-stat tabular-nums md:hidden">
                      <div className="border-b border-r border-bone/10 p-4">
                        <p className="text-[9px] uppercase tracking-widest text-ash">Place pts</p>
                        <p className="mt-1 text-xl font-black">{day.placement_points}</p>
                      </div>
                      <div className="border-b border-r border-bone/10 p-4">
                        <p className="text-[9px] uppercase tracking-widest text-ash">First bloods</p>
                        <p className="mt-1 text-xl font-black">{day.first_bloods}</p>
                      </div>
                      <div className="border-b border-r border-bone/10 p-4">
                        <p className="text-[9px] uppercase tracking-widest text-ash">Booyahs</p>
                        <p className="mt-1 text-xl font-black text-amber">{day.booyahs}</p>
                      </div>
                      <div className="border-b border-r border-bone/10 p-4">
                        <p className="text-[9px] uppercase tracking-widest text-ash">Rooms</p>
                        <p className="mt-1 text-xl font-black">{day.rooms_played}</p>
                      </div>
                    </div>

                    {day.rooms.length > 0 ? (
                      <PlayerRoomStats rooms={day.rooms} />
                    ) : (
                      <div className="border border-bone/10 px-5 py-8 text-center">
                        <p className="font-stat text-xs uppercase tracking-widest text-ash">No room data available</p>
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