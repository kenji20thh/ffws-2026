"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Player, Team, TournamentDay } from "@/types";
import { getPlayerLeaderboard } from "@/lib/api";
import { buildDayMenu, shortDayName } from "@/lib/dayMenu";
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

type DayStats = Map<number, { kills: number; rooms: number; firstBloods: number }>;

interface Props {
  players: PlayerWithStats[];
  teams: Team[];
  tournamentId: number;
  days: TournamentDay[];
}

/**
 * Most kills first. Ties: more first bloods, then fewer rooms played (same kills in
 * fewer rooms is better; only compared when there are kills), then IGN.
 */
function compareRanking(a: MvpEntry, b: MvpEntry) {
  return (
    b.kills - a.kills ||
    b.firstBloods - a.firstBloods ||
    (a.kills > 0 ? a.rooms - b.rooms : 0) ||
    a.ign.localeCompare(b.ign)
  );
}

function RowSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-[5.5rem] animate-pulse chamfer border border-bone/10 bg-char-2" />
      ))}
    </div>
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
  const [selectedDay, setSelectedDay] = useState("all");

  // Kills per day are loaded on demand and cached once fetched.
  const [dayStats, setDayStats] = useState<Record<string, DayStats>>({});
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const daySections = useMemo(() => buildDayMenu(days), [days]);

  useEffect(() => {
    if (selectedDay === "all" || dayStats[selectedDay]) return;

    let cancelled = false;
    setError("");

    getPlayerLeaderboard(tournamentId, Number(selectedDay))
      .then((entries) => {
        if (cancelled) return;
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
        setDayStats((prev) => ({ ...prev, [selectedDay]: map }));
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load this day's stats.");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDay, tournamentId, attempt, dayStats]);

  const stats = selectedDay === "all" ? null : (dayStats[selectedDay] ?? null);
  const dayLoading = selectedDay !== "all" && !stats && !error;

  const dayName =
    selectedDay === "all"
      ? "All days"
      : shortDayName(
          days.find((day) => String(day.id) === selectedDay)?.name ?? "Matchday",
        );

  // Every player with the numbers of the selected day (or the whole tournament).
  // For a single day, only players who actually played that day are ranked.
  const ranked = useMemo<MvpEntry[]>(() => {
    const rows: MvpEntry[] = players.map((player) => {
      if (selectedDay === "all") {
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

    const played = selectedDay === "all" ? rows : rows.filter((r) => r.rooms > 0);
    return played.sort(compareRanking);
  }, [players, selectedDay, stats]);

  // MVP is picked from everyone that day, whatever the search / team filters say.
  const mvp = ranked[0] && ranked[0].kills > 0 ? ranked[0] : null;

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return ranked.filter((player) => {
      if (selectedTeam !== "all" && player.team.id.toString() !== selectedTeam) {
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
    selectedDay !== "all" && !dayLoading && !error && ranked.length === 0;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      {/* Filters */}
      <div className="mb-8 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="SEARCH PLAYER..."
            className="h-12 w-full chamfer border border-bone/10 bg-char-2 px-4 font-stat text-xs uppercase tracking-widest text-bone outline-none placeholder:text-ash focus:border-ember"
          />
        </div>

        <MatchdayMenu
          ariaLabel="Day"
          sections={daySections}
          value={selectedDay}
          onChange={setSelectedDay}
          disabled={days.length === 0}
          placeholder="All days"
        />

        <TeamSelect
          teams={teamsWithPlayers}
          value={selectedTeam}
          onChange={setSelectedTeam}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        {/* MVP of the selected day (above the list on small screens) */}
        <aside className="lg:order-2 lg:sticky lg:top-24">
          {dayLoading ? (
            <div className="h-[34rem] animate-pulse chamfer border border-bone/10 bg-char-2" aria-hidden="true" />
          ) : (
            <MvpCard
              mvp={error ? null : mvp}
              title={selectedDay === "all" ? "Tournament MVP" : "MVP of the day"}
              dayLabel={dayName}
            />
          )}
        </aside>

        <section className="min-w-0 lg:order-1">
          {/* Result count */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-stat text-[0.6875rem] uppercase tracking-[0.2em] text-ash">
              {filteredPlayers.length}{" "}
              {filteredPlayers.length === 1 ? "PLAYER" : "PLAYERS"}
            </p>

            <p className="truncate font-stat text-[0.6875rem] uppercase tracking-[0.2em] text-ash">
              SORTED BY KILLS · {dayName}
            </p>
          </div>

          {error && (
            <div className="chamfer border border-danger/30 bg-char-2 px-6 py-8 text-center">
              <p className="text-sm text-bone">{error}</p>
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="mt-4 border border-ember px-4 py-2 font-stat text-xs uppercase tracking-wider text-ember"
              >
                Try again
              </button>
            </div>
          )}

          {dayLoading && <RowSkeleton />}

          {/* Players */}
          {!dayLoading && !error && (
            <div className="space-y-2">
              {filteredPlayers.map((player, index) => {
                const icon = roleIcon(player.role);

                return (
                  <Link
                    key={player.id}
                    href={`/players/${player.id}`}
                    className="group block chamfer border border-bone/10 bg-char-2 transition-colors hover:border-ember"
                  >
                    <div className="flex min-h-[5.5rem] items-center gap-4 px-4 py-3 md:px-6">
                      {/* Rank */}
                      <div className="hidden w-8 shrink-0 text-center font-stat text-xs text-ash sm:block">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      {/* Team logo */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                        {player.team.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={player.team.logo_url}
                            alt={player.team.name}
                            className="h-12 w-12 object-contain"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center border border-bone/10 font-display text-xs font-black text-ash">
                            {player.team.tag.slice(0, 3)}
                          </div>
                        )}
                      </div>

                      {/* Player information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate font-display text-xl font-extrabold uppercase leading-none md:text-2xl">
                            {player.ign}
                          </h2>

                          <Flag country={player.country} height={16} />
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {/* Role */}
                          <div className="flex items-center gap-1.5">
                            {icon && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={icon}
                                alt=""
                                className="h-5 w-5 object-contain"
                              />
                            )}

                            <span className="font-stat text-[0.625rem] uppercase tracking-widest text-ember">
                              {roleLabel(player.role)}
                            </span>
                          </div>

                          <span className="text-bone/20">·</span>

                          <span className="font-stat text-[0.625rem] uppercase tracking-widest text-ash">
                            {player.team.name}
                          </span>
                        </div>
                      </div>

                      {/* Kills */}
                      <div className="shrink-0 text-right">
                        <p className="font-display text-3xl font-black leading-none text-bone md:text-4xl">
                          {player.kills}
                        </p>

                        <p className="mt-1 font-stat text-[0.5625rem] uppercase tracking-[0.18em] text-ash">
                          KILLS
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Empty states */}
          {noResultsForDay && (
            <div className="chamfer border border-bone/10 bg-char-2 px-6 py-16 text-center">
              <p className="font-display text-2xl font-extrabold uppercase">
                No results yet
              </p>

              <p className="mt-2 font-stat text-xs uppercase tracking-widest text-ash">
                Kills for {dayName} appear once matches are played.
              </p>
            </div>
          )}

          {!dayLoading && !error && !noResultsForDay && filteredPlayers.length === 0 && (
            <div className="chamfer border border-bone/10 bg-char-2 px-6 py-16 text-center">
              <p className="font-display text-2xl font-extrabold uppercase">
                No players found
              </p>

              <p className="mt-2 font-stat text-xs uppercase tracking-widest text-ash">
                Try another player or team.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
