import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

type Kind = "p1" | "p2" | "lc" | "gf";
type SegKind = "p2" | "p2b" | "lc" | "gf" | "out" | "champ";

const KIND_STYLE: Record<Kind, { label: string; cell: string; dot: string }> = {
  p1: { label: "Phase 1 · Group stage", cell: "bg-ember text-char", dot: "bg-ember" },
  p2: { label: "Phase 2 · Knockout", cell: "bg-amber text-char", dot: "bg-amber" },
  lc: { label: "Last Chance", cell: "bg-[#7441b4] text-bone", dot: "bg-[#7441b4]" },
  gf: { label: "Grand Finals", cell: "bg-bone text-char", dot: "bg-bone" },
};

const SEG_STYLE: Record<SegKind, string> = {
  p2: "bg-amber text-char",
  p2b: "bg-amber/60 text-char",
  lc: "bg-[#7441b4] text-bone",
  gf: "bg-bone text-char",
  out: "bg-char-3 text-ash",
  champ: "bg-ember text-char",
};

function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div>
      <p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">{eyebrow}</p>
      <h2 className="mt-1 font-display text-2xl font-black uppercase text-bone sm:text-3xl">{title}</h2>
      {children && <p className="mt-2 max-w-3xl text-sm leading-6 text-ash">{children}</p>}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">{children}</p>;
}

