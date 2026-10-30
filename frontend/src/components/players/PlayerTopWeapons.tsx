"use client";

import { useState } from "react";
import type { PlayerWeaponStat } from "@/types";

/**
 * Weapon pictures live in public/weapons. In the database, image_url can be just the
 * file name ("file.png"), the path ("/weapons/file.png") or a full https:// link.
 */
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
      className="h-14 w-24 shrink-0 object-contain"
    />
  );
}

/** The player's top 3 weapons by kills. Renders nothing until weapon kills are entered. */
export default function PlayerTopWeapons({ weapons }: { weapons: PlayerWeaponStat[] }) {
  if (weapons.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#111111] text-white">
      <div className="relative mx-auto max-w-[1440px] px-5 pb-14 md:px-10 md:pb-16 lg:px-16 lg:pb-20">
        <div className="mb-8 border-b border-white/[0.08] pb-5">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
            <span className="h-[2px] w-5 bg-[#f5c542]/60" />
            Arsenal
          </p>
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] md:text-4xl">
            Top Weapons
          </h2>
        </div>

        <div className="grid grid-cols-1 border-l border-t border-white/[0.08] md:grid-cols-3">
          {weapons.map((w, i) => (
            <div
              key={w.weapon_id}
              className="relative border-b border-r border-white/[0.08] px-5 py-6 md:px-6 md:py-7"
            >
              {i === 0 && <div className="absolute left-0 top-0 h-px w-8 bg-[#f5c542]/60" />}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                      i === 0 ? "text-[#f5c542]" : "text-white/30"
                    }`}
                  >
                    Top {i + 1}
                  </p>
                  <p className="mt-2 truncate text-2xl font-black uppercase tracking-[-0.03em] md:text-3xl">
                    {w.name}
                  </p>
                  {w.category && (
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                      {w.category}
                    </p>
                  )}
                </div>

                <WeaponImage url={w.image_url} name={w.name} />
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span
                  className={`font-black leading-none tracking-[-0.05em] ${
                    i === 0 ? "text-5xl text-white" : "text-4xl text-white/85"
                  }`}
                >
                  {w.percentage.toFixed(1)}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/25">
                  of kills
                </span>
              </div>

              <div className="relative mt-4 h-[3px] w-full bg-white/[0.08]">
                <div
                  className="h-full bg-[#f5c542]/60"
                  style={{ width: `${Math.min(Math.max(w.percentage, 0), 100)}%` }}
                />
              </div>

              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">
                {w.kills} {w.kills === 1 ? "kill" : "kills"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
