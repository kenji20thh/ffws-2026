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

/** Menu sections for picking one tournament day (plus an "all days" row on top). */
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

  for (const group of GROUP_ORDER) {
    const inGroup = ordered.filter((day) => groupOf(day) === group);
    if (inGroup.length === 0) continue;

    const single = GROUP_LABEL[group] === undefined;

    sections.push({
      key: group,
      label: GROUP_LABEL[group],
      items: inGroup.map((day) => ({
        value: String(day.id),
        label: single ? shortDayName(day.name) : dayOptionLabel(day.name),
        display: shortDayName(day.name),
      })),
    });
  }

  return sections;
}
