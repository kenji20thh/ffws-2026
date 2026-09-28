"use client";

import { useEffect, useState } from "react";
import { pad2 } from "@/lib/format";

const WINDOW_DAYS = 60; // the ring "closes in" over the last 60 days
const SIZE = 340;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function calc(target: number) {
  const diff = Math.max(target - Date.now(), 0);
  return {
    diff,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function Countdown({ targetDate }: { targetDate: string }) {
  const target = new Date(targetDate).getTime();
  const [t, setT] = useState<ReturnType<typeof calc> | null>(null);

  useEffect(() => {
    setT(calc(target));
    const id = setInterval(() => setT(calc(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const windowMs = WINDOW_DAYS * 86_400_000;
  const remaining = t ? Math.min(t.diff / windowMs, 1) : 1;

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE, maxWidth: "100%" }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(241,233,220,0.1)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#ff5a1f"
          strokeWidth={STROKE}
          strokeLinecap="butt"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - remaining)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R - 22}
          fill="none"
          stroke="rgba(255,90,31,0.35)"
          strokeWidth={1}
          strokeDasharray="4 8"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-stat text-[10px] uppercase tracking-[0.35em] text-ember">Zone closes in</p>
        <p className="font-display text-[7rem] font-black leading-none tabular-nums">
          {t ? pad2(t.days) : "--"}
        </p>
        <p className="-mt-1 font-stat text-xs uppercase tracking-widest text-ash">days</p>
        <p className="mt-3 font-stat text-lg tabular-nums text-bone">
          {t ? `${pad2(t.hours)}:${pad2(t.minutes)}:${pad2(t.seconds)}` : "--:--:--"}
        </p>
      </div>
    </div>
  );
}