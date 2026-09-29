import Link from "next/link";
import Badge, { statusTone } from "@/components/ui/Badge";
import { formatTime } from "@/lib/format";
import type { Room } from "@/types";

export default function CurrentRoomWidget({ room }: { room: Room | null }) {
  if (!room) {
    return (
      <div className="chamfer border border-dashed border-bone/15 bg-char-2 p-6 text-center">
        <p className="font-stat text-xs uppercase tracking-widest text-ash">No room scheduled right now</p>
      </div>
    );
  }

  return (
    <Link
      href="/schedule"
      className={`chamfer relative block overflow-hidden border border-bone/10 bg-char-2 p-6 transition-colors hover:border-ember ${
        room.status === "live" ? "scanlines" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
            {room.status === "live" ? "Happening now" : "Up next"}
          </p>
          <p className="mt-1 font-display text-4xl font-black uppercase">
            Room {room.room_number}
          </p>
          <p className="font-stat text-sm text-bone/60">{room.map_name || "Map TBA"} · {formatTime(room.scheduled_at)}</p>
        </div>
        <Badge tone={statusTone(room.status)}>{room.status}</Badge>
      </div>
    </Link>
  );
}