import Image from "next/image";
import Link from "next/link";
import { CHIPS } from "@/lib/chips";
import {
  getFantasyStandings,
  getPredictionStandings,
  getTournament,
} from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fantasy · FFWS 2026" };

async function loadStats() {
  try {
    const t = await getTournament("ffws-2026");
    const [fantasy, predictions] = await Promise.all([
      getFantasyStandings(t.id).catch(() => []),
      getPredictionStandings(t.id).catch(() => []),
    ]);
    return { fantasy: fantasy.length, predictions: predictions.length };
  } catch {
    return null;
  }
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-stat text-[10px] font-bold uppercase tracking-[0.25em] text-ember">
      {children}
    </p>
  );
}

export default async function FantasyIndexPage() {
  const stats = await loadStats();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 text-bone sm:px-6 sm:pt-10 lg:px-8">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border border-bone/10 bg-char-2">
        <div className="map-grid absolute inset-0 -z-10 opacity-60" />
        <div className="absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-ember/15 blur-3xl" />
        <div className="absolute right-0 top-0 h-full w-1 bg-ember" />

        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:p-12">
          <div>
            <Eyebrow>Free Fire World Series 2026</Eyebrow>
            <h1 className="mt-5 font-display text-[clamp(3.5rem,10vw,7.5rem)] font-black uppercase leading-[0.82] tracking-tight">
              Play the
              <br />
              <span className="text-ember">tournament.</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-6 text-bone/70 sm:text-base">
              Draft your four favourite players, back a captain and score from
              every kill, or call the final team standings before each
              matchday. Two games, one leaderboard to climb.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/fantasy/pick-team"
                className="inline-flex items-center gap-3 bg-ember px-6 py-3 font-stat text-xs font-bold uppercase tracking-[0.16em] text-char transition hover:bg-bone"
              >
                Pick your team <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href="/fantasy/predict/make"
                className="inline-flex items-center gap-3 border border-bone/25 px-6 py-3 font-stat text-xs font-bold uppercase tracking-[0.16em] text-bone transition hover:border-ember hover:text-ember"
              >
                Make a prediction
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px border border-bone/10 bg-bone/10 lg:grid-cols-1">
            {[
              { value: "4", label: "Players per squad" },
              { value: "$100", label: "Budget" },
              { value: "×2", label: "Captain score" },
            ].map((s) => (
              <div key={s.label} className="bg-char p-4 lg:flex lg:items-center lg:justify-between">
                <p className="font-display text-3xl font-black tabular-nums text-ember sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 font-stat text-[9px] uppercase tracking-wider text-ash lg:mt-0">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two game modes */}
      <section className="pt-12 sm:pt-16">
        <Eyebrow>Choose your game</Eyebrow>
        <h2 className="mt-2 font-display text-4xl font-black uppercase leading-[0.92] sm:text-5xl">
          Two ways <span className="text-ember">to win.</span>
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="chamfer relative flex flex-col border border-ember/30 bg-char-2 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">
                Mode 01
              </span>
              {stats && (
                <span className="border border-bone/10 px-2 py-1 font-stat text-[9px] uppercase tracking-widest text-ash">
                  {stats.fantasy} {stats.fantasy === 1 ? "manager" : "managers"}
                </span>
              )}
            </div>
            <h3 className="mt-4 font-display text-4xl font-black uppercase">Fantasy</h3>
            <p className="mt-3 text-sm leading-6 text-bone/65">
              Build a new squad of four for every tournament day. Players earn
              points from kills, first blood and their team&apos;s placement.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-bone/80">
              <li className="flex gap-2"><span className="text-ember">▸</span> Pick 4 players from 4 different teams</li>
              <li className="flex gap-2"><span className="text-ember">▸</span> Stay under the $100 budget</li>
              <li className="flex gap-2"><span className="text-ember">▸</span> Captain scores double (or triple)</li>
              <li className="flex gap-2"><span className="text-ember">▸</span> Play special chips once each</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3 pt-2">
              <Link
                href="/fantasy/pick-team"
                className="inline-flex items-center gap-2 bg-ember px-5 py-3 font-stat text-[11px] font-bold uppercase tracking-widest text-char transition hover:bg-bone"
              >
                Pick team <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href="/fantasy/regulation"
                className="inline-flex items-center px-3 py-3 font-stat text-[11px] uppercase tracking-widest text-ash transition hover:text-ember"
              >
                How it works →
              </Link>
            </div>
          </article>

          <article className="chamfer relative flex flex-col border border-bone/10 bg-char-2 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">
                Mode 02
              </span>
              {stats && (
                <span className="border border-bone/10 px-2 py-1 font-stat text-[9px] uppercase tracking-widest text-ash">
                  {stats.predictions} {stats.predictions === 1 ? "player" : "players"}
                </span>
              )}
            </div>
            <h3 className="mt-4 font-display text-4xl font-black uppercase">Prediction</h3>
            <p className="mt-3 text-sm leading-6 text-bone/65">
              Before each matchday, rank all 12 teams from first to last. The
              closer you are to the official result, the more points you earn.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-bone/80">
              <li className="flex gap-2"><span className="text-ember">▸</span> Rank every team from 1st to 12th</li>
              <li className="flex gap-2"><span className="text-ember">▸</span> 12 points for each exact pick</li>
              <li className="flex gap-2"><span className="text-ember">▸</span> Up to 144 points per matchday</li>
              <li className="flex gap-2"><span className="text-ember">▸</span> Edit freely until the deadline</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3 pt-2">
              <Link
                href="/fantasy/predict/make"
                className="inline-flex items-center gap-2 bg-ember px-5 py-3 font-stat text-[11px] font-bold uppercase tracking-widest text-char transition hover:bg-bone"
              >
                Make prediction <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href="/fantasy/predict/regulation"
                className="inline-flex items-center px-3 py-3 font-stat text-[11px] uppercase tracking-widest text-ash transition hover:text-ember"
              >
                How it works →
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* How it works */}
      <section className="pt-12 sm:pt-16">
        <Eyebrow>Every matchday</Eyebrow>
        <h2 className="mt-2 font-display text-4xl font-black uppercase leading-[0.92] sm:text-5xl">
          Pick. Lock. <span className="text-ember">Compete.</span>
        </h2>
        <div className="mt-6 grid gap-px overflow-hidden border border-bone/10 bg-bone/10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["01", "Make your picks", "Choose your squad or your team ranking for the day."],
            ["02", "Beat the deadline", "Each matchday locks at its own deadline. Check the schedule."],
            ["03", "Watch the rooms", "Points are calculated as organizers enter the results."],
            ["04", "Climb the table", "Compete in Global, your region or a private league."],
          ].map(([n, title, text]) => (
            <div key={n} className="bg-char-2 p-5">
              <span className="font-stat text-xs tracking-[0.2em] text-ember">{n}</span>
              <h3 className="mt-5 font-display text-xl font-extrabold uppercase">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-bone/55">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chips */}
      <section className="pt-12 sm:pt-16">
        <Eyebrow>Fantasy chips</Eyebrow>
        <h2 className="mt-2 font-display text-4xl font-black uppercase leading-[0.92] sm:text-5xl">
          Play your <span className="text-ember">wild card.</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-bone/65">
          One chip per day, and each chip can only be used once per tournament.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {CHIPS.map((chip) => (
            <div key={chip.id} className="flex items-center gap-4 border border-bone/10 bg-char-2 p-5">
              <div className="relative h-16 w-16 shrink-0">
                <Image src={chip.image} alt="" fill sizes="64px" className="object-contain" />
              </div>
              <div className="min-w-0">
                <p className="font-stat text-[9px] uppercase tracking-[0.2em] text-ember">{chip.short}</p>
                <h3 className="mt-1 font-display text-xl font-extrabold uppercase">{chip.name}</h3>
                <p className="mt-1 text-xs leading-5 text-bone/55">{chip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="pt-12 sm:pt-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["/fantasy/leagues", "Leagues", "Global, regional and private"],
            ["/fantasy/form", "Player form", "Who's hot right now"],
            ["/fantasy/schedule", "Schedule", "Matchdays and deadlines"],
            ["/fantasy/regulation", "Regulation", "Full rules and scoring"],
          ].map(([href, title, text]) => (
            <Link
              key={href}
              href={href}
              className="group border border-bone/10 bg-char-2 p-5 transition hover:border-ember/50"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-extrabold uppercase">{title}</h3>
                <span className="text-bone/30 transition group-hover:text-ember">→</span>
              </div>
              <p className="mt-1 text-xs text-bone/55">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mt-14 overflow-hidden border border-ember/30 bg-[#1a120e] p-6 sm:p-10">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-ember/15 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <Eyebrow>Your move</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-black uppercase sm:text-4xl">Ready to play?</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-bone/60">
              Create a free account, set up your team profile and jump into
              both games.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-3 bg-ember px-5 py-3 font-stat text-xs font-bold uppercase tracking-[0.16em] text-char transition hover:bg-bone"
            >
              Register <span aria-hidden="true">↗</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center border border-bone/25 px-5 py-3 font-stat text-xs font-bold uppercase tracking-[0.16em] text-bone transition hover:border-ember hover:text-ember"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}