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

  const top = rank <= 3;
  // bigger tap targets on touch screens
  const arrowSize = touchDevice ? "h-8 w-8" : "h-6 w-6";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(rowDrag ? { ...attributes, ...listeners } : {})}
      className={`chamfer-sm relative flex min-h-[2.9rem] w-full min-w-0 max-w-full touch-pan-y items-center gap-2 border px-2 py-1 ${
        isDragging
          ? "z-10 border-ember bg-char-3 opacity-80 shadow-lg"
          : top
            ? "border-ember/30 bg-char-2"
            : "border-bone/10 bg-char-2"
      } ${
        disabled ? "cursor-default" : rowDrag ? "cursor-grab hover:border-ember/50 active:cursor-grabbing" : ""
      }`}
    >
      {handleDrag && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag ${team.name} to reorder`}
          className="chamfer-sm -ml-0.5 flex h-9 w-8 shrink-0 cursor-grab touch-none items-center justify-center border border-ember/60 bg-ember/10 text-ember active:cursor-grabbing active:bg-ember/25"
        >
          <svg width="14" height="16" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 1v16M4 5l4-4 4 4M4 13l4 4 4-4" />
          </svg>
        </button>
      )}

      <span
        className={`w-6 shrink-0 text-center font-display text-xl font-black tabular-nums sm:w-7 ${
          top ? "text-ember" : "text-bone/70"
        }`}
      >
        {rank}
      </span>

      <Monogram label={team.tag || team.name} imageUrl={team.logo_url} size={30} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-extrabold uppercase leading-none">
          {team.name}
        </p>

        <p className="mt-1 flex min-w-0 items-center gap-1 truncate font-stat text-[9px] uppercase tracking-widest text-ash">
          <Flag country={team.country} height={10} />
          <span className="truncate">
            {team.country}
            {team.region && ` · ${team.region}`}
          </span>
        </p>
      </div>

      {!disabled && (
        <div
          className="flex shrink-0 gap-1"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Move ${team.name} up`}
            className={`chamfer-sm flex ${arrowSize} items-center justify-center border border-bone/20 text-[10px] text-bone/70 hover:border-ember hover:text-ember disabled:opacity-30`}
          >
            ▲
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Move ${team.name} down`}
            className={`chamfer-sm flex ${arrowSize} items-center justify-center border border-bone/20 text-[10px] text-bone/70 hover:border-ember hover:text-ember disabled:opacity-30`}
          >
            ▼
          </button>
        </div>
      )}
    </div>
  );
}
