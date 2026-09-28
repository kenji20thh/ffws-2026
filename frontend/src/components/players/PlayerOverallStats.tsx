import type { PlayerProfile as PlayerProfileData } from "@/types";

type PlayerOverallStatsProps = {
  overall: PlayerProfileData["overall"];
};

function formatNumber(value: number, decimals = 1) {
  return value.toFixed(decimals);
}

export default function PlayerOverallStats({
  overall,
}: PlayerOverallStatsProps) {
  const stats = [
    {
      label: "Total Kills",
      value: overall.total_kills.toString(),
      large: true,
    },
    {
      label: "Kills / Room",
      value: formatNumber(overall.kills_per_room, 2),
    },
    {
      label: "Avg Placement",
      value: formatNumber(overall.average_placement, 2),
    },
    {
      label: "Placement Pts / Room",
      value: formatNumber(overall.placement_points_per_room, 2),
    },
    {
      label: "Booyahs",
      value: overall.booyahs.toString(),
    },
    {
      label: "First Bloods",
      value: overall.first_bloods.toString(),
    },
  ];

  return (
    <section className="bg-[#f2f2f0] text-[#151515]">
      <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-18 lg:px-16 lg:py-20">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-6 border-b border-black/10 pb-5">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-black/40">
              Performance
            </p>

            <h2 className="text-3xl font-black uppercase tracking-[-0.04em] md:text-4xl">
              Overall Stats
            </h2>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">
              Rooms Played
            </p>

            <p className="mt-1 text-2xl font-black">
              {overall.rooms_played}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 border-l border-t border-black/10 md:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border-b border-r border-black/10 p-5 md:p-6"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-black/40">
                {stat.label}
              </p>

              <p
                className={`mt-3 font-black leading-none tracking-[-0.05em] ${
                  stat.large
                    ? "text-4xl md:text-5xl"
                    : "text-3xl md:text-4xl"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Kill Participation */}
        <div className="mt-4 border border-black/10 bg-[#e8e8e5] p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
                Kill Participation
              </p>

              <p className="mt-2 text-5xl font-black tracking-[-0.06em] md:text-6xl">
                {formatNumber(overall.kill_participation, 1)}%
              </p>
            </div>

            <div className="w-full md:max-w-md">
              <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-black/35">
                <span>Team Kill Share</span>
                <span>
                  {formatNumber(overall.kill_participation, 1)}%
                </span>
              </div>

              <div className="h-2 w-full bg-black/10">
                <div
                  className="h-full bg-[#151515] transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(overall.kill_participation, 0),
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}