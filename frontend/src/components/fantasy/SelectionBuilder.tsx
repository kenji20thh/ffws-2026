"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError, submitFantasySelection } from "@/lib/api";
import { captainMultiplier } from "@/lib/chips";
import type { FantasyChip, FantasyChipUse, FantasySelectionEntry, PoolPlayer } from "@/types";
import BudgetBar from "./BudgetBar";
import ChipPicker from "./ChipPicker";
import FormationBoard, { SlotPlayer } from "./FormationBoard";
import PlayerDetailCard from "./PlayerDetailCard";
import PlayerListRow from "./PlayerListRow";

const SQUAD_SIZE = 4;
const BUDGET = 100;

interface Props {
  tournamentId: number;
  dayId: number;
  pool: PoolPlayer[];
  existing: FantasySelectionEntry[];
  locked: boolean;
  lockTime?: string | null;
  chip?: FantasyChip | "" | null; // chip already saved for this day
  chipsUsed?: FantasyChipUse[]; // chips played on any day
  onSaved: () => void;
}

export default function SelectionBuilder({
  tournamentId,
  dayId,
  pool,
  existing,
  locked,
  lockTime,
  chip: savedChip,
  chipsUsed = [],
  onSaved,
}: Props) {
  const byId = useMemo(() => new Map(pool.map((o) => [o.player_id, o])), [pool]);

  // Four fixed slots (null = empty). Existing picks fill them in order.
  const [slots, setSlots] = useState<(number | null)[]>(() => {
    const ids = existing
      .map((s) => s.player_id)
      .filter((id) => byId.has(id))
      .slice(0, SQUAD_SIZE);
    return Array.from({ length: SQUAD_SIZE }, (_, i) => ids[i] ?? null);
  });
  const [captainId, setCaptainId] = useState<number | null>(
    () => existing.find((s) => s.is_captain)?.player_id ?? null,
  );
  const [chip, setChip] = useState<FantasyChip | null>(() => savedChip || null);
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Esc closes the player card
  useEffect(() => {
    if (detailId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailId]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pool
      .filter((o) => !q || o.ign.toLowerCase().includes(q) || o.team_name.toLowerCase().includes(q))
      .sort((a, b) => b.fantasy_price - a.fantasy_price || a.ign.localeCompare(b.ign));
  }, [pool, search]);

  const picked = slots.filter((id): id is number => id !== null);
  const pickedOptions = picked.map((id) => byId.get(id)).filter((o): o is PoolPlayer => !!o);
  const spent = pickedOptions.reduce((s, o) => s + o.fantasy_price, 0);
  const usedTeamIds = new Set(pickedOptions.map((o) => o.team_id));
  const unlimited = chip === "limitless";
  const sameTeamAllowed = chip === "same_team";
  const multiplier = captainMultiplier(chip);
  const teamCounts = new Map<number, number>();
  pickedOptions.forEach((o) => teamCounts.set(o.team_id, (teamCounts.get(o.team_id) ?? 0) + 1));
  const pairs = [...teamCounts.values()].filter((n) => n === 2).length;
  // The first pick is captain until the user chooses someone else.
  const captain = captainId !== null && picked.includes(captainId) ? captainId : (picked[0] ?? null);

  function blockedReason(o: PoolPlayer): string | null {
    if (locked) return "Selections are locked for this day";
    if (picked.includes(o.player_id)) return null;
    if (picked.length >= SQUAD_SIZE) return "Your squad is full";
    if (usedTeamIds.has(o.team_id)) {
      if (!sameTeamAllowed) return "You already picked a player from this team";
      if ((teamCounts.get(o.team_id) ?? 0) >= 2) return "At most 2 players from one team";
      if (pairs >= 1) return "Same Team allows only one pair";
    }
    return null;
  }

  function changeChip(next: FantasyChip | null) {
    if (locked) return;
    setChip(next);
    setError("");
    if (next === "same_team") return;
    // Without Same Team, only one player per team: drop the later pick of any pair.
    if (pickedOptions.some((o) => (teamCounts.get(o.team_id) ?? 0) > 1)) {
      setSlots((prev) => {
        const seen = new Set<number>();
        return prev.map((id) => {
          if (id === null) return null;
          const o = byId.get(id);
          if (!o || seen.has(o.team_id)) return null;
          seen.add(o.team_id);
          return id;
        });
      });
      setError("Removed a player: without the Same Team chip you can only pick one player per team.");
    }
  }

  function remove(id: number) {
    if (locked) return;
    setSlots((prev) => prev.map((x) => (x === id ? null : x)));
    if (captainId === id) setCaptainId(null);
  }

  function toggle(o: PoolPlayer) {
    if (locked) return;
    if (picked.includes(o.player_id)) return remove(o.player_id);
    if (blockedReason(o)) return;
    setError("");
    setSlots((prev) => {
      const i = prev.indexOf(null);
      if (i === -1) return prev;
      const next = [...prev];
      next[i] = o.player_id;
      return next;
    });
  }

  function makeCaptain(id: number) {
    if (locked) return;
    setCaptainId(id);
  }

  async function save() {
    if (picked.length !== SQUAD_SIZE) {
      setError("Pick exactly 4 players.");
      return;
    }
    if (captain === null) {
      setError("Choose a captain.");
      return;
    }
    if (!unlimited && spent > BUDGET) {
      setError("You're over the $100 budget.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await submitFantasySelection(
        tournamentId,
        dayId,
        picked.map((player_id) => ({ player_id, is_captain: player_id === captain })),
        chip,
      );
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Your session expired. Please log in again.");
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to save selection");
      }
    } finally {
      setBusy(false);
    }
  }

  if (pool.length === 0) return <EmptyState title="No players available" />;

  const slotData: (SlotPlayer | null)[] = slots.map((id) => {
    const o = id !== null ? byId.get(id) : undefined;
    if (!o) return null;
    return {
      id: o.player_id,
      name: o.ign,
      role: o.role,
      photoUrl: o.photo_url,
      price: o.fantasy_price,
      captain: o.player_id === captain,
    };
  });

  const detailOption = detailId !== null ? (byId.get(detailId) ?? null) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
      {/* LEFT: players, most expensive first */}
      <section className="order-2 space-y-3 lg:order-1">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search player or team…"
          className="chamfer-sm w-full border border-bone/20 bg-char-2 px-4 py-3 font-stat text-sm placeholder:text-ash focus:border-ember focus:outline-none"
        />
        <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
          {list.length} players · highest price first
        </p>
        <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
          {list.length === 0 ? (
            <p className="py-6 text-center font-stat text-xs uppercase tracking-widest text-ash">No players match</p>
          ) : (
            list.map((o) => (
              <PlayerListRow
                key={o.player_id}
                option={o}
                selected={picked.includes(o.player_id)}
                active={detailId === o.player_id}
                blockedReason={blockedReason(o)}
                onOpen={() => setDetailId(o.player_id)}
                onToggle={() => toggle(o)}
              />
            ))
          )}
        </div>
      </section>

      {/* MIDDLE: your squad */}
      <section className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-20">
        <BudgetBar spent={spent} unlimited={unlimited} />
        <ChipPicker chip={chip} used={chipsUsed} dayId={dayId} locked={locked} onChange={changeChip} />
        <p className="font-stat text-xs uppercase tracking-widest text-ash">
          {picked.length} / {SQUAD_SIZE} selected · {usedTeamIds.size} {usedTeamIds.size === 1 ? "team" : "teams"} used
        </p>

        {locked ? (
          <p className="border-l-2 border-danger pl-3 font-stat text-xs uppercase tracking-widest text-danger">
            Selections are locked for this day ·{" "}
            {lockTime
              ? `deadline was ${new Date(lockTime).toUTCString()}`
              : "play has already started and no deadline is set"}
          </p>
        ) : lockTime ? (
          <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
            Picks lock at {new Date(lockTime).toUTCString()}
          </p>
        ) : null}

        <FormationBoard
          slots={slotData}
          onSelect={locked ? undefined : makeCaptain}
          onRemove={locked ? undefined : remove}
          emptyLabel="Add a player"
          captainMultiplier={multiplier}
        />
        <p className="text-center font-stat text-[10px] uppercase tracking-widest text-ash">
          Click a player to make him captain ({multiplier}x points)
        </p>

        <p aria-live="polite" className="min-h-5 font-stat text-xs text-danger">
          {error}
        </p>
        <Button type="button" onClick={save} disabled={locked || busy} className="w-full">
          {busy ? "Saving…" : "Save selection"}
        </Button>
      </section>

      {/* RIGHT: player card (full-screen overlay on small screens) */}
      <section className={`order-3 ${detailOption ? "" : "hidden lg:block"}`}>
        {detailOption ? (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setDetailId(null); // click the dark backdrop to close
            }}
            className="fixed inset-0 z-50 overflow-y-auto bg-char/95 p-4 lg:static lg:z-auto lg:overflow-visible lg:bg-transparent lg:p-0"
          >
            <PlayerDetailCard
              option={detailOption}
              onClose={() => setDetailId(null)}
              action={{
                label: picked.includes(detailOption.player_id) ? "Remove from team" : "Add to team",
                disabled: locked || (!picked.includes(detailOption.player_id) && !!blockedReason(detailOption)),
                hint: blockedReason(detailOption) ?? undefined,
                onClick: () => toggle(detailOption),
              }}
            />
          </div>
        ) : (
          <div className="chamfer flex min-h-[16rem] items-center justify-center border border-dashed border-bone/15 bg-char-2/40 p-6 text-center">
            <p className="font-stat text-xs uppercase tracking-widest text-ash">
              Click a player to see his stats, fantasy points and history
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
