"use client";

import Link from "next/link";
import type { FantasyLeague } from "@/types";

function LeagueCard({
  league,
  active,
  onSelect,
}: {
  league: FantasyLeague;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li
      className={`group relative flex min-h-[170px] flex-col justify-between overflow-hidden border transition-all duration-200 sm:min-h-[190px] ${
        active
          ? "border-ember bg-ember/[0.09] shadow-[inset_0_0_0_1px_rgba(255,90,31,0.15)]"
          : "border-bone/10 bg-char-2 hover:border-bone/30 hover:bg-char-3"
      }`}
    >
      <button
        type="button"
        aria-pressed={active}
        onClick={onSelect}
        className="flex min-h-0 flex-1 flex-col items-start p-4 text-left sm:p-5"
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span
            className={`h-1 w-8 transition-all duration-200 ${
              active ? "bg-ember" : "bg-bone/20 group-hover:bg-ember/70"
            }`}
          />
          {league.type === "private" && (
            <span
              role="img"
              aria-label="Private league"
              className="text-sm text-ash"
            >
              🔒
            </span>
          )}
        </span>

        <span className="mt-6 line-clamp-3 break-words font-display text-xl font-black uppercase leading-tight text-bone sm:text-2xl">
          {league.name}
        </span>

        <span className="mt-3 font-stat text-[10px] uppercase tracking-[0.16em] text-ash sm:text-[11px]">
          {league.teams} {league.teams === 1 ? "player" : "players"}
        </span>
      </button>

      <div className="flex items-center justify-between border-t border-bone/[0.08] px-4 py-3 sm:px-5">
        <span
          className={`font-stat text-[9px] uppercase tracking-[0.2em] ${
            active ? "text-ember" : "text-ash"
          }`}
        >
          {active ? "Selected" : league.type === "private" ? "Private" : "League"}
        </span>

        <Link
          href={`/fantasy/leagues/${encodeURIComponent(league.slug)}`}
          aria-label={`Open the ${league.name} league page`}
          className="flex h-8 w-8 items-center justify-center border border-bone/10 text-lg text-ash transition-colors hover:border-ember hover:bg-ember hover:text-char"
        >
          →
        </Link>
      </div>
    </li>
  );
}

function Section({
  title,
  empty,
  leagues,
  active,
  onSelect,
}: {
  title: string;
  empty: string;
  leagues: FantasyLeague[];
  active: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <section aria-label={title}>
      <h2 className="mb-4 flex items-center gap-3 font-stat text-[10px] uppercase tracking-[0.25em] text-ember sm:text-[11px] sm:tracking-[0.3em]">
        {title}
        <span className="h-px flex-1 bg-bone/15" />
        <span className="text-ash">{leagues.length}</span>
      </h2>

      {leagues.length === 0 ? (
        <p className="border border-dashed border-bone/15 px-4 py-5 font-stat text-xs text-ash">
          {empty}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {leagues.map((league) => (
            <LeagueCard
              key={league.slug}
              league={league}
              active={league.slug === active}
              onSelect={() => onSelect(league.slug)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Displays all leagues in a compact card grid, separated by league type. */
export default function LeagueOverview({
  leagues,
  active,
  onSelect,
}: {
  leagues: FantasyLeague[];
  active: string;
  standings: Record<string, unknown>;
  onSelect: (slug: string) => void;
}) {
  const general = leagues.filter((league) => league.type !== "private");
  const priv = leagues.filter((league) => league.type === "private");

  return (
    <div className="space-y-7">
      <Section
        title="General leagues"
        empty="No general leagues yet."
        leagues={general}
        active={active}
        onSelect={onSelect}
      />

      <Section
        title="Private leagues"
        empty="You haven't joined a private league yet. Create or join one below."
        leagues={priv}
        active={active}
        onSelect={onSelect}
      />
    </div>
  );
}