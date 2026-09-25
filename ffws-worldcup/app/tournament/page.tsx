import { tournament as t } from "@/data/tournament"; import { teams } from "@/data/teams"; import { formatDate } from "@/lib/format";
import PageHero from "@/components/PageHero"; import StatusBadge from "@/components/StatusBadge"; import SectionHeader from "@/components/SectionHeader"; import StatCard from "@/components/StatCard"; import TeamCard from "@/components/TeamCard"; import EmptyState from "@/components/EmptyState";
export default function Tournament() {
  return (<><PageHero eyebrow={formatDate(t.startDate)} title="FFWS WORLD CUP"><StatusBadge status={t.status} /></PageHero>
    <div className="mx-auto max-w-7xl space-y-14 px-4 pt-12">
      <section><SectionHeader title="Tournament overview" /><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><StatCard label="Teams" value={teams.length} /><StatCard label="Start" value="Nov 6, 2026" /><StatCard label="Location" value={t.location ?? "TBA"} /><StatCard label="Status" value={t.status} /></div></section>
      <section><SectionHeader title="Format" /><ul className="space-y-2 text-muted">{t.format.map((f) => <li key={f} className="border border-line bg-panel p-4">{f}</li>)}</ul></section>
      <section><SectionHeader title="Schedule" />{t.schedule.map((s) => <div key={s.label} className="flex justify-between border border-line bg-panel p-4"><span>{s.label}</span><span className="text-muted">{s.date ? formatDate(s.date) : "TBA"}</span></div>)}</section>
      <section><SectionHeader title="Participating teams" href="/teams" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{teams.map((x) => <TeamCard key={x.slug} team={x} />)}</div></section>
      <section><SectionHeader title="Tournament stages" /><div className="grid gap-3 md:grid-cols-3">{t.stages.map((s) => <div key={s.name} className="border border-line bg-panel p-4"><p className="font-display text-xl">{s.name}</p><p className="text-sm text-muted">{s.description}</p></div>)}</div>
        <div className="mt-4"><EmptyState title="Results will appear here once the tournament begins." /></div></section></div></>);
}
