"use client";

import Link from "next/link";
import type { FantasyLeague } from "@/types";

export type LeagueStanding =
  | { status: "ok"; rank: number; total: number; points: number }
  | { status: "error" };

export function topPercent(rank: number, total: number): number {
  if (total <= 0) return 100;
  return Math.min(100, Math.max(1, Math.ceil((rank / total) * 100)));
}

function Standing({
  standing,
  teams,
}: {
  standing: LeagueStanding | undefined;
  teams: number;
}) {
  if (!standing) {
    return (
      <div className="mt-4 animate-pulse space-y-2">
        <div className="h-7 w-20 bg-bone/10" />
        <div className="h-3 w-16 bg-bone/10" />
      </div>
    );
  }

  if (standing.status === "error") {
    return (
      <div className="mt-4">
        <p className="font-display text-2xl font-black leading-none text-ash">
          —
        </p>
        <p className="mt-1 font-stat text-[9px] uppercase tracking-widest text-ash">
          Unavailable
        </p>
      </div>
    );
  }

  if (standing.total < 2) {
    return (
      <div className="mt-4">
        <p className="font-display text-2xl font-black uppercase leading-none text-bone">
          Solo
        </p>
        <p className="mt-1 font-stat text-[9px] uppercase tracking-widest text-ash">
          #{standing.rank} of {standing.total || teams}
        </p>
      </div>
    );
  }

  const pct = topPercent(standing.rank, standing.total);

  return (
    <div className="mt-4">
      <p
        className={`font-display text-3xl font-black uppercase leading-none tabular-nums ${
          pct <= 10 ? "text-ember" : "text-bone"
        }`}
      >
        Top {pct}%
      </p>
      <p className="mt-1 font-stat text-[9px] uppercase tracking-widest text-ash">
        #{standing.rank} of {standing.total}
      </p>
    </div>
  );
}

function LeagueCard({
  league,
  active,
  standing,
  onSelect,
}: {
  league: FantasyLeague;
  active: boolean;
  standing: LeagueStanding | undefined;
  onSelect: () => void;
}) {
  const isPrivate = league.type === "private";

  return (
    <li className="min-w-0">
      <div
        className={`group relative flex aspect-square flex-col overflow-hidden border transition-all duration-300 ${
          active
            ? "border-ember bg-ember/[0.08]"
            : "border-bone/10 bg-char-2 hover:border-ember/60 hover:bg-char-3"
        }`}
      >
        <button
          type="button"
          aria-pressed={active}
          onClick={onSelect}
          className="relative flex min-h-0 flex-1 flex-col items-start overflow-hidden p-4 text-left sm:p-5"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-3 -top-5 select-none font-display text-[7rem] font-black leading-none text-bone/[0.025] transition-colors group-hover:text-ember/[0.06] sm:text-[8rem]"
          >
            {isPrivate ? "P" : league.type === "global" ? "G" : "R"}
          </span>

          <span className="relative z-10 flex w-full items-center justify-between gap-2">
            <span
              className={`h-1 w-8 transition-all duration-300 group-hover:w-12 ${
                active ? "bg-ember" : "bg-bone/20 group-hover:bg-ember"
              }`}
            />
            {isPrivate && (
              <span className="text-sm" role="img" aria-label="Private league">
                🔒
              </span>
            )}
          </span>

          <div className="relative z-10 mt-5 min-w-0 w-full">
            <p className="mb-2 font-stat text-[9px] uppercase tracking-[0.16em] text-ash">
              {isPrivate
                ? "Private competition"
                : league.type === "global"
                  ? "Worldwide"
                  : "Regional competition"}
            </p>

            <h3 className="break-words font-display text-xl font-black uppercase leading-[0.98] tracking-tight text-bone transition-colors group-hover:text-ember sm:text-2xl">
              {league.name}
            </h3>
          </div>

          <div className="relative z-10 mt-auto w-full">
            <Standing standing={standing} teams={league.teams} />
          </div>
        </button>

        <div className="relative z-10 flex items-center justify-between border-t border-bone/10 px-4 py-3 sm:px-5">
          <div>
            <p className="font-display text-lg font-bold leading-none tabular-nums text-bone">
              {league.teams}
            </p>
            <p className="mt-1 font-stat text-[9px] uppercase tracking-widest text-ash">
              {league.teams === 1 ? "Player" : "Players"}
            </p>
          </div>

          <Link
            href={`/fantasy/leagues/${encodeURIComponent(league.slug)}`}
            aria-label={`Open the ${league.name} league page`}
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-bone/10 text-lg text-bone/60 transition-colors hover:border-ember hover:bg-ember hover:text-char"
          >
            ↗
          </Link>
        </div>

        <span
          aria-hidden="true"
          className={`absolute bottom-0 left-0 h-[2px] bg-ember transition-all duration-300 ${
            active ? "w-full" : "w-0 group-hover:w-full"
          }`}
        />
      </div>
    </li>
  );
}

function Section({
  title,
  empty,
  leagues,
  active,
  standings,
  onSelect,
}: {
  title: string;
  empty: string;
  leagues: FantasyLeague[];
  active: string;
  standings: Record<string, LeagueStanding>;
  onSelect: (slug: string) => void;
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
            <LeagueCard
              key={league.slug}
              league={league}
              active={league.slug === active}
              standing={standings[league.slug]}
              onSelect={() => onSelect(league.slug)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function LeagueOverview({
  leagues,
  active,
  standings,
  onSelect,
}: {
  leagues: FantasyLeague[];
  active: string;
  standings: Record<string, LeagueStanding>;
  onSelect: (slug: string) => void;
}) {
  const general = leagues.filter((league) => league.type !== "private");
  const priv = leagues.filter((league) => league.type === "private");

  return (
    <div className="space-y-8">
      <Section
        title="General leagues"
        empty="No general leagues yet."
        leagues={general}
        active={active}
        standings={standings}
        onSelect={onSelect}
      />

      <Section
        title="Private leagues"
        empty="You haven't joined a private league yet. Create or join one below."
        leagues={priv}
        active={active}
        standings={standings}
        onSelect={onSelect}
      />
    </div>
  );
}