/** A proportional bar: each segment's width follows its team count. */
function Bar({ segs }: { segs: { n: number; label: string; sub?: string; kind: SegKind }[] }) {
  return (
    <div>
      <div
        className="flex h-9 w-full gap-0.5 overflow-hidden"
        role="img"
        aria-label={segs.map((s) => `${s.n} ${s.label}`).join(", ")}
      >
        {segs.map((s, i) => (
          <div
            key={i}
            style={{ flexGrow: s.n, flexBasis: 0 }}
            className={`flex min-w-[26px] items-center justify-center font-stat text-xs font-bold ${SEG_STYLE[s.kind]}`}
          >
            {s.n}
          </div>
        ))}
      </div>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {segs.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-ash">
            <span className={`mt-0.5 h-3 w-3 shrink-0 ${SEG_STYLE[s.kind].split(" ")[0]}`} />
            <span>
              <span className="font-semibold text-bone">
                {s.n} · {s.label}
              </span>
              {s.sub && <span> — {s.sub}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Small "label / value" chips shown at the top of a stage. */
export function FactChips({ facts }: { facts: { k: string; v: string }[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {facts.map((f) => (
        <div key={f.k} className="border border-char-3 bg-char-2 p-3">
          <p className="font-stat text-[10px] uppercase tracking-widest text-ash">{f.k}</p>
          <p className="mt-1 font-display text-base font-extrabold uppercase leading-5 text-bone">{f.v}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. How to use this page                                             */
/* ------------------------------------------------------------------ */

const STEPS = [
  { n: "1", t: "Pick a stage", d: "Open Knockout, Last Chance or Grand Finals in the roadmap to read its rules." },
  { n: "2", t: "Open a match day", d: "Each day shows its date. Open it to see which teams play and which rooms are scheduled." },
  { n: "3", t: "Choose a room", d: "A room is one match. Select it to see live or final standings for that match." },
];

export function QuickStart() {
  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="Start here" title="How to read this page" />
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-3 border border-char-3 bg-char p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-ember font-display text-lg font-black text-char">{s.n}</span>
            <span>
              <span className="block font-display text-base font-extrabold uppercase text-bone">{s.t}</span>
              <span className="mt-1 block text-sm leading-6 text-ash">{s.d}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Calendar + at-a-glance table                                     */
/* ------------------------------------------------------------------ */

const CAL: Record<number, { kind: Kind; label: string }> = {
  6: { kind: "p1", label: "P1 · D1" },
  7: { kind: "p1", label: "P1 · D2" },
  8: { kind: "p1", label: "P1 · D3" },
  13: { kind: "p1", label: "P1 · D4" },
  14: { kind: "p1", label: "P1 · D5" },
  15: { kind: "p1", label: "P1 · D6" },
  19: { kind: "p2", label: "P2 · D1" },
  20: { kind: "p2", label: "P2 · D2" },
  21: { kind: "p2", label: "P2 · D3" },
  22: { kind: "p2", label: "P2 · D4" },
  27: { kind: "lc", label: "Last Chance" },
  28: { kind: "gf", label: "Finals" },
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKS = [
  [2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20, 21, 22],
  [23, 24, 25, 26, 27, 28, 29],
];

function CalendarStrip() {
  return (
    <div className="border border-char-3 bg-char p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Eyebrow>Calendar · November 2026</Eyebrow>
        <p className="text-xs text-ash">P1 = Phase 1 · P2 = Phase 2 · D = match day</p>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <p key={w} className="pb-1 text-center font-stat text-[10px] uppercase tracking-widest text-ash">{w}</p>
        ))}
        {WEEKS.flat().map((d) => {
          const hit = CAL[d];
          if (!hit) {
            const blank = d < 2 || d > 29;
            return (
              <div key={d} className={`flex h-12 items-start p-1 font-stat text-[10px] text-bone/25 sm:h-14 ${blank ? "invisible" : "bg-char-2/40"}`}>{d}</div>
            );
          }
          return (
            <div key={d} className={`flex h-12 flex-col justify-between p-1 sm:h-14 sm:p-1.5 ${KIND_STYLE[hit.kind].cell}`}>
              <span className="font-display text-sm font-black leading-none sm:text-base">{d}</span>
              <span className="font-stat text-[8px] font-bold uppercase leading-tight tracking-wide sm:text-[10px]">{hit.label}</span>
            </div>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {(Object.keys(KIND_STYLE) as Kind[]).map((k) => (
          <li key={k} className="flex items-center gap-2 text-xs text-ash">
            <span className={`h-3 w-3 ${KIND_STYLE[k].dot}`} />
            {KIND_STYLE[k].label}
          </li>
        ))}
        <li className="flex items-center gap-2 text-xs text-ash"><span className="h-3 w-3 bg-char-2" />No matches</li>
      </ul>
    </div>
  );
}

const GLANCE: { kind: Kind; stage: string; dates: string; teams: string; how: string; next: string; out: string }[] = [
  { kind: "p1", stage: "Phase 1 · Group stage", dates: "Nov 6–8 and 13–15", teams: "24", how: "4 groups of 6 · 2 sessions a day · 6 match days · 36 games per team", next: "18 → Phase 2, 2 → Last Chance", out: "4 teams" },
  { kind: "p2", stage: "Phase 2 · Knockout", dates: "Nov 19–22", teams: "18", how: "4 pools · 4 days · 12 teams play each day", next: "8 → Grand Finals (2 per day), 10 → Last Chance", out: "None directly" },
  { kind: "lc", stage: "Last Chance", dates: "Nov 27", teams: "12", how: "10 matches", next: "4 → Grand Finals", out: "8 teams" },
  { kind: "gf", stage: "Grand Finals", dates: "Nov 28", teams: "12", how: "Champion Rush · BITEC LIVE, Bangkok", next: "1 champion", out: "—" },
];

function AtAGlanceTable() {
  return (
    <div className="overflow-x-auto border border-char-3 bg-char">
      <table className="w-full min-w-[720px] text-left">
        <caption className="sr-only">Every stage of the tournament at a glance</caption>
        <thead>
          <tr className="border-b border-char-3 font-stat text-[10px] uppercase tracking-widest text-ash">
            <th scope="col" className="p-3">Stage</th>
            <th scope="col" className="p-3">Dates</th>
            <th scope="col" className="p-3 text-right">Teams</th>
            <th scope="col" className="p-3">How it works</th>
            <th scope="col" className="p-3">Who moves on</th>
            <th scope="col" className="p-3">Eliminated</th>
          </tr>
        </thead>
        <tbody>
          {GLANCE.map((r) => (
            <tr key={r.stage} className="border-b border-char-3 last:border-0 align-top">
              <th scope="row" className="p-3 text-left">
                <span className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-bone">
                  <span className={`h-3 w-3 shrink-0 ${KIND_STYLE[r.kind].dot}`} />
                  {r.stage}
                </span>
              </th>
              <td className="p-3 text-sm text-bone">{r.dates}</td>
              <td className="p-3 text-right font-display text-xl font-black text-ember">{r.teams}</td>
              <td className="p-3 text-sm leading-5 text-ash">{r.how}</td>
              <td className="p-3 text-sm leading-5 text-bone">{r.next}</td>
              <td className="p-3 text-sm text-ash">{r.out}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OverviewSection() {
  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="Overview" title="Format at a glance">
        The whole tournament on one screen: when each stage is played, how many teams take part, and who moves on.
      </SectionTitle>
      <CalendarStrip />
      <AtAGlanceTable />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Journey of the teams                                             */
/* ------------------------------------------------------------------ */

const JOURNEY: {
  num: string;
  title: string;
  when: string;
  teams: number;
  blurb: string;
  segs: { n: number; label: string; sub?: string; kind: SegKind }[];
}[] = [
  {
    num: "01",
    title: "Phase 1 · Group stage",
    when: "Nov 6–15",
    teams: 24,
    blurb: "Six match days. Every team plays 6 matches a day (36 in total) and collects ranking points.",
    segs: [
      { n: 12, label: "Pool 1 of Phase 2", sub: "places #1–12", kind: "p2" },
      { n: 6, label: "Pools 2–4 of Phase 2", sub: "places #13–18, 2 teams per pool", kind: "p2b" },
      { n: 2, label: "Last Chance", sub: "places #19–20", kind: "lc" },
      { n: 4, label: "Eliminated", sub: "places #21–24", kind: "out" },
    ],
  },
  {
    num: "02",
    title: "Phase 2 · Knockout progression",
    when: "Nov 19–22",
    teams: 18,
    blurb: "Four days, 12 teams play each day. The top 2 teams of each day lock in a Grand Finals spot; the other 10 carry on to the next day.",
    segs: [
      { n: 8, label: "Grand Finals", sub: "2 per day × 4 days", kind: "gf" },
      { n: 10, label: "Last Chance", sub: "the 10 teams left after Day 4", kind: "lc" },
    ],
  },
  {
    num: "03",
    title: "Last Chance",
    when: "Nov 27",
    teams: 12,
    blurb: "2 teams from Phase 1 and 10 from Phase 2 play 10 matches for the final 4 Grand Finals spots.",
    segs: [
      { n: 4, label: "Grand Finals", sub: "top 4", kind: "gf" },
      { n: 8, label: "Eliminated", kind: "out" },
    ],
  },
  {
    num: "04",
    title: "Grand Finals · Champion Rush",
    when: "Nov 28",
    teams: 12,
    blurb: "8 teams from Phase 2 plus 4 from Last Chance compete live at BITEC LIVE, Bangkok.",
    segs: [
      { n: 1, label: "Champion", kind: "champ" },
      { n: 11, label: "Other finalists", kind: "out" },
    ],
  },
];

export function JourneySection() {
  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="The road to the title" title="Where every team goes">
        Follow the 24 teams from the first match to the champion. Each bar is split in proportion to the number of teams, and the number inside is the team count.
      </SectionTitle>
      <ol className="space-y-2">
        {JOURNEY.map((s, i) => (
          <li key={s.num}>
            <div className="border border-char-3 bg-char p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-char-3 bg-char-2 font-display text-lg font-black text-ember">{s.num}</span>
                  <div>
                    <h3 className="font-display text-lg font-extrabold uppercase text-bone">{s.title}</h3>
                    <p className="font-stat text-[10px] uppercase tracking-widest text-ash">{s.when}</p>
                  </div>
                </div>
                <p className="text-right">
                  <span className="block font-display text-3xl font-black leading-none text-ember">{s.teams}</span>
                  <span className="font-stat text-[10px] uppercase tracking-widest text-ash">teams start</span>
                </p>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ash">{s.blurb}</p>
              <div className="mt-4">
                <Eyebrow>What happens to these {s.teams} teams</Eyebrow>
                <div className="mt-2"><Bar segs={s.segs} /></div>
              </div>
            </div>
            {i < JOURNEY.length - 1 && (
              <p className="py-1.5 text-center font-stat text-[10px] uppercase tracking-widest text-ash" aria-hidden="true">▼ qualified teams continue</p>
            )}
          </li>
        ))}
      </ol>

      <div className="border border-char-3 bg-char p-4 sm:p-5">
        <Eyebrow>Quick check</Eyebrow>
        <h3 className="mt-1 font-display text-lg font-extrabold uppercase text-bone">Where the 12 Grand Finals teams come from</h3>
        <div className="mt-3">
          <Bar
            segs={[
              { n: 2, label: "Phase 2 · Day 1", kind: "gf" },
              { n: 2, label: "Phase 2 · Day 2", kind: "gf" },
              { n: 2, label: "Phase 2 · Day 3", kind: "gf" },
              { n: 2, label: "Phase 2 · Day 4", kind: "gf" },
              { n: 4, label: "Last Chance", kind: "lc" },
            ]}
          />
        </div>
        <p className="mt-3 text-sm text-ash">2 + 2 + 2 + 2 + 4 = <span className="font-bold text-bone">12 teams</span>.</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Phase 1 maths                                                    */
/* ------------------------------------------------------------------ */

function Num({ big, small, accent = false }: { big: string; small: string; accent?: boolean }) {
  return (
    <div className={`min-w-[110px] flex-1 border p-3 text-center ${accent ? "border-ember bg-ember/10" : "border-char-3 bg-char"}`}>
      <p className={`font-display text-4xl font-black leading-none ${accent ? "text-ember" : "text-bone"}`}>{big}</p>
      <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">{small}</p>
    </div>
  );
}

function Op({ children }: { children: ReactNode }) {
  return <span className="flex items-center font-display text-2xl font-black text-ash" aria-hidden="true">{children}</span>;
}

export function PhaseOneMath() {
  return (
    <div className="border border-char-3 bg-char-2 p-4">
      <Eyebrow>The numbers</Eyebrow>
      <h4 className="mt-1 font-display text-lg font-extrabold uppercase text-bone">How 36 games per team adds up</h4>
      <div className="mt-4 flex flex-wrap items-stretch gap-2">
        <Num big="6" small="matches per team, per day" />
        <Op>×</Op>
        <Num big="6" small="match days" />
        <Op>=</Op>
        <Num big="36" small="games per team" accent />
      </div>

      <p className="mt-5 font-stat text-[10px] uppercase tracking-[0.2em] text-ash">One match day, step by step</p>
      <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <div className="border border-char-3 bg-char p-3">
          <p className="font-display text-sm font-extrabold uppercase text-bone">Session 1</p>
          <p className="mt-1 text-sm leading-6 text-ash"><span className="font-bold text-bone">12 teams</span> (2 groups) play <span className="font-bold text-bone">6 rooms</span>. Each room is one match with all 12 teams.</p>
        </div>
        <Op>+</Op>
        <div className="border border-char-3 bg-char p-3">
          <p className="font-display text-sm font-extrabold uppercase text-bone">Session 2</p>
          <p className="mt-1 text-sm leading-6 text-ash">The <span className="font-bold text-bone">other 12 teams</span> (the other 2 groups) play their own <span className="font-bold text-bone">6 rooms</span>.</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-ash">
        Together that is <span className="font-bold text-bone">24 teams</span> and <span className="font-bold text-bone">12 rooms</span> per match day, and <span className="font-bold text-bone">72 matches</span> over the 6 days. A team only plays in its own session, so it plays 6 matches a day.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Phase 2 table                                                    */
/* ------------------------------------------------------------------ */

const P2_ROWS = [
  { day: "Day 1", date: "Nov 19", who: "All 12 teams of Pool 1", next: "The other 10 play on Day 2" },
  { day: "Day 2", date: "Nov 20", who: "10 teams carried over from Day 1 + 2 teams from Pool 2", next: "The other 10 play on Day 3" },
  { day: "Day 3", date: "Nov 21", who: "10 teams carried over from Day 2 + 2 teams from Pool 3", next: "The other 10 play on Day 4" },
  { day: "Day 4", date: "Nov 22", who: "10 teams carried over from Day 3 + 2 teams from Pool 4", next: "The other 10 go to Last Chance" },
];

export function PhaseTwoTable() {
  return (
    <div className="mt-4 overflow-x-auto border border-char-3 bg-char-2">
      <table className="w-full min-w-[640px] text-left">
        <caption className="sr-only">Phase 2, day by day</caption>
        <thead>
          <tr className="border-b border-char-3 font-stat text-[10px] uppercase tracking-widest text-ash">
            <th scope="col" className="p-3">Day</th>
            <th scope="col" className="p-3">Who plays (12 teams)</th>
            <th scope="col" className="p-3">Top 2</th>
            <th scope="col" className="p-3">Everyone else</th>
          </tr>
        </thead>
        <tbody>
          {P2_ROWS.map((r) => (
            <tr key={r.day} className="border-b border-char-3 last:border-0 align-top">
              <th scope="row" className="p-3 text-left">
                <span className="block font-display text-sm font-extrabold uppercase text-bone">{r.day}</span>
                <span className="font-stat text-[10px] uppercase tracking-widest text-ash">{r.date}</span>
              </th>
              <td className="p-3 text-sm leading-5 text-bone">{r.who}</td>
              <td className="p-3"><span className="inline-block bg-bone px-2 py-1 font-stat text-[10px] font-bold uppercase tracking-wider text-char">→ Grand Finals</span></td>
              <td className="p-3 text-sm leading-5 text-ash">{r.next}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Scoring                                                          */
/* ------------------------------------------------------------------ */

const TABLE_COLUMNS = [
  { k: "Rank", v: "The team's position in that room, #1 is best." },
  { k: "Team", v: "The team's name." },
  { k: "Kills", v: "How many opponents the team eliminated." },
  { k: "Place pts", v: "Points for how long the team survived. Lasting longer earns more." },
  { k: "Total", v: "Place pts + kill points. This number decides the ranking." },
];

export function ScoringSection() {
  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="Scoring" title="How points work">
        Teams are ranked by points. Every match, a team earns points in two ways.
      </SectionTitle>

      <div className="flex flex-wrap items-stretch gap-2">
        <Num big="Placement" small="how long you survive" />
        <Op>+</Op>
        <Num big="Kills" small="opponents you eliminate" />
        <Op>=</Op>
        <Num big="Total" small="what the ranking uses" accent />
      </div>

      <div className="border border-char-3 bg-char p-4">
        <Eyebrow>Illustration only</Eyebrow>
        <p className="mt-2 text-sm leading-6 text-ash">
          A team that earns <span className="font-bold text-bone">8 placement points</span> and gets <span className="font-bold text-bone">5 kills</span> (1 point each) ends the match with <span className="font-bold text-ember">13 total points</span>. The real numbers always appear in the standings tables.
        </p>
      </div>

      <div className="border border-char-3 bg-char p-4">
        <Eyebrow>Reading a standings table</Eyebrow>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {TABLE_COLUMNS.map((c) => (
            <div key={c.k} className="flex gap-3 border-l-2 border-ember bg-char-2 py-2 pl-3 pr-2">
              <dt className="w-20 shrink-0 font-stat text-[11px] font-bold uppercase tracking-wider text-bone">{c.k}</dt>
              <dd className="text-sm leading-5 text-ash">{c.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border border-char-3 bg-char p-4">
        <Eyebrow>Grand Finals · Champion Rush</Eyebrow>
        <ol className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { n: "1", t: "Collect points", d: "Teams play match after match and add up their points as usual." },
            { n: "2", t: "Become eligible", d: "When a team reaches the set point threshold, it becomes Champion Rush eligible." },
            { n: "3", t: "Win a match", d: "The first eligible team to win a match (a Booyah!) is crowned champion." },
          ].map((s) => (
            <li key={s.n} className="flex gap-3 bg-char-2 p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-ember font-display text-sm font-black text-char">{s.n}</span>
              <span>
                <span className="block font-display text-sm font-extrabold uppercase text-bone">{s.t}</span>
                <span className="mt-1 block text-sm leading-5 text-ash">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Glossary + FAQ                                                   */
/* ------------------------------------------------------------------ */

const GLOSSARY = [
  { t: "Phase", d: "A block of the tournament. The Knockout Stage has two: Phase 1 and Phase 2." },
  { t: "Group", d: "One of 4 groups (A–D) of 6 teams used in Phase 1." },
  { t: "Session", d: "Half of a Phase 1 match day. Two groups (12 teams) play together in each session." },
  { t: "Room", d: "One match, with its own map and start time. All the teams of that session play in it." },
  { t: "Match day", d: "One calendar day of play. Open it to see teams, rooms and standings." },
  { t: "Pool", d: "A set of teams in Phase 2, based on their Phase 1 ranking. Pool 1 is the strongest." },
  { t: "Kills", d: "Opponents a team eliminates. They add to the team's points." },
  { t: "Placement points", d: "Points based on how long a team survives in a match." },
  { t: "Booyah!", d: "The Free Fire name for winning a match: the last team standing." },
  { t: "Champion Rush", d: "The Grand Finals format: reach the point threshold, then win a match to take the title." },
  { t: "Last Chance", d: "A one-day stage that gives 12 teams a final shot at the last 4 Grand Finals spots." },
  { t: "TBA", d: "To be announced. The team is not known yet. The tile shows where it will come from." },
];

export function GlossarySection() {
  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="Glossary" title="Words used on this page" />
      <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {GLOSSARY.map((g) => (
          <div key={g.t} className="border border-char-3 bg-char p-3">
            <dt className="font-display text-sm font-extrabold uppercase text-ember">{g.t}</dt>
            <dd className="mt-1 text-sm leading-5 text-ash">{g.d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const FAQ = [
  { q: "Do all 24 teams play every day in Phase 1?", a: "Yes. Every match day all 24 teams play, but in two separate sessions of 12 teams each." },
  { q: "How do I know which groups play together?", a: "Open the Match format table in the Knockout Stage. It lists the two groups in each session for every day." },
  { q: "What do the TBA tiles mean?", a: "Those teams are not decided yet. Each tile says where the team will come from, for example a place in Phase 1 or a day of Phase 2." },
  { q: "Where can I see live results?", a: "Open a match day, choose View teams & match details, then select a room. Live rooms show a pulsing Live marker and refresh every 10 seconds." },
  { q: "What happens to teams that miss the cut?", a: "They are eliminated. In Phase 1 the teams in places #21–24 go out. Phase 2 teams that do not qualify go to Last Chance." },
  { q: "Where are the Grand Finals played?", a: "At BITEC LIVE in Bangkok, on November 28." },
];

export function FaqSection() {
  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="FAQ" title="Common questions" />
      <div className="space-y-2">
        {FAQ.map((f) => (
          <details key={f.q} className="group border border-char-3 bg-char">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-display text-sm font-bold uppercase text-bone hover:bg-char-2">
              {f.q}
              <span className="text-ember transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="border-t border-char-3 p-4 text-sm leading-6 text-ash">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
