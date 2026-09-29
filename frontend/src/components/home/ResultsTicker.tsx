import type { Room, RoomTeamSummary } from "@/types";

export default function ResultsTicker({ room, results }: { room: Room | null; results: RoomTeamSummary[] }) {
  if (!room || results.length === 0) return null;
  const sorted = [...results].sort((a, b) => a.placement - b.placement);
  const items = [...sorted, ...sorted]; // duplicated for a seamless loop

  return (
    <div className="overflow-hidden border-y border-bone/10 bg-char-2">
      <div className="flex whitespace-nowrap py-3">
        <div className="marquee flex shrink-0 gap-10">
          {items.map((r, i) => (
            <span key={`${r.team_id}-${i}`} className="font-stat text-xs uppercase tracking-widest text-bone/70">
              <span className="text-ember">[{r.team_name}]</span> ▸ #{r.placement} ▸ {r.total_kills} kills ▸{" "}
              <span className="text-amber">{r.total_points} pts</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}