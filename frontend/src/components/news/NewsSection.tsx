import Link from "next/link";
import NewsCard from "./NewsCard";
import { latestNews } from "@/data/news";

export default function NewsSection() {
return ( <section className="relative overflow-hidden bg-[#111111] px-5 py-20 text-bone md:px-8 md:py-28 lg:px-12">
{/* Background grid */} <div className="pointer-events-none absolute inset-0 map-grid opacity-30" />

  {/* Ambient glow */}
  <div
    className="pointer-events-none absolute -left-64 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[#ff5a1f]/[0.025] blur-3xl"
    aria-hidden="true"
  />

  <div className="relative mx-auto max-w-[1600px]">
    {/* Header */}
    <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-8 bg-[#ff5a1f]" />

          <span className="font-stat text-[9px] font-bold uppercase tracking-[0.3em] text-[#ff5a1f]">
            Latest Updates
          </span>
        </div>

        <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-black uppercase leading-[0.85] tracking-[-0.04em]">
          Latest
          <br />
          News
        </h2>
      </div>

      <Link
        href="/news"
        className="inline-flex h-11 w-fit items-center justify-center border border-bone/15 px-6 font-stat text-[10px] font-bold uppercase tracking-[0.2em] text-bone transition-colors hover:border-[#ff5a1f] hover:text-[#ff5a1f]"
      >
        View All News
        <span className="ml-3">→</span>
      </Link>
    </div>

    {/* News grid */}
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
      {latestNews.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  </div>
</section>

);
}
