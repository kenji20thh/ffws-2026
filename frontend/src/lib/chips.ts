import type { FantasyChip } from "@/types";

export interface ChipInfo {
  id: FantasyChip;
  name: string;
  short: string;
  description: string;
}

// Rules enforced by the backend (service/scoring.go + SubmitSelection). Each chip: once per tournament, one chip per day.
export const CHIPS: ChipInfo[] = [
  {
    id: "triple_captain",
    name: "Triple Captain",
    short: "Captain scores 3x",
    description: "Your captain's points count triple instead of double.",
  },
  {
    id: "limitless",
    name: "Limitless",
    short: "No budget limit",
    description: "The $100 budget doesn't apply: pick any four players.",
  },
  {
    id: "same_team",
    name: "Same Team",
    short: "2 from one team",
    description: "You may pick two players from the same team (one pair only).",
  },
];

export const chipName = (id?: string | null) => CHIPS.find((c) => c.id === id)?.name ?? "";

export const captainMultiplier = (chip?: string | null) => (chip === "triple_captain" ? 3 : 2);
