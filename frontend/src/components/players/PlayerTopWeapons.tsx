"use client";

import { useState, type ReactNode } from "react";
import type { PlayerWeaponStat } from "@/types";

function weaponImageSrc(url: string): string | undefined {
  const u = url.trim();
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u) || u.startsWith("/")) return u;
  return `/weapons/${u}`;
}

function WeaponImage({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const src = weaponImageSrc(url);

  if (!src || failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className="h-full w-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-110"
    />
  );
}

function HeadshotIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="h-7 w-7"
    >
      <circle cx="24" cy="24" r="13" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M24 3v9M24 36v9M3 24h9M36 24h9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="m29 19 7-7m-3 0h3v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path
        d="M8 21h8m-4-4v4m-5-18h10v5a5 5 0 0 1-10 0V3ZM7 6H3v2a5 5 0 0 0 5 5m9-7h4v2a5 5 0 0 1-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WeaponRank({ rank }: { rank: number }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center border text-sm font-black ${
        rank === 1
          ? "border-[#f5c542]/50 bg-[#f5c542]/15 text-[#f5c542]"
          : "border-white/10 bg-white/[0.04] text-white/55"
      }`}
    >
      {String(rank).padStart(2, "0")}
    </div>
  );
}

export default function PlayerTopWeapons({
  weapons,
  headshotKills = 0,
  sideContent,
}: {
  weapons: PlayerWeaponStat[];
  headshotKills?: number;
  /** Rendered to the left of the weapons list (e.g. the characters showcase). */
  sideContent?: ReactNode;
}) {
  if (weapons.length === 0 && headshotKills <= 0 && !sideContent) return null;

  const topWeapons = [...weapons]
    .sort((a, b) => b.kills - a.kills)
    .slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-[#0b0c0e] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "2.25rem 2.25rem",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-[#f5c542]/[0.045] blur-[6.25rem]"
      />

      <div className="relative mx-auto max-w-[90rem] px-5 py-12 sm:px-8 md:px-10 md:py-16 lg:px-16">
        {/* Section heading */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-white/[0.09] pb-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-[0.125rem] w-6 bg-[#f5c542]" />
              <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.28em] text-[#f5c542]">
                Combat analytics
              </p>
            </div>

            <h2 className="text-3xl font-black uppercase leading-none tracking-[-0.055em] sm:text-4xl md:text-5xl">
              Arsenal <span className="text-white/35">&</span> Precision
            </h2>

            <p className="mt-3 max-w-lg text-xs leading-5 text-white/40 sm:text-sm">
              Headshot eliminations and the weapons defining this player&apos;s
              performance.
            </p>
          </div>

          <div className="flex items-center gap-2 border border-white/[0.09] bg-white/[0.025] px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f5c542]" />
            <span className="text-[0.5625rem] font-bold uppercase tracking-[0.18em] text-white/45">
              Player statistics
            </span>
          </div>
        </div>

        {/* Headshot statistics — preserved */}
        {headshotKills > 0 && (
          <div className="mb-10">
            <div className="group relative overflow-hidden border border-[#f5c542]/20 bg-gradient-to-br from-[#211d10] via-[#15140f] to-[#101113] p-5 sm:p-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full border border-[#f5c542]/[0.07] transition-transform duration-500 group-hover:scale-110"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-8 h-40 w-40 rounded-full border border-[#f5c542]/[0.08]"
              />

              <div className="relative flex items-center gap-5 sm:gap-7">
                <div className="relative flex h-[5.75rem] w-[5.75rem] shrink-0 items-center justify-center border border-[#f5c542]/30 bg-[#f5c542]/[0.08] text-[#f5c542] sm:h-28 sm:w-28">
                  <div className="absolute inset-2 border border-[#f5c542]/10" />
                  <HeadshotIcon />

                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center border border-[#0b0c0e] bg-[#f5c542] text-[#0b0c0e]">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className="h-4 w-4"
                    >
                      <path
                        d="m4 10 4 4 8-8"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.22em] text-[#f5c542]/70">
                    Precision kills
                  </p>

                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-5xl font-black leading-none tracking-[-0.07em] text-white sm:text-6xl">
                      {headshotKills.toLocaleString()}
                    </span>

                    <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-white/35">
                      Headshot kills
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-white/45">
                    Confirmed headshot eliminations
                  </p>
                </div>
              </div>

              <div className="relative mt-7 border-t border-white/[0.08] pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.5625rem] font-bold uppercase tracking-[0.18em] text-white/35">
                    Headshot kill count
                  </span>

                  <span className="text-[0.5625rem] font-bold uppercase tracking-[0.15em] text-[#f5c542]">
                    Recorded stats
                  </span>
                </div>

                <div className="mt-3 flex h-1.5 gap-1 overflow-hidden">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <span
                      key={i}
                      className={`flex-1 ${
                        i < Math.min(20, Math.ceil(headshotKills / 5))
                          ? "bg-[#f5c542]"
                          : "bg-white/[0.08]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top weapons — directly follows headshot stats */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-[#f5c542]/75">
              Weapon leaderboard
            </p>

            <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.045em] sm:text-3xl">
              Top Weapons
            </h3>
          </div>

          <p className="text-[0.5625rem] font-bold uppercase tracking-[0.15em] text-white/30">
            Ranked by kills
          </p>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-10">
          {sideContent ? <div>{sideContent}</div> : null}

          <div className={sideContent ? "" : "lg:col-span-2"}>
            {topWeapons.length === 0 ? (
              <div className="border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center">
                <p className="text-sm font-bold text-white/60">
                  No weapon stats yet
                </p>

                <p className="mt-2 text-xs text-white/30">
                  Weapon analytics will appear when match statistics are
                  recorded.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {topWeapons.map((weapon, index) => {
                  const rank = index + 1;
                  const isFirst = rank === 1;
                  const percentage = Math.min(
                    100,
                    Math.max(0, Number(weapon.percentage) || 0)
                  );
                  // staircase: 1st pushed furthest right, 3rd flush left
                  const offset = [
                    "ml-8 sm:ml-16 lg:ml-24",
                    "ml-4 sm:ml-8 lg:ml-12",
                    "ml-0",
                  ][index];

                  return (
                    <article
                      key={weapon.weapon_id}
                      className={`group relative overflow-hidden border transition-colors duration-300 ${offset} ${
                        isFirst
                          ? "border-[#f5c542]/25 bg-gradient-to-r from-[#201c10] to-[#111214]"
                          : "border-white/[0.08] bg-[#111316] hover:border-white/20"
                      }`}
                    >
                      {isFirst && (
                        <div className="absolute left-0 top-0 h-[0.125rem] w-full bg-gradient-to-r from-[#f5c542] via-[#f5c542]/50 to-transparent" />
                      )}

                      <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                        <WeaponRank rank={rank} />

                        <div className="flex h-20 w-28 shrink-0 items-center justify-center sm:w-36">
                          <WeaponImage url={weapon.image_url} name={weapon.name} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-[0.5625rem] font-extrabold uppercase tracking-[0.2em] ${
                                isFirst ? "text-[#f5c542]" : "text-white/35"
                              }`}
                            >
                              {isFirst ? "Most lethal" : `Rank ${rank}`}
                              {weapon.category ? ` · ${weapon.category}` : ""}
                            </p>
                            {isFirst && (
                              <span className="text-[#f5c542]">
                                <TrophyIcon />
                              </span>
                            )}
                          </div>

                          <h4 className="mt-1 truncate text-lg font-black uppercase tracking-[-0.035em] sm:text-xl">
                            {weapon.name}
                          </h4>

                          <div className="mt-2 flex items-end justify-between gap-3">
                            <p
                              className={`text-2xl font-black leading-none tracking-[-0.05em] sm:text-3xl ${
                                isFirst ? "text-[#f5c542]" : "text-white"
                              }`}
                            >
                              {weapon.kills.toLocaleString()}
                              <span className="ml-1 text-[0.5625rem] font-bold uppercase tracking-[0.15em] text-white/35">
                                kills
                              </span>
                            </p>
                            <p className="text-sm font-black text-white/70">
                              {weapon.percentage.toFixed(1)}%
                            </p>
                          </div>

                          <div
                            className="mt-2 h-1.5 overflow-hidden bg-white/[0.07]"
                            role="progressbar"
                            aria-label={`${weapon.name} kill share`}
                            aria-valuenow={percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className={`h-full transition-[width] duration-700 ease-out ${
                                isFirst
                                  ? "bg-gradient-to-r from-[#c99c22] to-[#ffe58a]"
                                  : "bg-gradient-to-r from-white/35 to-white/70"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}