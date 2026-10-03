import Image from "next/image";
import type { NewsArticle } from "@/data/news";

type NewsCardProps = {
article: NewsArticle;
};

export default function NewsCard({ article }: NewsCardProps) {
const formattedDate = new Date(article.date).toLocaleDateString("en-US", {
month: "short",
day: "numeric",
year: "numeric",
});

return (
<a
href={article.url || "#"}
target={article.url ? "_blank" : undefined}
rel={article.url ? "noopener noreferrer" : undefined}
className="group block overflow-hidden border border-bone/[0.08] bg-[#0d0d0d] transition-colors duration-300 hover:border-[#ff5a1f]/40"
>
{/* Image */} <div className="relative aspect-[16/9] overflow-hidden"> <Image
       src={article.image}
       alt={article.title}
       fill
       className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
     />

    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d]/80 via-transparent to-transparent" />

    {/* Category */}
    <div className="absolute left-4 top-4">
      <span className="border border-[#ff5a1f] bg-[#111111]/80 px-2.5 py-1 font-stat text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff5a1f] backdrop-blur-sm">
        {article.category}
      </span>
    </div>
  </div>

  {/* Content */}
  <div className="p-5 md:p-6">
    <div className="mb-3 flex items-center gap-2">
      <span className="h-px w-5 bg-[#ff5a1f]" />

      <span className="font-stat text-[9px] uppercase tracking-[0.18em] text-ash">
        {formattedDate}
      </span>
    </div>

    <h3 className="font-display text-xl font-black uppercase leading-[0.95] tracking-[-0.02em] text-bone transition-colors duration-300 group-hover:text-[#ff5a1f] md:text-2xl">
      {article.title}
    </h3>

    <p className="mt-3 line-clamp-2 font-stat text-xs leading-relaxed text-ash">
      {article.excerpt}
    </p>

    <div className="mt-5 flex items-center gap-2 font-stat text-[9px] font-bold uppercase tracking-[0.2em] text-bone/60 transition-colors group-hover:text-[#ff5a1f]">
      Read Story

      <span className="transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </div>
  </div>
</a>

);
}
