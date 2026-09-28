import type { PlayerProfile as PlayerProfileData } from "@/types";

type PlayerRoomStatsProps = {
  rooms: PlayerProfileData["days"][number]["rooms"];
};

export default function PlayerRoomStats({
  rooms,
}: PlayerRoomStatsProps) {
  return (
    <div className="overflow-hidden border border-black/10">
      {/* Desktop header */}
      <div className="hidden grid-cols-[80px_1fr_100px_100px_120px_120px] border-b border-black/10 bg-[#e8e8e5] px-4 py-3 md:grid">
        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
          Room
        </span>

        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
          Map
        </span>

        <span className="text-right text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
          Place
        </span>

        <span className="text-right text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
          Kills
        </span>

        <span className="text-right text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
          Kill Part.
        </span>

        <span className="text-right text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
          Placement Pts
        </span>
      </div>

      {rooms.map((room) => (
        <div
          key={room.room_id}
          className="border-b border-black/10 last:border-b-0"
        >
          {/* Desktop */}
          <div className="hidden grid-cols-[80px_1fr_100px_100px_120px_120px] items-center px-4 py-4 md:grid">
            <div className="text-sm font-black">
              #{room.room_number}
            </div>

            <div>
              <p className="text-sm font-bold uppercase">
                {room.map_name || "—"}
              </p>
            </div>

            <div className="text-right text-sm font-black">
              {room.placement > 0 ? `#${room.placement}` : "—"}
            </div>

            <div className="text-right text-sm font-black">
              {room.kills}
            </div>

            <div className="text-right text-sm font-black">
              {room.kill_participation.toFixed(1)}%
            </div>

            <div className="text-right text-sm font-black">
              {room.placement_points}
            </div>
          </div>

          {/* Mobile */}
          <div className="p-4 md:hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black">
                  ROOM #{room.room_number}
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-black/35">
                  {room.map_name || "—"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
                  Placement
                </p>

                <p className="mt-1 text-xl font-black">
                  {room.placement > 0
                    ? `#${room.placement}`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 border-l border-t border-black/10">
              <div className="border-b border-r border-black/10 p-3">
                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-black/35">
                  Kills
                </p>

                <p className="mt-1 text-lg font-black">
                  {room.kills}
                </p>
              </div>

              <div className="border-b border-r border-black/10 p-3">
                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-black/35">
                  Kill Part.
                </p>

                <p className="mt-1 text-lg font-black">
                  {room.kill_participation.toFixed(1)}%
                </p>
              </div>

              <div className="border-b border-r border-black/10 p-3">
                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-black/35">
                  Placement Pts
                </p>

                <p className="mt-1 text-lg font-black">
                  {room.placement_points}
                </p>
              </div>
            </div>

            {room.first_blood && (
              <div className="mt-3 inline-flex items-center border border-black/10 bg-[#e8e8e5] px-3 py-2">
                <span className="text-[9px] font-black uppercase tracking-[0.15em]">
                  First Blood
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}