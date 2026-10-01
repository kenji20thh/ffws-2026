"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/fantasy/pick-team", label: "Pick Team" },
  { href: "/fantasy/points", label: "Points" },
  { href: "/fantasy/leagues", label: "Leagues" },
  { href: "/fantasy/leaderboard", label: "Leaderboard" },
  { href: "/fantasy/prices", label: "Price Changes" },
  { href: "/fantasy/schedule", label: "Schedule" },
];

export default function FantasySubNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-16 z-40 border-b border-bone/10 bg-char/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);

          return (
            <Link
              key={t.href}
              href={t.href}
              className={`shrink-0 border-b-2 px-4 py-3 font-display text-base font-bold uppercase tracking-wider transition-colors ${
                active
                  ? "border-ember text-ember"
                  : "border-transparent text-bone/60 hover:text-bone"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}