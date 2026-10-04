import RegulationView, { RuleTable, type RuleSection } from "@/components/fantasy/RegulationView";

export const metadata = { title: "Regulation · Fantasy · FFWS 2026" };

// Keep these numbers in sync with backend/internal/service/scoring.go (Fantasy*).
const PLACEMENT: [string, string][] = [
  ["1st", "15"], ["2nd", "12"], ["3rd", "10"], ["4th", "8"], ["5th", "6"],
  ["6th", "5"], ["7th", "4"], ["8th", "3"], ["9th", "2"], ["10th", "1"], ["11th – 12th", "0"],
];
const PER_PLAYER: [string, string][] = [
  ["Each kill", "10 pts"],
  ["First blood", "+5 pts"],
  ["Team placement in the room", "see table below"],
];

const sections: RuleSection[] = [
  {
    title: "How it works",
    content: (
      <p>
        Before each tournament day, pick a squad of 4 players. Your squad earns points from how those players and their
        teams perform in every room of that day. You build a new squad for each day.
      </p>
    ),
  },
  {
    title: "Building your squad",
    content: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Pick exactly 4 players.</li>
        <li>All 4 players must come from different teams.</li>
        <li>The total price of your squad can&apos;t go over $100.</li>
        <li>Choose one captain. The captain&apos;s points count double.</li>
        <li>You need a fantasy team (team name and country) before you can pick. It is shared with Prediction.</li>
      </ul>
    ),
  },
  {
    title: "Scoring",
    content: (
      <>
        <p>In every room, each player in your squad earns:</p>
        <RuleTable head={["Event", "Points"]} rows={PER_PLAYER} />
        <p>Placement points depend on where the player&apos;s team finished in that room:</p>
        <RuleTable head={["Team placement", "Points"]} rows={PLACEMENT} />
        <p>
          Your day score is the sum over all rooms of that day, with the captain&apos;s total doubled. Your overall score
          is the sum of all days.
        </p>
      </>
    ),
  },
  {
    title: "Deadlines",
    content: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Every day has its own lock time, shown on the Schedule tab.</li>
        <li>You can change your squad as often as you like until the day locks.</li>
        <li>Once a day is locked, its squad can&apos;t be changed.</li>
        <li>Other players&apos; squads stay hidden until the day locks, so nobody can copy them.</li>
        <li>Lock times can be moved by the organizers. The Schedule tab always shows the current time.</li>
      </ul>
    ),
  },
  {
    title: "Leaderboard",
    content: (
      <p>
        Players are ranked by total points. The leaderboard shows the overall ranking, or you can view a single day.
      </p>
    ),
  },
];

export default function FantasyRegulationPage() {
  return (
    <RegulationView
      eyebrow="Fantasy"
      title="Regulation"
      intro="Everything you need to know about building a squad, scoring points and the deadlines."
      sections={sections}
    />
  );
}
