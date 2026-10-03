"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError, submitFantasySelection } from "@/lib/api";
import type { FantasyPlayerOption, FantasySelectionEntry } from "@/types";
import BudgetBar from "./BudgetBar";
import PlayerPickerCard from "./PlayerPickerCard";

interface Props {
  tournamentId: number;
  dayId: number;
  pool: FantasyPlayerOption[];
  existing: FantasySelectionEntry[];
  locked: boolean;
  onSaved: () => void;
}

export default function SelectionBuilder({ tournamentId, dayId, pool, existing, locked, onSaved }: Props) {
  const [picks, setPicks] = useState<Map<number, boolean>>(
    new Map(existing.map((s) => [s.player_id, s.is_captain]))
  );
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedOptions = pool.filter((o) => picks.has(o.player_id));
  const spent = selectedOptions.reduce((s, o) => s + o.fantasy_price, 0);
  const usedTeamIds = new Set(selectedOptions.map((o) => o.team_id));
  const hasCaptain = [...picks.values()].some(Boolean);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((o) => o.ign.toLowerCase().includes(q) || o.team_name.toLowerCase().includes(q));
  }, [pool, search]);

  function toggle(o: FantasyPlayerOption) {
    if (locked) return;
    setPicks((prev) => {
      const next = new Map(prev);
      if (next.has(o.player_id)) {
        const wasCaptain = next.get(o.player_id) === true;
        next.delete(o.player_id);
        // removing the captain hands the armband to the first remaining pick
        if (wasCaptain && next.size > 0) {
          const [firstId] = next.keys();
          next.set(firstId, true);
        }
      } else {
        if (next.size >= 4) return prev;
        if (usedTeamIds.has(o.team_id)) return prev;
        next.set(o.player_id, next.size === 0); // first pick defaults to captain
      }
      return next;
    });
  }

  function setCaptain(playerId: number) {
    if (locked) return;
    setPicks((prev) => {
      const next = new Map<number, boolean>();
      prev.forEach((_, id) => next.set(id, id === playerId));
      return next;
    });
  }

  function isDisabled(o: FantasyPlayerOption) {
    if (picks.has(o.player_id)) return false;
    if (picks.size >= 4) return true;
    if (usedTeamIds.has(o.team_id)) return true;
    return false;
  }

  async function save() {
    if (picks.size !== 4) {
      setError("Pick exactly 4 players.");
      return;
    }
    if (!hasCaptain) {
      setError("Choose a captain.");
      return;
    }
    if (spent > 100) {
      setError("You're over the $100 budget.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await submitFantasySelection(
        tournamentId,
        dayId,
        [...picks.entries()].map(([player_id, is_captain]) => ({ player_id, is_captain }))
      );
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save selection");
    } finally {
      setBusy(false);
    }
  }

  if (pool.length === 0) return <EmptyState title="No players available" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search player or team…"
          disabled={locked}
          className="chamfer-sm border border-bone/20 bg-char-2 px-4 py-3 font-stat text-sm placeholder:text-ash focus:border-ember focus:outline-none disabled:opacity-50"
        />
        <BudgetBar spent={spent} />
      </div>

      <p className="font-stat text-xs uppercase tracking-widest text-ash">
        {picks.size} / 4 selected · {4 - usedTeamIds.size >= 0 ? usedTeamIds.size : 0} teams used
      </p>

      {locked && (
        <p className="border-l-2 border-danger pl-3 font-stat text-xs uppercase tracking-widest text-danger">
          Selections are locked for this day
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((o) => (
          <PlayerPickerCard
            key={o.player_id}
            option={o}
            selected={picks.has(o.player_id)}
            isCaptain={picks.get(o.player_id) ?? false}
            disabled={locked || isDisabled(o)}
            onToggle={() => toggle(o)}
            onCaptain={() => setCaptain(o.player_id)}
          />
        ))}
      </div>

      <p aria-live="polite" className="min-h-5 font-stat text-xs text-danger">{error}</p>
      <Button type="button" onClick={save} disabled={locked || busy} className="w-full sm:w-auto">
        {busy ? "Saving…" : "Save selection"}
      </Button>
    </div>
  );
}