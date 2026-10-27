import Link from "next/link";
import type { FantasyLeague } from "@/types";

/** Where the player stands in one league (loaded separately from the league list). */
export type LeagueStanding =
  | { status: "ok"; rank: number; total: number; points: number }
  | { status: "error" };

/** Rank 1 of 100 -> 1 ("Top 1%"). Rounded up and never below 1%. */
export function topPercent(rank: number, total: number): number {
  if (total <= 0) return 100;
  return Math.min(100, Math.max(1, Math.ceil((rank / total) * 100)));
}

function Standing({ standing, teams }: { standing: LeagueStanding | undefined; teams: number }) {
  if (!standing) {
    // still loading
    return (
      <div aria-hidden="true" className="flex flex-col items-end gap-2">
        <div className="h-7 w-20 animate-pulse bg-bone/10" />
        <div className="h-3 w-14 animate-pulse bg-bone/10" />
      </div>
    );
  }

  if (standing.status === "error") {
    return (
      <div className="text-right">
        <p className="font-display text-3xl font-black leading-none text-ash">–</p>
        <p className="mt-1 font-stat text-[0.625rem] uppercase tracking-widest text-ash">Unavailable</p>
      </div>
    );
  }

  // Only member: a percentage would just say "Top 100%"
  if (standing.total < 2) {
    return (
      <div className="text-right">
        <p className="font-display text-2xl font-black uppercase leading-none text-bone">Solo</p>
        <p className="mt-1 font-stat text-[0.625rem] uppercase tracking-widest text-ash">
          #{standing.rank} of {standing.total || teams}
        </p>
      </div>
    );
  }

  const pct = topPercent(standing.rank, standing.total);

  return (
    <div className="text-right">
      <p
        className={`font-display text-3xl font-black uppercase leading-none tabular-nums ${
          pct <= 10 ? "text-ember" : "text-bone"
        }`}
      >
        Top {pct}%
      </p>
      <p className="mt-1 font-stat text-[0.625rem] uppercase tracking-widest text-ash">
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
  return (
    <li
      className={`flex items-stretch border transition-colors ${
        active ? "border-ember bg-ember/10" : "border-bone/10 bg-char-2 hover:border-bone/30"
      }`}
    >
      <button
        type="button"
        aria-pressed={active}
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            {league.type === "private" && (
              <span role="img" aria-label="Private league" className="text-base">
                🔒
              </span>
            )}
            <span className="truncate font-display text-2xl font-black uppercase leading-none">
              {league.name}
            </span>
          </span>
          <span className="mt-1 block font-stat text-[0.625rem] uppercase tracking-widest text-ash">
            {league.teams} {league.teams === 1 ? "player" : "players"}
          </span>
        </span>

        <Standing standing={standing} teams={league.teams} />
      </button>

      <Link
        href={`/fantasy/leagues/${encodeURIComponent(league.slug)}`}
        aria-label={`Open the ${league.name} league page`}
        className="flex w-12 shrink-0 items-center justify-center border-l border-bone/10 font-stat text-lg text-ash transition-colors hover:bg-char-3 hover:text-ember"
      >
        →
      </Link>
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
      <h2 className="mb-3 flex items-center gap-3 font-stat text-[0.6875rem] uppercase tracking-[0.3em] text-ember">
        {title}
        <span className="h-px flex-1 bg-bone/15" />
      </h2>

      {leagues.length === 0 ? (
        <p className="border border-dashed border-bone/15 px-5 py-4 font-stat text-xs text-ash">{empty}</p>
      ) : (
        <ul className="space-y-2">
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

/** Every league the player is in, split into general (Global + region) and private. */
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
  const general = leagues.filter((l) => l.type !== "private");
  const priv = leagues.filter((l) => l.type === "private");

  return (
    <div className="space-y-6">
      <Section
        title="General leagues"
        empty="No general league yet."
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
