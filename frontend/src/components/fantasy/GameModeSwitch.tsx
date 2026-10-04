"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GameModeSwitch() {
  const pathname = usePathname();
  const isPrediction = pathname.startsWith("/fantasy/predict");

  const tabClass = (active: boolean) =>
    `flex-1 border-b-4 px-6 py-4 text-center font-display text-2xl font-black uppercase tracking-wider transition-colors ${
      active ? "border-ember bg-char-2 text-ember" : "border-transparent text-bone/50 hover:text-bone"
    }`;

  return (
    <div className="flex border-b border-bone/10 bg-char">
      <Link href="/fantasy/pick-team" className={tabClass(!isPrediction)}>Fantasy</Link>
      <Link href="/fantasy/predict/make" className={tabClass(isPrediction)}>Prediction</Link>
    </div>
  );
}