import type { MenuSection } from "@/components/standings/MatchdayMenu";
import type { TournamentDay } from "@/types";

/** "Knockout Stage - Week 1 Day 2" -> "Week 1 · Day 2" (other names just lose the prefix). */
export function shortDayName(name: string) {
  const trimmed = name.replace(/^Knockout Stage\s*[-–—]\s*/i, "").trim();
  const match = trimmed.match(/^Week\s*(\d+)\s*[-–—,]?\s*Day\s*(\d+)/i);
  return match ? `Week ${match[1]} · Day ${match[2]}` : trimmed;
}

/** Label inside a "Week N" section: just "Day N" when possible. */
function dayOptionLabel(name: string) {
  const match = name.match(/Day\s*(\d+)/i);
  return match ? `Day ${match[1]}` : shortDayName(name);
}

type DayGroup = "week-1" | "week-2" | "week-3" | "last-chance" | "grand-finals";

const GROUP_ORDER: DayGroup[] = [
  "week-1",
  "week-2",
  "week-3",
  "last-chance",
  "grand-finals",
];

const GROUP_LABEL: Record<DayGroup, string | undefined> = {
  "week-1": "Week 1",
  "week-2": "Week 2",
  "week-3": "Week 3",
  // single-day stages: the day name is the label, no header needed
  "last-chance": undefined,
  "grand-finals": undefined,
};

function groupOf(day: TournamentDay): DayGroup {
  const name = day.name.toLowerCase();
  if (name.includes("last chance")) return "last-chance";
  if (name.includes("grand final") || day.day_order >= 11) return "grand-finals";
  if (day.day_order <= 3) return "week-1";
  if (day.day_order <= 6) return "week-2";
  return "week-3";
}

const WEEK_NUMBER: Record<"week-1" | "week-2" | "week-3", string> = {
  "week-1": "Week 1",
  "week-2": "Week 2",
  "week-3": "Week 3",
};

/** Days of the two knockout phases (Phase 1 = weeks 1-2, Phase 2 = week 3). */
function phaseDays(days: TournamentDay[], phase: "phase-1" | "phase-2") {
  const groups: DayGroup[] = phase === "phase-1" ? ["week-1", "week-2"] : ["week-3"];
  return days.filter((day) => groups.includes(groupOf(day)));
}

function daysLabel(count: number) {
  return `${count} ${count === 1 ? "day" : "days"}`;
}

/**
 * Menu sections for picking a day, a week or a whole phase, plus an "all days" row.
 * Values: "all", "phase-1", "phase-2", "week-1", "week-2" or a tournament day id.
 */
export function buildDayMenu(days: TournamentDay[], allLabel = "All days") {
  const ordered = [...days].sort((a, b) => a.day_order - b.day_order);

  const sections: MenuSection[] = [
    {
      key: "all",
      items: [
        {
          value: "all",
          label: allLabel,
          display: allLabel,
          hint: "Tournament",
          strong: true,
        },
      ],
    },
  ];

  const phaseItems = (["phase-1", "phase-2"] as const)
    .map((phase) => ({ phase, list: phaseDays(ordered, phase) }))
    .filter(({ list }) => list.length > 0)
    .map(({ phase, list }) => {
      const label = phase === "phase-1" ? "Phase 1 · Overall" : "Phase 2 · Overall";
      return {
        value: phase,
        label,
        display: label,
        hint: daysLabel(list.length),
        strong: true,
      };
    });

  if (phaseItems.length > 0) sections.push({ key: "phases", items: phaseItems });

  for (const group of GROUP_ORDER) {
    const inGroup = ordered.filter((day) => groupOf(day) === group);
    if (inGroup.length === 0) continue;

    const single = GROUP_LABEL[group] === undefined;

    // Week 1 and Week 2 can be viewed as a whole. Week 3 is the same as "Phase 2 · Overall".
    const weekOverall =
      group === "week-1" || group === "week-2"
        ? [
            {
              value: group,
              label: "Overall",
              display: `${WEEK_NUMBER[group]} · Overall`,
              hint: daysLabel(inGroup.length),
              strong: true,
            },
          ]
        : [];

    sections.push({
      key: group,
      label: GROUP_LABEL[group],
      items: [
        ...weekOverall,
        ...inGroup.map((day) => ({
          value: String(day.id),
          label: single ? shortDayName(day.name) : dayOptionLabel(day.name),
          display: shortDayName(day.name),
        })),
      ],
    });
  }

  return sections;
}

export type DaySelection = {
  scope: "all" | "phase" | "week" | "day";
  /** Tournament days whose stats are added up (empty for "all"). */
  dayIds: number[];
  label: string;
};

/** Turns a menu value into the days it covers. */
export function resolveSelection(value: string, days: TournamentDay[]): DaySelection {
  if (value === "all") return { scope: "all", dayIds: [], label: "All days" };

  if (value === "phase-1" || value === "phase-2") {
    return {
      scope: "phase",
      dayIds: phaseDays(days, value).map((day) => day.id),
      label: value === "phase-1" ? "Phase 1 · Overall" : "Phase 2 · Overall",
    };
  }

  if (value === "week-1" || value === "week-2") {
    return {
      scope: "week",
      dayIds: days.filter((day) => groupOf(day) === value).map((day) => day.id),
      label: `${WEEK_NUMBER[value]} · Overall`,
    };
  }

  const day = days.find((d) => String(d.id) === value);
  return {
    scope: "day",
    dayIds: day ? [day.id] : [],
    label: day ? shortDayName(day.name) : "Matchday",
  };
}
