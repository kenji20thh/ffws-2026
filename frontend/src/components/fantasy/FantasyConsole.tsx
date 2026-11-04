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

function getTimeRemaining(lockTime: string | null, now: number) {
if (!lockTime) {
return {
days: 0,
hours: 0,
minutes: 0,
seconds: 0,
expired: true,
};
}

const target = new Date(lockTime).getTime();

if (Number.isNaN(target)) {
return {
days: 0,
hours: 0,
minutes: 0,
seconds: 0,
expired: true,
};
}

const difference = target - now;

if (difference <= 0) {
return {
days: 0,
hours: 0,
minutes: 0,
seconds: 0,
expired: true,
};
}

const totalSeconds = Math.floor(difference / 1000);

const seconds = totalSeconds % 60;
const totalMinutes = Math.floor(totalSeconds / 60);
const minutes = totalMinutes % 60;
const totalHours = Math.floor(totalMinutes / 60);
const hours = totalHours % 24;
const days = Math.floor(totalHours / 24);

return {
days,
hours,
minutes,
seconds,
expired: false,
};
}

function pad(value: number) {
return String(value).padStart(2, "0");
}

// The price list from the API has no artwork, so merge in player photos and team logos.
// If that extra lookup fails the pick screen still works.
async function loadPool(
tournamentId: number,
dayId: number
): Promise<PoolPlayer[]> {
const options = await getFantasyPlayerPool(tournamentId, dayId);

try {
const teams = await getTeams(tournamentId);

const lists = await Promise.all(
  teams.map((t) => getPlayers(t.id).catch(() => [] as Player[]))
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
const [now, setNow] = useState(() => Date.now());

useEffect(() => {
setLoggedIn(!!getToken());
setAuthChecked(true);
}, []);

/*
Live countdown clock.
Updates every second so the visible countdown actually ticks.
*/
useEffect(() => {
const interval = window.setInterval(() => {
setNow(Date.now());
}, 1000);

return () => window.clearInterval(interval);

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

  setError(e instanceof Error ? e.message : "Something went wrong");
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

}, [loggedIn, tournamentId, loadTeam, fail]);

/*
Load the player pool only after the active fantasy day is known.
The backend now filters the pool by tournament + day.
*/
useEffect(() => {
if (!loggedIn || !day) return;

setPoolLoaded(false);

loadPool(tournamentId, day.id)
  .then((p) => {
    setPool(p);
    setPoolLoaded(true);
  })
  .catch(fail);

}, [loggedIn, tournamentId, day, fail]);

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

/*
IMPORTANT:
The selection endpoint may not always have lock_time yet.
The tournament day itself already has a deadline, so use it
as the fallback. This prevents the countdown from disappearing.
*/
const lockTime =
sel?.lock_time ||
(day?.deadline && !day.deadline.startsWith("0001")
? day.deadline
: null);

const backendLocked = sel?.locked ?? false;

const countdown = getTimeRemaining(lockTime, now);

/*
The frontend locks visually as soon as the countdown reaches zero,
even if the backend has not refreshed its locked state yet.
*/
const locked = backendLocked || countdown.expired;

const cells: [string, number][] = [
  ["Days", countdown.days],
  ["Hrs", countdown.hours],
  ["Min", countdown.minutes],
  ["Sec", countdown.seconds],
];

return (
  <div className="relative overflow-hidden">
    {/* Background atmosphere */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-ember/[0.07] blur-[120px]" />
      <div className="absolute -left-40 top-[45%] h-[450px] w-[450px] rounded-full bg-bone/[0.025] blur-[120px]" />

      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>

    <div className="relative mx-auto max-w-[87.5rem] px-3 py-3 sm:px-5 lg:px-6 lg:py-4">
      {/* One compact status bar: team · matchday · deadline */}
      <section className="relative overflow-hidden chamfer-sm border border-bone/10 bg-char-2">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-ember/[0.07] to-transparent" />

        <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3 px-3 py-2.5 sm:px-4">
          {/* Team identity */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center chamfer-sm border border-ember/25 bg-ember/10">
              <span className="font-display text-base font-black text-ember">
                {team.team_name.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="min-w-0">
              <p className="font-stat text-[8px] uppercase tracking-[0.2em] text-ash">
                FFWS 2026 Fantasy · Your team
              </p>
              <p className="truncate font-display text-lg font-black uppercase leading-tight">
                {team.team_name}
              </p>
            </div>
          </div>

          {day ? (
            <>
              {/* Matchday */}
              <div className="flex items-center gap-3 sm:border-l sm:border-bone/10 sm:pl-6">
                <div className="flex h-10 min-w-10 items-center justify-center chamfer-sm border border-ember/30 bg-ember/10 px-1">
                  <span className="font-stat text-[11px] font-black uppercase text-ember">
                    D{day.day_order}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="font-stat text-[8px] uppercase tracking-[0.2em] text-ash">
                    Building for
                  </p>
                  <p className="truncate font-display text-lg font-black uppercase leading-tight">
                    {day.name}
                  </p>
                </div>
              </div>

              {/* Deadline / countdown */}
              <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto">
                {locked ? (
                  <div className="flex w-full items-center gap-2 border border-danger/25 bg-danger/[0.06] px-3 py-2 sm:w-auto">
                    <span aria-hidden="true">🔒</span>
                    <p className="font-stat text-[10px] font-bold uppercase tracking-widest text-danger">
                      Selections locked
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden items-center gap-2 md:flex">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember shadow-[0_0_10px_rgba(255,100,40,.8)]" />
                      <p className="font-stat text-[9px] font-bold uppercase leading-tight tracking-[0.18em] text-ember">
                        Closes
                        <br />
                        in
                      </p>
                    </div>

                    <div
                      className="grid flex-1 grid-cols-4 gap-1.5 sm:flex-none"
                      role="timer"
                      aria-label="Time until the selection deadline"
                    >
                      {cells.map(([label, value], i) => {
                        const last = i === cells.length - 1;

                        return (
                          <div
                            key={label}
                            className={`border px-2 py-1 text-center sm:min-w-[3rem] ${
                              last
                                ? "border-ember/25 bg-ember/[0.08]"
                                : "border-bone/10 bg-char/60"
                            }`}
                          >
                            <div
                              className={`font-stat text-base font-black leading-none tabular-nums sm:text-lg ${
                                last ? "text-ember" : "text-bone"
                              }`}
                            >
                              {pad(value)}
                            </div>
                            <div
                              className={`mt-1 font-stat text-[7px] font-bold uppercase tracking-[0.18em] ${
                                last ? "text-ember/70" : "text-ash"
                              }`}
                            >
                              {label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* Builder */}
      {!day ? (
        <div className="mt-4 chamfer-sm border border-bone/10 bg-char-2 p-6">
          <p className="font-stat text-sm uppercase tracking-widest text-ash">
            No tournament days scheduled yet.
          </p>
        </div>
      ) : loading || !poolLoaded ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(18.75rem,23.75rem)_minmax(0,1fr)]">
          <Skeleton className="h-[420px] lg:h-[520px]" />
          <Skeleton className="h-[420px] lg:h-[520px]" />
        </div>
      ) : (
        <section className="mt-4">
          <SelectionBuilder
            key={day.id}
            lockTime={lockTime}
            chip={sel?.chip || null}
            chipsUsed={sel?.chips_used ?? []}
            tournamentId={tournamentId}
            dayId={day.id}
            pool={pool}
            existing={sel?.selections ?? []}
            breakdown={sel?.breakdown ?? []}
            locked={locked}
            onSaved={() => router.push(`/fantasy/${team.id}`)}
          />
        </section>
      )}
    </div>
  </div>
);
}
