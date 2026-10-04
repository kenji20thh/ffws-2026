"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FANTASY_TABS = [
  { href: "/fantasy/pick-team", label: "Pick Team" },
  { href: "/fantasy/points", label: "Points" },
  { href: "/fantasy/leagues", label: "Leagues" },
  { href: "/fantasy/leaderboard", label: "Leaderboard" },
  { href: "/fantasy/prices", label: "Price Changes" },
  { href: "/fantasy/schedule", label: "Schedule" },
  { href: "/fantasy/regulation", label: "Regulation" },
];

const PREDICT_TABS = [
  { href: "/fantasy/predict/make", label: "Make Prediction" },
  { href: "/fantasy/predict/points", label: "Points" },
  { href: "/fantasy/predict/schedule", label: "Schedule" },
  { href: "/fantasy/predict/leaderboard", label: "Leaderboard" },
  { href: "/fantasy/predict/regulation", label: "Regulation" },
];

export default function FantasySubNav() {
  const pathname = usePathname();
  const tabs = pathname.startsWith("/fantasy/predict") ? PREDICT_TABS : FANTASY_TABS;

  return (
    <nav className="sticky top-16 z-40 border-b border-bone/10 bg-char/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5">
        {tabs.map((t) => {
          // a single prediction page (/fantasy/predict/<id>) belongs under "Points"
          const viewingPrediction = /^\/fantasy\/predict\/\d+/.test(pathname);
          const active =
            pathname.startsWith(t.href) || (viewingPrediction && t.href === "/fantasy/predict/points");
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