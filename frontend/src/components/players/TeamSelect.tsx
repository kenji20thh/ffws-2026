"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Team } from "@/types";

interface Props {
  teams: Team[];
  /** "all" or a team id as string */
  value: string;
  onChange: (value: string) => void;
}

type Option = { value: string; label: string; team?: Team };

/** Every logo gets the same square box so the list lines up. */
function TeamLogo({ team }: { team: Team }) {
  if (team.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logo_url}
        alt=""
        className="h-6 w-6 shrink-0 object-contain"
      />
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-bone/10 font-display text-[0.5rem] font-black text-ash">
      {team.tag.slice(0, 3)}
    </span>
  );
}

export default function TeamSelect({ teams, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const options: Option[] = useMemo(
    () => [
      { value: "all", label: "ALL TEAMS" },
      ...[...teams]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((team) => ({ value: String(team.id), label: team.name, team })),
    ],
    [teams],
  );

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  // close when clicking outside
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // keep the highlighted option visible
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function openList() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(options.length - 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) choose(active);
        else openList();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative md:w-64">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="flex h-12 w-full items-center gap-3 chamfer border border-bone/10 bg-char-2 px-4 text-left font-stat text-xs uppercase tracking-widest text-bone outline-none focus:border-ember"
      >
        {selected.team && <TeamLogo team={selected.team} />}
        <span className="min-w-0 flex-1 truncate">{selected.label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={`h-3 w-3 shrink-0 text-ash transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 4.5 6 8.5 10 4.5" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto border border-bone/15 bg-char-2 py-1 shadow-xl shadow-black/50"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === active;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                data-index={index}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2 font-stat text-xs uppercase tracking-widest ${
                  isActive ? "bg-char-3" : ""
                } ${isSelected ? "text-ember" : "text-bone"}`}
              >
                {option.team ? (
                  <TeamLogo team={option.team} />
                ) : (
                  <span className="h-6 w-6 shrink-0" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
