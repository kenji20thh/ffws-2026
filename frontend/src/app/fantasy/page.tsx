
"use client";

import Link from "next/link";

export default function FantasyIndexPage() {
  return (
    <main className="relative flex min-h-[75vh] items-center justify-center overflow-hidden bg-[#0b0908] px-5 py-20 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff5a1f]/[0.07] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(#f1e9dc_1px,transparent_1px),linear-gradient(90deg,#f1e9dc_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="mb-8 inline-flex items-center gap-2 border border-[#ff5a1f]/40 bg-[#ff5a1f]/10 px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff5a1f]" />
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#ff5a1f]">
            Coming Soon
          </span>
        </div>

        <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-[#8a817a]">
          Free Fire World Series 2026
        </p>

        <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tight text-[#f1e9dc] sm:text-7xl">
          Fantasy
          <span className="mt-2 block text-[#ff5a1f]">
            League
          </span>
        </h1>

        <div className="mx-auto my-8 h-1 w-20 bg-[#ff5a1f]" />

        <p className="mx-auto max-w-lg text-base leading-7 text-[#8a817a] sm:text-lg">
          Build your dream squad, choose your champions, and compete
          against other fans. The ultimate fantasy experience is coming
          soon.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <div className="border border-[#2b2521] bg-[#141110] px-5 py-3 font-mono text-xs uppercase tracking-widest text-[#8a817a]">
            Squad Building
          </div>
          <div className="border border-[#2b2521] bg-[#141110] px-5 py-3 font-mono text-xs uppercase tracking-widest text-[#8a817a]">
            Leaderboards
          </div>
          <div className="border border-[#2b2521] bg-[#141110] px-5 py-3 font-mono text-xs uppercase tracking-widest text-[#8a817a]">
            Compete & Win
          </div>
        </div>

        <Link
          href="/"
          className="mt-12 inline-flex items-center gap-2 border border-[#ff5a1f] px-7 py-3 font-mono text-sm uppercase tracking-widest text-[#ff5a1f] transition-colors hover:bg-[#ff5a1f] hover:text-[#0b0908]"
        >
          <span aria-hidden="true">←</span>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
