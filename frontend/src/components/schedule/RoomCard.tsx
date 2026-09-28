import Badge, { statusTone } from "@/components/ui/Badge";
import { formatTime } from "@/lib/format";
import type { Room } from "@/types";

interface Props {
  room: Room;
  active: boolean;
  onSelect: () => void;
}

export default function RoomCard({ room, active, onSelect }: Props) {
  const live = room.status === "live";
  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      className={`chamfer relative overflow-hidden border p-4 text-left transition-colors ${
        active ? "border-ember bg-char-3" : "border-bone/10 bg-char-2 hover:border-bone/40"
      } ${live ? "scanlines" : ""}`}
    >
      <div className="flex items-start justify-between">
        <span className="font-display text-5xl font-black leading-none">
          R{String(room.room_number).padStart(2, "0")}
        </span>
        <Badge tone={statusTone(room.status)}>{room.status}</Badge>
      </div>
      <p className="mt-3 font-display text-xl font-bold uppercase">{room.map_name || "Map TBA"}</p>
      <p className="font-stat text-[11px] tabular-nums text-ash">{formatTime(room.scheduled_at)}</p>
    </button>
  );
}