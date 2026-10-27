import type { ReactNode } from "react";
import RegulationView, {
  RuleTable,
  type RuleSection,
} from "@/components/fantasy/RegulationView";
import Monogram from "@/components/ui/Monogram";
import { getTeams, getTournament } from "@/lib/api";
import type { Team } from "@/types";
import { pointsTone } from "@/lib/predictionTone";

export const dynamic = "force-dynamic";

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

const EXAMPLE_TEAMS = [
  { name: "LYON", tag: "LYN", predicted: 1, actual: 1 },
  { name: "TEAM FLASH", tag: "FL", predicted: 2, actual: 4 },
  { name: "ONIC OLYMPUS", tag: "ONIC", predicted: 3, actual: 6 },
  { name: "LOS GRANDES", tag: "LOS", predicted: 4, actual: 3 },
  { name: "HORAA ESPORTS", tag: "HR", predicted: 5, actual: 10 },
  { name: "XPROJEKT", tag: "XP", predicted: 6, actual: 5 },
  { name: "BIGETRON", tag: "BTR", predicted: 7, actual: 2 },
  { name: "BLUE CHEESE", tag: "BC", predicted: 8, actual: 12 },
  { name: "P ESPORTS", tag: "PES", predicted: 9, actual: 9 },
  { name: "FLUXO", tag: "FX", predicted: 10, actual: 8 },
  { name: "RRQ", tag: "RRQ", predicted: 11, actual: 11 },
  { name: "LOUD", tag: "LOUD", predicted: 12, actual: 7 },
];

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findTeamLogo(team: (typeof EXAMPLE_TEAMS)[number], teams: Team[]) {
  const tag = normalizeName(team.tag);
  const name = normalizeName(team.name);

  const aliases: Record<string, string[]> = {
    lyon: ["lyon", "lyonesports"],
    teamflash: ["teamflash", "flash"],
    onicolympus: ["onicolympus", "onic"],
    losgrandes: ["losgrandes", "los"],
    horaaesports: ["horaaesports", "horaa"],
    xprojekt: ["xprojekt", "xprojekt"],
    bigetron: ["bigetron", "bigetronbyvitality", "btr"],
    bluecheese: ["bluecheese"],
    pesports: ["pesports"],
    fluxo: ["fluxo", "fx"],
    rrq: ["rrq"],
    loud: ["loud"],
  };

  const candidates = aliases[name] ?? [name, tag];

  const match = teams.find((candidate) => {
    const candidateName = normalizeName(candidate.name);
    const candidateTag = normalizeName(candidate.tag);

    return (
      candidates.includes(candidateName) ||
      candidates.includes(candidateTag) ||
      candidateName === name ||
      candidateTag === tag
    );
  });

  return match?.logo_url || undefined;
}

function predictionPoints(predicted: number, actual: number) {
  const difference = Math.abs(predicted - actual);

  if (difference === 0) return 12;
  if (difference === 1) return 9;
  if (difference === 2) return 7;
  if (difference === 3) return 5;
  if (difference === 4) return 3;
  if (difference === 5) return 2;
  if (difference === 6) return 1;
  return 0;
}

const EXAMPLE_RESULTS = EXAMPLE_TEAMS.map((team) => ({
  ...team,
  points: predictionPoints(team.predicted, team.actual),
}));

const EXAMPLE_TOTAL = EXAMPLE_RESULTS.reduce(
  (total, team) => total + team.points,
  0,
);

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 font-stat text-[10px] font-bold uppercase tracking-[0.18em] text-ember">
      <span className="h-1 w-1 shrink-0 bg-ember" />
      {children}
    </div>
  );
}

