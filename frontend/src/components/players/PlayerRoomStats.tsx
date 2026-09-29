import Badge from "@/components/ui/Badge";
import type { PlayerProfile as PlayerProfileData } from "@/types";

type Props = { rooms: PlayerProfileData["days"][number]["rooms"] };

export default function PlayerRoomStats({ rooms }: Props) {
  return (
    <div className="chamfer overflow-hidden border border-bone/10">
      <div className="hidden grid-cols-[80px_1fr_90px_90px_110px_110px] border-b border-bone/10 bg-char-3 px-4 py-3 font-stat text-[9px] uppercase tracking-widest text-ash md:grid">
        <span>Room</span><span>Map</span>
        <span className="text-right">Place</span><span className="text-right">Kills</span>
        <span className="text-right">Kill %</span><span className="text-right">Place pts</span>
      </div>

      {rooms.map((room) => (
        <div key={room.room_id} className="border-b border-bone/10 bg-char-2 last:border-b-0">
          <div className="hidden grid-cols-[80px_1fr_90px_90px_110px_110px] items-center px-4 py-4 font-stat text-sm tabular-nums md:grid">
            <span className="font-display text-lg font-black">#{room.room_number}</span>
            <span className="uppercase text-bone/80">{room.map_name || "—"}</span>
            <span className="text-right">{room.placement > 0 ? `#${room.placement}` : "—"}</span>
            <span className="text-right">{room.kills}</span>
            <span className="text-right">{room.kill_participation.toFixed(1)}%</span>
            <span className="text-right text-ember">{room.placement_points}</span>
          </div>

          <div className="p-4 md:hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-black">ROOM #{room.room_number}</p>
                <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">{room.map_name || "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-stat text-[9px] uppercase tracking-widest text-ash">Placement</p>
                <p className="mt-1 font-display text-xl font-black tabular-nums">{room.placement > 0 ? `#${room.placement}` : "—"}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 border-l border-t border-bone/10 font-stat tabular-nums">
              <div className="border-b border-r border-bone/10 p-3">
                <p className="text-[8px] uppercase tracking-widest text-ash">Kills</p>
                <p className="mt-1 text-lg font-black">{room.kills}</p>
              </div>
              <div className="border-b border-r border-bone/10 p-3">
                <p className="text-[8px] uppercase tracking-widest text-ash">Kill %</p>
                <p className="mt-1 text-lg font-black">{room.kill_participation.toFixed(1)}%</p>
              </div>
              <div className="border-b border-r border-bone/10 p-3">
                <p className="text-[8px] uppercase tracking-widest text-ash">Place pts</p>
                <p className="mt-1 text-lg font-black text-ember">{room.placement_points}</p>
              </div>
            </div>

            {room.first_blood && (
              <div className="mt-3">
                <Badge tone="live">First blood</Badge>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}