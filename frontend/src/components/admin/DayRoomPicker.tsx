import type { Room, TournamentDay } from "@/types";

interface Props {
  days: TournamentDay[];
  rooms: Room[];
  dayId: number;
  roomId: number | null;
  onDay: (id: number) => void;
  onRoom: (id: number) => void;
}

const select =
  "chamfer-sm border border-bone/20 bg-char-2 px-4 py-3 font-display text-xl font-bold uppercase text-bone focus:border-ember focus:outline-none";

export default function DayRoomPicker({ days, rooms, dayId, roomId, onDay, onRoom }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <label htmlFor="day" className="mb-1 block font-stat text-[10px] uppercase tracking-widest text-ash">Day</label>
        <select id="day" className={select} value={dayId} onChange={(e) => onDay(Number(e.target.value))}>
          {days.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="room" className="mb-1 block font-stat text-[10px] uppercase tracking-widest text-ash">Room</label>
        <select id="room" className={select} value={roomId ?? ""} onChange={(e) => onRoom(Number(e.target.value))}
          disabled={rooms.length === 0}>
          {rooms.length === 0 && <option value="">No rooms</option>}
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>Room {r.room_number} · {r.status}</option>
          ))}
        </select>
      </div>
    </div>
  );
}