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

        {/* Venue + Countdown */}
        <motion.div
          custom={1}
          variants={rise}
          initial="hidden"
          animate="show"
          className="relative my-8 flex flex-1 overflow-hidden border border-bone/[0.08] bg-[#0d0d0d] md:my-10"
        >
          {/* Venue background */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/home/venue.jpg')",
            }}
          />

          {/* Image overlays */}
          <div className="absolute inset-0 bg-[#111111]/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/50 via-transparent to-[#111111]/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/40 via-transparent to-[#111111]/40" />

          {/* Orange glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff5a1f]/10 blur-3xl"
            aria-hidden="true"
          />

          {/* Countdown */}
          <div className="relative z-10 flex min-h-[500px] w-full items-center justify-center px-5 py-16 md:min-h-[600px] lg:min-h-[650px]">
            <div className="flex flex-col items-center text-center">
              <motion.p
                custom={2}
                variants={rise}
                initial="hidden"
                animate="show"
                className="mb-6 font-stat text-[10px] font-bold uppercase tracking-[0.4em] text-[#ff5a1f]"
              >
                FFWS {tournament.season}
              </motion.p>

              <motion.div
                custom={3}
                variants={rise}
                initial="hidden"
                animate="show"
              >
                <Countdown targetDate={tournament.start_date} />
              </motion.div>
            </div>
          </div>

          {/* Bottom left label */}
          <div className="absolute bottom-5 left-5 z-10 flex items-center gap-3">
            <span className="h-px w-8 bg-[#ff5a1f]" />

            <span className="font-stat text-[9px] font-bold uppercase tracking-[0.25em] text-bone/60">
              The World Stage
            </span>
          </div>

          {/* Bottom right location */}
          <div className="absolute bottom-5 right-5 z-10 font-stat text-[9px] uppercase tracking-[0.2em] text-bone/50">
            Bangkok · Thailand
          </div>
        </motion.div>

        {/* Event information */}
        <motion.div
          custom={4}
          variants={rise}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-7 pb-6 lg:flex-row lg:items-end lg:justify-between"
        >
          {/* Title */}
          <div>
            <p className="mb-2 font-stat text-[10px] font-bold uppercase tracking-[0.3em] text-[#ff5a1f]">
              FFWS {tournament.season}
            </p>

            <h1 className="font-display text-[clamp(2.8rem,6vw,6rem)] font-black uppercase leading-[0.82] tracking-[-0.05em]">
              World
              <br />
              Championship
            </h1>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
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

            {/* Navigation */}
            <div className="flex flex-wrap gap-3">
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
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}