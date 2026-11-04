"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError, submitFantasySelection } from "@/lib/api";
import { captainMultiplier } from "@/lib/chips";
import type {
  FantasyChip,
  FantasyChipUse,
  FantasyPlayerDayScore,
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
  breakdown: FantasyPlayerDayScore[];
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
  breakdown,
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

  const scoreByPlayerId = useMemo(
    () => new Map(breakdown.map((score) => [score.player_id, score])),
    [breakdown],
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

  const [chip, setChip] = useState<FantasyChip | null>(() => savedChip || null);

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const marketRef = useRef<HTMLElement>(null);

  function goToMarket() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      searchRef.current?.focus();
    } else {
      marketRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  const [detailId, setDetailId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  const spent = pickedOptions.reduce((sum, o) => sum + o.fantasy_price, 0);

  const remaining = BUDGET - spent;

  const usedTeamIds = new Set(pickedOptions.map((o) => o.team_id));

  const unlimited = chip === "limitless";
  const sameTeamAllowed = chip === "duo_stack";
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

    if (next === "duo_stack") return;

    if (pickedOptions.some((o) => (teamCounts.get(o.team_id) ?? 0) > 1)) {
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
    setError("");

    if (captainId === id) {
      setCaptainId(null);
    }
  }

  function clearAll() {
    if (locked || picked.length === 0) return;

    setSlots(Array.from({ length: SQUAD_SIZE }, () => null));
    setCaptainId(null);
    setError("");
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
          err instanceof ApiError ? err.message : "Failed to save selection",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  if (pool.length === 0) {
    return <EmptyState title="No players available" />;
  }

  const detailOption = detailId !== null ? (byId.get(detailId) ?? null) : null;

  const confirmInner = (
    <>
              <p
                aria-live="polite"
                className={`text-center font-stat text-[11px] text-danger ${
                  error ? "mb-2" : ""
                }`}
              >
                {error}
              </p>

              <div className="flex flex-wrap items-stretch gap-2 sm:gap-3">
                <div className="flex shrink-0 items-center divide-x divide-bone/10 border border-bone/10 bg-char">
                  <div className="px-3 py-1.5">
                    <p className="font-stat text-[8px] uppercase tracking-widest text-ash">
                      Teams
                    </p>
                    <p className="font-display text-base font-black leading-tight">
                      {usedTeamIds.size}
                    </p>
                  </div>
                  <div className="px-3 py-1.5">
                    <p className="font-stat text-[8px] uppercase tracking-widest text-ash">
                      Left
                    </p>
                    <p
                      className={`font-display text-base font-black leading-tight ${
                        unlimited
                          ? "text-ember"
                          : remaining < 0
                            ? "text-danger"
                            : "text-bone"
                      }`}
                    >
                      {unlimited ? "∞" : `$${remaining.toFixed(1)}M`}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={save}
                  disabled={locked || busy}
                  className="min-w-[9rem] flex-1 !px-4 !py-2 !text-base"
                >
                  {busy
                    ? "Saving squad…"
                    : locked
                      ? "Selection locked"
                      : picked.length < SQUAD_SIZE
                        ? `Select ${SQUAD_SIZE - picked.length} more`
                        : "Confirm squad →"}
                </Button>
              </div>
                </>
  );

  return (
    <>
      <div className="grid gap-4 pb-24 lg:pb-0 lg:grid-cols-[minmax(17rem,19rem)_minmax(0,1fr)] xl:grid-cols-[minmax(18.75rem,23.75rem)_minmax(0,1fr)] lg:items-start">
        {/* ───────── Player market ───────── */}
        <section ref={marketRef} className="order-2 min-w-0 scroll-mt-28 lg:sticky lg:top-[7.25rem] lg:order-1 lg:h-[calc(100vh_-_8.5rem)] lg:min-h-[26rem]">
          <div className="flex h-full flex-col overflow-hidden chamfer-sm border border-bone/10 bg-char-2">
            <div className="shrink-0 border-b border-bone/10 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-ember shadow-[0_0_10px_rgba(255,100,40,.8)]" />
                  <p className="font-display text-lg font-black uppercase leading-none">
                    Player market
                  </p>
                </div>
                <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
                  <span className="text-ember">{list.length}</span> available
                </p>
              </div>

              <div className="relative mt-2.5">
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="SEARCH PLAYER OR TEAM..."
                  className="w-full chamfer-sm border border-bone/15 bg-char px-3 py-2 pr-9 font-stat text-[10px] uppercase tracking-wider text-bone outline-none transition placeholder:text-ash/50 focus:border-ember"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base text-ash">
                  ⌕
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="font-stat text-[8px] uppercase tracking-[0.2em] text-ash">
                  Highest value first
                </p>
                <p className="font-stat text-[8px] uppercase tracking-[0.2em] text-ash/50">
                  Click a player for details
                </p>
              </div>
            </div>

            <div className="max-h-[55vh] min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2 lg:max-h-none">
              {list.length === 0 ? (
                <div className="px-4 py-10 text-center">
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
        </section>

        {/* ───────── Lineup ───────── */}
        <section className="order-1 min-w-0 lg:sticky lg:top-[7.25rem] lg:order-2">
          <div className="overflow-hidden chamfer-sm border border-bone/10 bg-char-2">
            {/* header */}
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_10px_rgba(255,100,40,.8)]" />
                <p className="font-display text-lg font-black uppercase leading-none">
                  Your lineup
                </p>
                <span className="font-display text-lg font-black leading-none">
                  <span className="text-ember">{picked.length}</span>
                  <span className="text-ash/40">/{SQUAD_SIZE}</span>
                </span>
              </div>

              {!locked && (
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={picked.length === 0}
                  className="chamfer-sm border border-bone/25 px-2.5 py-1 font-stat text-[9px] font-bold uppercase tracking-widest text-bone transition hover:border-danger/60 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-bone/25 disabled:hover:text-bone"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="h-0.5 bg-char">
              <div
                className="h-full bg-ember transition-all duration-500"
                style={{
                  width: `${Math.min(100, (picked.length / SQUAD_SIZE) * 100)}%`,
                }}
              />
            </div>

            {/* budget + chips */}
            <div className="space-y-3 border-b border-bone/10 px-3 py-3 sm:px-4">
              <BudgetBar spent={spent} unlimited={unlimited} />
              <ChipPicker
                chip={chip}
                used={chipsUsed}
                dayId={dayId}
                locked={locked}
                onChange={changeChip}
              />
            </div>

            {locked && (
              <div className="flex items-center gap-2 border-b border-danger/20 bg-danger/[0.05] px-3 py-2 sm:px-4">
                <span aria-hidden="true" className="text-danger">
                  🔒
                </span>
                <p className="font-stat text-[9px] uppercase tracking-widest text-danger">
                  Locked for this day
                  {lockTime
                    ? ` · deadline was ${new Date(lockTime).toUTCString()}`
                    : " · play has already started"}
                </p>
              </div>
            )}

            {/* cards */}
            <div className="relative px-3 py-3 sm:px-4">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/[0.04] blur-3xl" />
              </div>

              <div className="relative mx-auto grid max-w-[21.25rem] grid-cols-2 gap-x-3 gap-y-3 sm:max-w-none sm:grid-cols-4 sm:gap-x-3">
                {slots.map((id, index) => {
                  const player = id !== null ? byId.get(id) : undefined;

                  if (!player) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="mx-auto w-full max-w-[10.625rem] min-w-0 lg:max-w-[clamp(7rem,calc((100vh_-_27rem)_*_0.667),10.625rem)]"
                      >
                        <button
                          type="button"
                          disabled={locked}
                          onClick={goToMarket}
                          className="group relative block w-full overflow-hidden chamfer-sm border border-dashed border-bone/15 bg-char/60 text-left transition duration-300 hover:border-ember/50 hover:bg-ember/[0.025] disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ aspectRatio: "1024 / 1536" }}
                        >
                          <div className="absolute left-2 top-2 flex h-5 min-w-5 items-center justify-center border border-bone/10 bg-char-2 px-1 font-stat text-[8px] font-bold text-ash">
                            0{index + 1}
                          </div>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-bone/20 bg-char transition group-hover:border-ember/60 group-hover:bg-ember/10">
                              <span className="font-display text-2xl font-light leading-none text-ash transition group-hover:text-ember">
                                +
                              </span>
                            </div>
                            <p className="mt-2.5 font-stat text-[8px] uppercase tracking-[0.2em] text-ash transition group-hover:text-bone">
                              Add player
                            </p>
                          </div>
                        </button>
                        {!locked && <div className="mt-1.5 h-9 lg:h-7" />}
                      </div>
                    );
                  }

                  const isCaptain = player.player_id === captain;
                  const score = scoreByPlayerId.get(player.player_id);

                  return (
                    <div
                      key={`player-${player.player_id}`}
                      className="mx-auto w-full max-w-[10.625rem] min-w-0 lg:max-w-[clamp(7rem,calc((100vh_-_27rem)_*_0.667),10.625rem)]"
                    >
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
                            Math.round(80 + player.fantasy_price * 0.35),
                          ),
                        )}
                        price={player.fantasy_price}
                        selected={true}
                        captain={isCaptain}
                        form={player.form}
                        stats={{
                          kills: score?.kills,
                          fantasyPoints: score?.final_points,
                        }}
                        onClick={() => setDetailId(player.player_id)}
                        disabled={locked}
                      />

                      {!locked && (
                        <div className="mt-1.5 flex h-9 gap-1 lg:h-7">
                          <button
                            type="button"
                            onClick={() => makeCaptain(player.player_id)}
                            aria-pressed={isCaptain}
                            title={
                              isCaptain
                                ? "Captain"
                                : `Make ${player.ign} captain`
                            }
                            className={`flex min-w-0 flex-1 items-center justify-center gap-1 chamfer-sm border font-stat text-[9px] font-black uppercase tracking-wider transition-all ${
                              isCaptain
                                ? "border-ember bg-ember text-char"
                                : "border-bone/25 bg-char text-bone hover:border-ember hover:bg-ember/15 hover:text-ember"
                            }`}
                          >
                            <span className="text-[11px] leading-none">
                              {isCaptain ? "★" : "☆"}
                            </span>
                            <span className="truncate">Captain</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => remove(player.player_id)}
                            className="flex w-9 shrink-0 items-center justify-center border border-bone/25 bg-char text-lg lg:w-7 lg:text-base leading-none text-bone transition hover:border-danger/60 hover:text-danger"
                            aria-label={`Remove ${player.ign}`}
                            title={`Remove ${player.ign}`}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="relative mt-3 flex items-center justify-center gap-2 font-stat text-[9px] uppercase tracking-[0.18em] text-ash">
                <span className="text-ember">★</span>
                Captain scores <span className="text-ember">{multiplier}x points</span>
              </p>
            </div>

            {/* footer: desktop only (mobile uses the fixed bar below) */}
            <div className="hidden border-t border-bone/10 px-3 py-3 sm:px-4 lg:block">
              {confirmInner}
            </div>
          </div>
        </section>
      </div>

      {/* Mobile / tablet: confirm bar stays reachable while scrolling the market */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-bone/15 bg-char/95 px-3 pt-2.5 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-2xl">{confirmInner}</div>
      </div>

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
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/[0.08] blur-[120px]" />

          <div
            className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="absolute -right-2 -top-2 z-[110] flex h-10 w-10 items-center justify-center chamfer-sm border border-bone/20 bg-char-2 text-bone shadow-xl transition hover:border-ember hover:bg-ember hover:text-char"
                aria-label="Close player details"
              >
                <span className="text-xl leading-none">×</span>
              </button>

              <PlayerDetailCard
                option={detailOption}
                onClose={() => setDetailId(null)}
                action={{
                  label: picked.includes(detailOption.player_id)
                    ? "Remove from team"
                    : "Add to team",
                  disabled:
                    locked ||
                    (!picked.includes(detailOption.player_id) &&
                      !!blockedReason(detailOption)),
                  hint: blockedReason(detailOption) ?? undefined,
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