function Position({
  value,
  highlight = false,
}: {
  value: number;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center font-stat text-xs font-bold tabular-nums ${
        highlight
          ? "bg-ember text-char"
          : "border border-bone/10 bg-char text-bone/80"
      }`}
    >
      {value}
    </span>
  );
}

async function PredictionExample() {
  let teams: Team[] = [];

  try {
    const tournament = await getTournament("ffws-2026");
    teams = await getTeams(tournament.id);
  } catch {
    // Keep the example available if the API is temporarily unreachable.
  }

  const results = EXAMPLE_RESULTS.map((team) => ({
    ...team,
    logoUrl: findTeamLogo(team, teams),
  }));

  const exact = results.filter(
    (team) => team.predicted === team.actual,
  ).length;

  return (
    <div className="my-5 overflow-hidden border border-bone/10 bg-char-2">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bone/10 px-4 py-4 sm:px-5">
        <div>
          <SectionLabel>Scoring example</SectionLabel>
          <h3 className="font-display text-xl font-black uppercase leading-tight text-bone sm:text-2xl">
            Prediction vs. result
          </h3>
          <p className="mt-1 text-xs text-ash">
            12 teams · Maximum 144 points
          </p>
        </div>

        <span className="border border-bone/10 px-2.5 py-1 font-stat text-[9px] font-semibold uppercase tracking-wider text-ash">
          Illustrative example
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_36px_36px_58px] items-center gap-2 border-b border-bone/10 px-3 py-2 font-stat text-[9px] uppercase tracking-wider text-ash sm:grid-cols-[minmax(0,1fr)_48px_48px_76px] sm:px-5">
        <span>Team</span>
        <span className="text-center">Pick</span>
        <span className="text-center">Result</span>
        <span className="text-right">Points</span>
      </div>

      <div>
        {results.map((team) => {
          const tone = pointsTone(team.points);
          const difference = Math.abs(team.predicted - team.actual);

          return (
            <div
              key={team.tag}
              className="grid grid-cols-[minmax(0,1fr)_36px_36px_58px] items-center gap-2 border-b border-bone/[0.06] px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_48px_48px_76px] sm:px-5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {team.logoUrl ? (
                    <Monogram
                      label={team.tag}
                      imageUrl={team.logoUrl}
                      size={32}
                    />
                  ) : (
                    <Monogram label={team.tag} size={32} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-display text-xs font-bold uppercase leading-tight text-bone sm:text-sm">
                    {team.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ash">
                    {difference === 0
                      ? "Exact prediction"
                      : `${difference} ${difference === 1 ? "place" : "places"} off`}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Position value={team.predicted} />
              </div>

              <div className="flex justify-center">
                <Position
                  value={team.actual}
                  highlight={difference === 0}
                />
              </div>

              <div className="flex justify-end">
                <span
                  style={{ color: tone.color }}
                  className="font-stat text-sm font-black tabular-nums sm:text-base"
                >
                  +{team.points}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 border-t border-bone/10">
        <div className="border-r border-bone/10 px-4 py-3 sm:px-5">
          <p className="font-stat text-[9px] uppercase tracking-wider text-ash">
            Exact predictions
          </p>
          <p className="mt-1 font-display text-2xl font-black text-bone">
            {exact}
            <span className="ml-1 font-stat text-xs font-normal text-ash">
              / 12
            </span>
          </p>
        </div>

        <div className="px-4 py-3 text-right sm:px-5">
          <p className="font-stat text-[9px] uppercase tracking-wider text-ash">
            Total points
          </p>
          <p className="mt-1 font-display text-2xl font-black tabular-nums text-ember">
            {EXAMPLE_TOTAL}
            <span className="ml-1 font-stat text-xs font-normal text-ash">
              / 144
            </span>
          </p>
        </div>
      </div>

      <p className="border-t border-bone/10 px-4 py-3 text-[11px] leading-relaxed text-ash sm:px-5">
        The logos come from the tournament&apos;s team records. The placements
        above are illustrative, not official match results. Points are awarded
        according to the difference between each predicted and actual position.
      </p>
    </div>
  );
}

function ScoringLadder() {
  return (
    <div className="my-5 border border-bone/10 bg-char-2 p-4 sm:p-5">
      <SectionLabel>Prediction scoring</SectionLabel>

      <div className="space-y-3">
        {PREDICTION_POINTS.map(([label, value]) => {
          const points = Number(value);
          const tone = pointsTone(points);

          return (
            <div
              key={label}
              className="grid grid-cols-[minmax(0,1fr)_minmax(52px,1fr)_28px] items-center gap-3"
            >
              <span className="text-xs text-bone/75">{label}</span>

              <div className="h-1.5 overflow-hidden bg-bone/[0.06]">
                <div
                  style={{
                    width: `${(points / 12) * 100}%`,
                    backgroundColor: tone.color,
                  }}
                  className="h-full"
                />
              </div>

              <span
                style={{ color: tone.color }}
                className="text-right font-stat text-sm font-bold tabular-nums"
              >
                {points}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 border-t border-bone/10 pt-3 text-[11px] leading-relaxed text-ash">
        Points are based on the absolute difference between your predicted
        position and the final position. The same scoring applies to all
        12 teams.
      </p>
    </div>
  );
}

function MatchdayFlow() {
  const steps = [
    {
      number: "01",
      title: "Rank the lobby",
      description: "Place all 12 teams from 1st to 12th.",
    },
    {
      number: "02",
      title: "Confirm your picks",
      description: "Submit before the matchday deadline.",
    },
    {
      number: "03",
      title: "Collect your points",
      description: "Earn points when results are scored.",
    },
  ];

  return (
    <div className="my-5 grid gap-2 sm:grid-cols-3">
      {steps.map((step) => (
        <div
          key={step.number}
          className="border border-bone/10 bg-char-2 p-4"
        >
          <p className="font-stat text-[10px] font-bold text-ember">
            {step.number}
          </p>
          <h3 className="mt-3 font-display text-sm font-bold uppercase text-bone">
            {step.title}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-ash">
            {step.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function ScoreSummary() {
  const stats = [
    { label: "Teams per prediction", value: "12", detail: "Every team once" },
    { label: "Points per exact pick", value: "12", detail: "Per team" },
    { label: "Maximum day score", value: "144", detail: "12 × 12 points" },
  ];

  return (
    <div className="my-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`border p-3 sm:p-4 ${
            index === 2
              ? "col-span-2 border-ember/20 bg-ember/[0.04] sm:col-span-1"
              : "border-bone/10 bg-char-2"
          }`}
        >
          <p className="font-stat text-[9px] uppercase tracking-wider text-ash">
            {stat.label}
          </p>
          <p
            className={`mt-2 font-display text-3xl font-black tabular-nums ${
              index === 2 ? "text-ember" : "text-bone"
            }`}
          >
            {stat.value}
          </p>
          <p className="mt-1 text-[10px] text-ash">{stat.detail}</p>
        </div>
      ))}
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
          Arrange every team from 1st to 12th before the deadline. The closer
          your predictions are to the official results, the more points you
          earn.
        </p>
        <MatchdayFlow />
      </>
    ),
  },
  {
    title: "Making a prediction",
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Rank all 12 teams. Every team must appear exactly once.</li>
        <li>
          Drag teams to reorder them, or use the arrow buttons. 1st place
          is at the top.
        </li>
        <li>Review your ranking, then confirm to submit.</li>
        <li>
          You get one prediction per day and can change it as often as you
          like until that day locks.
        </li>
        <li>
          You need a team profile with a team name and country before you
          can predict. It is shared with Fantasy.
        </li>
      </ul>
    ),
  },
  {
    title: "The real result",
    content: (
      <>
        <p>
          A team&apos;s matchday ranking is calculated from its total points
          across all rooms played that day. Each room contributes placement
          points plus one point for every kill.
        </p>

        <div className="my-5 border border-bone/10 bg-char-2 p-4">
          <SectionLabel>Example room score</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-bone/10 bg-char p-3">
              <p className="font-stat text-[9px] uppercase tracking-wider text-ash">
                1st-place finish
              </p>
              <p className="mt-2 font-display text-3xl font-black text-bone">
                12
              </p>
              <p className="text-[10px] text-ash">Placement points</p>
            </div>
            <div className="border border-bone/10 bg-char p-3">
              <p className="font-stat text-[9px] uppercase tracking-wider text-ash">
                5 kills
              </p>
              <p className="mt-2 font-display text-3xl font-black text-ember">
                +5
              </p>
              <p className="text-[10px] text-ash">Kill points</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-bone/10 pt-3">
            <span className="font-stat text-[10px] uppercase tracking-wider text-ash">
              Total room points
            </span>
            <span className="font-display text-2xl font-black text-ember">
              17
            </span>
          </div>
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
    title: "Scoring",
    content: (
      <>
        <p>
          Every team earns points independently. Compare its predicted
          position with its actual final position to determine the points
          awarded.
        </p>

        <ScoringLadder />
        <PredictionExample />
        <ScoreSummary />

        <p>
          Your day score is the sum of the points earned by all 12 teams.
          Your overall score is the sum of all scored days. Points appear
          after the organizers enter and score the day&apos;s results.
        </p>
      </>
    ),
  },
  {
    title: "Deadlines",
    content: (
      <>
        <div className="my-4 grid gap-2 sm:grid-cols-2">
          <div className="border border-ember/20 bg-ember/[0.04] p-4">
            <p className="font-stat text-[10px] font-bold uppercase tracking-widest text-ember">
              Before lock
            </p>
            <h3 className="mt-2 font-display text-base font-bold uppercase text-bone">
              Make changes
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ash">
              Create or edit your prediction before the deadline.
            </p>
          </div>
          <div className="border border-bone/10 bg-char-2 p-4">
            <p className="font-stat text-[10px] font-bold uppercase tracking-widest text-ash">
              After lock
            </p>
            <h3 className="mt-2 font-display text-base font-bold uppercase text-bone">
              Prediction locked
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ash">
              You cannot create or change that day&apos;s prediction.
            </p>
          </div>
        </div>

        <ul className="list-disc space-y-2 pl-5">
          <li>
            Every day has its own lock time, shown on the Schedule tab.
          </li>
          <li>
            Other players&apos; predictions remain hidden until the day locks,
            so nobody can copy them beforehand.
          </li>
          <li>
            Organizers can change lock times. The Schedule tab shows the
            current deadline.
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
      intro="Learn how to rank a 12-team lobby, understand the official results, and earn prediction points."
      sections={sections}
    />
  );
}