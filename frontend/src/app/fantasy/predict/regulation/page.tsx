import RegulationView, { RuleTable, type RuleSection } from "@/components/fantasy/RegulationView";

export const metadata = { title: "Regulation · Predictions · FFWS 2026" };

// Keep these numbers in sync with backend/internal/service/scoring.go (PlacementPoints, PredictionPoints).
const TEAM_PLACEMENT: [string, string][] = [
  ["1st", "12"], ["2nd", "9"], ["3rd", "8"], ["4th", "7"], ["5th", "6"],
  ["6th", "5"], ["7th", "4"], ["8th", "3"], ["9th", "2"], ["10th", "1"], ["11th – 12th", "0"],
];
const PREDICTION_POINTS: [string, string][] = [
  ["Exact position", "12"],
  ["1 place off", "9"],
  ["2 places off", "7"],
  ["3 places off", "5"],
  ["4 places off", "3"],
  ["5 places off", "2"],
  ["6 places off", "1"],
  ["7 or more places off", "0"],
];

const sections: RuleSection[] = [
  {
    title: "How it works",
    content: (
      <p>
        Each tournament day has a lobby of 12 teams. Before the day starts, predict the order they will finish in, from
        1st to 12th. The closer your prediction is to the real result, the more points you earn.
      </p>
    ),
  },
  {
    title: "Making a prediction",
    content: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Rank all 12 teams. Every team appears exactly once.</li>
        <li>Drag teams to reorder them, or use the arrow buttons. 1st place is at the top.</li>
        <li>Review your order, then confirm to submit.</li>
        <li>You get one prediction per day, and you can change it as often as you like until the day locks.</li>
        <li>You need a team (team name and country) before you can predict. It is shared with Fantasy.</li>
      </ul>
    ),
  },
  {
    title: "The real result",
    content: (
      <>
        <p>
          Teams are ranked by their total points for the day, added up over all rooms of that day. Each room gives a
          team placement points, plus 1 point for every kill:
        </p>
        <RuleTable head={["Placement in a room", "Points"]} rows={TEAM_PLACEMENT} />
        <p>If two teams finish level on points, the team with more kills ranks higher.</p>
      </>
    ),
  },
  {
    title: "Scoring",
    content: (
      <>
        <p>
          Each team you ranked earns points based on how far your predicted position was from its real position. The
          value is the same whichever position you are predicting.
        </p>
        <RuleTable head={["Your prediction was", "Points"]} rows={PREDICTION_POINTS} />
        <p>
          Your day score is the sum of all 12 teams, with a maximum of 144. Your overall score is the sum of all days.
          Points appear once the organizers have entered and scored the day&apos;s results.
        </p>
      </>
    ),
  },
  {
    title: "Deadlines",
    content: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Every day has its own lock time, shown on the Schedule tab.</li>
        <li>Once a day is locked, its prediction can&apos;t be created or changed.</li>
        <li>Other players&apos; predictions stay hidden until the day locks, so nobody can copy them.</li>
        <li>Lock times can be moved by the organizers. The Schedule tab always shows the current time.</li>
      </ul>
    ),
  },
];

export default function PredictionRegulationPage() {
  return (
    <RegulationView
      eyebrow="Predictions"
      title="Regulation"
      intro="How to predict a day's final ranking and how your points are calculated."
      sections={sections}
    />
  );
}
