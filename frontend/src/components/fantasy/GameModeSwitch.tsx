"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GameModeSwitch() {
  const pathname = usePathname();
  const isPrediction = pathname.startsWith("/fantasy/predict");

  const tabClass = (active: boolean) =>
    `flex-1 border-b-4 px-3 py-3 text-center font-display text-lg font-black sm:px-6 sm:py-4 sm:text-2xl uppercase tracking-wider transition-colors ${
      active ? "border-ember bg-char-2 text-ember" : "border-transparent text-bone/50 hover:text-bone"
    }`;

  return (
    <div className="flex border-b border-bone/10 bg-char">
      <Link href="/fantasy/pick-team" className={tabClass(!isPrediction)}>Fantasy</Link>
      <Link href="/fantasy/predict/make" className={tabClass(isPrediction)}>Prediction</Link>
    </div>
  );
}