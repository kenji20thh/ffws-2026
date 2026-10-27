import type { ReactNode } from "react";
import Monogram from "@/components/ui/Monogram";
import { getTeams, getTournament } from "@/lib/api";
import type { Team } from "@/types";
import { pointsTone } from "@/lib/predictionTone";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Regulation · Predictions · FFWS 2026",
};

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

const PREDICTION_POINTS: [string, number][] = [
  ["Exact position", 12],
  ["1 place off", 9],
  ["2 places off", 7],
  ["3 places off", 5],
  ["4 places off", 3],
  ["5 places off", 2],
  ["6 places off", 1],
  ["7+ places off", 0],
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

function findTeamLogo(
  example: (typeof EXAMPLE_TEAMS)[number],
  teams: Team[],
) {
  const aliases: Record<string, string[]> = {
    lyon: ["lyon", "lyonesports"],
    teamflash: ["teamflash", "flash"],
    onicolympus: ["onicolympus", "onic"],
    losgrandes: ["losgrandes", "los"],
    horaaesports: ["horaaesports", "horaa"],
    xprojekt: ["xprojekt"],
    bigetron: ["bigetron", "bigetronbyvitality", "btr"],
    bluecheese: ["bluecheese"],
    pesports: ["pesports"],
    fluxo: ["fluxo", "fx"],
    rrq: ["rrq"],
    loud: ["loud"],
  };

  const name = normalizeName(example.name);
  const tag = normalizeName(example.tag);
  const candidates = aliases[name] ?? [name, tag];

  const match = teams.find((team) => {
    const teamName = normalizeName(team.name);
    const teamTag = normalizeName(team.tag);

    return (
      candidates.includes(teamName) ||
      candidates.includes(teamTag) ||
      teamName === name ||
      teamTag === tag
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
  (sum, team) => sum + team.points,
  0,
);

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-stat text-[10px] font-bold uppercase tracking-[0.2em] text-ember">
      {children}
    </p>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="mt-2 font-display text-2xl font-black uppercase leading-none tracking-tight text-bone sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ash">
          {description}
        </p>
      )}
    </div>
  );
}

