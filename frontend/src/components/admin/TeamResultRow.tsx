"use client";

import Button from "@/components/ui/Button";
import Monogram from "@/components/ui/Monogram";
import type { RoomTeamSummary, Team } from "@/types";
import PointsPreview from "./PointsPreview";

export interface Draft {
  placement: string;
  kills: Record<number, string>;
  firstBloodPlayerId: number | null;
}

export const emptyDraft: Draft = {
  placement: "",
  kills: {},
  firstBloodPlayerId: null,
};

export function draftError(team: Team, d: Draft): string | null {
  const players = team.players ?? [];
  if (players.length === 0) return "No players on this team";
  const p = Number(d.placement);
  if (!Number.isInteger(p) || p < 1 || p > 12)
    return "Placement must be 1 to 12";
  for (const pl of players) {
    const raw = d.kills[pl.id] ?? "";
    const k = raw === "" ? 0 : Number(raw);
    if (!Number.isInteger(k) || k < 0) return `Invalid kills for ${pl.ign}`;
  }
  return null;
}

export function totalKills(team: Team, d: Draft): number {
  return (team.players ?? []).reduce((sum, pl) => {
    const k = Number(d.kills[pl.id] || 0);
    return sum + (Number.isInteger(k) && k > 0 ? k : 0);
  }, 0);
}

interface Props {
  team: Team;
  draft: Draft;
  saved?: RoomTeamSummary;
  duplicate: boolean;
  busy: boolean;
  onChange: (d: Draft) => void;
  onSubmit: () => void;
}

export default function TeamResultRow({
  team,
  draft,
  saved,
  duplicate,
  busy,
  onChange,
  onSubmit,
}: Props) {
  const players = team.players ?? [];
  const err = draft.placement !== "" ? draftError(team, draft) : null;
  const placement =
    Number.isInteger(Number(draft.placement)) && draft.placement !== ""
      ? Number(draft.placement)
      : null;
  const num =
    "chamfer-sm w-full border bg-char px-2 py-3 text-center font-stat text-xl tabular-nums focus:border-ember focus:outline-none";

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit();
        }
      }}
      className={`chamfer border bg-char-2 p-4 ${saved ? "border-bone/30" : draft.placement ? "border-amber/60" : "border-bone/10"}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <Monogram
          label={team.tag || team.name}
          imageUrl={team.logo_url}
          size={44}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-2xl font-extrabold uppercase leading-none">
            {team.name}
          </p>
          <p className="mt-1 font-stat text-[10px] uppercase tracking-widest">
            {saved ? (
              <span className="text-bone">
                ✓ Saved · #{saved.placement} · {saved.total_points} pts
              </span>
            ) : draft.placement ? (
              <span className="text-amber">Unsaved</span>
            ) : (
              <span className="text-ash">Waiting</span>
            )}
          </p>
        </div>
        <PointsPreview placement={placement} kills={totalKills(team, draft)} />
      </div>

      <div className="mt-4 grid grid-cols-[5rem_1fr] gap-4">
        <div>
          <label className="mb-1 block font-stat text-[10px] uppercase tracking-widest text-ash">
            Place
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            value={draft.placement}
            onChange={(e) => onChange({ ...draft, placement: e.target.value })}
            className={`${num} ${duplicate ? "border-amber" : "border-bone/20"}`}
            aria-label={`${team.name} placement`}
          />
        </div>
        <div>
          <label className="mb-1 block font-stat text-[10px] uppercase tracking-widest text-ash">
            Kills per player
          </label>
          {players.length === 0 ? (
            <p className="py-3 font-stat text-xs text-danger">
              No players on this team. Add players first.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {players.map((pl) => (
                <div key={pl.id}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={draft.kills[pl.id] ?? ""}
                    placeholder="0"
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        kills: { ...draft.kills, [pl.id]: e.target.value },
                      })
                    }
                    className={`${num} border-bone/20`}
                    aria-label={`${pl.ign} kills`}
                  />
                  <p className="mt-1 truncate text-center font-stat text-[10px] uppercase text-ash">
                    {pl.ign}
                  </p>
                  <label className="mt-1 flex items-center justify-center gap-1 font-stat text-[9px] uppercase text-ash">
                    <input
                      type="radio"
                      name={`fb-${team.id}`}
                      checked={draft.firstBloodPlayerId === pl.id}
                      onChange={() =>
                        onChange({ ...draft, firstBloodPlayerId: pl.id })
                      }
                    />
                    First blood
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="font-stat text-xs text-danger" aria-live="polite">
          {err ??
            (duplicate ? (
              <span className="text-amber">
                Another team has this placement
              </span>
            ) : (
              ""
            ))}
        </p>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={busy || !draft.placement || !!err}
          className="!px-5 !py-2 !text-base"
        >
          {busy ? "Saving…" : saved ? "Re-submit" : "Submit"}
        </Button>
      </div>
    </div>
  );
}
