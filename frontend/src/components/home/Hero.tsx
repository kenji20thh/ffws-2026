"use client";

import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { Tournament } from "@/types";
import Countdown from "./Countdown";
import SubscribeForm from "./SubscribeForm";

const rise = {
  hidden: { opacity: 0, y: 40 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Hero({ tournament }: { tournament: Tournament }) {
  return (
    <section className="map-grid relative overflow-hidden">
      {/* safe-zone rings */}
      <div className="pointer-events-none absolute -right-40 top-1/2 -translate-y-1/2" aria-hidden="true">
        <div className="animate-spin [animation-duration:120s]">
          <svg width="900" height="900" viewBox="0 0 900 900" fill="none">
            <circle cx="450" cy="450" r="440" stroke="rgba(255,90,31,0.25)" strokeDasharray="6 14" />
            <circle cx="450" cy="450" r="330" stroke="rgba(241,233,220,0.08)" />
            <circle cx="450" cy="450" r="220" stroke="rgba(255,90,31,0.18)" strokeDasharray="2 10" />
          </svg>
        </div>
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <motion.div custom={0} variants={rise} initial="hidden" animate="show" className="flex items-center gap-3">
            <Badge tone="ember">Coming soon</Badge>
            <span className="font-stat text-[11px] uppercase tracking-widest text-ash">
              {formatDate(tournament.start_date)} → {formatDate(tournament.end_date)}
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-5 font-display text-[clamp(3.5rem,11vw,10rem)] font-extrabold uppercase leading-[0.85] tracking-tight"
          >
            Free Fire
            <br />
            World Series
          </motion.h1>

          <motion.p
            custom={2}
            variants={rise}
            initial="hidden"
            animate="show"
            className="stencil font-display text-[clamp(4rem,12vw,9rem)] font-black leading-[0.9]"
          >
            {tournament.season}
          </motion.p>

          <motion.p
            custom={3}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-xl text-lg text-bone/70"
          >
            Teams, players, schedule and live standings. Every room, every kill, every booyah in one place.
          </motion.p>

          <motion.div custom={4} variants={rise} initial="hidden" animate="show" className="mt-8">
            <SubscribeForm />
          </motion.div>
        </div>

        <motion.div custom={3} variants={rise} initial="hidden" animate="show">
          <Countdown targetDate={tournament.start_date} />
        </motion.div>
      </div>
    </section>
  );
}