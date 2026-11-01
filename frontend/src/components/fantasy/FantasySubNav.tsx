"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const FANTASY_TABS = [
  { href: "/fantasy/pick-team", label: "Pick Team" },
  { href: "/fantasy/points", label: "Points" },
  { href: "/fantasy/leagues", label: "Leagues" },
  { href: "/fantasy/leaderboard", label: "Leaderboard" },
  { href: "/fantasy/form", label: "Player Form" },
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

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  // a single prediction page (/fantasy/predict/<id>) belongs under "Points"
  const viewingPrediction = /^\/fantasy\/predict\/\d+/.test(pathname);
  const isActive = (href: string) =>
    pathname.startsWith(href) || (viewingPrediction && href === "/fantasy/predict/points");

  // show a fade on whichever edge still has hidden tabs
  const updateFade = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setFade((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  // keep the active tab visible (centered) when the page or route changes
  useEffect(() => {
    const el = scrollerRef.current;
    const active = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && active) {
      el.scrollTo({
        left: active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2,
        behavior: "smooth",
      });
    }
    updateFade();
  }, [pathname, updateFade]);

  useEffect(() => {
    updateFade();
    window.addEventListener("resize", updateFade);
    return () => window.removeEventListener("resize", updateFade);
  }, [updateFade]);

  return (
    <nav
      aria-label="Fantasy sections"
      className="sticky top-16 z-40 border-b border-bone/10 bg-char/95 backdrop-blur-sm"
    >
      <div className="relative mx-auto max-w-7xl">
        <div
          ref={scrollerRef}
          onScroll={updateFade}
          className="flex gap-0.5 overflow-x-auto overscroll-x-contain px-2 [scrollbar-width:none] sm:gap-1 sm:px-5 [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((t) => {
            const active = isActive(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-3 font-display text-sm font-bold uppercase tracking-wider transition-colors sm:px-4 sm:text-base ${
                  active ? "border-ember text-ember" : "border-transparent text-bone/60 hover:text-bone"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* edge fades: hint that the bar scrolls */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-char to-transparent transition-opacity ${
            fade.left ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-char to-transparent transition-opacity ${
            fade.right ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </nav>
  );
}