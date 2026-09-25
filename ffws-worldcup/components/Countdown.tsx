"use client";
import { useEffect, useState } from "react";
export default function Countdown({ target }: { target: string }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => { const t = new Date(target).getTime(); const tick = () => setMs(Math.max(0, t - Date.now())); tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, [target]);
  const v = ms ?? 0; const parts = [["Days", Math.floor(v / 864e5)], ["Hours", Math.floor(v / 36e5) % 24], ["Minutes", Math.floor(v / 6e4) % 60], ["Seconds", Math.floor(v / 1e3) % 60]] as const;
  return (<div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-label="Countdown to tournament start">
    {parts.map(([l, n]) => (<div key={l} className="border border-line bg-panel px-2 py-3 text-center sm:px-6 sm:py-4">
      <p className="font-display text-3xl tabular-nums sm:text-5xl">{ms === null ? "--" : String(n).padStart(2, "0")}</p><p className="text-[10px] uppercase tracking-wider text-muted sm:text-xs">{l}</p></div>))}
  </div>);
}
