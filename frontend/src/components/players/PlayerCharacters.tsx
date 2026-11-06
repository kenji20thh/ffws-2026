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
      className="h-full w-full object-contain object-bottom drop-shadow-[0_8px_15px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-105"
    />
  );
}

function NameRibbon({
  name,
  variant,
}: {
  name: string;
  variant?: "main" | "blue" | "red";
}) {
  let bgColor = "bg-[#35a6d9] text-white";
  if (variant === "main") {
    bgColor = "bg-[#f5c542] text-[#16101f]";
  } else if (variant === "red") {
    bgColor = "bg-[#e24a4a] text-white";
  }

  return (
    <div
      className={`absolute -bottom-1 inset-x-2 z-10 flex items-center justify-center py-1 px-3 text-center font-black uppercase tracking-wider drop-shadow-md ${bgColor} ${
        variant === "main" ? "text-xs sm:text-sm py-1.5" : "text-[9px] sm:text-[10px]"
      }`}
      style={{
        clipPath:
          "polygon(0% 15%, 5% 0%, 95% 0%, 100% 15%, 100% 85%, 95% 100%, 8% 100%, 0% 80%)",
      }}
    >
      <span className="truncate">{characterLabel(name)}</span>
    </div>
  );
}

function CharacterCard({
  character,
  large,
  variant = "blue",
}: {
  character: string;
  large?: boolean;
  variant?: "main" | "blue" | "red";
}) {
  return (
    <article className="group relative h-full w-full">
      {/* Torn paper / spiked frame effect using polygon clip-path */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#3a2063] via-[#24133d] to-[#120822] p-1 border-2 border-[#8c5ce7]/60 shadow-xl"
        style={{
          clipPath:
            "polygon(0% 4%, 3% 0%, 8% 3%, 15% 0%, 90% 0%, 97% 3%, 100% 2%, 100% 96%, 97% 100%, 92% 97%, 85% 100%, 10% 100%, 3% 97%, 0% 98%)",
        }}
      >
        {/* Inner background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#5e389c]/40 via-transparent to-transparent pointer-events-none" />

        {/* Character Image container */}
        <div className="absolute inset-x-2 bottom-6 top-2">
          <CharacterImage character={character} large={large} />
        </div>
      </div>

      <NameRibbon name={character} variant={variant} />
    </article>
  );
}

export default function PlayerCharacters({
  characters,
  embedded = false,
}: {
  characters: PlayerCharacter[];
  /** Render without its own section wrapper so it can sit beside other content. */
  embedded?: boolean;
}) {
  const sorted = [...characters]
    .sort((a, b) => a.slot - b.slot)
    .slice(0, 5);

  if (!sorted.length) return null;

  const [main, ...others] = sorted;

  if (embedded) {
    return (
      <div className="w-full">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-[0.125rem] w-6 bg-[#8c5ce7]" />
          <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.22em] text-[#b99bf5]">
            Characters
          </p>
        </div>
        <div className="grid grid-cols-2 items-center gap-2 sm:gap-3">
          <div className="aspect-[3/4] w-full">
            <CharacterCard character={main.character} large variant="main" />
          </div>
          <div className="grid aspect-[3/4] w-full grid-cols-2 grid-rows-2 gap-2">
            {others.map((c, index) => (
              <div key={c.slot} className="h-full w-full">
                <CharacterCard
                  character={c.character}
                  variant={index === 3 ? "red" : "blue"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#120c20] text-white py-6">
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 20%, rgba(120,50,200,0.3), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        {/* Showcase layout matching reference */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 items-center">
          {/* Main character on the left */}
          <div className="aspect-[3/4] w-full">
            <CharacterCard character={main.character} large variant="main" />
          </div>

          {/* 2x2 grid on the right */}
          <div className="grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-3.5 aspect-[3/4] w-full">
            {others.map((c, index) => {
              // Give the last item a red ribbon variant to match the reference style if desired
              const cardVariant = index === 3 ? "red" : "blue";
              return (
                <div key={c.slot} className="h-full w-full">
                  <CharacterCard character={c.character} variant={cardVariant} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}