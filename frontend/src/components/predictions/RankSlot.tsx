"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Monogram from "@/components/ui/Monogram";
import { countryFlag } from "@/lib/flags";
import type { Team } from "@/types";

interface Props {
team: Team;
rank: number;
canMoveUp: boolean;
canMoveDown: boolean;
onMoveUp: () => void;
onMoveDown: () => void;
disabled: boolean;
}

export default function RankSlot({
team,
rank,
canMoveUp,
canMoveDown,
onMoveUp,
onMoveDown,
disabled,
}: Props) {
const {
attributes,
listeners,
setNodeRef,
transform,
transition,
isDragging,
} = useSortable({
id: team.id,
disabled,
});

const style = {
transform: CSS.Transform.toString(transform),
transition,
};

return (
<div
ref={setNodeRef}
style={style}
{...(disabled ? {} : { ...attributes, ...listeners })}
className={`chamfer-sm flex items-center gap-4 border p-3 ${
        isDragging
          ? "border-ember bg-char-3 opacity-70"
          : "border-bone/10 bg-char-2"
      } ${
        disabled
          ? "cursor-default"
          : "cursor-grab touch-none active:cursor-grabbing"
      }`}
> <span className="w-10 shrink-0 text-center font-display text-3xl font-black tabular-nums text-ember">
{rank} </span>

  <Monogram
    label={team.tag || team.name}
    imageUrl={team.logo_url}
    size={40}
  />

  <div className="min-w-0 flex-1">
    <p className="truncate font-display text-xl font-extrabold uppercase leading-none">
      {team.name}
    </p>

    <p className="mt-1 flex items-center gap-1 font-stat text-[10px] uppercase tracking-widest text-ash">
      <span>{countryFlag(team.country)}</span>
      {team.country}
      {team.region && ` · ${team.region}`}
    </p>
  </div>

  {!disabled && (
    <div
      className="flex shrink-0 flex-col gap-1"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        aria-label={`Move ${team.name} up`}
        className="chamfer-sm border border-bone/20 px-2 py-0.5 text-xs text-bone/70 hover:border-ember hover:text-ember disabled:opacity-30"
      >
        ▲
      </button>

      <button
        type="button"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        aria-label={`Move ${team.name} down`}
        className="chamfer-sm border border-bone/20 px-2 py-0.5 text-xs text-bone/70 hover:border-ember hover:text-ember disabled:opacity-30"
      >
        ▼
      </button>
    </div>
  )}
</div>

);
}
