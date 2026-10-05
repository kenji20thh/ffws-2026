"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import {
ApiError,
getDays,
getFantasyPlayerPool,
getMyFantasySelection,
getMyFantasyTeam,
getPlayers,
getTeams,
} from "@/lib/api";
import { clearSession, getToken } from "@/lib/auth";
import type {
FantasySelectionResponse,
FantasyTeam,
Player,
PoolPlayer,
TournamentDay,
} from "@/types";
import CreateFantasyTeamForm from "./CreateFantasyTeamForm";
import SelectionBuilder from "./SelectionBuilder";

function pickNextOpenDay(days: TournamentDay[]): TournamentDay | null {
if (days.length === 0) return null;

const sorted = [...days].sort((a, b) => a.day_order - b.day_order);
const now = Date.now();

const open = sorted.find((d) => {
const hasDeadline = d.deadline && !d.deadline.startsWith("0001");

if (!hasDeadline) return true;

return new Date(d.deadline).getTime() > now;

});

return open ?? sorted[sorted.length - 1];
}

// The price list from the API has no artwork, so merge in player photos and team logos.
// If that extra lookup fails the pick screen still works.
async function loadPool(tournamentId: number): Promise<PoolPlayer[]> {
const options = await getFantasyPlayerPool(tournamentId);

try {
const teams = await getTeams(tournamentId);

const lists = await Promise.all(
  teams.map((t) =>
    getPlayers(t.id).catch(() => [] as Player[])
  )
);

const photos = new Map<number, string>();

lists.flat().forEach((p) => {
  if (p.photo_url) {
    photos.set(p.id, p.photo_url);
  }
});

const logos = new Map<number, string>();

teams.forEach((t) => {
  if (t.logo_url) {
    logos.set(t.id, t.logo_url);
  }
});

return options.map((o) => ({
  ...o,
  photo_url: photos.get(o.player_id),
  team_logo_url: logos.get(o.team_id),
}));

} catch {
return options;
}
}

export default function FantasyConsole({
tournamentId,
}: {
tournamentId: number;
}) {
const router = useRouter();

const [authChecked, setAuthChecked] = useState(false);
const [loggedIn, setLoggedIn] = useState(false);
const [team, setTeam] = useState<FantasyTeam | null | undefined>(undefined);
const [day, setDay] = useState<TournamentDay | null>(null);
const [pool, setPool] = useState<PoolPlayer[]>([]);
const [poolLoaded, setPoolLoaded] = useState(false);
const [sel, setSel] = useState<FantasySelectionResponse | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
setLoggedIn(!!getToken());
setAuthChecked(true);
}, []);

const expireSession = useCallback((e: unknown) => {
if (e instanceof ApiError && e.status === 401) {
clearSession();
setLoggedIn(false);
return true;
}

return false;

}, []);

const fail = useCallback(
(e: unknown) => {
if (expireSession(e)) return;

  setError(
    e instanceof Error ? e.message : "Something went wrong"
  );
},
[expireSession]

);

const loadTeam = useCallback(() => {
getMyFantasyTeam(tournamentId)
.then(setTeam)
.catch((e) => {
if (e instanceof ApiError && e.status === 404) {
setTeam(null);
} else {
fail(e);
}
});
}, [tournamentId, fail]);

useEffect(() => {
if (!loggedIn) return;

setError(null);

loadTeam();

getDays(tournamentId)
  .then((d) => setDay(pickNextOpenDay(d)))
  .catch(fail);

loadPool(tournamentId)
  .then((p) => {
    setPool(p);
    setPoolLoaded(true);
  })
  .catch(fail);

}, [loggedIn, tournamentId, loadTeam, fail]);

const loadSelection = useCallback(() => {
if (!day) return;

setLoading(true);

getMyFantasySelection(tournamentId, day.id)
  .then(setSel)
  .catch((e) => {
    if (!expireSession(e)) {
      setSel(null);
    }
  })
  .finally(() => setLoading(false));

}, [tournamentId, day, expireSession]);

