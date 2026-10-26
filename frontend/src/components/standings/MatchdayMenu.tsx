"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type MenuItem = {
  value: string;
  /** Text inside the list. */
  label: string;
  /** Text on the closed button, e.g. "Week 1 · Day 2". */
  display: string;
  /** Small note on the right of the row, e.g. "3 days". */
  hint?: string;
  /** Aggregate rows ("Overall") are shown bolder. */
  strong?: boolean;
};

export type MenuSection = {
  key: string;
  /** Header line, e.g. "Week 1". Omit for a standalone group. */
  label?: string;
  items: MenuItem[];
};

interface Props {
  sections: MenuSection[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  placeholder?: string;
}

function Chevron({ open }: { open: boolean }) {
  return (
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
  );
}

/** Dropdown for picking a matchday, with sections separated by lines. */
export default function MatchdayMenu({
  sections,
  value,
  onChange,
  ariaLabel,
  disabled = false,
  placeholder = "Select",
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // Where the list sits on screen. The list is rendered at the top level of the page
  // (portal), so no card around the menu can clip it or paint over it.
  const [pos, setPos] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const items = sections.flatMap((section) => section.items);
  const selectedIndex = items.findIndex((item) => item.value === value);
  const selected = selectedIndex >= 0 ? items[selectedIndex] : null;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the list glued under (or above, when there is no room) the button.
  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const margin = 8;
      const below = window.innerHeight - rect.bottom - margin;
      const above = rect.top - margin;
      const openUp = below < 240 && above > below;
      const room = Math.max(openUp ? above : below, 120);

      setPos({
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - margin - Math.max(rect.width, 224))),
        width: Math.max(rect.width, 224),
        maxHeight: Math.min(room, 384),
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open, pos]);

  function openList() {
    if (disabled || items.length === 0) return;
    setActive(Math.max(selectedIndex, 0));
    setOpen(true);
  }

  function choose(index: number) {
    const item = items[index];
    if (!item) return;
    onChange(item.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.min(i + 1, items.length - 1));
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
          setActive(items.length - 1);
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

  let flatIndex = -1;

  return (
    <div ref={rootRef} className="relative min-w-[12rem] flex-1 sm:w-64 sm:flex-none">
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="flex h-10 w-full items-center justify-between gap-3 border border-bone/10 bg-char-2 px-3 text-left font-stat text-xs font-bold uppercase tracking-wider text-bone outline-none transition-colors hover:border-bone/30 focus:border-ember disabled:cursor-not-allowed disabled:text-ash"
      >
        <span className="min-w-0 truncate">{selected?.display ?? placeholder}</span>
        <Chevron open={open} />
      </button>

      {open &&
        pos &&
        createPortal(
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: "fixed",
            left: pos.left,
            width: pos.width,
            top: pos.top,
            bottom: pos.bottom,
            maxHeight: pos.maxHeight,
          }}
          className="z-[100] overflow-y-auto border border-bone/20 bg-char-2 py-1 shadow-xl shadow-black/60"
        >
          {sections.map((section, sectionIndex) => (
            <li key={section.key} role="presentation">
              {sectionIndex > 0 && <div className="my-1 h-px bg-bone/20" />}

              {section.label && (
                <div
                  aria-hidden="true"
                  className="flex items-center gap-3 px-3 pb-1 pt-2 font-stat text-[0.625rem] font-bold uppercase tracking-[0.2em] text-ember"
                >
                  {section.label}
                  <span className="h-px flex-1 bg-bone/15" />
                </div>
              )}

              <ul role="presentation">
                {section.items.map((item) => {
                  flatIndex += 1;
                  const index = flatIndex;
                  const isSelected = item.value === value;
                  const isActive = index === active;

                  return (
                    <li
                      key={item.value}
                      role="option"
                      aria-selected={isSelected}
                      data-index={index}
                      onMouseEnter={() => setActive(index)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(index)}
                      className={`flex cursor-pointer items-center justify-between gap-3 border-l-2 py-2 pl-4 pr-3 font-stat text-xs uppercase tracking-wider ${
                        isSelected
                          ? "border-ember text-ember"
                          : "border-transparent text-bone"
                      } ${isActive ? "bg-char-3" : ""} ${item.strong ? "font-bold" : ""}`}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.hint && (
                        <span className="shrink-0 text-[0.625rem] font-normal tracking-widest text-ash">
                          {item.hint}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  );
}
