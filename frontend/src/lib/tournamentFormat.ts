/**
 * FFWS Global Finals 2026 – Knockout Stage format.
 *
 * Phase 1 (Nov 6–15): 24 teams in 4 groups of 6. Every match day has ALL 24 teams
 * playing, split into two separate sessions of 12 teams (two groups each).
 * The day/session rotation below is taken straight from the official format graphic.
 */

export type GroupKey = "A" | "B" | "C" | "D";
export type SessionKey = "session-1" | "session-2";

export type GroupDef = {
  key: GroupKey;
  name: string;
  color: string;
  teams: { name: string; logo: string; aliases?: string[] }[];
};

export const GROUPS: GroupDef[] = [
  {
    key: "A", name: "Group A", color: "#ff5a1f",
    teams: [
      { name: "LYON", logo: "/teams/LYON.png" },
      { name: "Team Flash", logo: "/teams/FLASH.png", aliases: ["Flash"] },
      { name: "ONIC Olympus", logo: "/teams/ONIC.png", aliases: ["ONIC"] },
      { name: "LOS Grandes", logo: "/teams/LOS.png", aliases: ["LOS"] },
      { name: "Horaa Esports", logo: "/teams/HE.png", aliases: ["Horaa"] },
      { name: "XPROJEKT Esports", logo: "/teams/XP.png", aliases: ["XPROJEKT", "X Projekt"] },
    ],
  },
  {
    key: "B", name: "Group B", color: "#ffb000",
    teams: [
      { name: "Bigetron by Vitality", logo: "/teams/BTR.png", aliases: ["Vitality", "Bigetron", "Bigetron Esports"] },
      { name: "Blue Cheese", logo: "/teams/BlueCheese.png" },
      { name: "P Esports", logo: "/teams/pe.png" },
      { name: "Resurrection Esports", logo: "/teams/RES.png", aliases: ["Resurrection"] },
      { name: "Pirate Esports", logo: "/teams/PIRATE.png", aliases: ["Pirate"] },
      { name: "ParadoX Gaming", logo: "/teams/PDX.png", aliases: ["Paradox"] },
    ],
  },
  {
    key: "C", name: "Group C", color: "#c42cff",
    teams: [
      { name: "LOUD GG", logo: "/teams/LOUD.png", aliases: ["Loud Snickers", "LOUD"] },
      { name: "Team Apex Gaming", logo: "/teams/APEX.png", aliases: ["Apex Gaming", "Apex"] },
      { name: "GOW", logo: "/teams/GOW.png", aliases: ["GOW Esports"] },
      { name: "RRQ Kazu", logo: "/teams/RRQ.png", aliases: ["RRQ"] },
      { name: "Gun Dynasty", logo: "/teams/GunDynasty.png", aliases: ["Sun Dynasty", "Sun Dynasty Esports"] },
      { name: "Total Winner Esports", logo: "/teams/TOTALWINNER.png", aliases: ["Total Winner"] },
    ],
  },
  {
    key: "D", name: "Group D", color: "#25d366",
    teams: [
      { name: "Team Infinity", logo: "/teams/INF.png", aliases: ["Infinity"] },
      { name: "All Gamers Global", logo: "/teams/AG.png", aliases: ["All Gamers", "AG Global"] },
      { name: "Buriram United Esports", logo: "/teams/BRU.png", aliases: ["Buriram United", "Buriram"] },
      { name: "TSG Pros", logo: "/teams/TSG.png", aliases: ["TSG"] },
      { name: "Stellar Esports", logo: "/teams/STELLAR.png", aliases: ["Stellar"] },
      { name: "FLUXO", logo: "/teams/fluxo.png", aliases: ["Fluxo W7M", "FLUXO W7M"] },
    ],
  },
];

export const GROUP_BY_KEY: Record<GroupKey, GroupDef> = Object.fromEntries(
  GROUPS.map((g) => [g.key, g]),
) as Record<GroupKey, GroupDef>;

export const TEAM_LOGOS: Record<string, string> = Object.fromEntries(
  GROUPS.flatMap((g) => g.teams.map((t) => [t.name, t.logo])),
);

/** Official rotation: which two groups play in each session of each Phase 1 match day. */
export const PHASE_ONE_ROTATION: Record<
  number /* week */,
  Record<number /* day 1-3 */, Record<SessionKey, [GroupKey, GroupKey]>>
> = {
  1: {
    1: { "session-1": ["A", "B"], "session-2": ["C", "D"] },
    2: { "session-1": ["A", "C"], "session-2": ["B", "D"] },
    3: { "session-1": ["A", "D"], "session-2": ["B", "C"] },
  },
  2: {
    1: { "session-1": ["C", "D"], "session-2": ["A", "B"] },
    2: { "session-1": ["B", "D"], "session-2": ["A", "C"] },
    3: { "session-1": ["B", "C"], "session-2": ["A", "D"] },
  },
};

/** day_order 1..6 → { week: 1|2, day: 1|2|3 }; undefined outside Phase 1. */
export function phaseOneSlot(dayOrder: number): { week: number; day: number } | undefined {
  if (dayOrder < 1 || dayOrder > 6) return undefined;
  return { week: dayOrder <= 3 ? 1 : 2, day: ((dayOrder - 1) % 3) + 1 };
}

export function sessionGroups(dayOrder: number, session: SessionKey): [GroupKey, GroupKey] | undefined {
  const slot = phaseOneSlot(dayOrder);
  return slot ? PHASE_ONE_ROTATION[slot.week][slot.day][session] : undefined;
}

function norm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const GROUP_LOOKUP: { key: string; group: GroupKey; exact: boolean }[] = GROUPS.flatMap((g) =>
  g.teams.flatMap((t) => [
    { key: norm(t.name), group: g.key, exact: true },
    ...(t.aliases ?? []).map((a) => ({ key: norm(a), group: g.key, exact: true })),
  ]),
);

/** Find a team's Phase 1 group from its name/tag as stored in the database. */
export function groupForTeam(team: { name: string; tag?: string }): GroupKey | undefined {
  const name = norm(team.name);
  const tag = team.tag ? norm(team.tag) : "";
  const exact = GROUP_LOOKUP.find((e) => e.key === name || (tag && e.key === tag));
  if (exact) return exact.group;
  // fallback: one name contains the other (e.g. "ONIC Esports Olympus" vs "ONIC")
  const loose = GROUP_LOOKUP.find((e) => e.key.length >= 4 && (name.includes(e.key) || (name.length >= 4 && e.key.includes(name))));
  return loose?.group;
}

/** Where a team ends up after Phase 1, based on its overall rank (1-based). */
export type Phase1Zone = { label: string; tone: "pool1" | "pool" | "last-chance" | "out" };

export function phaseOneZone(rank: number): Phase1Zone {
  if (rank <= 12) return { label: "Pool 1 · Week 3 Day 1", tone: "pool1" };
  if (rank <= 14) return { label: "Pool 2 · Week 3 Day 2", tone: "pool" };
  if (rank <= 16) return { label: "Pool 3 · Week 3 Day 3", tone: "pool" };
  if (rank <= 18) return { label: "Pool 4 · Week 3 Day 4", tone: "pool" };
  if (rank <= 20) return { label: "Last Chance", tone: "last-chance" };
  return { label: "Eliminated", tone: "out" };
}
