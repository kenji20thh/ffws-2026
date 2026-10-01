import { FFWS_MAPS } from "@/lib/maps";
import type { TeamMapStats } from "@/types";

type MapTheme = {
  background: string;
  accent: string;
  text: string;
  muted: string;
};

const MAP_THEMES: Record<string, MapTheme> = {
  Bermuda: {
    background: "#f9df1f",
    accent: "#e4c719",
    text: "#171717",
    muted: "rgba(23,23,23,0.55)",
  },
  Kalahari: {
    background: "#ffb866",
    accent: "#e6a052",
    text: "#171717",
    muted: "rgba(23,23,23,0.55)",
  },
  NexTerra: {
    background: "#a9d8c5",
    accent: "#8dc0aa",
    text: "#171717",
    muted: "rgba(23,23,23,0.55)",
  },
  Purgatory: {
    background: "#d8b7e8",
    accent: "#bd98d0",
    text: "#171717",
    muted: "rgba(23,23,23,0.55)",
  },
  Solara: {
    background: "#e7a9a2",
    accent: "#ce8e87",
    text: "#171717",
    muted: "rgba(23,23,23,0.55)",
  },
};

const DEFAULT_THEME: MapTheme = {
  background: "#d6d6d2",
  accent: "#bdbdb8",
  text: "#171717",
  muted: "rgba(23,23,23,0.55)",
};

export default function MapStats({
  maps,
}: {
  maps: TeamMapStats[] | null;
}) {
  const byName = new Map((maps ?? []).map((m) => [m.map_name, m]));

  return (
    <div className="space-y-14">
      {FFWS_MAPS.map((name) => {
        const m = byName.get(name);
        const played = !!m && m.rooms_played > 0;
        const theme = MAP_THEMES[name] ?? DEFAULT_THEME;

        return (
          <div
            key={name}
            className="relative min-h-[270px] overflow-hidden"
            style={{
              backgroundColor: theme.background,
              color: theme.text,
            }}
          >
            {/* Large decorative circle */}
            <div
              className="pointer-events-none absolute -right-2 top-0 h-[190px] w-[190px] rounded-full"
              style={{
                backgroundColor: "rgba(255,255,255,0.22)",
              }}
            />

            {/* Large diagonal */}
            <div
              className="pointer-events-none absolute left-[34%] top-[-45%] h-[180%] w-[42px] rotate-45"
              style={{
                backgroundColor: "rgba(255,255,255,0.20)",
              }}
            />

            {/* Bottom-left geometric shape */}
            <div
              className="pointer-events-none absolute -bottom-28 -left-10 h-48 w-48 rotate-12 border-[18px]"
              style={{
                borderColor: "rgba(23,23,23,0.10)",
              }}
            />

            {/* Map label */}
            <div className="absolute left-[18px] top-0 z-10 -translate-y-[1px] bg-[#111] px-5 py-3">
              <span className="font-stat text-[10px] font-bold uppercase tracking-[0.28em] text-white">
                {name}
              </span>
            </div>

            {/* Map initial */}
            <span
              className="pointer-events-none absolute right-8 top-8 font-display text-[78px] font-black leading-none"
              style={{
                color: "rgba(23,23,23,0.07)",
              }}
            >
              {name.charAt(0)}
            </span>

            <div className="relative z-[1] px-9 pb-10 pt-14 sm:px-10">
              {/* Heading */}
              <div>
                <p
                  className="font-stat text-[9px] uppercase tracking-[0.32em]"
                  style={{ color: theme.muted }}
                >
                  Team Performance
                </p>

                <h3 className="mt-1 font-display text-3xl font-extrabold uppercase leading-none sm:text-[34px]">
                  {name}
                </h3>
              </div>

              {/* Stats */}
              {played && m ? (
                <div className="mt-8 grid max-w-[720px] grid-cols-1 sm:grid-cols-3">
                  {/* Rooms */}
                  <div className="border-l border-black/20 pl-4 sm:pl-4">
                    <p
                      className="font-stat text-[9px] uppercase tracking-[0.18em]"
                      style={{ color: theme.muted }}
                    >
                      Rooms Played
                    </p>

                    <p className="mt-1 font-display text-3xl font-black tabular-nums">
                      {m.rooms_played}
                    </p>
                  </div>

                  {/* Average kills */}
                  <div className="mt-5 border-l border-black/20 pl-4 sm:mt-0 sm:pl-4">
                    <p
                      className="font-stat text-[9px] uppercase tracking-[0.18em]"
                      style={{ color: theme.muted }}
                    >
                      Average Kills
                    </p>

                    <p className="mt-1 font-display text-3xl font-black tabular-nums">
                      {m.rooms_played > 0
                        ? (m.total_kills / m.rooms_played).toFixed(1)
                        : "0.0"}
                    </p>
                  </div>

                  {/* Average placement */}
                  <div className="mt-5 border-l border-black/20 pl-4 sm:mt-0 sm:pl-4">
                    <p
                      className="font-stat text-[9px] uppercase tracking-[0.18em]"
                      style={{ color: theme.muted }}
                    >
                      Average Placement
                    </p>

                    <p className="mt-1 font-display text-3xl font-black tabular-nums">
                      {m.average_placement.toFixed(1)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-10">
                  <p
                    className="font-stat text-[10px] uppercase tracking-[0.2em]"
                    style={{ color: theme.muted }}
                  >
                    No data yet
                  </p>
                </div>
              )}

              {/* Bottom decoration */}
              <div className="mt-12 flex items-center gap-2">
                <div
                  className="h-[4px] w-[72px]"
                  style={{ backgroundColor: theme.text, opacity: 0.65 }}
                />

                <div
                  className="h-[4px] w-[42px]"
                  style={{ backgroundColor: theme.text, opacity: 0.25 }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}