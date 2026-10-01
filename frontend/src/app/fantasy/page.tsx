import PageHeader from "@/components/layout/PageHeader";
import FantasyConsole from "@/components/fantasy/FantasyConsole";
import ErrorState from "@/components/ui/ErrorState";
import { getTournament } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fantasy · FFWS 2026" };

export default async function FantasyPage() {
  try {
    const t = await getTournament("ffws-2026");
    return (
      <>
        <PageHeader eyebrow="Draft 4, win big" title="Fantasy">
          Pick 4 players from 4 different teams, stay under $100, name your captain.
        </PageHeader>
        <FantasyConsole tournamentId={t.id} />
      </>
    );
  } catch (e) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={e instanceof Error ? e.message : undefined} />
      </div>
    );
  }
}