import { news } from "@/data/news"; import PageHero from "@/components/PageHero"; import NewsCard from "@/components/NewsCard";
export default function News() {
  const [first, ...rest] = news;
  return (<><PageHero title="NEWS">Placeholder articles until real content is published.</PageHero><div className="mx-auto max-w-7xl space-y-6 px-4 pt-10"><NewsCard article={first} featured /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rest.map((n) => <NewsCard key={n.slug} article={n} />)}</div></div></>);
}
