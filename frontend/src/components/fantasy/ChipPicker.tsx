import Image from "next/image";
import { CHIPS } from "@/lib/chips";
import type { FantasyChip, FantasyChipUse } from "@/types";

interface Props {
  chip: FantasyChip | null;
  used: FantasyChipUse[];
  dayId: number;
  locked: boolean;
  onChange: (chip: FantasyChip | null) => void;
}

export default function ChipPicker({
  chip,
  used,
  dayId,
  locked,
  onChange,
}: Props) {
  const active = CHIPS.find((c) => c.id === chip);

  return (
    <div>
      <p className="mb-1.5 font-stat text-[10px] uppercase tracking-widest text-ash">
        Chip <span className="text-ash/60">· one per day, each used once</span>
      </p>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {CHIPS.map((c) => {
          const usedElsewhere = used.some(
            (u) => u.chip === c.id && u.tournament_day_id !== dayId,
          );

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
              className={`chamfer-sm flex min-w-0 flex-col items-center gap-1 border px-1.5 py-1.5 text-center transition-all sm:flex-row sm:gap-2 sm:px-2 sm:text-left ${
                isActive
                  ? "border-amber bg-amber text-char"
                  : "border-bone/20 bg-char hover:border-ember"
              } ${
                disabled && !isActive
                  ? "cursor-not-allowed opacity-40 hover:border-bone/20"
                  : ""
              }`}
            >
              <Image
                src={c.image}
                alt=""
                width={36}
                height={36}
                className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
              />

              <span className="w-full min-w-0">
                <span className="block truncate font-display text-xs font-extrabold uppercase leading-tight sm:text-sm">
                  {c.name}
                </span>
                <span
                  className={`block truncate font-stat text-[8px] uppercase tracking-wider ${
                    isActive ? "text-char/70" : "text-ash"
                  }`}
                >
                  {usedElsewhere ? "Used" : isActive ? "Active" : c.short}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <p className="mt-1.5 font-stat text-[9px] uppercase tracking-wider text-amber">
          {active.description}
        </p>
      )}
    </div>
  );
}
