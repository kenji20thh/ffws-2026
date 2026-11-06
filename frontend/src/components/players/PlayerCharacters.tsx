
"use client";

import { useState } from "react";
import { characterImageSrc, characterLabel } from "@/lib/characters";
import type { PlayerCharacter } from "@/types";

function CharacterImage({
  character,
  large,
}: {
  character: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={`flex h-full w-full items-center justify-center font-black uppercase text-white/20 ${
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
      className="h-full w-full object-contain object-bottom drop-shadow-[0_8px_15px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-105"
    />
  );
}

function NameRibbon({
  name,
  main,
}: {
  name: string;
  main?: boolean;
}) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-10 flex items-center justify-center px-2 text-center font-black uppercase tracking-wide ${
        main
          ? "h-8 bg-[#f5c542] text-xs text-[#16101f] sm:h-9 sm:text-sm"
          : "h-6 bg-[#35a6d9] text-[9px] text-white sm:h-7 sm:text-[10px]"
      }`}
      style={{
        clipPath: "polygon(0 0, 100% 0, 96% 100%, 4% 100%)",
      }}
    >
      <span className="truncate">{characterLabel(name)}</span>
    </div>
  );
}

function CharacterCard({
  character,
  large,
}: {
  character: string;
  large?: boolean;
}) {
  return (
    <article
      className={`group relative overflow-hidden border border-[#8c5ce7]/50 bg-gradient-to-b from-[#38215e] via-[#25153f] to-[#140d24] ${
        large ? "h-full" : "h-full"
      }`}
    >
      {/* Purple frame */}
      <div className="absolute inset-0 border-[3px] border-[#6c42b5]/30" />

      {/* Top glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b78aff] to-transparent" />

      {/* Character */}
      <div className="absolute inset-x-0 bottom-6 top-1 px-1 sm:bottom-7 sm:px-2">
        <CharacterImage character={character} large={large} />
      </div>

      <NameRibbon name={character} main={large} />
    </article>
  );
}

/**
 * Main character on the left.
 * Four remaining characters in a 2x2 grid on the right.
 */
export default function PlayerCharacters({
  characters,
}: {
  characters: PlayerCharacter[];
}) {
  const sorted = [...characters]
    .sort((a, b) => a.slot - b.slot)
    .slice(0, 5);

  if (!sorted.length) return null;

  const [main, ...others] = sorted;

  return (
    <section className="relative overflow-hidden bg-[#120c20] text-white">
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 0%, rgba(111,55,190,0.2), transparent 65%), linear-gradient(135deg, rgba(255,255,255,0.02), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="h-8 w-1 bg-[#a66bff]" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a66bff]">
              Character collection
            </p>
            <h2 className="text-xl font-black uppercase tracking-tight sm:text-2xl">
              Most used characters
            </h2>
          </div>
        </div>

        {/* Showcase layout */}
        <div className="grid grid-cols-[1fr_1fr] gap-2 sm:gap-4">
          {/* Main character */}
          <div className="aspect-[3/4] min-h-0">
            <CharacterCard character={main.character} large />
          </div>

          {/* Other characters */}
          <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-4">
            {others.map((c) => (
              <div key={c.slot} className="aspect-[3/4] min-h-0">
                <CharacterCard character={c.character} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