useEffect(() => {
if (team && day) {
loadSelection();
} else {
setLoading(false);
}
}, [team, day, loadSelection]);

if (!authChecked) {
return ( <div className="mx-auto max-w-7xl px-5 py-10"> <Skeleton className="h-48" /> </div>
);
}

if (!loggedIn) {
return ( <div className="relative min-h-[70vh] overflow-hidden px-5 py-20"> <div className="pointer-events-none absolute inset-0"> <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-ember/10 blur-3xl" /> </div>

    <div className="relative mx-auto max-w-md">
      <div className="chamfer border border-bone/10 bg-char-2/90 p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center chamfer-sm border border-ember/30 bg-ember/10">
          <span className="font-display text-2xl font-black text-ember">
            FF
          </span>
        </div>

        <p className="font-stat text-[10px] uppercase tracking-[0.3em] text-ash">
          FFWS 2026 Fantasy
        </p>

        <p className="mt-2 font-display text-4xl font-black uppercase leading-none">
          Log in to play
        </p>

        <p className="mt-4 text-sm leading-6 text-ash">
          Build your squad, choose your captain and compete for the top
          spot.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex items-center justify-center chamfer-sm border border-ember/40 bg-ember px-7 py-3 font-stat text-xs font-bold uppercase tracking-[0.18em] text-char transition hover:bg-bone"
        >
          Go to login
          <span className="ml-3 text-base">→</span>
        </Link>
      </div>
    </div>
  </div>
);

}

if (error) {
return ( <div className="mx-auto max-w-3xl px-5 py-16"> <ErrorState message={error} /> </div>
);
}

if (team === undefined) {
return ( <div className="mx-auto max-w-7xl px-5 py-10"> <Skeleton className="h-48" /> </div>
);
}

if (team === null) {
return ( <div className="relative min-h-[70vh] overflow-hidden px-5 py-12"> <div className="pointer-events-none absolute inset-0"> <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-ember/10 blur-3xl" /> <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-bone/5 blur-3xl" /> </div>

    <div className="relative mx-auto max-w-5xl">
      <div className="mb-10">
        <p className="font-stat text-[10px] uppercase tracking-[0.3em] text-ember">
          FFWS 2026 Fantasy
        </p>

        <h1 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight md:text-6xl">
          Create your
          <span className="block text-ember">fantasy team</span>
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-6 text-ash md:text-base">
          Choose your identity, build your fantasy roster and get ready
          for the tournament.
        </p>
      </div>

      <CreateFantasyTeamForm
        tournamentId={tournamentId}
        onCreated={loadTeam}
      />
    </div>
  </div>
);

}

const locked = sel?.locked ?? false;

