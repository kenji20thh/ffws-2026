"use client";

import Link from "next/link";
import type { FantasyLeague } from "@/types";

function LeagueCard({ league }: { league: FantasyLeague }) {
  const isPrivate = league.type === "private";

  return (
    <li className="min-w-0">
      <Link
        href={`/fantasy/leagues/${encodeURIComponent(league.slug)}`}
        className="group relative flex aspect-square flex-col justify-between overflow-hidden border border-bone/10 bg-char-2 p-4 transition-all duration-300 hover:border-ember/70 hover:bg-char-3 sm:p-5 lg:p-6"
      >
        {/* Decorative background */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -top-7 select-none font-display text-[8rem] font-black leading-none text-bone/[0.025] transition-all duration-300 group-hover:scale-110 group-hover:text-ember/[0.07] sm:text-[10rem]"
        >
          {isPrivate ? "P" : league.type === "global" ? "G" : "R"}
        </span>

        {/* Top section */}
        <div className="relative z-10 flex items-start justify-between gap-2">
          <span
            className={`h-1 w-8 transition-all duration-300 group-hover:w-12 ${
              isPrivate ? "bg-bone/40" : "bg-ember"
            }`}
          />

          {isPrivate && (
            <span
              className="flex h-7 w-7 items-center justify-center border border-bone/15 text-bone/60"
              aria-label="Private league"
              title="Private league"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-3.5 w-3.5"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <rect x="5" y="10" width="14" height="11" rx="1" />
                <path
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          )}
        </div>

        {/* League identity */}
        <div className="relative z-10 min-w-0">
          <p className="mb-2 font-stat text-[9px] uppercase tracking-[0.2em] text-ash sm:text-[10px]">
            {isPrivate
              ? "Private competition"
              : league.type === "global"
                ? "Worldwide"
                : "Regional competition"}
          </p>

          <h3 className="break-words font-display text-2xl font-black uppercase leading-[0.95] tracking-tight text-bone transition-colors duration-200 group-hover:text-ember sm:text-3xl lg:text-4xl">
            {league.name}
          </h3>
        </div>

        {/* Bottom section */}
        <div className="relative z-10 flex items-end justify-between gap-2 border-t border-bone/10 pt-3 sm:pt-4">
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold leading-none tabular-nums text-bone sm:text-3xl">
              {league.teams}
            </p>
            <p className="mt-1 font-stat text-[9px] uppercase tracking-[0.15em] text-ash sm:text-[10px]">
              {league.teams === 1 ? "Player" : "Players"}
            </p>
          </div>

          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-bone/10 text-lg text-bone/50 transition-all duration-200 group-hover:border-ember group-hover:bg-ember group-hover:text-char"
          >
            ↗
          </span>
        </div>

        {/* Hover accent */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] w-0 bg-ember transition-all duration-300 group-hover:w-full"
        />
      </Link>
    </li>
  );
}

function Section({
  title,
  empty,
  leagues,
}: {
  title: string;
  empty: string;
  leagues: FantasyLeague[];
}) {
  return (
    <section aria-label={title}>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="shrink-0 font-stat text-[10px] font-bold uppercase tracking-[0.22em] text-ember sm:text-xs sm:tracking-[0.28em]">
          {title}
        </h2>

        <span className="h-px flex-1 bg-bone/10" />

        <span className="font-stat text-[10px] tabular-nums text-ash">
          {String(leagues.length).padStart(2, "0")}
        </span>
      </div>

      {leagues.length === 0 ? (
        <p className="border border-dashed border-bone/15 px-4 py-5 font-stat text-xs text-ash">
          {empty}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {leagues.map((league) => (
            <LeagueCard key={league.slug} league={league} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function LeagueOverview({
  leagues,
}: {
  leagues: FantasyLeague[];
}) {
  const general = leagues.filter((league) => league.type !== "private");
  const priv = leagues.filter((league) => league.type === "private");

  return (
    <div className="space-y-8">
      <Section
        title="General leagues"
        empty="No general leagues yet."
        leagues={general}
      />

      <Section
        title="Private leagues"
        empty="You haven't joined a private league yet. Create or join one below."
        leagues={priv}
      />
    </div>
  );
}