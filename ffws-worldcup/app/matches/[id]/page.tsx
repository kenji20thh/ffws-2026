import PageHero from "@/components/PageHero"; import SectionHeader from "@/components/SectionHeader"; import EmptyState from "@/components/EmptyState";
export default async function MatchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (<><PageHero eyebrow={`Match ${id}`} title="MATCH DETAIL" /><div className="mx-auto max-w-7xl space-y-8 px-4 pt-10">
    {["Match information", "Teams", "Placement", "Kills", "Player performances", "Room information"].map((s) => <section key={s}><SectionHeader title={s} /><EmptyState title="Match data will appear once the tournament begins." /></section>)}</div></>);
}
