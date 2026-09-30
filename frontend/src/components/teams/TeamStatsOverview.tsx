import type { TeamOverallStats } from "@/types";

export default function TeamStatsOverview({ overall }: { overall: TeamOverallStats }) {
  const stats = [
    { label: "Total kills", value: overall.total_kills.toString(), big: true },
    { label: "Kills / room", value: overall.kills_per_room.toFixed(2) },
    { label: "Avg placement", value: overall.average_placement > 0 ? `#${overall.average_placement.toFixed(1)}` : "—" },
    { label: "Rooms played", value: overall.rooms_played.toString() },
    { label: "Booyahs", value: overall.booyahs.toString() },
  ];
  return (
    <div className="grid grid-cols-2 border-l border-t border-bone/10 sm:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label} className="border-b border-r border-bone/10 px-5 py-6">
          <p className="font-stat text-[9px] uppercase tracking-widest text-ash">{s.label}</p>
          <p className={`mt-2 font-display font-black leading-none tabular-nums ${s.big ? "text-4xl text-ember" : "text-3xl text-bone/90"}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}