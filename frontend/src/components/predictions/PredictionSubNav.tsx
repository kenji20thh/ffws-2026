"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/predictions/make", label: "Make Prediction" },
  { href: "/predictions/leaderboard", label: "Leaderboard" },
];

export default function PredictionSubNav() {
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
                active ? "border-ember text-ember" : "border-transparent text-bone/60 hover:text-bone"
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