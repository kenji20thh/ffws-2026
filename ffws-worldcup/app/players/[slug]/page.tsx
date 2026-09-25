import { notFound } from "next/navigation"; import Link from "next/link"; import { players, getPlayer } from "@/data/players"; import { getTeam } from "@/data/teams";
import Media from "@/components/Placeholder"; import CountryFlag from "@/components/CountryFlag"; import SectionHeader from "@/components/SectionHeader"; import StatCard from "@/components/StatCard"; import EmptyState from "@/components/EmptyState";
export const generateStaticParams = () => players.map((p) => ({ slug: p.slug }));
export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPlayer((await params).slug); if (!p) notFound(); const team = getTeam(p.teamSlug); const s = p.stats;
  return (<><section className="border-b border-line bg-panel"><div className="mx-auto grid max-w-7xl items-end gap-6 px-4 pt-10 md:grid-cols-[320px_1fr]">
    <Media src={p.photo} alt={`${p.nickname} photo`} label={p.nickname} className="aspect-[4/5] w-full max-w-xs" />
    <div className="pb-10"><h1 className="font-display text-5xl sm:text-7xl">{p.nickname}</h1>
      <p className="mt-3 text-lg"><Link href={`/teams/${p.teamSlug}`} className="text-accent hover:underline">{team?.name}</Link></p><p className="text-muted"><CountryFlag code={p.countryCode} /> {p.country}</p></div></div></section>
    <div className="mx-auto max-w-7xl space-y-14 px-4 pt-12">
      <section><SectionHeader title="Tournament stats" subtitle="Statistics will appear once the tournament begins." /><div className="grid grid-cols-2 gap-3 md:grid-cols-5"><StatCard label="Matches" value={s?.matches} /><StatCard label="Kills" value={s?.kills} /><StatCard label="Assists" value={s?.assists} /><StatCard label="First blood" value={s?.firstBlood} /><StatCard label="Avg placement" value={s?.avgPlacement} /></div></section>
      <section><SectionHeader title="Match history" /><EmptyState title="No matches yet." /></section>
      <section><SectionHeader title="Player information" /><dl className="grid gap-px border border-line bg-line sm:grid-cols-3">{[["Team", team?.name], ["Country", p.country], ["Role", p.role]].map(([k, v]) => <div key={k} className="bg-panel p-4"><dt className="text-xs text-muted">{k}</dt><dd>{v ?? "—"}</dd></div>)}</dl></section></div></>);
}
