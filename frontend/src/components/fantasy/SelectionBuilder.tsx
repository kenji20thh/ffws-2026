"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError, submitFantasySelection } from "@/lib/api";
import { captainMultiplier } from "@/lib/chips";
import type {
  FantasyChip,
  FantasyChipUse,
  FantasySelectionEntry,
  PoolPlayer,
} from "@/types";
import BudgetBar from "./BudgetBar";
import ChipPicker from "./ChipPicker";
import FantasyPlayerCard from "./FantasyPlayerCard";
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
  chip?: FantasyChip | "" | null;
  chipsUsed?: FantasyChipUse[];
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
  const byId = useMemo(
    () => new Map(pool.map((o) => [o.player_id, o])),
    [pool],
  );

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

  const [chip, setChip] = useState<FantasyChip | null>(
    () => savedChip || null,
  );

  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /*
   * Close player detail with Escape.
   */
  useEffect(() => {
    if (detailId === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetailId(null);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [detailId]);

  /*
   * Prevent the page behind the player detail modal from scrolling.
   */
  useEffect(() => {
    if (detailId === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [detailId]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();

    return pool
      .filter(
        (o) =>
          !q ||
          o.ign.toLowerCase().includes(q) ||
          o.team_name.toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          b.fantasy_price - a.fantasy_price || a.ign.localeCompare(b.ign),
      );
  }, [pool, search]);

  const picked = slots.filter((id): id is number => id !== null);

  const pickedOptions = picked
    .map((id) => byId.get(id))
    .filter((o): o is PoolPlayer => !!o);

  const spent = pickedOptions.reduce(
    (sum, o) => sum + o.fantasy_price,
    0,
  );

  const remaining = BUDGET - spent;

  const usedTeamIds = new Set(pickedOptions.map((o) => o.team_id));

  const unlimited = chip === "limitless";
  const sameTeamAllowed = chip === "Duo_stack";
  const multiplier = captainMultiplier(chip);

  const teamCounts = new Map<number, number>();

  pickedOptions.forEach((o) => {
    teamCounts.set(o.team_id, (teamCounts.get(o.team_id) ?? 0) + 1);
  });

  const pairs = [...teamCounts.values()].filter((n) => n === 2).length;

  const captain =
    captainId !== null && picked.includes(captainId)
      ? captainId
      : (picked[0] ?? null);

  function blockedReason(o: PoolPlayer): string | null {
    if (locked) return "Selections are locked for this day";

    if (picked.includes(o.player_id)) return null;

    if (picked.length >= SQUAD_SIZE) {
      return "Your squad is full";
    }

    if (usedTeamIds.has(o.team_id)) {
      if (!sameTeamAllowed) {
        return "You already picked a player from this team";
      }

      if ((teamCounts.get(o.team_id) ?? 0) >= 2) {
        return "At most 2 players from one team";
      }

      if (pairs >= 1) {
        return "Duo Stack allows only one pair";
      }
    }

    return null;
  }

  function changeChip(next: FantasyChip | null) {
    if (locked) return;

    setChip(next);
    setError("");

    if (next === "Duo_stack") return;

    if (
      pickedOptions.some(
        (o) => (teamCounts.get(o.team_id) ?? 0) > 1,
      )
    ) {
      setSlots((prev) => {
        const seen = new Set<number>();

        return prev.map((id) => {
          if (id === null) return null;

          const o = byId.get(id);

          if (!o || seen.has(o.team_id)) {
            return null;
          }

          seen.add(o.team_id);
          return id;
        });
      });

      setError(
        "Removed a player: without the Same Team chip you can only pick one player per team.",
      );
    }
  }

  function remove(id: number) {
    if (locked) return;

    setSlots((prev) => prev.map((x) => (x === id ? null : x)));

    if (captainId === id) {
      setCaptainId(null);
    }
  }

  function toggle(o: PoolPlayer) {
    if (locked) return;

    if (picked.includes(o.player_id)) {
      remove(o.player_id);
      return;
    }

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
        picked.map((player_id) => ({
          player_id,
          is_captain: player_id === captain,
        })),
        chip,
      );

      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Your session expired. Please log in again.");
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "Failed to save selection",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  if (pool.length === 0) {
    return <EmptyState title="No players available" />;
  }

  const detailOption =
    detailId !== null ? (byId.get(detailId) ?? null) : null;

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(260px,0.85fr)_minmax(560px,1.5fr)] lg:items-start">
        {/* PLAYER MARKET */}
        <section className="order-2 min-w-0 lg:order-1">
          <div className="overflow-hidden chamfer border border-bone/10 bg-char-2">
            {/* Market header */}
            <div className="border-b border-bone/10 px-5 py-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-ember shadow-[0_0_10px_rgba(255,100,40,.8)]" />

                    <p className="font-stat text-[9px] font-bold uppercase tracking-[0.25em] text-ash">
                      Player market
                    </p>
                  </div>

                  <p className="mt-2 font-display text-2xl font-black uppercase">
                    Choose your squad
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-stat text-[8px] uppercase tracking-widest text-ash">
                    Available
                  </p>

                  <p className="mt-1 font-display text-xl font-black text-ember">
                    {list.length}
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mt-5">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="SEARCH PLAYER OR TEAM..."
                  className="w-full chamfer-sm border border-bone/15 bg-char px-4 py-3.5 pr-10 font-stat text-[10px] uppercase tracking-wider text-bone outline-none transition placeholder:text-ash/50 focus:border-ember"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-ash">
                  ⌕
                </span>
              </div>
            </div>

            {/* Player list */}
            <div className="p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="font-stat text-[8px] uppercase tracking-[0.2em] text-ash">
                  Highest value first
                </p>

                <p className="font-stat text-[8px] uppercase tracking-[0.2em] text-ash/50">
                  Click player for details
                </p>
              </div>

              <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
                {list.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <p className="font-display text-lg font-black uppercase text-bone/60">
                      No players found
                    </p>

                    <p className="mt-2 font-stat text-[9px] uppercase tracking-widest text-ash">
                      Try another player or team
                    </p>
                  </div>
                ) : (
                  list.map((o) => (
                    <PlayerListRow
                      key={o.player_id}
                      option={o}
                      selected={picked.includes(o.player_id)}
                      active={false}
                      blockedReason={blockedReason(o)}
                      onOpen={() => setDetailId(o.player_id)}
                      onToggle={() => toggle(o)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SQUAD BUILDER */}
        <section className="order-1 min-w-0 space-y-5 lg:order-2 lg:sticky lg:top-20">
          {/* Budget + chips */}
          <div className="space-y-3">
            <BudgetBar spent={spent} unlimited={unlimited} />

            <ChipPicker
              chip={chip}
              used={chipsUsed}
              dayId={dayId}
              locked={locked}
              onChange={changeChip}
            />
          </div>

          {/* Squad header */}
          <div className="overflow-hidden chamfer border border-bone/10 bg-char-2">
            <div className="flex items-center justify-between px-5 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_10px_rgba(255,100,40,.8)]" />

                  <p className="font-stat text-[9px] uppercase tracking-[0.25em] text-ash">
                    Your lineup
                  </p>
                </div>

                <p className="mt-2 font-display text-2xl font-black uppercase">
                  Ultimate Squad
                </p>
              </div>

              <div className="text-right">
                <p className="font-stat text-[8px] uppercase tracking-widest text-ash">
                  Players
                </p>

                <p className="mt-1 font-display text-3xl font-black leading-none">
                  <span className="text-ember">{picked.length}</span>
                  <span className="text-ash/40">
                    {" "}
                    / {SQUAD_SIZE}
                  </span>
                </p>
              </div>
            </div>

            <div className="h-1 bg-char">
              <div
                className="h-full bg-ember transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (picked.length / SQUAD_SIZE) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Lock message */}
          {locked ? (
            <div className="flex items-center gap-3 border border-danger/20 bg-danger/[0.04] px-4 py-3">
              <span className="text-danger">🔒</span>

              <p className="font-stat text-[9px] uppercase tracking-widest text-danger">
                Selections are locked for this day
                {lockTime
                  ? ` · deadline was ${new Date(
                      lockTime,
                    ).toUTCString()}`
                  : " · play has already started"}
              </p>
            </div>
          ) : lockTime ? (
            <div className="flex items-center justify-between border border-bone/10 bg-char-2 px-4 py-3">
              <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
                Selection deadline
              </p>

              <p className="font-stat text-[9px] uppercase tracking-widest text-ember">
                {new Date(lockTime).toUTCString()}
              </p>
            </div>
          ) : null}

          {/* CARD BOARD */}
          <div className="relative overflow-hidden chamfer border border-bone/10 bg-char-2 p-4 sm:p-6">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/[0.035] blur-3xl" />

              <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgba(255,255,255,.8) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />
            </div>

            <div className="relative">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_10px_rgba(255,100,40,.8)]" />

                  <span className="font-stat text-[9px] uppercase tracking-[0.25em] text-ash">
                    Starting lineup
                  </span>
                </div>

                <span className="font-stat text-[9px] uppercase tracking-widest text-ash">
                  2 × 2
                </span>
              </div>

              {/* Four cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {slots.map((id, index) => {
                  const player =
                    id !== null ? byId.get(id) : undefined;

                  if (!player) {
                    return (
                      <button
                        key={`empty-${index}`}
                        type="button"
                        disabled={locked}
                        onClick={() => {
                          document
                            .querySelector<HTMLInputElement>(
                              'input[placeholder="SEARCH PLAYER OR TEAM..."]',
                            )
                            ?.focus();
                        }}
                        className="group relative w-full overflow-hidden chamfer-sm border border-dashed border-bone/15 bg-char/60 text-left transition duration-300 hover:border-ember/50 hover:bg-ember/[0.025] disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ aspectRatio: "932 / 1480" }}
                      >
                        <div className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center border border-bone/10 bg-char-2 font-stat text-[10px] font-bold text-ash">
                          0{index + 1}
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-bone/20 bg-char transition group-hover:border-ember/60 group-hover:bg-ember/10">
                            <span className="font-display text-3xl font-light text-ash transition group-hover:text-ember">
                              +
                            </span>
                          </div>

                          <p className="mt-4 font-stat text-[9px] uppercase tracking-[0.25em] text-ash transition group-hover:text-bone">
                            Add player
                          </p>

                          <p className="mt-1 font-stat text-[8px] uppercase tracking-widest text-ash/50">
                            Slot {index + 1}
                          </p>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bone/20 to-transparent" />
                      </button>
                    );
                  }

                  const isCaptain = player.player_id === captain;

                  /*
                   * The new FIFA-style card is intentionally kept separate from
                   * the remove/captain controls. This prevents nested <button>
                   * elements and lets FantasyPlayerCard handle its own scaling,
                   * artwork and selected state cleanly.
                   */
                  return (
                    <div
                      key={player.player_id}
                      className={`relative min-w-0 ${
                        isCaptain
                          ? "drop-shadow-[0_0_22px_rgba(255,90,31,0.16)]"
                          : ""
                      }`}
                    >
                      {/* Player card */}
                      <FantasyPlayerCard
                        size="fluid"
                        player={{
                          ign: player.ign,
                          role: player.role,
                          country: player.country,
                          photo_url: player.photo_url,
                        }}
                        team={{
                          name: player.team_name,
                          tag: player.team_tag,
                          logo_url: player.team_logo_url,
                        }}
                        overall={Math.min(
                          99,
                          Math.max(
                            70,
                            Math.round(
                              80 +
                                player.fantasy_price * 0.35,
                            ),
                          ),
                        )}
                        price={player.fantasy_price}
                        selected={true}
                        captain={isCaptain}
                        onClick={() =>
                          setDetailId(player.player_id)
                        }
                        disabled={locked}
                      />

                      {/* Slot number */}
                      <div className="pointer-events-none absolute left-[7%] top-[6%] z-20 flex h-7 min-w-7 items-center justify-center border border-bone/15 bg-char/70 px-2 backdrop-blur-sm">
                        <span className="font-stat text-[8px] font-bold text-ash">
                          0{index + 1}
                        </span>
                      </div>

                      {/* Remove */}
                      {!locked && (
                        <button
                          type="button"
                          onClick={() =>
                            remove(player.player_id)
                          }
                          className="absolute bottom-[5%] right-[5%] z-30 flex h-8 w-8 items-center justify-center border border-bone/15 bg-char/80 text-ash opacity-0 backdrop-blur-sm transition hover:border-danger/50 hover:text-danger group-hover:opacity-100"
                          aria-label={`Remove ${player.ign}`}
                        >
                          ×
                        </button>
                      )}

                      {/* Captain control */}
                      {!locked && (
                        <button
                          type="button"
                          onClick={() =>
                            makeCaptain(player.player_id)
                          }
                          className={`absolute left-[7%] top-[14%] z-30 flex items-center gap-1.5 chamfer-sm border px-2.5 py-1.5 font-stat text-[8px] font-black uppercase tracking-wider backdrop-blur-md transition-all ${
                            isCaptain
                              ? "border-ember bg-ember text-char shadow-[0_0_18px_rgba(255,100,40,.35)]"
                              : "border-bone/25 bg-char/80 text-bone hover:border-ember hover:bg-ember/15 hover:text-ember"
                          }`}
                        >
                          <span className="text-xs leading-none">
                            ★
                          </span>

                          <span>
                            {isCaptain
                              ? "Captain"
                              : "Make Captain"}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 border-t border-bone/10 pt-4">
                <span className="text-ember">★</span>

                <p className="font-stat text-[9px] uppercase tracking-[0.18em] text-ash">
                  Select a captain for{" "}
                  <span className="text-ember">
                    {multiplier}x points
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Squad summary */}
          <div className="grid grid-cols-3 overflow-hidden chamfer border border-bone/10 bg-char-2">
            <div className="border-r border-bone/10 px-4 py-4">
              <p className="font-stat text-[8px] uppercase tracking-widest text-ash">
                Squad
              </p>

              <p className="mt-1 font-display text-lg font-black">
                {picked.length}/{SQUAD_SIZE}
              </p>
            </div>

            <div className="border-r border-bone/10 px-4 py-4">
              <p className="font-stat text-[8px] uppercase tracking-widest text-ash">
                Teams
              </p>

              <p className="mt-1 font-display text-lg font-black">
                {usedTeamIds.size}
              </p>
            </div>

            <div className="px-4 py-4">
              <p className="font-stat text-[8px] uppercase tracking-widest text-ash">
                Remaining
              </p>

              <p
                className={`mt-1 font-display text-lg font-black ${
                  unlimited
                    ? "text-ember"
                    : remaining < 0
                      ? "text-danger"
                      : "text-bone"
                }`}
              >
                {unlimited
                  ? "∞"
                  : `$${remaining.toFixed(1)}M`}
              </p>
            </div>
          </div>

          {/* Error */}
          <p
            aria-live="polite"
            className="min-h-5 text-center font-stat text-xs text-danger"
          >
            {error}
          </p>

          {/* Save */}
          <Button
            type="button"
            onClick={save}
            disabled={locked || busy}
            className="w-full"
          >
            {busy
              ? "Saving squad…"
              : locked
                ? "Selection locked"
                : picked.length < SQUAD_SIZE
                  ? `Select ${
                      SQUAD_SIZE - picked.length
                    } more`
                  : "Confirm squad →"}
          </Button>
        </section>
      </div>

      {/* PLAYER DETAIL OVERLAY */}
      {detailOption && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-char/75 p-4 backdrop-blur-md sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setDetailId(null);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${detailOption.ign} player details`}
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/[0.08] blur-[120px]" />

          {/* Modal card */}
          <div
            className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="absolute -right-2 -top-2 z-[110] flex h-10 w-10 items-center justify-center chamfer-sm border border-bone/20 bg-char-2 text-bone shadow-xl transition hover:border-ember hover:bg-ember hover:text-char"
                aria-label="Close player details"
              >
                <span className="text-xl leading-none">
                  ×
                </span>
              </button>

              <PlayerDetailCard
                option={detailOption}
                onClose={() => setDetailId(null)}
                action={{
                  label: picked.includes(
                    detailOption.player_id,
                  )
                    ? "Remove from team"
                    : "Add to team",
                  disabled:
                    locked ||
                    (!picked.includes(
                      detailOption.player_id,
                    ) &&
                      !!blockedReason(detailOption)),
                  hint:
                    blockedReason(detailOption) ??
                    undefined,
                  onClick: () => toggle(detailOption),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}