function RuleTable({
  rows,
}: {
  rows: [string, string][];
}) {
  return (
    <div className="overflow-hidden border-t border-bone/10">
      {rows.map(([label, value], index) => (
        <div
          key={label}
          className={`flex items-center justify-between gap-4 border-b border-bone/[0.07] py-3 ${
            index === 0 ? "text-bone" : "text-bone/75"
          }`}
        >
          <span className="text-sm">{label}</span>
          <span className="font-stat text-sm font-bold tabular-nums text-ember">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function MatchdayFlow() {
  const steps = [
    {
      number: "01",
      title: "Build your ranking",
      text: "Order all 12 teams from first to last.",
    },
    {
      number: "02",
      title: "Lock it in",
      text: "Submit before the matchday deadline.",
    },
    {
      number: "03",
      title: "Earn your points",
      text: "Your score is calculated when results are entered.",
    },
  ];

  return (
    <div className="grid gap-px overflow-hidden border border-bone/10 bg-bone/10 sm:grid-cols-3">
      {steps.map((step, index) => (
        <div
          key={step.number}
          className="relative min-h-36 bg-char-2 p-5"
        >
          <div className="flex items-center justify-between">
            <span className="font-stat text-[10px] font-bold tracking-widest text-ember">
              {step.number}
            </span>
            {index < 2 && (
              <span className="hidden text-lg text-bone/20 sm:block">↗</span>
            )}
          </div>
          <h3 className="mt-5 font-display text-base font-bold uppercase text-bone">
            {step.title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-ash">{step.text}</p>
        </div>
      ))}
    </div>
  );
}

function PredictionExample({ teams }: { teams: Team[] }) {
  const results = EXAMPLE_RESULTS.map((team) => ({
    ...team,
    logoUrl: findTeamLogo(team, teams),
  }));

  const exact = results.filter(
    (team) => team.predicted === team.actual,
  ).length;

  return (
    <div className="overflow-hidden border border-bone/10 bg-char-2">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-bone/10 p-4 sm:p-5">
        <div>
          <SectionEyebrow>Worked example</SectionEyebrow>
          <h3 className="mt-2 font-display text-xl font-black uppercase text-bone sm:text-2xl">
            Your picks vs. reality
          </h3>
          <p className="mt-1 text-xs text-ash">
            Illustrative placements · 12 teams
          </p>
        </div>
        <div className="text-right">
          <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
            Total score
          </p>
          <p className="font-display text-3xl font-black tabular-nums text-ember">
            {EXAMPLE_TOTAL}
            <span className="ml-1 text-sm font-medium text-ash">/ 144</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_38px_38px_48px] gap-2 border-b border-bone/10 px-3 py-2 font-stat text-[9px] uppercase tracking-wider text-ash sm:grid-cols-[minmax(0,1fr)_50px_50px_64px] sm:px-5">
        <span>Team</span>
        <span className="text-center">Pick</span>
        <span className="text-center">Actual</span>
        <span className="text-right">Pts</span>
      </div>

      {results.map((team) => {
        const difference = Math.abs(team.predicted - team.actual);
        const tone = pointsTone(team.points);

        return (
          <div
            key={team.tag}
            className="grid grid-cols-[minmax(0,1fr)_38px_38px_48px] items-center gap-2 border-b border-bone/[0.06] px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_50px_50px_64px] sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                <Monogram
                  label={team.tag}
                  imageUrl={team.logoUrl}
                  size={32}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-xs font-bold uppercase text-bone sm:text-sm">
                  {team.name}
                </p>
                <p className="mt-0.5 text-[9px] text-ash">
                  {difference === 0
                    ? "Exact"
                    : `${difference} ${difference === 1 ? "place" : "places"} off`}
                </p>
              </div>
            </div>

            <span className="text-center font-stat text-xs tabular-nums text-bone/70">
              {team.predicted}
            </span>
            <span
              className={`text-center font-stat text-xs font-bold tabular-nums ${
                difference === 0 ? "text-ember" : "text-bone"
              }`}
            >
              {team.actual}
            </span>
            <span
              style={{ color: tone.color }}
              className="text-right font-stat text-sm font-black tabular-nums"
            >
              +{team.points}
            </span>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bone/10 bg-char px-4 py-3 sm:px-5">
        <span className="font-stat text-[10px] uppercase tracking-wider text-ash">
          Exact placements
        </span>
        <span className="font-display text-lg font-black text-bone">
          {exact}
          <span className="ml-1 font-stat text-xs font-normal text-ash">
            / 12 teams
          </span>
        </span>
      </div>
      <p className="px-4 py-3 text-[10px] leading-relaxed text-ash sm:px-5">
        Example only, not official results. Logos are loaded from the tournament
        team records where a matching team is available.
      </p>
    </div>
  );
}

function ScoringBreakdown() {
  return (
    <div className="border border-bone/10 bg-char-2 p-4 sm:p-5">
      <SectionEyebrow>Points by accuracy</SectionEyebrow>
      <h3 className="mt-2 font-display text-xl font-black uppercase text-bone">
        Every position counts
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-ash">
        The smaller the gap between your pick and the final position, the more
        points you receive.
      </p>

      <div className="mt-5 space-y-4">
        {PREDICTION_POINTS.map(([label, points]) => {
          const tone = pointsTone(points);

          return (
            <div key={label}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-xs text-bone/80">{label}</span>
                <span
                  style={{ color: tone.color }}
                  className="font-stat text-xs font-bold tabular-nums"
                >
                  {points} pts
                </span>
              </div>
              <div className="h-1 overflow-hidden bg-bone/[0.07]">
                <div
                  style={{
                    width: `${(points / 12) * 100}%`,
                    backgroundColor: tone.color,
                  }}
                  className="h-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoomScoring() {
  return (
    <div className="border border-bone/10 bg-char-2 p-4 sm:p-5">
      <SectionEyebrow>Official team result</SectionEyebrow>
      <h3 className="mt-2 font-display text-xl font-black uppercase text-bone">
        How room points work
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-ash">
        A team's day ranking uses its total points across the rooms it plays.
        Each room contributes placement points plus one point per kill.
      </p>

      <div className="mt-5 divide-y divide-bone/10 border-y border-bone/10">
        <div className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="text-sm text-bone">1st-place finish</p>
            <p className="mt-0.5 text-[10px] text-ash">Placement points</p>
          </div>
          <span className="font-display text-2xl font-black text-bone">12</span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="text-sm text-bone">5 kills</p>
            <p className="mt-0.5 text-[10px] text-ash">Kill points</p>
          </div>
          <span className="font-display text-2xl font-black text-bone">+5</span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <p className="font-stat text-[10px] font-bold uppercase tracking-widest text-ash">
            Total room points
          </p>
          <span className="font-display text-3xl font-black text-ember">17</span>
        </div>
      </div>

      <h4 className="mb-1 mt-5 font-stat text-[10px] font-bold uppercase tracking-widest text-ash">
        Placement points per room
      </h4>
      <RuleTable rows={TEAM_PLACEMENT} />

      <p className="mt-3 text-[11px] leading-relaxed text-ash">
        If two teams finish level on total points, the team with more kills
        ranks higher.
      </p>
    </div>
  );
}

function Deadlines() {
  return (
    <div className="grid gap-px overflow-hidden border border-bone/10 bg-bone/10 sm:grid-cols-2">
      <div className="bg-char-2 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-ember" />
          <SectionEyebrow>Before the deadline</SectionEyebrow>
        </div>
        <h3 className="mt-4 font-display text-xl font-black uppercase text-bone">
          Your picks are editable
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ash">
          Create your ranking or change your submitted prediction as many times
          as you like before that day's lock time.
        </p>
      </div>
      <div className="bg-char-2 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-bone/40" />
          <SectionEyebrow>After the deadline</SectionEyebrow>
        </div>
        <h3 className="mt-4 font-display text-xl font-black uppercase text-bone">
          Your picks are locked
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ash">
          You cannot create or change a prediction for that day. Other players'
          predictions remain hidden until the day locks.
        </p>
      </div>
      <div className="col-span-full flex flex-wrap items-start justify-between gap-3 border-t border-bone/10 bg-char px-5 py-4">
        <p className="max-w-xl text-xs leading-relaxed text-ash">
          Each matchday has its own deadline. Check the Schedule tab for the
          current lock time. Organizers may update deadlines.
        </p>
        <span className="shrink-0 font-stat text-[10px] font-bold uppercase tracking-widest text-ember">
          Check the schedule ↗
        </span>
      </div>
    </div>
  );
}

export default async function PredictionRegulationPage() {
  let teams: Team[] = [];

  try {
    const tournament = await getTournament("ffws-2026");
    teams = await getTeams(tournament.id);
  } catch {
    // The regulation page remains readable if the API is unavailable.
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <header className="relative overflow-hidden border border-bone/10 bg-char-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
          style={{
            background:
              "linear-gradient(115deg, transparent 10%, rgba(255,90,31,0.06) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 h-full w-1 bg-ember"
        />

        <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end lg:p-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <SectionEyebrow>FFWS 2026 / Predictions</SectionEyebrow>
              <span className="border border-bone/10 px-2 py-1 font-stat text-[9px] uppercase tracking-widest text-ash">
                Game rules
              </span>
            </div>

            <h1 className="mt-6 max-w-3xl font-display text-[clamp(3.4rem,9vw,7rem)] font-black uppercase leading-[0.78] tracking-[-0.055em] text-bone">
              Read the
              <br />
              <span className="text-ember">lobby.</span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-relaxed text-bone/65 sm:text-base">
              Call the final standings before matchday. Get closer to the
              official result, collect more points, and climb the prediction
              leaderboard.
            </p>
          </div>

          <div className="grid grid-cols-3 border-y border-bone/10 lg:grid-cols-1 lg:border-y-0">
            <div className="border-r border-bone/10 py-4 pr-2 lg:border-b lg:border-r-0 lg:py-3 lg:pr-0">
              <p className="font-display text-3xl font-black tabular-nums text-bone sm:text-4xl">
                12
              </p>
              <p className="mt-1 font-stat text-[9px] uppercase tracking-wider text-ash">
                Teams to rank
              </p>
            </div>
            <div className="border-r border-bone/10 px-2 py-4 lg:border-b lg:border-r-0 lg:px-0 lg:py-3">
              <p className="font-display text-3xl font-black tabular-nums text-bone sm:text-4xl">
                144
              </p>
              <p className="mt-1 font-stat text-[9px] uppercase tracking-wider text-ash">
                Max points per day
              </p>
            </div>
            <div className="py-4 pl-2 lg:py-3 lg:pl-0">
              <p className="font-display text-3xl font-black tabular-nums text-ember sm:text-4xl">
                12
              </p>
              <p className="mt-1 font-stat text-[9px] uppercase tracking-wider text-ash">
                Points per exact pick
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-bone/10 px-5 py-3 sm:px-8">
          <p className="font-stat text-[9px] uppercase tracking-[0.16em] text-ash">
            Know the rules. Make your call.
          </p>
          <a
            href="#how-it-works"
            className="font-stat text-[10px] font-bold uppercase tracking-widest text-ember transition hover:text-bone"
          >
            Explore the rules ↓
          </a>
        </div>
      </header>

      <nav
        aria-label="Regulation sections"
        className="mt-5 flex gap-2 overflow-x-auto border-b border-bone/10 pb-3"
      >
        {[
          ["how-it-works", "Overview"],
          ["making-a-prediction", "Your picks"],
          ["scoring", "Prediction scoring"],
          ["real-results", "Room points"],
          ["deadlines", "Deadlines"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 border border-bone/10 px-3 py-2 font-stat text-[9px] font-bold uppercase tracking-wider text-ash transition hover:border-ember/50 hover:text-bone sm:text-[10px]"
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="how-it-works" className="scroll-mt-8 pt-12 sm:pt-16">
        <SectionHeading
          eyebrow="01 / The format"
          title="Three steps. One ranking."
          description="Every matchday, predict the finishing order of all 12 teams in your lobby."
        />
        <MatchdayFlow />
      </section>

      <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-10">
        <section id="making-a-prediction" className="scroll-mt-8">
          <SectionHeading
            eyebrow="02 / Your prediction"
            title="Make every place count."
            description="Your prediction must be a complete ranking. Each team can occupy one position only."
          />

          <div className="border-y border-bone/10">
            {[
              ["Rank all 12 teams", "Every team must appear exactly once, from 1st to 12th."],
              ["Reorder your picks", "Use the available controls to arrange the teams in your predicted order."],
              ["Submit before lock", "Review your ranking and confirm before the matchday deadline."],
              ["Edit while open", "You can update your prediction until the deadline passes."],
            ].map(([title, description], index) => (
              <div
                key={title}
                className="flex gap-4 border-b border-bone/[0.07] py-4 last:border-b-0"
              >
                <span className="pt-0.5 font-stat text-[10px] font-bold tabular-nums text-ember">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-base font-bold uppercase text-bone">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-ash">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ash">
            You need a team profile with a team name and country before you can
            predict. That profile is shared with Fantasy.
          </p>
        </section>

        <section id="real-results" className="scroll-mt-8">
          <SectionHeading
            eyebrow="03 / Official results"
            title="How teams score."
            description="The official matchday standings are calculated from the points earned across the rooms played that day."
          />
          <RoomScoring />
        </section>
      </div>

      <section id="scoring" className="scroll-mt-8 pt-12 sm:pt-16">
        <SectionHeading
          eyebrow="04 / Prediction scoring"
          title="Accuracy is everything."
          description="Every team is scored independently. Compare your predicted position with its actual finishing position to calculate the points earned."
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <ScoringBreakdown />
          <PredictionExample teams={teams} />
        </div>

        <div className="mt-5 grid gap-px overflow-hidden border border-bone/10 bg-bone/10 sm:grid-cols-3">
          <div className="bg-char-2 p-4 sm:p-5">
            <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
              Teams scored
            </p>
            <p className="mt-2 font-display text-3xl font-black text-bone">12</p>
            <p className="mt-1 text-xs text-ash">Every team in the lobby</p>
          </div>
          <div className="bg-char-2 p-4 sm:p-5">
            <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
              Exact pick
            </p>
            <p className="mt-2 font-display text-3xl font-black text-ember">12</p>
            <p className="mt-1 text-xs text-ash">Points for each exact position</p>
          </div>
          <div className="bg-char-2 p-4 sm:p-5">
            <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
              Perfect day
            </p>
            <p className="mt-2 font-display text-3xl font-black text-bone">144</p>
            <p className="mt-1 text-xs text-ash">12 exact predictions × 12 points</p>
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ash">
          Your matchday score is the sum of the points earned by all 12 teams.
          Your overall score adds together all scored matchdays. Points appear
          once the organizers enter and score the results.
        </p>
      </section>

      <section id="deadlines" className="scroll-mt-8 pt-12 sm:pt-16">
        <SectionHeading
          eyebrow="05 / Matchday lock"
          title="Don't miss your window."
          description="Every matchday has its own deadline. Once the day locks, your submitted ranking cannot be changed."
        />
        <Deadlines />
      </section>

      <footer className="mt-12 flex flex-col gap-3 border-t border-bone/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
          FFWS 2026 · Prediction regulations
        </p>
        <a
          href="/fantasy/predict/make"
          className="inline-flex items-center justify-center gap-3 self-start bg-ember px-5 py-3 font-stat text-[10px] font-bold uppercase tracking-widest text-char transition hover:bg-bone sm:self-auto"
        >
          Make a prediction <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </main>
  );
}
