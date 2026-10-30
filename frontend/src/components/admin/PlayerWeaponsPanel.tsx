"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import {
  ApiError,
  getPlayerProfile,
  getPlayers,
  getPlayerWeaponKills,
  getTeams,
  getTournament,
  getWeapons,
  savePlayerWeaponKills,
} from "@/lib/api";
import { clearSession, isAdmin } from "@/lib/auth";
import type { Player, Team, Weapon } from "@/types";

const select =
  "chamfer-sm w-full border border-bone/20 bg-char-2 px-4 py-3 font-display text-xl font-bold uppercase text-bone focus:border-ember focus:outline-none disabled:opacity-50";

const label = "mb-1 block font-stat text-[10px] uppercase tracking-widest text-ash";

export default function PlayerWeaponsPanel() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teamId, setTeamId] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState(0);

  // kills typed per weapon id ("" = not used)
  const [kills, setKills] = useState<Record<number, string>>({});
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [resultKills, setResultKills] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      setNotice({ tone: "err", text: e instanceof Error ? e.message : "Something went wrong" });
    },
    [router],
  );

  // teams + weapon list
  useEffect(() => {
    if (!isAdmin()) return; // the results panel already sends non-admins to /login
    getTournament("ffws-2026")
      .then((t) => Promise.all([getTeams(t.id), getWeapons()]))
      .then(([t, w]) => {
        setTeams([...t].sort((a, b) => a.name.localeCompare(b.name)));
        setWeapons(w);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  // team change: its players
  useEffect(() => {
    setPlayers([]);
    setPlayerId(0);
    if (!teamId) return;
    let cancelled = false;
    getPlayers(teamId)
      .then((p) => {
        if (!cancelled) setPlayers([...p].sort((a, b) => a.ign.localeCompare(b.ign)));
      })
      .catch(fail);
    return () => {
      cancelled = true;
    };
  }, [teamId, fail]);

  // player change: the weapon kills already saved + kills from the results (for comparison)
  useEffect(() => {
    setKills({});
    setNotice(null);
    setResultKills(null);
    if (!playerId) return;
    let cancelled = false;
    setLoadingPlayer(true);
    Promise.all([getPlayerWeaponKills(playerId), getPlayerProfile(playerId).catch(() => null)])
      .then(([saved, profile]) => {
        if (cancelled) return;
        const next: Record<number, string> = {};
        saved.forEach((s) => {
          if (s.kills > 0) next[s.weapon_id] = String(s.kills);
        });
        setKills(next);
        setResultKills(profile ? profile.overall.total_kills : null);
      })
      .catch(fail)
      .finally(() => {
        if (!cancelled) setLoadingPlayer(false);
      });
    return () => {
      cancelled = true;
    };
  }, [playerId, fail]);

  const invalid = (v: string) => v !== "" && !/^\d+$/.test(v);
  const hasInvalid = Object.values(kills).some(invalid);

  const total = useMemo(
    () =>
      Object.values(kills).reduce((sum, v) => (/^\d+$/.test(v) ? sum + Number(v) : sum), 0),
    [kills],
  );

  async function save() {
    if (!playerId || hasInvalid) return;
    const payload = weapons
      .map((w) => ({ weapon_id: w.id, kills: Number(kills[w.id] || 0) }))
      .filter((w) => w.kills > 0);
    setBusy(true);
    setNotice(null);
    try {
      await savePlayerWeaponKills(playerId, payload);
      const name = players.find((p) => p.id === playerId)?.ign ?? "player";
      setNotice({ tone: "ok", text: `Saved weapons for ${name}` });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (loading) return <Skeleton className="h-40" />;
  if (weapons.length === 0)
    return (
      <EmptyState
        title="No weapons yet"
        hint="Add the weapons to the weapons table in the database first."
      />
    );

  return (
    <div className="space-y-6">
      <p className="border-l-2 border-amber pl-3 text-sm text-bone/70">
        Pick a player and enter how many kills he got with each weapon he used. Leave a weapon
        empty if he didn&apos;t use it. Saving <b>replaces</b> the player&apos;s whole weapon list.
        This is separate from the room results: nothing here changes kills or placement.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="weapons-team" className={label}>
            Team
          </label>
          <select
            id="weapons-team"
            className={select}
            value={teamId}
            onChange={(e) => setTeamId(Number(e.target.value))}
          >
            <option value={0}>Select a team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="weapons-player" className={label}>
            Player
          </label>
          <select
            id="weapons-player"
            className={select}
            value={playerId}
            disabled={!teamId || players.length === 0}
            onChange={(e) => setPlayerId(Number(e.target.value))}
          >
            <option value={0}>{teamId && players.length === 0 ? "No players" : "Select a player"}</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.ign}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p
        aria-live="polite"
        className={`min-h-5 font-stat text-xs ${notice?.tone === "ok" ? "text-amber" : "text-danger"}`}
      >
        {notice?.text}
      </p>

      {!playerId ? (
        <EmptyState title="Select a player" hint="Choose a team, then a player." />
      ) : loadingPlayer ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="chamfer border border-bone/10 bg-char-2 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-bone/10 pb-3 font-stat text-[11px] uppercase tracking-widest">
            <span className="text-ash">
              Weapon kills entered: <b className="text-bone">{total}</b>
            </span>
            {resultKills !== null && (
              <span className="text-ash">
                Kills in room results: <b className="text-bone">{resultKills}</b>
                {total !== resultKills && total > 0 && (
                  <span className="ml-2 text-amber">
                    ({total > resultKills ? "+" : "−"}
                    {Math.abs(total - resultKills)} difference)
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weapons.map((w) => {
              const v = kills[w.id] ?? "";
              return (
                <label
                  key={w.id}
                  className={`flex items-center justify-between gap-3 border px-3 py-2 ${
                    invalid(v) ? "border-danger" : v ? "border-ember/60 bg-char-3/60" : "border-bone/10"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg font-extrabold uppercase leading-none">
                      {w.name}
                    </span>
                    {w.category && (
                      <span className="mt-0.5 block font-stat text-[9px] uppercase tracking-widest text-ash">
                        {w.category}
                      </span>
                    )}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={v}
                    placeholder="0"
                    aria-label={`Kills with ${w.name}`}
                    onChange={(e) => setKills((k) => ({ ...k, [w.id]: e.target.value.trim() }))}
                    className="w-20 border border-bone/20 bg-char px-2 py-1.5 text-right font-stat text-lg tabular-nums text-bone focus:border-ember focus:outline-none"
                  />
                </label>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" disabled={busy || hasInvalid} onClick={save}>
              {busy ? "Saving…" : "Save weapons"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy || total === 0}
              onClick={() => setKills({})}
            >
              Clear all
            </Button>
            {hasInvalid && (
              <span className="font-stat text-xs text-danger">Kills must be whole numbers.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
