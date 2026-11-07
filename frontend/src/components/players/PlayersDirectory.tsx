"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Player, Team, TournamentDay } from "@/types";
import { getPlayerLeaderboard } from "@/lib/api";
import { buildDayMenu, resolveSelection } from "@/lib/dayMenu";
import { roleIcon, roleLabel } from "@/lib/roles";
import Flag from "@/components/ui/Flag";
import Monogram from "@/components/ui/Monogram";
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

function compareRanking(a: MvpEntry, b: MvpEntry) {
  return (
    b.kills - a.kills ||
    b.firstBloods - a.firstBloods ||
    (a.kills > 0 ? a.rooms - b.rooms : 0) ||
    a.ign.localeCompare(b.ign)
  );
}

function PlayerSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden border border-bone/10 bg-char-2"
      aria-hidden="true"
    >
      <div className="aspect-[4/3] bg-char-3" />
      <div className="space-y-3 p-3">
        <div className="h-5 w-2/3 bg-bone/10" />
        <div className="h-3 w-1/2 bg-bone/5" />
        <div className="h-8 w-full bg-bone/5" />
      </div>
    </div>
  );
}

function PlayerCard({ player }: { player: RankedMvpEntry }) {
  const icon = roleIcon(player.role);
  const remote = /^https?:\/\//.test(player.photo_url ?? "");

  return (
    <Link
      href={`/players/${player.id}`}
      className="group relative min-w-0 overflow-hidden border border-bone/10 bg-char-2 transition-all duration-300 hover:-translate-y-1 hover:border-ember/70 hover:bg-char-3"
    >
      {/* Portrait */}
      <div className="relative aspect-[4/3] overflow-hidden bg-char-3">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={player.ign}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized={remote}
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Monogram label={player.ign} size={64} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-char-2 via-char/10 to-transparent" />

        {/* Rank */}
        <div className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center border border-bone/20 bg-char/80 px-1.5 backdrop-blur-sm">
          <span className="font-stat text-[9px] font-bold tabular-nums text-bone">
            #{String(player.rank).padStart(2, "0")}
          </span>
        </div>

        {/* Team logo */}
        <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center border border-bone/10 bg-char/80 p-1.5 backdrop-blur-sm">
          {player.team.logo_url ? (
            <Image
              src={player.team.logo_url}
              alt={player.team.name}
              width={28}
              height={28}
              unoptimized
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="font-display text-[9px] font-black text-bone">
              {player.team.tag.slice(0, 3)}
            </span>
          )}
        </div>

        {/* Portrait identity */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate font-display text-lg font-black uppercase leading-none text-bone sm:text-xl">
              {player.ign}
            </h3>
            <Flag country={player.country} height={13} />
          </div>

          <p className="mt-1 truncate font-stat text-[8px] font-bold uppercase tracking-[0.15em] text-ember">
            {player.team.name}
          </p>
        </div>

        {/* Hover accent */}
        <div className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-ember transition-transform duration-300 group-hover:scale-x-100" />
      </div>

      {/* Player details */}
      <div className="p-2.5 sm:p-3">
        <div className="flex min-h-5 items-center gap-1.5">
          {icon && (
            <Image
              src={icon}
              alt=""
              width={15}
              height={15}
              unoptimized
              className="h-4 w-4 shrink-0 object-contain"
            />
          )}

          <span className="truncate font-stat text-[8px] uppercase tracking-wider text-ash sm:text-[9px]">
            {roleLabel(player.role)}
          </span>

          {player.is_captain && (
            <span className="ml-auto shrink-0 font-stat text-[8px] font-bold uppercase text-ember">
              CAP
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-end justify-between border-t border-bone/10 pt-2.5">
          <div>
            <p className="font-display text-2xl font-black leading-none tabular-nums text-bone sm:text-3xl">
              {player.kills}
            </p>
            <p className="mt-1 font-stat text-[8px] uppercase tracking-widest text-ash">
              Kills
            </p>
          </div>

          <div className="text-right">
            <p className="font-display text-lg font-bold leading-none tabular-nums text-bone/80">
              {player.rooms}
            </p>
            <p className="mt-1 font-stat text-[8px] uppercase tracking-widest text-ash">
              Rooms
            </p>
          </div>

          <div className="text-right">
            <p className="font-display text-lg font-bold leading-none tabular-nums text-ember">
              {player.firstBloods}
            </p>
            <p className="mt-1 font-stat text-[8px] uppercase tracking-widest text-ash">
              FB
            </p>
          </div>
        </div>
      </div>
    </Link>
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
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

      {/* MVP FEATURE */}
      <section className="mb-8">
        <MvpCard
          mvp={error ? null : mvp}
          title={mvpTitle}
          dayLabel={dayName}
        />
      </section>

      {/* DIRECTORY HEADER */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-stat text-[9px] font-bold uppercase tracking-[0.25em] text-ember">
              THE COMPETITORS
            </p>
            <h2 className="mt-1 font-display text-3xl font-black uppercase leading-none text-bone sm:text-4xl">
              Player roster<span className="text-ember">.</span>
            </h2>
          </div>

          <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
            {filteredPlayers.length} / {ranked.length} PLAYERS
          </p>
        </div>

        {/* FILTERS */}
        <div className="mb-6 border border-bone/10 bg-char-2 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,220px)_auto_minmax(180px,220px)] xl:items-center">

            {/* Search */}
            <div className="relative min-w-0">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4 4" />
                </svg>
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="SEARCH PLAYER OR TEAM..."
                aria-label="Search players or teams"
                className="h-11 w-full border border-bone/10 bg-char px-10 font-stat text-[10px] uppercase tracking-wider text-bone outline-none transition-colors placeholder:text-ash/60 focus:border-ember"
              />
            </div>

            {/* Matchday */}
            <MatchdayMenu
              ariaLabel="Day"
              sections={daySections}
              value={selectedDay}
              onChange={(value) => {
                setSelectedDay(value);
                setSelectedSession(0);
              }}
              disabled={days.length === 0}
              placeholder="All days"
            />

            {/* Session picker */}
            {selection.scope === "day" ? (
              <div
                role="group"
                aria-label="Session"
                className="flex h-11 min-w-0 border border-bone/10 bg-char"
              >
                {(
                  [
                    { value: 0, label: "Both" },
                    { value: 1, label: "S1" },
                    { value: 2, label: "S2" },
                  ] as const
                ).map((option) => {
                  const active = selectedSession === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedSession(option.value)}
                      className={`flex-1 px-3 font-stat text-[9px] font-bold uppercase tracking-wider transition-colors ${
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
            ) : (
              <div className="hidden xl:block" />
            )}

            {/* Team */}
            <TeamSelect
              teams={teamsWithPlayers}
              value={selectedTeam}
              onChange={setSelectedTeam}
            />
          </div>

          {/* Active selection */}
          {(search || selectedTeam !== "all") && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-bone/10 pt-3">
              <p className="font-stat text-[9px] uppercase tracking-wider text-ash">
                Showing filtered results
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedTeam("all");
                }}
                className="font-stat text-[9px] font-bold uppercase tracking-widest text-ember transition-colors hover:text-bone"
              >
                Clear filters ×
              </button>
            </div>
          )}
        </div>

        {/* RESULT BAR */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="font-stat text-[9px] uppercase tracking-[0.2em] text-ash">
            <span className="text-bone">{filteredPlayers.length}</span>{" "}
            {filteredPlayers.length === 1 ? "PLAYER" : "PLAYERS"}
          </p>

          <p className="font-stat text-[9px] uppercase tracking-[0.15em] text-ash">
            RANKED BY KILLS · {dayName}
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="border border-danger/30 bg-char-2 px-6 py-8 text-center">
            <p className="text-sm text-bone">{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-4 border border-ember px-4 py-2 font-stat text-xs uppercase tracking-wider text-ember transition-colors hover:bg-ember hover:text-char"
            >
              Try again
            </button>
          </div>
        )}

        {/* LOADING */}
        {dayLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, i) => (
              <PlayerSkeleton key={i} />
            ))}
          </div>
        )}

        {/* PLAYER GRID */}
        {!dayLoading && !error && (
          <>
            {filteredPlayers.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
                {filteredPlayers.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            )}
          </>
        )}

        {/* EMPTY STATES */}
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

        {!dayLoading &&
          !error &&
          !noResultsForDay &&
          filteredPlayers.length === 0 && (
            <div className="border border-bone/10 bg-char-2 px-6 py-16 text-center">
              <p className="font-display text-3xl font-black uppercase text-bone">
                No players found<span className="text-ember">.</span>
              </p>
              <p className="mt-2 font-stat text-[9px] uppercase tracking-widest text-ash">
                Try another player or team.
              </p>
            </div>
          )}
      </section>
    </main>
  );
}