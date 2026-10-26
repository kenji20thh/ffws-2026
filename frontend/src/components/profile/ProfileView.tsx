"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getMe, getMyFantasyTeam, getTournament } from "@/lib/api";
import { clearSession, getName, getRole, getToken } from "@/lib/auth";
import type { Me } from "@/types";
import AccountSettings from "./AccountSettings";

interface Session {
  name: string;
  role: string;
}

export default function ProfileView() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [fantasyTeamId, setFantasyTeamId] = useState<number | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    setSession({ name: getName() || "User", role: getRole() || "user" });
    let cancelled = false;

    getMe()
      .then((account) => {
        if (cancelled) return;
        setMe(account);
        setSession({ name: account.username, role: account.role });
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          clearSession();
          router.replace("/login");
        }
      });

    getTournament("ffws-2026")
      .then((t) => getMyFantasyTeam(t.id))
      .then((team) => {
        if (!cancelled) setFantasyTeamId(team.id);
      })
      .catch((e) => {
        // A 404 means the user has not created a fantasy team yet.
        if (e instanceof ApiError && e.status === 401) {
          clearSession();
          router.replace("/login");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  function logout() {
    clearSession();
    router.replace("/");
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const isAdmin = session.role === "admin";
  const initial = session.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 pb-8">
      <section className="border border-bone/10 bg-char-2">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-ember/40 bg-ember/10 font-display text-2xl font-bold uppercase text-ember">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-stat text-[10px] uppercase tracking-[0.18em] text-ash">Your FFWS account</p>
              <h1 className="mt-1 break-words font-display text-2xl font-bold uppercase leading-tight text-bone">{session.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 font-stat text-[11px] text-ash">
                <span>{isAdmin ? "Administrator" : "FFWS Member"}</span>
                {me?.email_verified && (
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <span aria-hidden="true">✓</span> Email verified
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {fantasyTeamId ? (
              <Link href={`/fantasy/${fantasyTeamId}`} className="inline-flex min-h-10 items-center justify-center bg-ember px-4 py-2 font-stat text-xs font-bold uppercase tracking-wide text-char transition-colors hover:bg-amber">
                My fantasy team
              </Link>
            ) : (
              <Link href="/fantasy/pick-team" className="inline-flex min-h-10 items-center justify-center bg-ember px-4 py-2 font-stat text-xs font-bold uppercase tracking-wide text-char transition-colors hover:bg-amber">
                Build fantasy team
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="inline-flex min-h-10 items-center justify-center border border-bone/20 px-4 py-2 font-stat text-xs font-bold uppercase tracking-wide text-bone transition-colors hover:border-ember hover:text-ember">
                Admin console
              </Link>
            )}
            <Button type="button" variant="ghost" onClick={logout}>Log out</Button>
          </div>
        </div>

        <div className="grid border-t border-bone/10 sm:grid-cols-3 sm:divide-x sm:divide-bone/10">
          <div className="flex min-w-0 items-center gap-3 border-b border-bone/10 px-4 py-3 sm:border-b-0 sm:px-5">
            <span className="text-sm text-ember" aria-hidden="true">@</span>
            <div className="min-w-0">
              <p className="font-stat text-[10px] uppercase tracking-wider text-ash">Username</p>
              <p className="mt-0.5 break-all font-stat text-sm text-bone">{session.name}</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-3 border-b border-bone/10 px-4 py-3 sm:border-b-0 sm:px-5">
            <span className="text-sm text-ember" aria-hidden="true">✉</span>
            <div className="min-w-0">
              <p className="font-stat text-[10px] uppercase tracking-wider text-ash">Email address</p>
              <p className="mt-0.5 break-all font-stat text-sm text-bone">{me?.email || "Not provided"}</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5">
            <span className="text-sm text-ember" aria-hidden="true">⌑</span>
            <div className="min-w-0">
              <p className="font-stat text-[10px] uppercase tracking-wider text-ash">Sign-in method</p>
              <p className="mt-0.5 font-stat text-sm text-bone">{me ? (me.has_password ? "Password enabled" : "Google / no password") : "Loading…"}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="font-display text-xl font-bold uppercase text-bone">Account settings</h2>
          <p className="mt-1 font-stat text-xs text-ash">Manage your username and sign-in details.</p>
        </div>
        {me ? (
          <AccountSettings
            me={me}
            onChanged={(patch) => {
              setMe((current) => (current ? { ...current, ...patch } : current));
              if (patch.username) {
                setSession((current) => (current ? { ...current, name: patch.username as string } : current));
              }
            }}
          />
        ) : (
          <div className="border border-bone/10 bg-char-2 p-4">
            <Skeleton className="h-12" />
            <div className="mt-2"><Skeleton className="h-12" /></div>
            <div className="mt-2"><Skeleton className="h-12" /></div>
          </div>
        )}
      </section>
    </main>
  );
}
