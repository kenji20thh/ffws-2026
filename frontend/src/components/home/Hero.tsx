"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { Tournament } from "@/types";
import Countdown from "./Countdown";

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function Hero({ tournament }: { tournament: Tournament }) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#111111] text-bone">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 map-grid opacity-70" />

      {/* Ambient orange glow */}
      <div
        className="pointer-events-none absolute -right-40 top-1/2 h-[700px] w-[700px] -translate-y-1/2 rounded-full bg-[#ff5a1f]/[0.035] blur-3xl"
        aria-hidden="true"
      />

      {/* Safe-zone rings */}
      <div
        className="pointer-events-none absolute -right-[320px] top-1/2 -translate-y-1/2 opacity-70"
        aria-hidden="true"
      >
        <div className="animate-spin [animation-duration:120s]">
          <svg
            width="900"
            height="900"
            viewBox="0 0 900 900"
            fill="none"
          >
            <circle
              cx="450"
              cy="450"
              r="440"
              stroke="rgba(255,90,31,0.20)"
              strokeDasharray="6 14"
            />
            <circle
              cx="450"
              cy="450"
              r="330"
              stroke="rgba(241,233,220,0.07)"
            />
            <circle
              cx="450"
              cy="450"
              r="220"
              stroke="rgba(255,90,31,0.14)"
              strokeDasharray="2 10"
            />
          </svg>
        </div>
      </div>

      {/* Main content */}
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col px-5 py-8 md:px-8 lg:px-12">
        {/* Top event information */}
        <motion.div
          custom={0}
          variants={rise}
          initial="hidden"
          animate="show"
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          <span className="border border-[#ff5a1f] px-2.5 py-1 font-stat text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff5a1f]">
            Coming Soon
          </span>

          <span className="font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
            {formatDate(tournament.start_date)}
            <span className="mx-2 text-bone/20">—</span>
            {formatDate(tournament.end_date)}
          </span>
        </motion.div>

        {/* Hero grid */}
        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12 lg:py-12">
          {/* Left side */}
          <div className="relative z-10">
            <motion.div
              custom={1}
              variants={rise}
              initial="hidden"
              animate="show"
            >
              <p className="mb-3 font-stat text-[11px] font-bold uppercase tracking-[0.35em] text-[#ff5a1f]">
                FFWS {tournament.season}
              </p>

              <h1 className="max-w-[720px] font-display text-[clamp(4rem,8vw,8.5rem)] font-black uppercase leading-[0.82] tracking-[-0.055em]">
                World
                <br />
                Championship
              </h1>
            </motion.div>

            <motion.div
              custom={2}
              variants={rise}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-6"
            >
              {/* Location */}
              <div>
                <p className="mb-2 font-stat text-[9px] font-bold uppercase tracking-[0.25em] text-ash">
                  Location
                </p>

                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center border border-bone/10 text-[#ff5a1f]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 21C16 16.8 19 13.5 19 9.5C19 5.91 15.87 3 12 3C8.13 3 5 5.91 5 9.5C5 13.5 8 16.8 12 21Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="12"
                        cy="9.5"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </span>

                  <div>
                    <p className="font-display text-xl font-black uppercase leading-none">
                      Bangkok
                    </p>
                    <p className="mt-1 font-stat text-[9px] uppercase tracking-[0.2em] text-ash">
                      Thailand
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <p className="mb-2 font-stat text-[9px] font-bold uppercase tracking-[0.25em] text-ash">
                  Championship
                </p>

                <p className="font-display text-xl font-black uppercase leading-none">
                  {formatDate(tournament.start_date)}
                  <span className="mx-2 text-[#ff5a1f]">—</span>
                  {formatDate(tournament.end_date)}
                </p>

                <p className="mt-1 font-stat text-[9px] uppercase tracking-[0.2em] text-ash">
                  FFWS {tournament.season}
                </p>
              </div>
            </motion.div>

            <motion.div
              custom={3}
              variants={rise}
              initial="hidden"
              animate="show"
              className="mt-9 flex flex-wrap gap-3"
            >
              <Link
                href="/teams"
                className="inline-flex h-11 items-center justify-center border border-[#ff5a1f] bg-[#ff5a1f] px-6 font-stat text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111] transition-colors hover:bg-transparent hover:text-[#ff5a1f]"
              >
                Meet the Teams
              </Link>

              <Link
                href="/schedule"
                className="inline-flex h-11 items-center justify-center border border-bone/15 px-6 font-stat text-[10px] font-bold uppercase tracking-[0.2em] text-bone transition-colors hover:border-bone/40"
              >
                Schedule
              </Link>
            </motion.div>
          </div>

          {/* Right side */}
          <motion.div
            custom={3}
            variants={rise}
            initial="hidden"
            animate="show"
            className="relative z-10 flex flex-col items-center justify-center"
          >
            <Countdown targetDate={tournament.start_date} />
          </motion.div>
        </div>

        {/* Championship artwork */}
        <motion.div
          custom={4}
          variants={rise}
          initial="hidden"
          animate="show"
          className="relative min-h-[220px] overflow-hidden border border-bone/[0.08] bg-[#0d0d0d] md:min-h-[280px] lg:min-h-[320px]"
        >
          {/* Replace this background with your final player + trophy artwork */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/home/hero-art.png')",
            }}
          />

          {/* Dark overlays keep the artwork integrated with the site */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-transparent to-[#111111]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />

          {/* Temporary placeholder until artwork is added */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border border-dashed border-bone/10 px-6 py-4 text-center">
              <p className="font-stat text-[9px] font-bold uppercase tracking-[0.25em] text-bone/25">
                Championship Artwork
              </p>
              <p className="mt-1 font-stat text-[8px] uppercase tracking-[0.18em] text-bone/15">
                Players · Trophy · FFWS 2026
              </p>
            </div>
          </div>

          {/* Artwork label */}
          <div className="absolute bottom-5 left-5 flex items-center gap-3">
            <span className="h-px w-8 bg-[#ff5a1f]" />
            <span className="font-stat text-[9px] font-bold uppercase tracking-[0.25em] text-bone/50">
              The World Stage
            </span>
          </div>

          <div className="absolute bottom-5 right-5 font-stat text-[9px] uppercase tracking-[0.2em] text-bone/25">
            Bangkok · Thailand
          </div>
        </motion.div>
      </div>
    </section>
  );
}