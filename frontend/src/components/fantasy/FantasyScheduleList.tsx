import Badge from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/format";
import type { FantasyDaySchedule } from "@/types";

export default function FantasyScheduleList({ schedule }: { schedule: FantasyDaySchedule[] }) {
  if (schedule.length === 0) {
    return <p className="font-stat text-xs uppercase tracking-widest text-ash">No days scheduled yet.</p>;
  }
  const now = Date.now();
  return (
    <div className="space-y-3">
      {schedule.map((d) => {
        const lock = d.lock_time ? new Date(d.lock_time).getTime() : null;
        const locked = lock !== null && lock < now;
        return (
          <div key={d.day_id} className="chamfer flex items-center justify-between border border-bone/10 bg-char-2 p-5">
            <div>
              <p className="font-display text-2xl font-extrabold uppercase leading-none">{d.day_name}</p>
              <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">{formatDate(d.date)}</p>
            </div>
            <div className="text-right">
              {d.lock_time ? (
                <>
                  <p className="font-stat text-[10px] uppercase tracking-widest text-ash">{locked ? "Locked at" : "Locks at"}</p>
                  <p className="font-stat text-sm tabular-nums text-bone">{formatTime(d.lock_time)}</p>
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