import NewsCard from "@/components/news/NewsCard";
import { NEWS } from "@/data/news";

export default function NewsPage() {
return ( <main className="min-h-screen bg-[#111111] text-bone">
{/* Header */} <section className="relative overflow-hidden border-b border-bone/[0.08] px-5 pb-16 pt-24 md:px-8 md:pb-20 md:pt-32 lg:px-12"> <div className="pointer-events-none absolute inset-0 map-grid opacity-40" />

    <div
      className="pointer-events-none absolute -right-48 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-[#ff5a1f]/[0.035] blur-3xl"
      aria-hidden="true"
    />

    <div className="relative mx-auto max-w-[1600px]">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-[#ff5a1f]" />

        <span className="font-stat text-[9px] font-bold uppercase tracking-[0.3em] text-[#ff5a1f]">
          FFWS {new Date().getFullYear()}
        </span>
      </div>

      <h1 className="font-display text-[clamp(3.5rem,8vw,8rem)] font-black uppercase leading-[0.8] tracking-[-0.05em]">
        News
      </h1>

      <p className="mt-7 max-w-xl font-stat text-sm leading-relaxed text-ash">
        The latest news, stories and updates from the Free Fire World
        Series.
      </p>
    </div>
  </section>

  {/* News */}
  <section className="relative px-5 py-16 md:px-8 md:py-20 lg:px-12">
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-8 flex items-center justify-between border-b border-bone/[0.08] pb-5">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 bg-[#ff5a1f]" />

          <span className="font-stat text-[10px] font-bold uppercase tracking-[0.25em] text-bone">
            All Stories
          </span>
        </div>

        <span className="font-stat text-[9px] uppercase tracking-[0.2em] text-ash">
          {NEWS.length} Articles
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {NEWS.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  </section>
</main>

);
}
