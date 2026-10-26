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

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-stat text-[10px] font-bold uppercase tracking-[0.28em] text-ember">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl font-black uppercase leading-none text-bone sm:text-3xl">{title}</h2>
      </div>
      <p className="max-w-md font-stat text-xs leading-relaxed text-ash">{description}</p>
    </div>
  );
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
      <div className="space-y-5">
        <Skeleton className="h-56" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const isAdmin = session.role === "admin";
  const initial = session.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      <section className="relative isolate overflow-hidden border border-bone/10 bg-char-2">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-ember/10 blur-3xl" />
          <div className="absolute right-12 top-0 h-full w-px rotate-[25deg] bg-bone/[0.06]" />
          <div className="absolute right-32 top-0 h-full w-px rotate-[25deg] bg-bone/[0.04]" />
          <div className="absolute bottom-0 left-0 h-1 w-32 bg-ember" />
        </div>

        <div className="relative p-5 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4 sm:gap-6">
              <div className="relative shrink-0">
                <div className="flex h-20 w-20 items-center justify-center border border-ember/60 bg-ember font-display text-4xl font-black uppercase text-char shadow-[0_0_35px_rgba(255,90,31,0.16)] sm:h-24 sm:w-24 sm:text-5xl">
                  {initial}
                </div>
                <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center border-4 border-char-2 bg-char text-xs text-ember" aria-hidden="true">
                  ✦
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-stat text-[10px] font-bold uppercase tracking-[0.3em] text-ember">Player profile</p>
                <h1 className="mt-2 break-words font-display text-3xl font-black uppercase leading-[0.95] text-bone sm:text-5xl">
                  {session.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 border border-bone/10 bg-char/70 px-2.5 py-1 font-stat text-[10px] font-bold uppercase tracking-widest text-ash">
                    <span className="h-1.5 w-1.5 rounded-full bg-ember" />
                    {isAdmin ? "Administrator" : "FFWS Member"}
                  </span>
                  {me?.email_verified && (
                    <span className="inline-flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-stat text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                      <span aria-hidden="true">✓</span> Email verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              {fantasyTeamId ? (
                <Link href={`/fantasy/${fantasyTeamId}`} className="inline-flex min-h-12 items-center justify-center gap-2 bg-ember px-5 py-3 font-display text-sm font-extrabold uppercase tracking-wider text-char transition hover:bg-amber focus:outline-none focus:ring-2 focus:ring-ember focus:ring-offset-2 focus:ring-offset-char-2">
                  <span aria-hidden="true">◆</span> My fantasy team
                </Link>
              ) : (
                <Link href="/fantasy/pick-team" className="inline-flex min-h-12 items-center justify-center gap-2 bg-ember px-5 py-3 font-display text-sm font-extrabold uppercase tracking-wider text-char transition hover:bg-amber focus:outline-none focus:ring-2 focus:ring-ember focus:ring-offset-2 focus:ring-offset-char-2">
                  <span aria-hidden="true">＋</span> Build fantasy team
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="inline-flex min-h-12 items-center justify-center border border-bone/20 px-5 py-3 font-display text-sm font-extrabold uppercase tracking-wider text-bone transition hover:border-ember hover:text-ember">
                  Admin console
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-3 border-t border-bone/10 pt-5 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-bone/10 bg-char font-display text-lg text-ember" aria-hidden="true">◎</span>
              <div>
                <p className="font-stat text-[10px] uppercase tracking-[0.18em] text-ash">Username</p>
                <p className="mt-1 break-all font-stat text-sm font-semibold text-bone">@{session.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-bone/10 bg-char font-display text-lg text-ember" aria-hidden="true">✉</span>
              <div className="min-w-0">
                <p className="font-stat text-[10px] uppercase tracking-[0.18em] text-ash">Email address</p>
                <p className="mt-1 break-all font-stat text-sm font-semibold text-bone">{me?.email || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-bone/10 bg-char font-display text-lg text-ember" aria-hidden="true">⌁</span>
              <div>
                <p className="font-stat text-[10px] uppercase tracking-[0.18em] text-ash">Sign-in method</p>
                <p className="mt-1 font-stat text-sm font-semibold text-bone">{me?.has_password ? "Password enabled" : "Google / password not set"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Manage your account"
          title="Account settings"
          description="Keep your sign-in details up to date and make sure your account stays secure."
        />
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
          <div className="border border-bone/10 bg-char-2 p-5">
            <Skeleton className="h-14" />
            <div className="mt-3"><Skeleton className="h-14" /></div>
            <div className="mt-3"><Skeleton className="h-14" /></div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 border border-bone/10 bg-char-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-danger/20 bg-danger/5 text-danger" aria-hidden="true">↗</span>
          <div>
            <h2 className="font-display text-lg font-extrabold uppercase text-bone">Finished for now?</h2>
            <p className="mt-1 max-w-xl font-stat text-xs leading-relaxed text-ash">Log out of your FFWS account on this device. You can sign back in at any time.</p>
          </div>
        </div>
        <Button type="button" variant="ghost" onClick={logout}>Log out</Button>
      </section>
    </main>
  );
}
