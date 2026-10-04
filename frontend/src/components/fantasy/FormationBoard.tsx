import Monogram from "@/components/ui/Monogram";

export interface SlotPlayer {
  id: number;
  name: string;
  role: string;
  photoUrl?: string;
  price?: number;
  captain: boolean;
  points?: number; // shown on the points page once the day is scored
  detail?: string;
}

// Diamond formation:      X
//                       X   X
//                         X
const POSITIONS = [
  "col-start-2 row-start-1",
  "col-start-1 row-start-2",
  "col-start-3 row-start-2",
  "col-start-2 row-start-3",
];

interface Props {
  slots: (SlotPlayer | null)[];
  onSelect?: (id: number) => void; // click a filled card (used to pick the captain)
  onRemove?: (id: number) => void; // shows an × on filled cards
  emptyLabel?: string;
}

export default function FormationBoard({ slots, onSelect, onRemove, emptyLabel = "Empty" }: Props) {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-3">
      {POSITIONS.map((pos, i) => {
        const p = slots[i] ?? null;
        return (
          <div key={i} className={pos}>
            {p ? <FilledSlot p={p} onSelect={onSelect} onRemove={onRemove} /> : <EmptySlot label={emptyLabel} />}
          </div>
        );
      })}
    </div>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="chamfer-sm flex h-full min-h-[10.5rem] flex-col items-center justify-center gap-1 border border-dashed border-bone/20 bg-char-2/40 text-center">
      <span className="font-display text-4xl font-black text-bone/20">+</span>
      <span className="font-stat text-[9px] uppercase tracking-widest text-ash">{label}</span>
    </div>
  );
}

function FilledSlot({
  p,
  onSelect,
  onRemove,
}: {
  p: SlotPlayer;
  onSelect?: (id: number) => void;
  onRemove?: (id: number) => void;
}) {
  const interactive = !!onSelect;
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? p.captain : undefined}
      title={interactive ? (p.captain ? "Captain" : "Click to make captain") : undefined}
      onClick={interactive ? () => onSelect!(p.id) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect!(p.id);
              }
            }
          : undefined
      }
      className={`chamfer-sm relative flex h-full min-h-[10.5rem] flex-col items-center justify-center gap-1 border p-2 text-center transition-colors ${
        p.captain ? "border-amber bg-char-3" : "border-bone/15 bg-char-2"
      } ${interactive ? "cursor-pointer hover:border-ember" : ""}`}
    >
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${p.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(p.id);
          }}
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center font-stat text-base leading-none text-ash hover:text-danger"
        >
          ×
        </button>
      )}
      {p.captain && (
        <span className="absolute left-1 top-1 bg-amber px-1.5 py-0.5 font-stat text-[9px] font-black uppercase text-char">
          C · 2x
        </span>
      )}
      <Monogram label={p.name} imageUrl={p.photoUrl} size={64} />
      <p className="w-full truncate font-display text-lg font-extrabold uppercase leading-none">{p.name}</p>
      <p className="font-stat text-[9px] uppercase tracking-widest text-ash">{p.role}</p>
      {p.price !== undefined && <p className="font-stat text-sm font-bold tabular-nums text-ember">${p.price}</p>}
      {p.points !== undefined && (
        <p className="font-stat text-sm font-bold tabular-nums text-ember">{p.points} pts</p>
      )}
      {p.detail && <p className="font-stat text-[9px] uppercase tracking-widest text-ash">{p.detail}</p>}
    </div>
  );
}
