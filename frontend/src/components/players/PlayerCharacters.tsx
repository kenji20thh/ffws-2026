"use client";

import { useState } from "react";
import { characterImageSrc, characterLabel } from "@/lib/characters";
import type { PlayerCharacter } from "@/types";

function CharacterImage({ character, large }: { character: string; large?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={`flex h-full w-full items-center justify-center font-black uppercase text-white/10 ${
          large ? "text-8xl" : "text-5xl"
        }`}
      >
        {character.charAt(0)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={characterImageSrc(character)}
      alt={characterLabel(character)}
      onError={() => setFailed(true)}
      className="h-full w-full object-contain object-bottom drop-shadow-[0_10px_22px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105"
    />
  );
}

function NameRibbon({ name, main }: { name: string; main?: boolean }) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 flex items-center justify-center px-3 py-1.5 text-center font-black uppercase tracking-[0.08em] ${
        main
          ? "bg-[#f5c542] py-2 text-sm text-[#0b0c0e] sm:text-base"
          : "bg-[#35a6d9] text-[0.6875rem] text-white sm:text-xs"
      }`}
      style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
    >
      <span className="truncate">{characterLabel(name)}</span>
    </div>
  );
}

/**
 * The player's most-used characters: slot 1 (the main) big on the left, the other
 * four (slots 2-5) in a 2x2 grid on the right.
 */
export default function PlayerCharacters({ characters }: { characters: PlayerCharacter[] }) {
  const sorted = [...characters].sort((a, b) => a.slot - b.slot).slice(0, 5);
  if (sorted.length === 0) return null;

  const [main, ...others] = sorted;

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

      <div className="relative mx-auto max-w-[90rem] px-5 py-12 sm:px-8 md:px-10 md:py-16 lg:px-16">
        <div className="mb-8 border-b border-white/[0.09] pb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-[0.125rem] w-6 bg-[#f5c542]" />
            <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.28em] text-[#f5c542]">
              Loadout
            </p>
          </div>

          <h2 className="text-3xl font-black uppercase leading-none tracking-[-0.055em] sm:text-4xl md:text-5xl">
            Most used <span className="text-white/35">characters</span>
          </h2>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-[1.15fr_1fr]">
          {/* Main character */}
          <article className="group relative h-[18rem] overflow-hidden border border-[#f5c542]/25 bg-gradient-to-b from-[#2a1c4a] to-[#14101f] sm:h-[26rem]">
            <div className="absolute left-0 top-0 h-[0.125rem] w-full bg-gradient-to-r from-[#f5c542] via-[#f5c542]/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-9 top-3 px-4 sm:bottom-10">
              <CharacterImage character={main.character} large />
            </div>
            <NameRibbon name={main.character} main />
          </article>

          {/* The other characters */}
          {others.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {others.map((c) => (
                <article
                  key={c.slot}
                  className="group relative h-[11rem] overflow-hidden border border-white/[0.1] bg-gradient-to-b from-[#241a3d] to-[#13101d] sm:h-[12.5rem]"
                >
                  <div className="absolute inset-x-0 bottom-7 top-2 px-2">
                    <CharacterImage character={c.character} />
                  </div>
                  <NameRibbon name={c.character} />
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
