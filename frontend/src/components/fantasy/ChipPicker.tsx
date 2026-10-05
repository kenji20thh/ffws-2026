import { CHIPS } from "@/lib/chips";
import type { FantasyChip, FantasyChipUse } from "@/types";

interface Props {
  chip: FantasyChip | null;
  used: FantasyChipUse[]; // chips already played (any day)
  dayId: number;
  locked: boolean;
  onChange: (chip: FantasyChip | null) => void;
}

export default function ChipPicker({ chip, used, dayId, locked, onChange }: Props) {
  const active = CHIPS.find((c) => c.id === chip);
  return (
    <div className="space-y-2">
      <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
        Chip · one per day, each can be played once
      </p>
      <div className="grid grid-cols-3 gap-2">
        {CHIPS.map((c) => {
          const usedElsewhere = used.some((u) => u.chip === c.id && u.tournament_day_id !== dayId);
          const isActive = chip === c.id;
          const disabled = locked || usedElsewhere;
          return (
            <button
              key={c.id}
              type="button"
              disabled={disabled}
              aria-pressed={isActive}
              title={usedElsewhere ? "Already used on another day" : c.description}
              onClick={() => onChange(isActive ? null : c.id)}
              className={`chamfer-sm border px-2 py-2 text-center transition-colors ${
                isActive ? "border-amber bg-amber text-char" : "border-bone/20 bg-char-2 hover:border-ember"
              } ${disabled && !isActive ? "cursor-not-allowed opacity-40 hover:border-bone/20" : ""}`}
            >
              <span className="block font-display text-sm font-extrabold uppercase leading-tight">{c.name}</span>
              <span
                className={`mt-0.5 block font-stat text-[9px] uppercase tracking-widest ${
                  isActive ? "text-char/70" : "text-ash"
                }`}
              >
                {usedElsewhere ? "Used" : isActive ? "Active" : c.short}
              </span>
            </button>
          );
        })}
      </div>
      {active && <p className="font-stat text-[10px] uppercase tracking-widest text-amber">{active.description}</p>}
    </div>
  );
}
