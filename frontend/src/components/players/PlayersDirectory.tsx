"use client";

import { useMemo, useState } from "react";
import type { Player, Team } from "@/types";

const roleIcons: Record<string, string> = {
  Rusher:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_rusher_role_player.png",
  Bomber:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_bomber_role_player.png",
  Support:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_support_role_player.png",
  Sniper:
    "https://webid.cdn.garenanow.com/gstaticid/FFID/main_esports/logo_sniper_role_player.png",
};

const countryFlags: Record<string, string> = {
  Morocco: "🇲🇦",
  Algeria: "🇩🇿",
  Tunisia: "🇹🇳",
  Egypt: "🇪🇬",
  Indonesia: "🇮🇩",
  Vietnam: "🇻🇳",
  Thailand: "🇹🇭",
  Malaysia: "🇲🇾",
  Singapore: "🇸🇬",
  Philippines: "🇵🇭",
  India: "🇮🇳",
  Brazil: "🇧🇷",
  Mexico: "🇲🇽",
  Turkey: "🇹🇷",
  France: "🇫🇷",
  Pakistan: "🇵🇰",
  Bangladesh: "🇧🇩",
  Nepal: "🇳🇵",
  Chile: "🇨🇱",
  Argentina: "🇦🇷",
};

type PlayerWithStats = Player & {
  team: Team;
  total_kills: number;
  rooms_played: number;
};

interface Props {
  players: PlayerWithStats[];
  teams: Team[];
}

export default function PlayersDirectory({ players, teams }: Props) {
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...players]
      .filter((player) => {
        if (selectedTeam === "all") return true;

        return player.team.id.toString() === selectedTeam;
      })
      .filter((player) => {
        if (!query) return true;

        return (
          player.ign.toLowerCase().includes(query) ||
          player.real_name?.toLowerCase().includes(query) ||
          player.team.name.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (b.total_kills !== a.total_kills) {
          return b.total_kills - a.total_kills;
        }

        return a.ign.localeCompare(b.ign);
      });
  }, [players, search, selectedTeam]);

  const teamsWithPlayers = teams.filter((team) =>
    players.some((player) => player.team.id === team.id),
  );

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

        <select
          value={selectedTeam}
          onChange={(event) => setSelectedTeam(event.target.value)}
          className="h-12 chamfer border border-bone/10 bg-char-2 px-4 font-stat text-xs uppercase tracking-widest text-bone outline-none focus:border-ember md:w-64"
        >
          <option value="all">ALL TEAMS</option>

          {teamsWithPlayers
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
        </select>
      </div>

      {/* Result count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="font-stat text-[11px] uppercase tracking-[0.2em] text-ash">
          {filteredPlayers.length}{" "}
          {filteredPlayers.length === 1 ? "PLAYER" : "PLAYERS"}
        </p>

        <p className="font-stat text-[11px] uppercase tracking-[0.2em] text-ash">
          SORTED BY KILLS
        </p>
      </div>

      {/* Players */}
      <div className="space-y-2">
        {filteredPlayers.map((player, index) => {
          const roleIcon = roleIcons[player.role];
          const flag = countryFlags[player.country];

          return (
            <div
              key={player.id}
              className="group chamfer border border-bone/10 bg-char-2 transition-colors hover:border-ember"
            >
              <div className="flex min-h-[88px] items-center gap-4 px-4 py-3 md:px-6">
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

                    {flag && (
                      <span
                        className="shrink-0 text-base leading-none"
                        title={player.country}
                      >
                        {flag}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {/* Role */}
                    <div className="flex items-center gap-1.5">
                      {roleIcon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={roleIcon}
                          alt=""
                          className="h-5 w-5 object-contain"
                        />
                      )}

                      <span className="font-stat text-[10px] uppercase tracking-widest text-ember">
                        {player.role || "PLAYER"}
                      </span>
                    </div>

                    <span className="text-bone/20">·</span>

                    <span className="font-stat text-[10px] uppercase tracking-widest text-ash">
                      {player.team.name}
                    </span>
                  </div>
                </div>

                {/* Kills */}
                <div className="shrink-0 text-right">
                  <p className="font-display text-3xl font-black leading-none text-bone md:text-4xl">
                    {player.total_kills}
                  </p>

                  <p className="mt-1 font-stat text-[9px] uppercase tracking-[0.18em] text-ash">
                    KILLS
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredPlayers.length === 0 && (
        <div className="chamfer border border-bone/10 bg-char-2 px-6 py-16 text-center">
          <p className="font-display text-2xl font-extrabold uppercase">
            No players found
          </p>

          <p className="mt-2 font-stat text-xs uppercase tracking-widest text-ash">
            Try another player or team.
          </p>
        </div>
      )}
    </main>
  );
}