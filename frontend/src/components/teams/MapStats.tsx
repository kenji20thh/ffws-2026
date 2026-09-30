import { FFWS_MAPS } from "@/lib/maps";
import type { TeamMapStats } from "@/types";

export default function MapStats({ maps }: { maps: TeamMapStats[] | null }) {
  const byName = new Map((maps ?? []).map((m) => [m.map_name, m]));
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {FFWS_MAPS.map((name) => {
        const m = byName.get(name);
        const played = !!m && m.rooms_played > 0;
        return (
          <div key={name} className={`chamfer border p-4 ${played ? "border-bone/10 bg-char-2" : "border-dashed border-bone/10 bg-char-2/40"}`}>
            <p className="font-display text-2xl font-extrabold uppercase leading-none">{name}</p>
            {played && m ? (
              <div className="mt-4 space-y-2 font-stat text-xs uppercase tracking-widest">
                <div className="flex justify-between"><span className="text-ash">Rooms</span><span className="tabular-nums text-bone">{m.rooms_played}</span></div>
                <div className="flex justify-between"><span className="text-ash">Avg place</span><span className="tabular-nums text-bone">#{m.average_placement.toFixed(1)}</span></div>
                <div className="flex justify-between"><span className="text-ash">Kills</span><span className="tabular-nums text-ember">{m.total_kills}</span></div>
                <div className="flex justify-between"><span className="text-ash">Booyahs</span><span className="tabular-nums text-amber">{m.booyahs}</span></div>
              </div>
            ) : (
              <p className="mt-4 font-stat text-[10px] uppercase tracking-widest text-ash">No data yet</p>
            )}
          </div>
        );
      })}
    </div>
  );
}