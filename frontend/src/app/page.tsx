import Hero from "@/components/home/Hero";
import NewsSection from "@/components/news/NewsSection";
import ErrorState from "@/components/ui/ErrorState";
import { getTournament } from "@/lib/api";
import type { Tournament } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
let tournament: Tournament;

try {
tournament = await getTournament("ffws-2026");
} catch (err) {
return ( <div className="mx-auto max-w-3xl px-5 py-24">
<ErrorState message={err instanceof Error ? err.message : undefined} /> </div>
);
}

// Ongoing/completed will get a live hub later; for now the hero shows in every state.
return (
<> <Hero tournament={tournament} /> <NewsSection />
</>
);
}
