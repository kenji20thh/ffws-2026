"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Player, Team, TournamentDay } from "@/types";
import { getPlayerLeaderboard } from "@/lib/api";
import { buildDayMenu, resolveSelection } from "@/lib/dayMenu";
import { roleIcon, roleLabel } from "@/lib/roles";
import Flag from "@/components/ui/Flag";
import MatchdayMenu from "@/components/standings/MatchdayMenu";
import TeamSelect from "./TeamSelect";
import { MvpCard, type MvpEntry } from "./MvpCard";

type PlayerWithStats = Player & {
  team: Team;
  total_kills: number;
  rooms_played: number;
  first_bloods?: number;
};

type DayStats = Map<
  number,
  { kills: number; rooms: number; firstBloods: number }
>;

type RankedMvpEntry = MvpEntry & {
  rank: number;
};

interface Props {
  players: PlayerWithStats[];
  teams: Team[];
  tournamentId: number;
  days: TournamentDay[];
}

type ViewMode = "players" | "teams";

function compareRanking(a: MvpEntry, b: MvpEntry) {
  return (
    b.kills - a.kills ||
    b.firstBloods - a.firstBloods ||
    (a.kills > 0 ? a.rooms - b.rooms : 0) ||
    a.ign.localeCompare(b.ign)
  );
}

function PlayerRow({ player }: { player: RankedMvpEntry }) {
  const icon = roleIcon(player.role);
  const remote = /^https?:\/\//.test(player.photo_url ?? "");

  return (
    <Link
      href={`/players/${player.id}`}
      className="group flex min-w-0 items-center gap-3 border border-bone/10 bg-char-2 px-3 py-3 transition-colors hover:border-ember/60 hover:bg-char-3 sm:gap-4 sm:px-4"
    >
      {/* Rank */}
      <div className="w-6 shrink-0 text-center">
        <span
          className={`font-stat text-xs font-bold tabular-nums ${
            player.rank <= 3 ? "text-ember" : "text-ash"
          }`}
        >
          {String(player.rank).padStart(2, "0")}
        </span>
      </div>

      {/* Player portrait */}
      <div className="relative h-14 w-12 shrink-0 overflow-hidden border border-bone/10 bg-char-3 sm:h-16 sm:w-14">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={player.ign}
            fill
            sizes="56px"
            unoptimized={remote}
            className="object-cover object-top transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-lg font-black text-bone/30">
            {player.ign.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Team logo */}
      <div className="hidden h-9 w-9 shrink-0 items-center justify-center sm:flex">
        {player.team.logo_url ? (
          <Image
            src={player.team.logo_url}
            alt={player.team.name}
            width={36}
            height={36}
            unoptimized
            className="h-9 w-9 object-contain"
          />
        ) : (
          <span className="font-display text-[9px] font-black text-ash">
            {player.team.tag.slice(0, 3)}
          </span>
        )}
      </div>

      {/* Player information */}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="truncate font-display text-lg font-black uppercase leading-none text-bone sm:text-xl">
            {player.ign}
          </h3>
          <Flag country={player.country} height={14} />
        </div>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex items-center gap-1 font-stat text-[9px] uppercase tracking-wider text-ember">
            {icon && (
              <Image
                src={icon}
                alt=""
                width={14}
                height={14}
                unoptimized
                className="h-3.5 w-3.5 object-contain"
              />
            )}
            {roleLabel(player.role)}
          </span>

          <span className="text-bone/20">·</span>

          <span className="truncate font-stat text-[9px] uppercase tracking-wider text-ash">
            {player.team.name}
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-6">
        <div className="hidden text-right xs:block">
          <p className="font-display text-lg font-bold leading-none text-bone sm:text-xl">
            {player.rooms}
          </p>
          <p className="mt-1 font-stat text-[8px] uppercase tracking-widest text-ash">
            Rooms
          </p>
        </div>

        <div className="hidden text-right sm:block">
          <p className="font-display text-lg font-bold leading-none text-ember">
            {player.firstBloods}
          </p>
          <p className="mt-1 font-stat text-[8px] uppercase tracking-widest text-ash">
            First bloods
          </p>
        </div>

        <div className="min-w-[42px] text-right">
          <p className="font-display text-2xl font-black leading-none tabular-nums text-bone sm:text-3xl">
            {player.kills}
          </p>
          <p className="mt-1 font-stat text-[8px] uppercase tracking-widest text-ash">
            Kills
          </p>
        </div>

        <span className="text-ash/40 transition-transform group-hover:translate-x-1 group-hover:text-ember">
          →
        </span>
      </div>
    </Link>
  );
}