return ( <div className="relative min-h-screen overflow-hidden">
{/* Background atmosphere */} <div className="pointer-events-none absolute inset-0 overflow-hidden"> <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-ember/[0.07] blur-[120px]" /> <div className="absolute -left-40 top-[45%] h-[450px] w-[450px] rounded-full bg-bone/[0.025] blur-[120px]" />

    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  </div>

  <div className="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
    {/* Fantasy header */}
    <section className="relative overflow-hidden chamfer border border-bone/10 bg-char-2">
      <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-ember/[0.08] to-transparent" />

      <div className="relative flex flex-col gap-7 p-6 md:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 bg-ember shadow-[0_0_14px_rgba(255,100,40,.7)]" />

            <p className="font-stat text-[10px] font-bold uppercase tracking-[0.3em] text-ash">
              FFWS 2026 Fantasy
            </p>
          </div>

          <h1 className="mt-3 font-display text-4xl font-black uppercase leading-[0.9] tracking-tight md:text-6xl">
            Build your
            <span className="ml-2 text-ember">squad.</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-ash">
            Select four players, choose your captain and create the lineup
            that will dominate the fantasy leaderboard.
          </p>
        </div>

        {/* Team identity */}
        <div className="flex items-center gap-4 border-l border-bone/10 pl-0 lg:pl-8">
          <div className="flex h-14 w-14 items-center justify-center chamfer-sm border border-ember/25 bg-ember/10">
            <span className="font-display text-xl font-black text-ember">
              {team.team_name.slice(0, 2).toUpperCase()}
            </span>
          </div>

          <div>
            <p className="font-stat text-[9px] uppercase tracking-[0.2em] text-ash">
              Your team
            </p>

            <p className="mt-1 font-display text-xl font-black uppercase">
              {team.team_name}
            </p>
          </div>
        </div>
      </div>

      {/* Header bottom status strip */}
      <div className="grid grid-cols-2 border-t border-bone/10 md:grid-cols-3">
        <div className="border-r border-bone/10 px-5 py-4">
          <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
            Competition
          </p>

          <p className="mt-1 font-display text-sm font-bold uppercase">
            Fantasy League
          </p>
        </div>

        <div className="border-r border-bone/10 px-5 py-4">
          <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
            Squad size
          </p>

          <p className="mt-1 font-display text-sm font-bold uppercase">
            4 Players
          </p>
        </div>

        <div className="hidden px-5 py-4 md:block">
          <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
            Status
          </p>

          <p
            className={`mt-1 font-display text-sm font-bold uppercase ${
              locked ? "text-red-400" : "text-ember"
            }`}
          >
            {locked ? "Locked" : "Selection Open"}
          </p>
        </div>
      </div>
    </section>

    {/* Day selector / current round */}
    {!day ? (
      <div className="mt-8 chamfer border border-bone/10 bg-char-2 p-8">
        <p className="font-stat text-sm uppercase tracking-widest text-ash">
          No tournament days scheduled yet.
        </p>
      </div>
    ) : loading || !poolLoaded ? (
      <div className="mt-8 space-y-5">
        <Skeleton className="h-28" />
        <Skeleton className="h-[600px]" />
      </div>
    ) : (
      <>
        <section className="mt-8 flex flex-col gap-4 md:flex-row md:items-stretch">
          {/* Current day */}
          <div className="relative flex-1 overflow-hidden chamfer border border-ember/20 bg-char-2">
            <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-ember/10 to-transparent" />

            <div className="relative flex items-center gap-5 px-6 py-5">
              <div className="flex h-14 min-w-14 items-center justify-center chamfer-sm border border-ember/30 bg-ember/10">
                <span className="font-stat text-xs font-black uppercase text-ember">
                  D{day.day_order}
                </span>
              </div>

              <div>
                <p className="font-stat text-[9px] uppercase tracking-[0.25em] text-ash">
                  Building for
                </p>

                <p className="mt-1 font-display text-2xl font-black uppercase">
                  {day.name}
                </p>
              </div>
            </div>
          </div>

          {/* Lock state */}
          <div
            className={`flex items-center gap-4 chamfer border px-6 py-5 md:min-w-[230px] ${
              locked
                ? "border-red-400/20 bg-red-400/[0.04]"
                : "border-ember/20 bg-ember/[0.04]"
            }`}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center chamfer-sm ${
                locked ? "bg-red-400/10" : "bg-ember/10"
              }`}
            >
              <span
                className={`text-lg ${
                  locked ? "text-red-400" : "text-ember"
                }`}
              >
                {locked ? "🔒" : "✦"}
              </span>
            </div>

            <div>
              <p className="font-stat text-[9px] uppercase tracking-widest text-ash">
                Selection
              </p>

              <p
                className={`mt-1 font-display text-sm font-black uppercase ${
                  locked ? "text-red-400" : "text-ember"
                }`}
              >
                {locked ? "Locked" : "Open"}
              </p>
            </div>
          </div>
        </section>

        {/* Builder */}
        <section className="mt-6">
          <SelectionBuilder
            key={day.id}
            lockTime={sel?.lock_time ?? null}
            chip={sel?.chip || null}
            chipsUsed={sel?.chips_used ?? []}
            tournamentId={tournamentId}
            dayId={day.id}
            pool={pool}
            existing={sel?.selections ?? []}
            locked={locked}
            onSaved={() => router.push(`/fantasy/${team.id}`)}
          />
        </section>
      </>
    )}
  </div>
</div>

);
}
