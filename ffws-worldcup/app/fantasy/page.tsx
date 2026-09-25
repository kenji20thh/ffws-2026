import PageHero from "@/components/PageHero"; import StatusBadge from "@/components/StatusBadge"; import SectionHeader from "@/components/SectionHeader"; import EmptyState from "@/components/EmptyState";
const blocks = [["How Fantasy works", "Pick your roster, follow the tournament and earn points from real match performance."], ["Player selection", "Roster selection opens here."], ["Budget", "Budget rules will be shown here."], ["Scoring", "The scoring system will be published here."]];
export default function Fantasy() {
  return (<><PageHero eyebrow="FFWS WORLD CUP FANTASY" title="BUILD YOUR TEAM. COMPETE WITH FANS."><StatusBadge status="COMING SOON" /></PageHero>
    <div className="mx-auto max-w-7xl space-y-12 px-4 pt-12"><div className="grid gap-4 md:grid-cols-2">{blocks.map(([t, d]) => <section key={t} className="border border-line bg-panel p-5"><h2 className="font-display text-2xl">{t}</h2><p className="mt-1 text-sm text-muted">{d}</p></section>)}</div>
      <section><SectionHeader title="Leaderboard" /><EmptyState title="Fantasy is coming soon." /></section></div></>);
}
