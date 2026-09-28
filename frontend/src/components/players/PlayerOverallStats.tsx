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
      {/* Background geometry */}
      <div className="pointer-events-none absolute inset-0">
        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Yellow diagonal lines */}
        <div className="absolute -right-20 top-0 h-[140%] w-px rotate-[28deg] bg-[#f5c542]/20" />
        <div className="absolute right-[12%] -top-20 h-[130%] w-px rotate-[28deg] bg-[#f5c542]/10" />
        <div className="absolute right-[25%] -top-32 h-[120%] w-px rotate-[28deg] bg-[#f5c542]/[0.06]" />

        {/* Thin horizontal accent */}
        <div className="absolute right-0 top-[30%] h-px w-[32%] bg-[#f5c542]/15" />
        <div className="absolute right-0 top-[30%] h-px w-[14%] bg-[#f5c542]/25" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-16 lg:px-16 lg:py-20">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between border-b border-white/[0.08] pb-5">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
              <span className="h-[2px] w-5 bg-[#f5c542]/60" />
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

        {/* Statistics */}
        <div className="grid grid-cols-2 border-l border-t border-white/[0.08] md:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="relative border-b border-r border-white/[0.08] px-5 py-6 md:px-6 md:py-7"
            >
              {/* Small yellow corner */}
              {index === 0 && (
                <div className="absolute left-0 top-0 h-px w-8 bg-[#f5c542]/60" />
              )}

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
        <div className="relative mt-3 border border-white/[0.08] px-5 py-6 md:px-7 md:py-7">
          {/* Yellow accent */}
          <div className="absolute left-0 top-0 h-px w-16 bg-[#f5c542]/60" />

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

              <div className="relative h-[3px] w-full bg-white/[0.08]">
                <div
                  className="h-full bg-[#f5c542]/60 transition-all"
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