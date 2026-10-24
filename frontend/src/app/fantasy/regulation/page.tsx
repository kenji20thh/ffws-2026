import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = { title: "Fantasy Guide · FFWS 2026" };

const placement = [
  ["1st", 15],
  ["2nd", 12],
  ["3rd", 10],
  ["4th", 8],
  ["5th", 6],
  ["6th", 5],
  ["7th", 4],
  ["8th", 3],
  ["9th", 2],
  ["10th", 1],
  ["11th–12th", 0],
] as const;

const chips = [
  {
    name: "Triple Captain",
    image: "/chips/triple_captain.png",
    tag: "3× CAPTAIN",
    short: "Your captain scores triple instead of double.",
    detail:
      "Your chosen captain's fantasy points are multiplied by 3 instead of the normal 2. Consider using it on a day when you expect your captain to perform well.",
  },
  {
    name: "Limitless",
    image: "/chips/limitless.png",
    tag: "NO BUDGET CAP",
    short: "Remove the $100 budget restriction for the day.",
    detail:
      "The $100 budget restriction does not apply to that day's squad. The other squad rules still apply unless specifically changed by another rule.",
  },
  {
    name: "Duo Stack",
    image: "/chips/duo_stack.png",
    tag: "ONE TEAM PAIR",
    short: "Choose one pair of players from the same team.",
    detail:
      "Normally, all four players must be from different teams. Duo Stack lets one pair share a team; your other picks must still follow the usual rules.",
  },
];

function SectionLabel({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="font-stat text-xs tracking-[0.22em] text-ember">
        {number}
      </span>
      <span className="h-px w-8 bg-ember/60" />
      <span className="font-stat text-[10px] uppercase tracking-[0.24em] text-bone/50">
        {children}
      </span>
    </div>
  );
}

function ExampleCard({
  number,
  price,
  role,
  card,
  captain = false,
}: {
  number: string;
  price: number;
  role: string;
  card: string;
  captain?: boolean;
}) {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-xl border border-bone/15 bg-[#171411] p-2 sm:p-3">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-ember to-transparent" />

      <div className="relative mx-auto mb-2 aspect-[2/2.6] w-full max-w-[110px] overflow-hidden rounded-md">
        <Image
          src={`/cards/${card}.png`}
          alt={`${card} player card`}
          fill
          sizes="110px"
          className="object-fill"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/35 font-display text-xl font-black text-white/90 sm:h-12 sm:w-12 sm:text-2xl">
            {number}
          </div>

          <span className="font-stat text-[8px] uppercase tracking-[0.18em] text-white/75 sm:text-[10px]">
            {role}
          </span>
        </div>

        {captain && (
          <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ember font-display text-sm font-black text-char">
            C
          </span>
        )}
      </div>

      <div className="text-center">
        <p className="font-display text-xs font-bold uppercase tracking-wide text-bone sm:text-sm">
          Player {number}
        </p>
        <p className="mt-1 font-stat text-xs text-ember">${price}</p>
        <p className="mt-1 font-stat text-[8px] uppercase tracking-wider text-bone/40">
          {card}
        </p>
      </div>
    </div>
  );
}