function PlayerSkeleton() {
  return (
    <div
      className="flex h-[82px] animate-pulse items-center gap-4 border border-bone/10 bg-char-2 p-3"
      aria-hidden="true"
    >
      <div className="h-12 w-12 bg-bone/10" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-bone/10" />
        <div className="h-2 w-1/2 bg-bone/5" />
      </div>
      <div className="h-8 w-10 bg-bone/10" />
    </div>
  );
}

function TeamGroup({
  team,
  players,
}: {
  team: Team;
  players: RankedMvpEntry[];
}) {
  return (
    <section className="border border-bone/10 bg-char-2">
      {/* Team heading */}
      <div className="flex items-center gap-3 border-b border-bone/10 bg-char-3 px-4 py-3 sm:px-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-bone/10 bg-char">
          {team.logo_url ? (
            <Image
              src={team.logo_url}
              alt={team.name}
              width={40}
              height={40}
              unoptimized
              className="h-9 w-9 object-contain"
            />
          ) : (
            <span className="font-display text-xs font-black text-bone">
              {team.tag.slice(0, 3)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-black uppercase text-bone sm:text-xl">
            {team.name}
          </h3>
          <p className="mt-0.5 font-stat text-[9px] uppercase tracking-widest text-ash">
            {players.length} PLAYERS
          </p>
        </div>

        <div className="text-right">
          <p className="font-display text-2xl font-black leading-none text-ember">
            {players.reduce((sum, player) => sum + player.kills, 0)}
          </p>
          <p className="mt-1 font-stat text-[8px] uppercase tracking-widest text-ash">
            Team kills
          </p>
        </div>
      </div>

      {/* Players stay one per line */}
      <div className="space-y-px">
        {players.map((player) => (
          <PlayerRow key={player.id} player={player} />
        ))}
      </div>
    </section>
  );
}

export default function PlayersDirectory({
  players,
  teams,
  tournamentId,
  days,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("players");

  // Preserve the original first-matchday default.
  const [selectedDay, setSelectedDay] = useState(() => {
    const first = [...days].sort(
      (a, b) => a.day_order - b.day_order,
    )[0];

    return first ? String(first.id) : "all";
  });

  const [selectedSession, setSelectedSession] = useState<0 | 1 | 2>(0);
  const [dayStats, setDayStats] = useState<Record<string, DayStats>>({});
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const daySections = useMemo(() => buildDayMenu(days), [days]);

  const selection = useMemo(
    () => resolveSelection(selectedDay, days),
    [selectedDay, days],
  );

  const session = selection.scope === "day" ? selectedSession : 0;

  const statKeys = useMemo(
    () =>
      selection.dayIds.map((id) => ({
        id,
        key: `${id}:${session}`,
      })),
    [selection, session],
  );

  const cacheRef = useRef(dayStats);

  useEffect(() => {
    cacheRef.current = dayStats;
  }, [dayStats]);

  useEffect(() => {
    if (selection.scope === "all") return;

    const missing = statKeys.filter(
      ({ key }) => !cacheRef.current[key],
    );

    if (missing.length === 0) return;

    let cancelled = false;
    setError("");

    Promise.allSettled(
      missing.map(async ({ id, key }) => {
        const entries = await getPlayerLeaderboard(
          tournamentId,
          id,
          session || undefined,
        );

        const map: DayStats = new Map(
          entries.map((entry) => [
            entry.player_id,
            {
              kills: entry.total_kills,
              rooms: entry.rooms_played,
              firstBloods: entry.first_bloods ?? 0,
            },
          ]),
        );

        return [key, map] as const;
      }),
    ).then((results) => {
      if (cancelled) return;

      const loaded = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );

      if (loaded.length > 0) {
        setDayStats((prev) => ({
          ...prev,
          ...Object.fromEntries(loaded),
        }));
      }

      if (loaded.length < results.length) {
        setError("Unable to load these stats.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selection, statKeys, session, tournamentId, attempt]);

  const selectionLoaded =
    selection.scope !== "all" &&
    statKeys.every(({ key }) => dayStats[key]);

  const stats = useMemo<DayStats | null>(() => {
    if (selection.scope === "all" || !selectionLoaded) return null;

    const total: DayStats = new Map();

    for (const { key } of statKeys) {
      for (const [playerId, entry] of dayStats[key]) {
        const current = total.get(playerId) ?? {
          kills: 0,
          rooms: 0,
          firstBloods: 0,
        };

        total.set(playerId, {
          kills: current.kills + entry.kills,
          rooms: current.rooms + entry.rooms,
          firstBloods: current.firstBloods + entry.firstBloods,
        });
      }
    }

    return total;
  }, [selection, statKeys, selectionLoaded, dayStats]);

  const dayLoading =
    selection.scope !== "all" && !stats && !error;

  const dayName =
    session === 0
      ? selection.label
      : `${selection.label} · Session ${session}`;

  const ranked = useMemo<RankedMvpEntry[]>(() => {
    const rows: MvpEntry[] = players.map((player) => {
      if (selection.scope === "all") {
        return {
          ...player,
          kills: player.total_kills,
          rooms: player.rooms_played,
          firstBloods: player.first_bloods ?? 0,
        };
      }

      const day = stats?.get(player.id);

      return {
        ...player,
        kills: day?.kills ?? 0,
        rooms: day?.rooms ?? 0,
        firstBloods: day?.firstBloods ?? 0,
      };
    });

    const played =
      selection.scope === "all"
        ? rows
        : rows.filter((player) => player.rooms > 0);

    return played
      .sort(compareRanking)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }));
  }, [players, selection, stats]);

  // MVP is independent of search and team filters.
  const mvp =
    ranked[0] && ranked[0].kills > 0 ? ranked[0] : null;

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return ranked.filter((player) => {
      if (
        selectedTeam !== "all" &&
        player.team.id.toString() !== selectedTeam
      ) {
        return false;
      }

      if (!query) return true;

      return (
        player.ign.toLowerCase().includes(query) ||
        player.real_name?.toLowerCase().includes(query) ||
        player.team.name.toLowerCase().includes(query)
      );
    });
  }, [ranked, search, selectedTeam]);

  // Group the already-ranked players by team.
  const groupedTeams = useMemo(() => {
    const groups = new Map<
      number,
      { team: Team; players: RankedMvpEntry[] }
    >();

    for (const player of filteredPlayers) {
      const existing = groups.get(player.team.id);

      if (existing) {
        existing.players.push(player);
      } else {
        groups.set(player.team.id, {
          team: player.team,
          players: [player],
        });
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => a.players[0].rank - b.players[0].rank,
    );
  }, [filteredPlayers]);

  const teamsWithPlayers = teams.filter((team) =>
    players.some((player) => player.team.id === team.id),
  );

  const noResultsForDay =
    selection.scope !== "all" &&
    !dayLoading &&
    !error &&
    ranked.length === 0;

  const mvpTitle =
    selection.scope === "all"
      ? "Tournament MVP"
      : `MVP of the ${selection.scope}`;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* MVP */}
      <section className="mb-8">
        {dayLoading ? (
          <div className="h-48 animate-pulse border border-bone/10 bg-char-2" />
        ) : (
          <MvpCard
            mvp={error ? null : mvp}
            title={mvpTitle}
            dayLabel={dayName}
          />
        )}
      </section>

      {/* Directory heading */}
      <div className="mb-5">
        <p className="font-stat text-[9px] font-bold uppercase tracking-[0.25em] text-ember">
          THE WORLD STAGE
        </p>
        <h2 className="mt-1 font-display text-3xl font-black uppercase leading-none text-bone sm:text-4xl">
          Players directory<span className="text-ember">.</span>
        </h2>
      </div>

      {/* MATCHDAY SELECTION */}
      <section className="mb-5 border border-bone/10 bg-char-2 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="font-stat text-[10px] font-bold uppercase tracking-[0.2em] text-bone">
              Tournament matchday
            </p>
            <p className="mt-1 font-stat text-[9px] uppercase tracking-wider text-ash">
              Choose the matches you want to explore
            </p>
          </div>

          <span className="shrink-0 font-stat text-[9px] uppercase tracking-wider text-ember">
            {selection.scope === "all" ? "All tournament" : dayName}
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <MatchdayMenu
              ariaLabel="Matchday"
              sections={daySections}
              value={selectedDay}
              onChange={(value) => {
                setSelectedDay(value);
                setSelectedSession(0);
              }}
              disabled={days.length === 0}
              placeholder="All days"
            />
          </div>

          {selection.scope === "day" && (
            <div
              role="group"
              aria-label="Match session"
              className="grid h-11 shrink-0 grid-cols-3 border border-bone/10 bg-char sm:w-auto"
            >
              {(
                [
                  { value: 0, label: "Both sessions" },
                  { value: 1, label: "Session 1" },
                  { value: 2, label: "Session 2" },
                ] as const
              ).map((option) => {
                const active = selectedSession === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedSession(option.value)}
                    className={`whitespace-nowrap px-3 font-stat text-[9px] font-bold uppercase tracking-wider transition-colors sm:px-4 ${
                      active
                        ? "bg-ember text-char"
                        : "text-ash hover:bg-char-3 hover:text-bone"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SEARCH AND TEAM FILTER */}
      <section className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,260px)]">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="SEARCH PLAYER, REAL NAME OR TEAM..."
          aria-label="Search players"
          className="h-12 min-w-0 border border-bone/10 bg-char-2 px-4 font-stat text-[10px] uppercase tracking-widest text-bone outline-none placeholder:text-ash/60 transition-colors focus:border-ember"
        />

        <TeamSelect
          teams={teamsWithPlayers}
          value={selectedTeam}
          onChange={setSelectedTeam}
        />
      </section>

      {/* LARGE VIEW SELECTOR */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-stat text-[10px] font-bold uppercase tracking-[0.2em] text-bone">
            Display players by
          </p>

          <p className="font-stat text-[9px] uppercase tracking-wider text-ash">
            {filteredPlayers.length} players
          </p>
        </div>

        <div
          role="group"
          aria-label="Directory view"
          className="grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            aria-pressed={viewMode === "players"}
            onClick={() => setViewMode("players")}
            className={`flex min-h-[62px] items-center justify-center gap-3 border px-3 transition-all sm:min-h-[72px] ${
              viewMode === "players"
                ? "border-ember bg-ember text-char"
                : "border-bone/15 bg-char-2 text-bone hover:border-bone/40"
            }`}
          >
            <span className="font-display text-2xl font-black">01</span>
            <span className="text-left">
              <span className="block font-stat text-xs font-bold uppercase tracking-widest">
                Players
              </span>
              <span
                className={`mt-1 block font-stat text-[8px] uppercase tracking-wider ${
                  viewMode === "players" ? "text-char/70" : "text-ash"
                }`}
              >
                Individual rankings
              </span>
            </span>
          </button>

          <button
            type="button"
            aria-pressed={viewMode === "teams"}
            onClick={() => setViewMode("teams")}
            className={`flex min-h-[62px] items-center justify-center gap-3 border px-3 transition-all sm:min-h-[72px] ${
              viewMode === "teams"
                ? "border-ember bg-ember text-char"
                : "border-bone/15 bg-char-2 text-bone hover:border-bone/40"
            }`}
          >
            <span className="font-display text-2xl font-black">02</span>
            <span className="text-left">
              <span className="block font-stat text-xs font-bold uppercase tracking-widest">
                By teams
              </span>
              <span
                className={`mt-1 block font-stat text-[8px] uppercase tracking-wider ${
                  viewMode === "teams" ? "text-char/70" : "text-ash"
                }`}
              >
                Team rosters
              </span>
            </span>
          </button>
        </div>
      </section>

      {/* RESULTS HEADER */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-bone/10 pb-3">
        <p className="font-stat text-[10px] font-bold uppercase tracking-[0.2em] text-bone">
          {viewMode === "players" ? "Player rankings" : "Team rosters"}
        </p>

        <p className="font-stat text-[9px] uppercase tracking-wider text-ash">
          SORTED BY KILLS · {dayName}
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="border border-danger/30 bg-char-2 px-6 py-8 text-center">
          <p className="text-sm text-bone">{error}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-4 border border-ember px-4 py-2 font-stat text-xs uppercase tracking-wider text-ember hover:bg-ember hover:text-char"
          >
            Try again
          </button>
        </div>
      )}

      {/* LOADING */}
      {dayLoading && (
        <div className="space-y-2">
          {Array.from({ length: 7 }, (_, i) => (
            <PlayerSkeleton key={i} />
          ))}
        </div>
      )}

      {/* PLAYERS VIEW */}
      {!dayLoading && !error && viewMode === "players" && (
        <div className="space-y-2">
          {filteredPlayers.map((player) => (
            <PlayerRow key={player.id} player={player} />
          ))}
        </div>
      )}

      {/* TEAMS VIEW */}
      {!dayLoading && !error && viewMode === "teams" && (
        <div className="space-y-4">
          {groupedTeams.map(({ team, players: teamPlayers }) => (
            <TeamGroup
              key={team.id}
              team={team}
              players={teamPlayers}
            />
          ))}
        </div>
      )}

      {/* NO MATCH RESULTS */}
      {noResultsForDay && (
        <div className="border border-bone/10 bg-char-2 px-6 py-16 text-center">
          <p className="font-display text-3xl font-black uppercase text-bone">
            No results yet<span className="text-ember">.</span>
          </p>
          <p className="mt-2 font-stat text-[9px] uppercase tracking-widest text-ash">
            Kills for {dayName} appear once matches are played.
          </p>
        </div>
      )}

      {/* NO SEARCH RESULTS */}
      {!dayLoading &&
        !error &&
        !noResultsForDay &&
        filteredPlayers.length === 0 && (
          <div className="border border-bone/10 bg-char-2 px-6 py-16 text-center">
            <p className="font-display text-3xl font-black uppercase text-bone">
              No players found<span className="text-ember">.</span>
            </p>
            <p className="mt-2 font-stat text-[9px] uppercase tracking-widest text-ash">
              Try another player, team or matchday.
            </p>
          </div>
        )}
    </main>
  );
}
