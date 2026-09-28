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
      label: "Kills",
      value: overall.total_kills.toString(),
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
    <section className="relative overflow-hidden bg-[#111111] text-white">
      {/* Subtle background texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(135deg, transparent 0%, transparent 49%, white 50%, transparent 51%, transparent 100%)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-16 lg:px-16 lg:py-20">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between border-b border-white/[0.08] pb-5">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
              Player Performance
            </p>

            <h2 className="text-3xl font-black uppercase tracking-[-0.04em] md:text-4xl">
              Overall Stats
            </h2>
          </div>

          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25">
              Rooms Played
            </p>

            <p className="mt-1 text-2xl font-black text-white/80">
              {overall.rooms_played}
            </p>
          </div>
        </div>

        {/* Main statistics */}
        <div className="grid grid-cols-2 border-l border-t border-white/[0.08] md:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`relative border-b border-r border-white/[0.08] px-5 py-6 md:px-6 md:py-7 ${
                index === 0 ? "bg-white/[0.025]" : ""
              }`}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                {stat.label}
              </p>

              <p
                className={`mt-3 font-black leading-none tracking-[-0.05em] ${
                  index === 0
                    ? "text-4xl text-white md:text-5xl"
                    : "text-3xl text-white/85 md:text-4xl"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Kill participation */}
        <div className="mt-3 border border-white/[0.08] bg-white/[0.025] px-5 py-6 md:px-7 md:py-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                Kill Participation
              </p>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-[-0.05em] md:text-5xl">
                  {formatNumber(overall.kill_participation, 1)}%
                </span>

                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/25">
                  of team kills
                </span>
              </div>
            </div>

            <div className="w-full md:max-w-[420px]">
              <div className="mb-2 flex justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/25">
                  Participation
                </span>

                <span className="text-[9px] font-bold text-white/35">
                  {formatNumber(overall.kill_participation, 1)}%
                </span>
              </div>

              <div className="h-[3px] w-full bg-white/[0.08]">
                <div
                  className="h-full bg-white/60 transition-all"
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