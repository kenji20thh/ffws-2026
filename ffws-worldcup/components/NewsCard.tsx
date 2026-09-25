import type { NewsArticle } from "@/data/types"; import { formatDate } from "@/lib/format"; import Media from "./Placeholder";
export default function NewsCard({ article, featured = false }: { article: NewsArticle; featured?: boolean }) {
  return (<article className={`overflow-hidden border border-line bg-panel ${featured ? "md:grid md:grid-cols-2" : ""}`}>
    <Media src={article.image} alt="" label={article.category} className={featured ? "aspect-video md:aspect-auto md:min-h-64" : "aspect-video"} />
    <div className="space-y-2 p-4"><p className="text-xs text-muted"><span className="font-semibold text-accent">{article.category}</span> · {formatDate(article.date)}{article.isPlaceholder && " · PLACEHOLDER"}</p>
      <h3 className={`font-display ${featured ? "text-3xl" : "text-xl"}`}>{article.title}</h3><p className="text-sm text-muted">{article.excerpt}</p></div>
  </article>);
}
