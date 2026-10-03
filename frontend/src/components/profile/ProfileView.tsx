"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getMyFantasyTeam, getTournament } from "@/lib/api";
import { clearSession, getName, getRole, getToken } from "@/lib/auth";

interface Session {
  name: string;
  role: string;
}

export default function ProfileView() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [fantasyTeamId, setFantasyTeamId] = useState<number | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setSession({ name: getName() || "User", role: getRole() || "user" });

    let cancelled = false;
    getTournament("ffws-2026")
      .then((t) => getMyFantasyTeam(t.id))
      .then((team) => {
        if (!cancelled) setFantasyTeamId(team.id);
      })
      .catch((e) => {
        // 404 just means "no fantasy team yet". An expired token (401) ends the session.
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

  if (!session) return <Skeleton className="h-40" />;

  const isAdmin = session.role === "admin";

  return (
    <div className="chamfer border border-bone/10 bg-char-2 p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-ember font-display text-3xl font-black uppercase text-char">
          {session.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-4xl font-black uppercase leading-none">{session.name}</p>
          <p className="mt-1 font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
            {isAdmin ? "Administrator" : "FFWS Member"}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {fantasyTeamId ? (
          <Link
            href={`/fantasy/${fantasyTeamId}`}
            className="chamfer-sm bg-ember px-7 py-3 font-display text-lg font-extrabold uppercase tracking-wider text-char transition-colors hover:bg-amber"
          >
            My fantasy team
          </Link>
        ) : (
          <Link
            href="/fantasy/pick-team"
            className="chamfer-sm bg-ember px-7 py-3 font-display text-lg font-extrabold uppercase tracking-wider text-char transition-colors hover:bg-amber"
          >
            Pick your team
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            className="chamfer-sm border border-bone/25 px-7 py-3 font-display text-lg font-extrabold uppercase tracking-wider text-bone transition-colors hover:border-ember hover:text-ember"
          >
            Admin console
          </Link>
        )}
        <Button type="button" variant="ghost" onClick={logout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
