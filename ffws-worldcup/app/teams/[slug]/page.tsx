import { notFound } from "next/navigation"; import { teams, getTeam } from "@/data/teams"; import { playersByTeam } from "@/data/players";
import Media from "@/components/Placeholder"; import CountryFlag from "@/components/CountryFlag"; import SectionHeader from "@/components/SectionHeader"; import PlayerCard from "@/components/PlayerCard"; import StatCard from "@/components/StatCard"; import EmptyState from "@/components/EmptyState";
export const generateStaticParams = () => teams.map((t) => ({ slug: t.slug }));
export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const team = getTeam((await params).slug); if (!team) notFound(); const s = team.stats;
  return (<><section className="border-b border-line bg-panel"><div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-12 sm:flex-row sm:items-center">
    <Media src={team.logo} alt={`${team.name} logo`} label={team.name} className="h-28 w-28 overflow-hidden sm:h-36 sm:w-36" />
    <div><h1 className="font-display text-4xl sm:text-6xl">{team.name}</h1><p className="mt-2 text-muted"><CountryFlag code={team.countryCode} /> {team.country} · {team.region}</p></div></div></section>
    <div className="mx-auto max-w-7xl space-y-14 px-4 pt-12">
      <section><SectionHeader title="Roster" /><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{playersByTeam(team.slug).map((p) => <PlayerCard key={p.slug} player={p} />)}</div></section>
      <section><SectionHeader title="Tournament" subtitle="Not started" /><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><StatCard label="Matches" value={s?.matches} /><StatCard label="Points" value={s?.points} /><StatCard label="Kills" value={s?.kills} /><StatCard label="Avg placement" value={s?.avgPlacement} /></div></section>
      <section><SectionHeader title="Recent results" /><EmptyState title="Results will appear once the tournament begins." /></section>
      <section><SectionHeader title="Team information" /><div className="border border-line bg-panel p-4 text-sm text-muted">Country: {team.country} · Region: {team.region}. More information will be added later.</div></section></div></>);
}
