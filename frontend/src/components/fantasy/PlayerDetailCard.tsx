"use client";

import { useEffect, useState, type ReactNode } from "react";
import Monogram from "@/components/ui/Monogram";
import Skeleton from "@/components/ui/Skeleton";
import { getPlayerProfile } from "@/lib/api";
import { countryFlag } from "@/lib/flags";
import { fantasyRoomPoints } from "@/lib/scoring";
import type { PlayerProfile, PoolPlayer } from "@/types";

interface Props {
  option: PoolPlayer;
  onClose: () => void;
  action: { label: string; disabled: boolean; hint?: string; onClick: () => void };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="chamfer-sm border border-bone/10 bg-char-3 px-3 py-2">
      <p className="font-stat text-[9px] uppercase tracking-widest text-ash">{label}</p>
      <p className="font-stat text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h4 className="mb-2 font-display text-lg font-extrabold uppercase text-ember">{children}</h4>;
}

export default function PlayerDetailCard({ option, onClose, action }: Props) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProfile(null);
    getPlayerProfile(option.player_id)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load player stats");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [option.player_id]);

  const days = [...(profile?.days ?? [])].sort((a, b) => a.day_order - b.day_order);
  const rooms = days.flatMap((d) => d.rooms ?? []);
  const roomPoints = rooms.map(fantasyRoomPoints);
  const totalPts = roomPoints.reduce((s, n) => s + n, 0);
  const avgPts = rooms.length > 0 ? totalPts / rooms.length : 0;
  const bestPts = roomPoints.length > 0 ? Math.max(...roomPoints) : 0;
  const overall = profile?.overall;

  return (
    <div className="chamfer border border-bone/15 bg-char-2 p-5">
      <div className="flex items-start gap-4">
        <Monogram label={option.ign} imageUrl={option.photo_url} size={72} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-3xl font-black uppercase leading-none">{option.ign}</p>
          {profile?.player.real_name && (
            <p className="mt-1 truncate font-stat text-xs text-bone/70">{profile.player.real_name}</p>
          )}
          <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">
            {option.role} · {option.team_name} · {countryFlag(option.country)} {option.country}
          </p>
          <p className="mt-1 font-stat text-lg font-bold tabular-nums text-ember">${option.fantasy_price}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center border border-bone/20 font-stat text-lg leading-none text-bone hover:border-ember hover:text-ember"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        disabled={action.disabled}
        title={action.hint}
        onClick={action.onClick}
        className="chamfer-sm mt-4 w-full border border-ember bg-ember px-4 py-2 font-display text-lg font-bold uppercase tracking-wider text-char transition-colors hover:bg-transparent hover:text-ember disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ember disabled:hover:text-char"
      >
        {action.label}
      </button>
      {action.disabled && action.hint && (
        <p className="mt-1 text-center font-stat text-[10px] uppercase tracking-widest text-ash">{action.hint}</p>
      )}

      <div className="mt-5 space-y-5">
        {loading ? (
          <Skeleton className="h-48" />
        ) : error ? (
          <p className="font-stat text-xs text-danger">{error}</p>
        ) : overall ? (
          <>
            <section>
              <Heading>Stats</Heading>
              {overall.rooms_played === 0 ? (
                <p className="font-stat text-xs uppercase tracking-widest text-ash">No matches played yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Rooms" value={String(overall.rooms_played)} />
                  <Stat label="Kills" value={String(overall.total_kills)} />
                  <Stat label="Kills / room" value={overall.kills_per_room.toFixed(2)} />
                  <Stat label="Avg place" value={overall.average_placement.toFixed(2)} />
                  <Stat label="Booyahs" value={String(overall.booyahs)} />
                  <Stat label="First bloods" value={String(overall.first_bloods)} />
                </div>
              )}
            </section>

            <section>
              <Heading>Fantasy</Heading>
              {rooms.length === 0 ? (
                <p className="font-stat text-xs uppercase tracking-widest text-ash">No fantasy points yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Total pts" value={String(totalPts)} />
                  <Stat label="Avg / room" value={avgPts.toFixed(1)} />
                  <Stat label="Best room" value={String(bestPts)} />
                </div>
              )}
            </section>

            <section>
              <Heading>History</Heading>
              {days.length === 0 ? (
                <p className="font-stat text-xs uppercase tracking-widest text-ash">Nothing to show yet</p>
              ) : (
                <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                  {days.map((d) => {
                    const dayRooms = d.rooms ?? [];
                    const dayPts = dayRooms.reduce((s, r) => s + fantasyRoomPoints(r), 0);
                    return (
                      <div key={d.day_id}>
                        <div className="flex items-center justify-between border-b border-bone/10 pb-1 font-stat text-[10px] uppercase tracking-widest">
                          <span className="text-bone">{d.day_name}</span>
                          <span className="text-ember">{dayPts} pts</span>
                        </div>
                        {dayRooms.map((r) => (
                          <div
                            key={r.room_id}
                            className="flex items-center justify-between gap-2 py-1 font-stat text-xs tabular-nums text-bone/70"
                          >
                            <span className="truncate">
                              R{r.room_number}
                              {r.map_name ? ` · ${r.map_name}` : ""}
                            </span>
                            <span className="shrink-0">
                              #{r.placement} · {r.kills}k{r.first_blood ? " · FB" : ""} ={" "}
                              <span className="text-ember">{fantasyRoomPoints(r)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
