import { TONE_COLOR, type StageDef } from "@/lib/tournamentFormat";

function rankLabel(from: number, to: number) {
  return from === to ? `#${from}` : `#${from}–${to}`;
}

/** Explains who plays a stage/day and where each finishing position goes (colour-coded). */
export function StageRules({ def, compact = false }: { def: StageDef; compact?: boolean }) {
  return (
    <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
      <div className="border border-char-3 bg-char p-3">
        <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ash">Who plays · {def.size} teams</p>
        <ul className="mt-2 space-y-1.5">
          {def.entrants.map((e) => (
            <li key={e.label} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-bone">
                {e.label}
                {e.note && <span className="ml-2 text-xs text-ash">{e.note}</span>}
              </span>
              <span className="font-stat text-xs tabular-nums text-ash">×{e.count}</span>
            </li>
          ))}
        </ul>
      </div>

      {def.outcomes.length > 0 && (
        <div className="border border-char-3 bg-char p-3">
          <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ash">Where each place goes</p>
          <ul className="mt-2 space-y-1.5">
            {def.outcomes.map((o) => (
              <li
                key={`${o.from}-${o.to}`}
                className="flex items-center justify-between gap-3 border-l-4 py-1 pl-3 pr-2"
                style={{ borderColor: TONE_COLOR[o.tone], backgroundColor: `${TONE_COLOR[o.tone]}14` }}
              >
                <span className="font-stat text-xs font-bold tabular-nums text-bone">{rankLabel(o.from, o.to)}</span>
                <span className="text-right font-stat text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE_COLOR[o.tone] }}>
                  {o.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TbaTile({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 border border-dashed border-bone/15 bg-char-2 py-1.5 pl-2 pr-4">
      <span className="flex h-8 w-8 items-center justify-center bg-char-3 font-display text-sm font-black text-bone/30">?</span>
      <span className="min-w-0">
        <span className="block font-display text-lg font-bold uppercase leading-5 text-bone/40">TBA</span>
        <span className="block font-stat text-[9px] uppercase tracking-widest text-ash">{label}</span>
      </span>
    </li>
  );
}

/** Placeholder slots for teams that are not known yet, grouped by where they come from. */
export function TbaSlots({ def, filled = 0 }: { def: StageDef; filled?: number }) {
  // Some teams already assigned: just pad the rest with plain TBA tiles.
  if (filled > 0) {
    const missing = Math.max(0, def.size - filled);
    if (missing === 0) return null;
    return <ul className="flex flex-wrap gap-3">{Array.from({ length: missing }, (_, i) => <TbaTile key={i} label="To be announced" />)}</ul>;
  }
  return (
    <div className="space-y-4">
      {def.entrants.map((e) => (
        <div key={e.label}>
          <p className="mb-2 font-stat text-[10px] uppercase tracking-[0.2em] text-ember">
            {e.label} <span className="text-ash">· {e.count} team{e.count > 1 ? "s" : ""}{e.note ? ` · ${e.note}` : ""}</span>
          </p>
          <ul className="flex flex-wrap gap-3">
            {Array.from({ length: e.count }, (_, i) => <TbaTile key={i} label={e.label} />)}
          </ul>
        </div>
      ))}
    </div>
  );
}