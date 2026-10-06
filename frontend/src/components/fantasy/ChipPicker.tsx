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
    <div className="space-y-2">
      <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
        Chip · one per day, each can be played once
      </p>

      <div className="grid grid-cols-3 gap-2">
        {CHIPS.map((c) => {
          const usedElsewhere = used.some(
            (u) =>
              u.chip === c.id &&
              u.tournament_day_id !== dayId
          );

          const isActive = chip === c.id;
          const disabled = locked || usedElsewhere;

          return (
            <button
              key={c.id}
              type="button"
              disabled={disabled}
              aria-pressed={isActive}
              title={
                usedElsewhere
                  ? "Already used on another day"
                  : c.description
              }
              onClick={() => onChange(isActive ? null : c.id)}
              className={`chamfer-sm border px-2 py-3 text-center transition-all ${
                isActive
                  ? "border-amber bg-amber text-char"
                  : "border-bone/20 bg-char-2 hover:border-ember"
              } ${
                disabled && !isActive
                  ? "cursor-not-allowed opacity-40 hover:border-bone/20"
                  : ""
              }`}
            >
              {/* Chip Icon */}
              <div className="mb-2 flex justify-center">
                <Image
                  src={c.image}
                  alt={c.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain"
                />
              </div>

              {/* Chip Name */}
              <span className="block font-display text-sm font-extrabold uppercase leading-tight">
                {c.name}
              </span>

              {/* Chip Status / Short Description */}
              <span
                className={`mt-0.5 block font-stat text-[9px] uppercase tracking-widest ${
                  isActive ? "text-char/70" : "text-ash"
                }`}
              >
                {usedElsewhere
                  ? "Used"
                  : isActive
                    ? "Active"
                    : c.short}
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <p className="font-stat text-[10px] uppercase tracking-widest text-amber">
          {active.description}
        </p>
      )}
    </div>
  );
}