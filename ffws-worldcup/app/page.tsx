import Link from "next/link"; import { tournament as t } from "@/data/tournament"; import { teams } from "@/data/teams"; import { players } from "@/data/players"; import { news } from "@/data/news"; import { formatDate } from "@/lib/format";
import Countdown from "@/components/Countdown"; import StatCard from "@/components/StatCard"; import SectionHeader from "@/components/SectionHeader"; import TeamCard from "@/components/TeamCard"; import PlayerCard from "@/components/PlayerCard"; import NewsCard from "@/components/NewsCard"; import StatusBadge from "@/components/StatusBadge";
export default function Home() {
  return (<>
    <section className="border-b border-line"><div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
      <StatusBadge status={t.status} />
      <h1 className="mt-4 font-display text-6xl leading-[0.95] sm:text-8xl">FFWS <span className="text-accent">WORLD CUP</span></h1>
      <p className="mt-3 font-display text-xl tracking-wide sm:text-3xl">WORLD&apos;S BEST FREE FIRE TEAMS</p><p className="mt-1 text-muted">{formatDate(t.startDate)}</p>
      <div className="mt-8 max-w-2xl"><Countdown target={t.startDate} /></div>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/tournament" className="bg-accent px-5 py-3 text-sm font-bold text-black hover:bg-accent2">Explore Tournament</Link><Link href="/teams" className="border border-line px-5 py-3 text-sm font-bold hover:border-accent">Explore Teams</Link></div></div></section>
    <div className="mx-auto max-w-7xl space-y-16 px-4 pt-12">
      <section><SectionHeader title="Tournament overview" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Teams" value={teams.length} /><StatCard label="Players" value={players.length} /><StatCard label="Start date" value="Nov 6" /><StatCard label="Location" value={t.location ?? "TBA"} /><StatCard label="Status" value={t.status} /></div>
        <p className="mt-2 text-xs text-muted">Team and player counts reflect demo data until the official lists are supplied.</p></section>
      <section><SectionHeader title="Participating teams" href="/teams" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{teams.map((x) => <TeamCard key={x.slug} team={x} />)}</div></section>
      <section><SectionHeader title="Featured players" href="/players" /><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{players.slice(0, 4).map((p) => <PlayerCard key={p.slug} player={p} />)}</div></section>
      <section><SectionHeader title="Tournament format" href="/tournament" hrefLabel="Full details" /><div className="grid gap-3 md:grid-cols-3">{t.stages.map((s) => <div key={s.name} className="border border-line bg-panel p-4"><p className="font-display text-xl">{s.name}</p><p className="text-sm text-muted">{s.description}</p></div>)}</div></section>
      <section className="border border-line bg-panel p-8"><StatusBadge status="COMING SOON" /><h2 className="mt-3 font-display text-3xl sm:text-4xl">BUILD YOUR ROSTER. COMPETE WITH FANS.</h2><Link href="/fantasy" className="mt-4 inline-block text-sm font-bold text-accent hover:underline">About Fantasy</Link></section>
      <section><SectionHeader title="Latest news" subtitle="Placeholder content" href="/news" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{news.slice(0, 3).map((n) => <NewsCard key={n.slug} article={n} />)}</div></section>
    </div></>);
}