export default function FantasyRegulationPage() {
  const budget = 82;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-5 text-bone sm:px-6 sm:pt-8 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-2xl border border-bone/10 bg-[#14110f]">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/home/venue.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover opacity-30"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b0908] via-[#0b0908]/90 to-[#0b0908]/35" />
        <div className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-ember/15 blur-3xl" />
        <div className="grid gap-8 p-6 sm:p-9 md:grid-cols-[1.15fr_0.85fr] md:items-center md:p-12">
          <div>
            <p className="font-stat text-[10px] uppercase tracking-[0.32em] text-ember sm:text-xs">
              FFWS 2026 · Fantasy guide
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-5xl font-black uppercase leading-[0.88] tracking-tight sm:text-6xl lg:text-7xl">
              Build your
              <br />
              <span className="text-ember">dream squad.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-bone/70 sm:text-base">
              Pick your players, choose your captain and turn every kill into
              points. Here’s how to play FFWS Fantasy.
            </p>
            <Link
              href="/fantasy/pick-team"
              className="mt-7 inline-flex items-center gap-3 bg-ember px-5 py-3 font-stat text-xs font-bold uppercase tracking-[0.16em] text-char transition hover:bg-bone"
            >
              Build your squad <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { value: "04", label: "Players" },
              { value: "$100", label: "Budget" },
              { value: "×2", label: "Captain score" },
            ].map((s) => (
              <div
                key={s.label}
                className="border border-bone/15 bg-black/40 p-3 text-center backdrop-blur-sm sm:p-4"
              >
                <p className="font-display text-2xl font-black text-ember sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-2 font-stat text-[8px] uppercase tracking-[0.13em] text-bone/60 sm:text-[10px]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <nav
        aria-label="Fantasy guide sections"
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {[
          ["01", "Pick 4 players", "#build"],
          ["02", "Earn points", "#scoring"],
          ["03", "Play chips", "#chips"],
          ["04", "Lock & compete", "#deadlines"],
        ].map(([n, label, href]) => (
          <a
            key={href}
            href={href}
            className="group flex items-center gap-3 border border-bone/10 bg-char-2/70 px-3 py-3 transition hover:border-ember/50"
          >
            <span className="font-stat text-xs text-ember">{n}</span>
            <span className="text-xs font-semibold text-bone/75 transition group-hover:text-bone sm:text-sm">
              {label}
            </span>
            <span className="ml-auto text-bone/30 group-hover:text-ember">
              ↓
            </span>
          </a>
        ))}
      </nav>

      <section id="build" className="scroll-mt-8 pt-14 sm:pt-20">
        <SectionLabel number="01">Build your squad</SectionLabel>
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
          <div>
            <h2 className="font-display text-4xl font-black uppercase leading-[0.92] sm:text-5xl">
              Four picks.
              <br />
              <span className="text-ember">One winner.</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-bone/65">
              Build a new squad for every tournament day. Choose players you
              trust to get kills and help their teams finish high.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                ["Pick exactly 4 players", "No more, no less."],
                [
                  "Use 4 different teams",
                  "One player per team, unless you activate Duo Stack.",
                ],
                [
                  "Stay within $100",
                  "Your four player prices must fit the budget, unless you use Limitless.",
                ],
                [
                  "Choose a captain",
                  "Their points count double, or triple with Triple Captain.",
                ],
              ].map(([title, detail], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-ember/40 font-stat text-[10px] text-ember">
                    0{i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-bone">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-bone/55">
                      {detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-bone/10 bg-char-2 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-bone/45">
                  Example squad
                </p>
                <h3 className="mt-1 font-display text-2xl font-extrabold uppercase">
                  Your starting four
                </h3>
              </div>
              <span className="border border-ember/30 bg-ember/10 px-2.5 py-1 font-stat text-[9px] uppercase tracking-widest text-ember">
                Example only
              </span>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
              <ExampleCard
                number="01"
                price={24}
                role="Rusher"
                card="legendary"
                captain
              />
              <ExampleCard number="02" price={22} role="Support" card="epic" />
              <ExampleCard number="03" price={19} role="Sniper" card="gold" />
              <ExampleCard number="04" price={17} role="Flex" card="silver" />
            </div>
            <div className="mt-5 border-t border-bone/10 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-stat text-[10px] uppercase tracking-[0.18em] text-bone/50">
                    Budget used
                  </p>
                  <p className="mt-1 font-display text-2xl font-black">
                    {budget}
                    <span className="text-bone/35"> / 100</span>
                  </p>
                </div>
                <p className="text-right text-xs text-bone/55">
                  ${100 - budget} remaining
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-ember to-orange-300"
                  style={{ width: `${budget}%` }}
                />
              </div>
              <p className="mt-3 text-[11px] leading-5 text-bone/45">
                Illustrative prices only. The real player pool and prices appear
                in the squad builder.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="scoring" className="scroll-mt-8 pt-14 sm:pt-20">
        <SectionLabel number="02">Scoring system</SectionLabel>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="font-display text-4xl font-black uppercase leading-[0.92] sm:text-5xl">
              Every action
              <br />
              <span className="text-ember">adds up.</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-bone/65">
              In every room, your selected players earn points from kills, first
              blood and their team’s final placement.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="relative overflow-hidden border border-ember/30 bg-ember/10 p-4 sm:p-5">
                <span className="font-stat text-[9px] uppercase tracking-[0.2em] text-ember">
                  Combat
                </span>
                <p className="mt-2 font-display text-4xl font-black sm:text-5xl">
                  +10
                </p>
                <p className="mt-1 text-xs text-bone/65">Points per kill</p>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-5 -right-1 text-7xl font-black text-ember/10"
                >
                  K
                </span>
              </div>
              <div className="relative overflow-hidden border border-bone/10 bg-char-2 p-4 sm:p-5">
                <span className="font-stat text-[9px] uppercase tracking-[0.2em] text-bone/45">
                  First blood
                </span>
                <p className="mt-2 font-display text-4xl font-black sm:text-5xl">
                  +5
                </p>
                <p className="mt-1 text-xs text-bone/65">Bonus points</p>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-5 -right-1 text-7xl font-black text-ember/10"
                >
                  ✦
                </span>
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-bone/10 bg-char-2 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-extrabold uppercase">
                    Team placement
                  </h3>
                  <p className="mt-1 text-xs text-bone/50">
                    Points each player earns from their team’s finish in a room
                  </p>
                </div>
                <span className="font-stat text-[9px] uppercase tracking-widest text-ember">
                  Per room
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-6 sm:grid-cols-3">
                {placement.map(([place, points]) => (
                  <div
                    key={place}
                    className="flex items-center justify-between border-b border-bone/5 py-2 text-xs"
                  >
                    <span className="text-bone/70">{place}</span>
                    <span
                      className={`font-stat tabular-nums ${points > 0 ? "text-ember" : "text-bone/35"}`}
                    >
                      {points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="h-fit rounded-2xl border border-bone/10 bg-[#15120f] p-5 sm:p-6">
            <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">
              Worked example
            </p>
            <h3 className="mt-2 font-display text-2xl font-extrabold uppercase">
              One player. One room.
            </h3>
            <p className="mt-2 text-xs leading-5 text-bone/55">
              Imagine your player gets 3 kills, scores first blood and their
              team finishes 2nd.
            </p>
            <div className="mt-5 space-y-3">
              {[
                ["3 kills", "3 × 10", "+30"],
                ["First blood", "Bonus", "+5"],
                ["Team finishes 2nd", "Placement", "+12"],
              ].map(([label, formula, points]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 border-b border-bone/10 pb-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ember/10 text-xs text-ember">
                    +
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="mt-0.5 font-stat text-[10px] text-bone/40">
                      {formula}
                    </p>
                  </div>
                  <span className="font-stat text-sm text-ember">{points}</span>
                </div>
              ))}
            </div>
            <div className="flex items-end justify-between pt-4">
              <span className="font-stat text-[10px] uppercase tracking-[0.18em] text-bone/50">
                Player total
              </span>
              <span className="font-display text-4xl font-black text-bone">
                47 <span className="text-base text-ember">pts</span>
              </span>
            </div>
            <div className="mt-5 border border-ember/25 bg-ember/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-stat text-[10px] uppercase tracking-widest text-ember">
                    If they are captain
                  </p>
                  <p className="mt-1 text-xs text-bone/65">
                    47 points × 2 multiplier
                  </p>
                </div>
                <p className="font-display text-3xl font-black text-ember">
                  94
                </p>
              </div>
              <p className="mt-2 text-[10px] leading-4 text-bone/45">
                With Triple Captain, the same 47 points become 141. This example
                is for one room only.
              </p>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-bone/45">
              Your day score adds each selected player’s points across every
              room of that day. Your overall score adds together all tournament
              days.
            </p>
          </aside>
        </div>
      </section>

      <section id="chips" className="scroll-mt-8 pt-14 sm:pt-20">
        <SectionLabel number="03">Special chips</SectionLabel>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-4xl font-black uppercase leading-[0.92] sm:text-5xl">
              Play your
              <br />
              <span className="text-ember">wild card.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-bone/65">
              Open a chip card to learn what it does and how it changes your
              strategy.
            </p>
          </div>
          <p className="max-w-xs border-l-2 border-ember pl-3 text-xs leading-5 text-bone/50">
            One chip per day. Each individual chip can be used once per
            tournament.
          </p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {chips.map((chip) => (
            <details
              key={chip.name}
              className="group rounded-xl border border-bone/10 bg-char-2 p-4 transition open:border-ember/60 open:bg-ember/5 sm:p-5"
            >
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-stat text-[9px] uppercase tracking-[0.2em] text-ember">
                      {chip.tag}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-extrabold uppercase">
                      {chip.name}
                    </h3>
                  </div>
                  <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
                    <Image
                      src={chip.image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain drop-shadow-[0_0_12px_rgba(255,90,31,0.2)]"
                    />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-5 text-bone/65">
                  {chip.short}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-bone/10 pt-3">
                  <span className="font-stat text-[9px] uppercase tracking-[0.15em] text-bone/45">
                    Tap to explain
                  </span>
                  <span className="text-lg text-ember transition group-open:rotate-45">
                    ＋
                  </span>
                </div>
              </summary>
              <p className="mt-3 border-t border-bone/10 pt-3 text-xs leading-6 text-bone/70">
                {chip.detail}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-bone/45">
          Activate a chip on the pick screen before the day locks. You can
          change or remove it until lock time. It only counts as used once that
          day is locked.
        </p>
      </section>

      <section id="deadlines" className="scroll-mt-8 pt-14 sm:pt-20">
        <SectionLabel number="04">Deadlines & leaderboard</SectionLabel>
        <h2 className="font-display text-4xl font-black uppercase leading-[0.92] sm:text-5xl">
          Pick. Lock.
          <br />
          <span className="text-ember">Compete.</span>
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-bone/65">
          Your squad is yours to change until the deadline. Once the day locks,
          your picks are final and the tournament action decides your score.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: "01",
              title: "Pick your squad",
              desc: "Select your four players, captain and optional chip.",
            },
            {
              n: "02",
              title: "Deadline locks",
              desc: "Your lineup is frozen. Other players’ squads become visible after lock.",
            },
            {
              n: "03",
              title: "Matches happen",
              desc: "Your players earn points in each room from kills, first blood and placement.",
            },
            {
              n: "04",
              title: "Check rankings",
              desc: "Your scores contribute to the daily and overall leaderboard.",
            },
          ].map((step, i) => (
            <div
              key={step.n}
              className="border border-bone/10 bg-char-2 p-4 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-stat text-xs tracking-[0.2em] text-ember">
                  {step.n}
                </span>
                {i < 3 && (
                  <span className="hidden text-bone/20 lg:inline">→</span>
                )}
              </div>
              <h3 className="mt-5 font-display text-xl font-extrabold uppercase">
                {step.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-bone/55">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="border border-bone/10 p-4 sm:p-5">
            <h3 className="font-display text-xl font-extrabold uppercase">
              Know your deadline
            </h3>
            <p className="mt-2 text-sm leading-6 text-bone/60">
              Every tournament day has its own lock time. Check the Schedule tab
              for the current deadline; organizers may change it.
            </p>
          </div>
          <div className="border border-bone/10 p-4 sm:p-5">
            <h3 className="font-display text-xl font-extrabold uppercase">
              Climb the leaderboard
            </h3>
            <p className="mt-2 text-sm leading-6 text-bone/60">
              Compete for the overall ranking or compare scores for an
              individual day. Your overall total is the sum of your day scores.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mt-14 overflow-hidden rounded-2xl border border-ember/30 bg-[#1a120e] p-6 sm:mt-20 sm:p-10">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-ember/15 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">
              Your move
            </p>
            <h2 className="mt-2 font-display text-3xl font-black uppercase sm:text-4xl">
              Ready to draft?
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-bone/60">
              Pick your four, manage your budget and back your captain for the
              next tournament day.
            </p>
          </div>
          <Link
            href="/fantasy/pick-team"
            className="inline-flex shrink-0 items-center gap-3 bg-ember px-5 py-3 font-stat text-xs font-bold uppercase tracking-[0.16em] text-char transition hover:bg-bone"
          >
            Pick your team <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <p className="mt-6 text-center font-stat text-[9px] uppercase tracking-[0.18em] text-bone/30">
        FFWS 2026 Fantasy · Rules and scoring are subject to organizer updates
      </p>
    </main>
  );
}
