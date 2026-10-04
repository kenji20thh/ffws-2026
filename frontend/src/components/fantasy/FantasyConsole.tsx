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
// If that extra lookup fails the pick screen still works (it falls back to monograms).
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
  if (p.photo_url) photos.set(p.id, p.photo_url);
});

const logos = new Map<number, string>();

teams.forEach((t) => {
  if (t.logo_url) logos.set(t.id, t.logo_url);
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

type CountdownParts = {
months: number;
days: number;
hours: number;
minutes: number;
seconds: number;
};

function getCountdownParts(deadline: string | null | undefined): CountdownParts {
if (!deadline || deadline.startsWith("0001")) {
return {
months: 0,
days: 0,
hours: 0,
minutes: 0,
seconds: 0,
};
}

const target = new Date(deadline);
const now = new Date();

if (target.getTime() <= now.getTime()) {
return {
months: 0,
days: 0,
hours: 0,
minutes: 0,
seconds: 0,
};
}

let months = 0;
let cursor = new Date(now);

while (true) {
const next = new Date(cursor);
next.setMonth(next.getMonth() + 1);

if (next.getTime() <= target.getTime()) {
  months += 1;
  cursor = next;
} else {
  break;
}

if (months >= 120) break;

}

const remainingMs = Math.max(0, target.getTime() - cursor.getTime());

const totalSeconds = Math.floor(remainingMs / 1000);

const days = Math.floor(totalSeconds / 86400);
const hours = Math.floor((totalSeconds % 86400) / 3600);
const minutes = Math.floor((totalSeconds % 3600) / 60);
const seconds = totalSeconds % 60;

return {
months,
days,
hours,
minutes,
seconds,
};
}

function pad(value: number) {
return String(value).padStart(2, "0");
}

function formatCountdown(parts: CountdownParts) {
return [
pad(parts.months),
pad(parts.days),
pad(parts.hours),
pad(parts.minutes),
pad(parts.seconds),
].join(":");
}

function CountdownUnit({
value,
label,
}: {
value: number;
label: string;
}) {
return ( <div className="flex flex-col items-center"> <span className="font-stat text-2xl font-black tabular-nums sm:text-3xl lg:text-4xl">
{pad(value)} </span>

  <span className="mt-1 font-stat text-[8px] font-bold uppercase tracking-[0.18em] text-ash sm:text-[9px]">
    {label}
  </span>
</div>

);
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

const [countdown, setCountdown] = useState<CountdownParts>({
months: 0,
days: 0,
hours: 0,
minutes: 0,
seconds: 0,
});

const [countdownExpired, setCountdownExpired] = useState(false);

useEffect(() => {
setLoggedIn(!!getToken());
setAuthChecked(true);
}, []);

// Live countdown.
useEffect(() => {
if (!day?.deadline || day.deadline.startsWith("0001")) {
setCountdown({
months: 0,
days: 0,
hours: 0,
minutes: 0,
seconds: 0,
});
setCountdownExpired(false);
return;
}

const updateCountdown = () => {
  const deadlineMs = new Date(day.deadline).getTime();
  const nowMs = Date.now();

  if (deadlineMs <= nowMs) {
    setCountdown({
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });

    setCountdownExpired(true);
    return;
  }

  setCountdown(getCountdownParts(day.deadline));
  setCountdownExpired(false);
};

updateCountdown();

const interval = window.setInterval(updateCountdown, 1000);

return () => window.clearInterval(interval);

}, [day]);

// An expired or invalid token (401) ends the session and shows the login prompt.
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

// Once the countdown reaches zero, refresh the selection so the UI
// picks up the server-side locked state.
useEffect(() => {
if (!countdownExpired || !team || !day) return;

loadSelection();

}, [countdownExpired, team, day, loadSelection]);

if (!authChecked) {
return ( <div className="mx-auto max-w-3xl px-5 py-10"> <Skeleton className="h-40" /> </div>
);
}

if (!loggedIn) {
return ( <div className="mx-auto max-w-md px-5 py-20 text-center"> <p className="font-display text-3xl font-black uppercase">
Log in to play </p>

    <Link
      href="/login"
      className="mt-4 inline-block font-stat text-sm uppercase tracking-widest text-ember hover:underline"
    >
      Go to login →
    </Link>
  </div>
);

}

if (error) {
return ( <div className="mx-auto max-w-3xl px-5 py-16"> <ErrorState message={error} /> </div>
);
}

if (team === undefined) {
return ( <div className="mx-auto max-w-3xl px-5 py-10"> <Skeleton className="h-40" /> </div>
);
}

if (team === null) {
return ( <div className="px-5 py-16"> <CreateFantasyTeamForm
       tournamentId={tournamentId}
       onCreated={loadTeam}
     /> </div>
);
}

const locked = sel?.locked ?? false;
const isLocked = locked || countdownExpired;

return ( <div className="mx-auto max-w-7xl space-y-8 px-5 py-10"> <div className="chamfer border border-bone/10 bg-char-2 p-6"> <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
Your fantasy team </p>

    <p className="font-display text-3xl font-black uppercase">
      {team.team_name}
    </p>
  </div>

  {!day ? (
    <p className="font-stat text-sm uppercase tracking-widest text-ash">
      No tournament days scheduled yet.
    </p>
  ) : loading || !poolLoaded ? (
    <Skeleton className="h-64" />
  ) : (
    <>
      {/* DAY + COUNTDOWN */}
      <div className="relative">
        <div
          className={`chamfer-sm border bg-char-2 px-5 py-4 transition-colors sm:px-6 ${
            isLocked
              ? "border-red-500/30"
              : "border-bone/15"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* LEFT */}
            <div className="min-w-0">
              <p className="font-stat text-[10px] uppercase tracking-[0.18em] text-ash">
                Tournament day
              </p>

              <p
                className={`mt-1 truncate font-display text-lg font-black uppercase sm:text-xl ${
                  isLocked ? "text-red-500" : "text-bone"
                }`}
              >
                {day.name}
              </p>
            </div>

            {/* COUNTDOWN */}
            <div className="shrink-0 text-center">
              <p
                className={`mb-2 font-stat text-[8px] font-bold uppercase tracking-[0.22em] sm:text-[9px] ${
                  isLocked ? "text-red-500" : "text-ember"
                }`}
              >
                {isLocked
                  ? "Fantasy locked"
                  : "Picks close in"}
              </p>

              <div
                className={`flex items-center gap-1.5 font-stat ${
                  isLocked
                    ? "text-red-500"
                    : "text-ember"
                } sm:gap-2`}
              >
                <CountdownUnit
                  value={countdown.months}
                  label="Months"
                />

                <span className="pb-4 text-lg font-black opacity-50 sm:text-xl">
                  :
                </span>

                <CountdownUnit
                  value={countdown.days}
                  label="Days"
                />

                <span className="pb-4 text-lg font-black opacity-50 sm:text-xl">
                  :
                </span>

                <CountdownUnit
                  value={countdown.hours}
                  label="Hours"
                />

                <span className="pb-4 text-lg font-black opacity-50 sm:text-xl">
                  :
                </span>

                <CountdownUnit
                  value={countdown.minutes}
                  label="Minutes"
                />

                <span className="pb-4 text-lg font-black opacity-50 sm:text-xl">
                  :
                </span>

                <CountdownUnit
                  value={countdown.seconds}
                  label="Seconds"
                />
              </div>
            </div>

            {/* STATUS */}
            <div className="hidden shrink-0 sm:block">
              <div
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                  isLocked
                    ? "border-red-500/30 text-red-500"
                    : "border-green-500/30 text-green-500"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLocked
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                />

                <span className="font-stat text-[9px] font-bold uppercase tracking-widest">
                  {isLocked ? "Locked" : "Open"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOCK MESSAGE */}
      {isLocked && (
        <div className="chamfer-sm flex items-center gap-3 border border-red-500/20 bg-red-500/5 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-red-500/20 text-red-500">
            <span className="font-stat text-sm font-black">
              !
            </span>
          </div>

          <div>
            <p className="font-display text-sm font-black uppercase text-red-500">
              This day is locked
            </p>

            <p className="mt-1 font-stat text-[10px] uppercase tracking-wider text-ash">
              The deadline has passed. Your selection can no longer be changed.
            </p>
          </div>
        </div>
      )}

      <SelectionBuilder
        key={day.id}
        lockTime={sel?.lock_time ?? null}
        tournamentId={tournamentId}
        dayId={day.id}
        pool={pool}
        existing={sel?.selections ?? []}
        locked={isLocked}
        onSaved={() => router.push(`/fantasy/${team.id}`)}
      />
    </>
  )}
</div>

);
}
