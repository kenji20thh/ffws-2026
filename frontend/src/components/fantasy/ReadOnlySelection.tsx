import Monogram from "@/components/ui/Monogram";
import type { FantasySelectionEntry } from "@/types";

export default function ReadOnlySelection({ selections }: { selections: FantasySelectionEntry[] }) {
  if (selections.length === 0) {
    return <p className="font-stat text-xs uppercase tracking-widest text-ash">No selection made for this day</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {selections.map((s) => (
        <div key={s.id} className={`chamfer-sm border p-3 ${s.is_captain ? "border-amber bg-char-3" : "border-bone/10 bg-char-2"}`}>
          <div className="flex items-center gap-3">
            <Monogram label={s.player.ign} imageUrl={s.player.photo_url} size={40} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-extrabold uppercase leading-none">{s.player.ign}</p>
              <p className="font-stat text-[9px] uppercase tracking-widest text-ash">{s.player.role}</p>
            </div>
          </div>
          {s.is_captain && (
            <p className="mt-2 font-stat text-[10px] uppercase tracking-widest text-amber">Captain · 2x</p>
          )}
        </div>
      ))}
    </div>
  );
}