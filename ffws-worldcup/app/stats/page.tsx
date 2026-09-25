import { teams } from "@/data/teams"; import { players } from "@/data/players"; import PageHero from "@/components/PageHero"; import Leaderboard from "@/components/Leaderboard";
export default function Stats() {
  const sel = "border border-line bg-panel px-3 py-2 text-sm";
  return (<><PageHero title="STATS">The statistics center. Data appears once matches are played.</PageHero>
    <div className="mx-auto max-w-7xl space-y-8 px-4 pt-10">
      <div className="grid gap-3 sm:grid-cols-3">
        <select className={sel} aria-label="Stage"><option>All stages</option></select>
        <select className={sel} aria-label="Team"><option>All teams</option>{teams.map((t) => <option key={t.slug}>{t.name}</option>)}</select>
        <select className={sel} aria-label="Player"><option>All players</option>{players.map((p) => <option key={p.slug}>{p.nickname}</option>)}</select></div>
      <Leaderboard title="Player leaderboard" entity="Player" categories={["Kills", "Assists", "First Blood", "Average Placement", "Average Kills", "Total Points"]} />
      <Leaderboard title="Team leaderboard" entity="Team" categories={["Points", "Kills", "Average Placement", "Booyahs"]} /></div></>);
}
