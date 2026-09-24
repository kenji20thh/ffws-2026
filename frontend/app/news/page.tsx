import { NewsCard, PageHero, SectionHeader, Shell } from '@/components/site'
import { news } from '@/data/site'
export default function NewsPage() { return <Shell><PageHero eyebrow="FFWS World Cup / Newsroom" title="Stories from the global stage." description="Official updates, features, and tournament stories from the road to November 6, 2026."/><section className="content-section"><SectionHeader eyebrow="Latest stories" title="From the newsroom"/><div className="news-grid news-grid-wide">{news.map(article => <NewsCard key={article.slug} article={article}/>)}</div></section></Shell> }
