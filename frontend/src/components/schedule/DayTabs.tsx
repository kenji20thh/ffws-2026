import type { TournamentDay } from "@/types";
import { formatDate } from "@/lib/format";

interface Props {
  days: TournamentDay[];
  activeId: number;
  onSelect: (id: number) => void;
}

export default function DayTabs({ days, activeId, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Tournament days">
      {days.map((d) => {
        const active = d.id === activeId;
        return (
          <button
            key={d.id}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(d.id)}
            className={`chamfer-sm shrink-0 px-6 py-3 text-left transition-colors ${
              active ? "bg-ember text-char" : "border border-bone/20 text-bone/70 hover:text-ember"
            }`}
          >
            <span className="block font-display text-2xl font-black uppercase leading-none">{d.name}</span>
            <span className={`font-stat text-[10px] uppercase tracking-widest ${active ? "text-char/70" : "text-ash"}`}>
              {formatDate(d.date, { day: "numeric", month: "short" })}
            </span>
          </button>
        );
      })}
    </div>
  );
}