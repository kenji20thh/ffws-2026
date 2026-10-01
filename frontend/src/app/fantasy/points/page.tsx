"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, getMyFantasyTeam, getTournament } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function PointsRedirectPage() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "no-auth" | "no-team">("loading");

  useEffect(() => {
    if (!getToken()) {
      setState("no-auth");
      return;
    }
    getTournament("ffws-2026")
      .then((t) => getMyFantasyTeam(t.id))
      .then((team) => router.replace(`/fantasy/${team.id}`))
      .catch((e) => {
        if (e instanceof ApiError) setState("no-team");
        else setState("no-team");
      });
  }, [router]);

  if (state === "loading") {
    return <div className="mx-auto max-w-3xl px-5 py-20"><Skeleton className="h-40" /></div>;
  }

  if (state === "no-auth") {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="font-display text-3xl font-black uppercase">Log in to see your points</p>
        <Link href="/login" className="mt-4 inline-block font-stat text-sm uppercase tracking-widest text-ember hover:underline">
          Go to login →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <p className="font-display text-3xl font-black uppercase">No fantasy team yet</p>
      <p className="mt-2 font-stat text-xs uppercase tracking-widest text-ash">Create one and start picking.</p>
      <Link href="/fantasy/pick-team" className="mt-4 inline-block font-stat text-sm uppercase tracking-widest text-ember hover:underline">
        Pick your team →
      </Link>
    </div>
  );
}