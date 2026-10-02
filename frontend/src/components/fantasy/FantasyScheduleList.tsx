import Badge from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/format";
import type { TournamentDay } from "@/types";

export default function FantasyScheduleList({ schedule }: { schedule: TournamentDay[] }) {
  if (schedule.length === 0) {
    return <p className="font-stat text-xs uppercase tracking-widest text-ash">No days scheduled yet.</p>;
  }
  const now = Date.now();
  return (
    <div className="space-y-3">
      {schedule.map((d) => {
        const hasDeadline = d.deadline && !d.deadline.startsWith("0001");
        const locked = hasDeadline && new Date(d.deadline).getTime() < now;
        return (
          <div key={d.id} className="chamfer flex items-center justify-between border border-bone/10 bg-char-2 p-5">
            <div>
              <p className="font-display text-2xl font-extrabold uppercase leading-none">{d.name}</p>
              <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">{formatDate(d.date)}</p>
            </div>
            <div className="text-right">
              {hasDeadline ? (
                <>
                  <p className="font-stat text-[10px] uppercase tracking-widest text-ash">{locked ? "Locked at" : "Locks at"}</p>
                  <p className="font-stat text-sm tabular-nums text-bone">{formatTime(d.deadline)}</p>
                  <div className="mt-1"><Badge tone={locked ? "done" : "live"}>{locked ? "Locked" : "Open"}</Badge></div>
                </>
              ) : (
                <Badge tone="ember">Open</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}