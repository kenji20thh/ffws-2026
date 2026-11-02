"use client";

import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Monogram from "@/components/ui/Monogram";
import Flag from "@/components/ui/Flag";
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
setActivatorNodeRef,
transform,
transition,
isDragging,
} = useSortable({
id: team.id,
disabled,
});

// Phones/tablets (touch as the main input): drag only from the grip handle so the rest of
// the row can scroll the page. Desktop (mouse): drag from anywhere on the row.
const [touchDevice, setTouchDevice] = useState(false);
useEffect(() => {
const mq = window.matchMedia("(pointer: coarse)");
const update = () => setTouchDevice(mq.matches);
update();
mq.addEventListener("change", update);
return () => mq.removeEventListener("change", update);
}, []);

const rowDrag = !disabled && !touchDevice;
const handleDrag = !disabled && touchDevice;

const style = {
transform: CSS.Transform.toString(transform),
transition,
};

return (
<div
ref={setNodeRef}
style={style}
{...(rowDrag ? { ...attributes, ...listeners } : {})}
className={`chamfer-sm flex w-full min-w-0 max-w-full touch-pan-y items-center gap-2 border p-2 sm:gap-3 sm:p-3 ${
        isDragging
          ? "border-ember bg-char-3 opacity-70"
          : "border-bone/10 bg-char-2"
      } ${
        disabled ? "cursor-default" : rowDrag ? "cursor-grab active:cursor-grabbing" : ""
      }`}
>
  {handleDrag && (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Drag ${team.name} to reorder`}
      className="-ml-1 flex h-10 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-bone/50 hover:text-ember active:cursor-grabbing"
    >
      <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden="true">
        <circle cx="4" cy="4" r="1.6" /><circle cx="10" cy="4" r="1.6" />
        <circle cx="4" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" />
        <circle cx="4" cy="16" r="1.6" /><circle cx="10" cy="16" r="1.6" />
      </svg>
    </button>
  )}
  <span className="w-8 shrink-0 text-center font-display text-2xl sm:w-10 sm:text-3xl font-black tabular-nums text-ember">
{rank} </span>

  <Monogram
    label={team.tag || team.name}
    imageUrl={team.logo_url}
    size={40}
  />

  <div className="min-w-0 flex-1">
    <p className="truncate font-display text-lg font-extrabold sm:text-xl uppercase leading-none">
      {team.name}
    </p>

    <p className="mt-1 flex min-w-0 items-center gap-1 truncate font-stat text-[10px] uppercase tracking-widest text-ash">
      <Flag country={team.country} height={12} />
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