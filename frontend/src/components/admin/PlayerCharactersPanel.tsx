"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import {
  ApiError,
  getPlayerCharacters,
  getPlayers,
  getTeams,
  getTournament,
  savePlayerCharacters,
} from "@/lib/api";
import { clearSession, isAdmin } from "@/lib/auth";
import { CHARACTER_SUGGESTIONS, characterImageSrc, normalizeCharacter } from "@/lib/characters";
import type { Player, Team } from "@/types";

const select =
  "chamfer-sm w-full border border-bone/20 bg-char-2 px-4 py-3 font-display text-xl font-bold uppercase text-bone focus:border-ember focus:outline-none disabled:opacity-50";

const label = "mb-1 block font-stat text-[10px] uppercase tracking-widest text-ash";

const SLOTS = 5;
const emptySlots = () => Array.from({ length: SLOTS }, () => "");

export default function PlayerCharactersPanel() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teamId, setTeamId] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState(0);

  const [slots, setSlots] = useState<string[]>(emptySlots());
  const [loadingPlayer, setLoadingPlayer] = useState(false);
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

  useEffect(() => {
    if (!isAdmin()) return;
    getTournament("ffws-2026")
      .then((t) => getTeams(t.id))
      .then((t) => setTeams([...t].sort((a, b) => a.name.localeCompare(b.name))))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

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

  useEffect(() => {
    setSlots(emptySlots());
    setNotice(null);
    if (!playerId) return;
    let cancelled = false;
    setLoadingPlayer(true);
    getPlayerCharacters(playerId)
      .then((saved) => {
        if (cancelled) return;
        const next = emptySlots();
        saved.forEach((c) => {
          if (c.slot >= 1 && c.slot <= SLOTS) next[c.slot - 1] = c.character;
        });
        setSlots(next);
      })
      .catch(fail)
      .finally(() => {
        if (!cancelled) setLoadingPlayer(false);
      });
    return () => {
      cancelled = true;
    };
  }, [playerId, fail]);

  const cleaned = slots.map(normalizeCharacter).filter(Boolean);
  const hasDuplicate = new Set(cleaned).size !== cleaned.length;

  async function save() {
    if (!playerId || hasDuplicate) return;
    setBusy(true);
    setNotice(null);
    try {
      await savePlayerCharacters(playerId, cleaned);
      const name = players.find((p) => p.id === playerId)?.ign ?? "player";
      setNotice({ tone: "ok", text: `Saved characters for ${name}` });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (loading) return <Skeleton className="h-40" />;

  return (
    <div className="space-y-6">
      <p className="border-l-2 border-amber pl-3 text-sm text-bone/70">
        Pick a player and enter up to 5 characters he uses most. The <b>first</b> one is his main
        (shown big on the profile). Type the picture&apos;s file name from{" "}
        <code>public/characters/</code> without <code>.png</code> (e.g. <code>skyler</code>).
        Saving <b>replaces</b> the player&apos;s whole character list.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="characters-team" className={label}>
            Team
          </label>
          <select
            id="characters-team"
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
          <label htmlFor="characters-player" className={label}>
            Player
          </label>
          <select
            id="characters-player"
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
          <datalist id="character-suggestions">
            {CHARACTER_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((value, i) => {
              const name = normalizeCharacter(value);
              const dup = name !== "" && cleaned.filter((c) => c === name).length > 1;
              return (
                <label
                  key={i}
                  className={`flex items-center gap-3 border px-3 py-2 ${
                    dup ? "border-danger" : name ? "border-ember/60 bg-char-3/60" : "border-bone/10"
                  }`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-char">
                    {name && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={characterImageSrc(name)}
                        alt=""
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                        onLoad={(e) => {
                          e.currentTarget.style.visibility = "visible";
                        }}
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-stat text-[9px] uppercase tracking-widest text-ash">
                      {i === 0 ? "Main character" : `Character ${i + 1}`}
                    </span>
                    <input
                      type="text"
                      list="character-suggestions"
                      value={value}
                      placeholder="e.g. skyler"
                      aria-label={i === 0 ? "Main character" : `Character ${i + 1}`}
                      onChange={(e) =>
                        setSlots((s) => s.map((v, j) => (j === i ? e.target.value : v)))
                      }
                      className="mt-1 w-full border border-bone/20 bg-char px-2 py-1.5 font-stat text-base text-bone focus:border-ember focus:outline-none"
                    />
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" disabled={busy || hasDuplicate} onClick={save}>
              {busy ? "Saving…" : "Save characters"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy || slots.every((s) => s === "")}
              onClick={() => setSlots(emptySlots())}
            >
              Clear all
            </Button>
            {hasDuplicate && (
              <span className="font-stat text-xs text-danger">Each character can only be used once.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
