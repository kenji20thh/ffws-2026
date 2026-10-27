import RegulationView, {
  RuleTable,
  type RuleSection,
} from "@/components/fantasy/RegulationView";

export const metadata = {
  title: "Regulation · Predictions · FFWS 2026",
};

// Keep these values in sync with backend/internal/service/scoring.go.
const TEAM_PLACEMENT: [string, string][] = [
  ["1st", "12"],
  ["2nd", "9"],
  ["3rd", "8"],
  ["4th", "7"],
  ["5th", "6"],
  ["6th", "5"],
  ["7th", "4"],
  ["8th", "3"],
  ["9th", "2"],
  ["10th", "1"],
  ["11th – 12th", "0"],
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

const scoringExamples = [
  { team: "TEAM ALPHA", predicted: 1, actual: 1, points: 12 },
  { team: "TEAM BRAVO", predicted: 2, actual: 4, points: 7 },
  { team: "TEAM CHARLIE", predicted: 3, actual: 6, points: 5 },
  { team: "TEAM DELTA", predicted: 4, actual: 3, points: 9 },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
      {children}
    </div>
  );
}

function PositionBadge({
  position,
  accent = false,
}: {
  position: number;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs font-black ${
        accent
          ? "border-orange-400/40 bg-orange-500/15 text-orange-300"
          : "border-white/10 bg-white/[0.04] text-white/75"
      }`}
    >
      {position}
    </span>
  );
}

function PredictionExample() {
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-white/10 bg-[#0b0908]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            Example matchday
          </div>
          <div className="mt-1 text-sm font-bold text-white">
            Your prediction vs. actual results
          </div>
        </div>
        <span className="rounded-md border border-orange-400/20 bg-orange-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-300">
          Sample data
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_54px] gap-2 border-b border-white/[0.06] px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-white/40 sm:grid-cols-[minmax(0,1fr)_90px_90px_64px]">
        <span>Team</span>
        <span className="text-center">Predicted</span>
        <span className="text-center">Actual</span>
        <span className="text-right">Points</span>
      </div>

      {scoringExamples.map((example, index) => (
        <div
          key={example.team}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_54px] items-center gap-2 border-b border-white/[0.05] px-4 py-3 last:border-0 sm:grid-cols-[minmax(0,1fr)_90px_90px_64px]"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[10px] font-mono text-white/25">
              0{index + 1}
            </span>
            <span className="truncate text-[10px] font-bold tracking-wide text-white/80 sm:text-xs">
              {example.team}
            </span>
          </div>

          <div className="flex justify-center">
            <PositionBadge position={example.predicted} />
          </div>

          <div className="flex justify-center">
            <PositionBadge
              position={example.actual}
              accent={example.predicted === example.actual}
            />
          </div>

          <div className="text-right">
            <span className="text-sm font-black tabular-nums text-orange-300">
              +{example.points}
            </span>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.025] px-4 py-3">
        <span className="text-xs text-white/45">Points from these 4 teams</span>
        <span className="text-lg font-black tabular-nums text-white">
          33 <span className="text-xs font-medium text-white/35">/ 48</span>
        </span>
      </div>
    </div>
  );
}

function ScoringLadder() {
  const maxPoints = 12;

  return (
    <div className="my-5 rounded-xl border border-white/10 bg-[#0b0908] p-4 sm:p-5">
      <SectionLabel>Points by position accuracy</SectionLabel>

      <div className="space-y-3">
        {PREDICTION_POINTS.map(([label, value]) => {
          const points = Number(value);

          return (
            <div
              key={label}
              className="grid grid-cols-[minmax(0,1fr)_minmax(60px,1.1fr)_34px] items-center gap-3"
            >
              <span className="text-xs text-white/65">{label}</span>

              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className={`h-full rounded-full ${
                    points === 12 ? "bg-orange-400" : "bg-white/35"
                  }`}
                  style={{ width: `${(points / maxPoints) * 100}%` }}
                />
              </div>

              <span
                className={`text-right text-xs font-black tabular-nums ${
                  points === 12 ? "text-orange-300" : "text-white/75"
                }`}
              >
                {value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-white/[0.08] pt-3 text-[11px] leading-relaxed text-white/40">
        Compare each team&apos;s predicted position with its actual position.
        The smaller the difference, the more points you earn.
      </div>
    </div>
  );
}

function MatchdayFlow() {
  const steps = [
    {
      number: "01",
      title: "Rank 12 teams",
      description: "Arrange every team from 1st to 12th.",
    },
    {
      number: "02",
      title: "Confirm your order",
      description: "Submit before the matchday deadline.",
    },
    {
      number: "03",
      title: "Earn points",
      description: "Score points when official results are entered.",
    },
  ];

  return (
    <div className="my-5 grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => (
        <div
          key={step.number}
          className="relative rounded-xl border border-white/10 bg-[#0b0908] p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-orange-400">
              {step.number}
            </span>
            {index < steps.length - 1 && (
              <span className="hidden text-white/20 sm:block">→</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white">{step.title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-white/45">
            {step.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function ScoreSummary() {
  return (
    <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-orange-400/20 bg-orange-400/[0.06] p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">
          Teams to predict
        </div>
        <div className="mt-2 text-3xl font-black text-white">12</div>
        <div className="mt-1 text-[11px] text-white/40">Every team, once</div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">
          Max per team
        </div>
        <div className="mt-2 text-3xl font-black text-orange-300">12</div>
        <div className="mt-1 text-[11px] text-white/40">Exact position</div>
      </div>

      <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:col-span-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">
          Maximum per day
        </div>
        <div className="mt-2 text-3xl font-black text-white">144</div>
        <div className="mt-1 text-[11px] text-white/40">12 teams × 12 points</div>
      </div>
    </div>
  );
}

const sections: RuleSection[] = [
  {
    title: "How it works",
    content: (
      <>
        <p>
          Predict the final ranking of the 12 teams in a matchday lobby.
          Place every team from 1st to 12th before the deadline. The closer
          your predicted positions are to the official results, the more
          points you earn.
        </p>
        <MatchdayFlow />
      </>
    ),
  },
  {
    title: "Making a prediction",
    content: (
      <>
        <div className="mb-4 rounded-lg border border-orange-400/15 bg-orange-400/[0.05] p-3">
          <div className="text-xs font-bold text-orange-300">
            Your matchday checklist
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Make sure your full ranking is correct before confirming your
            prediction.
          </p>
        </div>
        <ul className="list-disc space-y-2 pl-5">
          <li>Rank all 12 teams. Every team must appear exactly once.</li>
          <li>
            Drag teams to reorder them, or use the arrow buttons. 1st place
            is at the top.
          </li>
          <li>Review your ranking, then confirm to submit it.</li>
          <li>
            You get one prediction per day and can change it as often as you
            like until that day locks.
          </li>
          <li>
            You need a team profile with a team name and country before you
            can predict. This is shared with Fantasy.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Understanding the real results",
    content: (
      <>
        <p>
          A team&apos;s matchday ranking is based on its total points across
          all rooms played that day. Each room contributes placement points
          plus one point for every kill.
        </p>

        <div className="my-5 rounded-xl border border-white/10 bg-[#0b0908] p-4">
          <SectionLabel>How a room is scored</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Placement points
              </div>
              <div className="mt-2 text-2xl font-black text-white">12</div>
              <div className="mt-1 text-[11px] text-white/40">
                For 1st place
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Kill points
              </div>
              <div className="mt-2 text-2xl font-black text-orange-300">5</div>
              <div className="mt-1 text-[11px] text-white/40">
                For 5 kills
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-xs text-white/55">Example room total</span>
            <span className="text-lg font-black text-white">17 points</span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-white/35">
            Illustrative example: 1st-place placement points plus 5 kills.
          </p>
        </div>

        <RuleTable
          head={["Placement in a room", "Points"]}
          rows={TEAM_PLACEMENT}
        />

        <p className="mt-3">
          If two teams finish level on total points, the team with more kills
          ranks higher.
        </p>
      </>
    ),
  },
  {
    title: "How prediction points work",
    content: (
      <>
        <p>
          Each team is scored independently according to the difference
          between your predicted position and its actual final position.
          The scoring is the same regardless of which position you predict.
        </p>

        <ScoringLadder />

        <PredictionExample />

        <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
          <div className="text-xs font-bold text-white">
            Remember: score every team
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            Your day score adds the points earned by all 12 teams. An exact
            prediction earns 12 points; a difference of 7 or more positions
            earns 0.
          </p>
        </div>

        <ScoreSummary />

        <p>
          Your overall score is the sum of your scores across all scored
          matchdays. Points appear after the organizers enter and score the
          day&apos;s results.
        </p>
      </>
    ),
  },
  {
    title: "Deadlines and locking",
    content: (
      <>
        <div className="my-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#0b0908] p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-orange-300">
              Before lock
            </div>
            <div className="text-sm font-bold text-white">
              Edit your prediction
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white/45">
              Change your ranking as often as you want before the deadline.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b0908] p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/35">
              After lock
            </div>
            <div className="text-sm font-bold text-white">
              Prediction is final
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white/45">
              You cannot create or change that day&apos;s prediction.
            </p>
          </div>
        </div>

        <ul className="list-disc space-y-2 pl-5">
          <li>
            Every day has its own lock time, shown on the Schedule tab.
          </li>
          <li>
            Other players&apos; predictions remain hidden until the day
            locks, so nobody can copy them beforehand.
          </li>
          <li>
            Organizers can change lock times. Always check the Schedule tab
            for the latest deadline.
          </li>
        </ul>
      </>
    ),
  },
];

export default function PredictionRegulationPage() {
  return (
    <RegulationView
      eyebrow="Predictions"
      title="Regulation"
      intro="Learn how to rank the lobby, understand the official standings, and maximize your prediction points."
      sections={sections}
    />
  );
}
