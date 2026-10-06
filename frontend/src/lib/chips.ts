import type { FantasyChip } from "@/types";

export interface ChipInfo {
  id: FantasyChip;
  name: string;
  short: string;
  description: string;
  image: string;
}

// Rules enforced by the backend (service/scoring.go + SubmitSelection).
// Each chip: once per tournament, one chip per day.
export const CHIPS: ChipInfo[] = [
  {
    id: "triple_captain",
    name: "Triple Captain",
    short: "Captain scores 3x",
    description: "Your captain's points count triple instead of double.",
    image: "/images/fantasy/triple_captain.png",
  },
  {
    id: "limitless",
    name: "Limitless",
    short: "No budget limit",
    description: "The $100 budget doesn't apply: pick any four players.",
    image: "/images/fantasy/limitless.png",
  },
  {
    id: "Duo_stack",
    name: "Duo Stack",
    short: "2 from one team",
    description: "You may pick two players from the same team (one pair only).",
    image: "/images/fantasy/duo_stack.png",
  },
];

export const chipName = (id?: string | null) =>
  CHIPS.find((c) => c.id === id)?.name ?? "";

export const captainMultiplier = (chip?: string | null) =>
  chip === "triple_captain" ? 3 : 2;