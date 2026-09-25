import { matches } from "@/data/matches"; import PageHero from "@/components/PageHero"; import SectionHeader from "@/components/SectionHeader"; import MatchCard from "@/components/MatchCard"; import EmptyState from "@/components/EmptyState";
export default function Matches() {
  return (<><PageHero title="MATCHES">Schedule and results.</PageHero><div className="mx-auto max-w-7xl px-4 pt-10"><SectionHeader title="Upcoming matches" />
    {matches.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{matches.map((m) => <MatchCard key={m.id} match={m} />)}</div> : <EmptyState title="Match schedule will appear here." text="Match results will appear here during the World Cup." />}</div></>);
}
