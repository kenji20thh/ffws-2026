import type { TeamStanding } from "@/types";

const HEIGHTS = ["h-56", "h-72", "h-44"]; // order rendered: 2nd, 1st, 3rd
const COLORS = ["text-bone", "text-amber", "text-ember"];

export default function PodiumTop3({ top }: { top: TeamStanding[] }) {
  if (top.length === 0) return null;
  const order = [1, 0, 2].filter((i) => top[i]);

  return (
    <div className="grid grid-cols-3 items-end gap-3">
      {order.map((i, col) => (
        <div key={top[i].team_id} className="text-center">
          {i === 0 && (
            <span className="mb-2 inline-block -rotate-3 border-2 border-amber px-3 py-1 font-display text-xl font-black uppercase tracking-widest text-amber">
              Booyah
            </span>
          )}
          <p className="truncate font-display text-2xl font-extrabold uppercase sm:text-4xl">
            {top[i].team_name}
          </p>
          <p className="mb-2 font-stat text-sm tabular-nums text-ash">{top[i].total_points} pts</p>
          <div
            className={`chamfer flex items-start justify-center border border-bone/10 bg-char-2 pt-3 ${HEIGHTS[i]}`}
          >
            <span className={`font-display text-8xl font-black leading-none ${COLORS[i]}`}>
              {i + 1}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}