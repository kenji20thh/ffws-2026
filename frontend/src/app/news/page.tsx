import Hero from "@/components/home/Hero";
import NewsSection from "@/components/news/NewsSection";
import ErrorState from "@/components/ui/ErrorState";
import { getTournament } from "@/lib/api";

export default async function HomePage() {
const result = await getTournament("ffws-2026");

if (!result) {
return <ErrorState message="Unable to load tournament information." />;
}

return (
<> <Hero tournament={result} /> <NewsSection />
</>
);
}
