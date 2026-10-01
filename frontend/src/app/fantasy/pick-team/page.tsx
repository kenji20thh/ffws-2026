import FantasyConsole from "@/components/fantasy/FantasyConsole";
import ErrorState from "@/components/ui/ErrorState";
import { getTournament } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pick Team · Fantasy · FFWS 2026" };

export default async function PickTeamPage() {
  try {
    const t = await getTournament("ffws-2026");
    return <FantasyConsole tournamentId={t.id} />;
  } catch (e) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={e instanceof Error ? e.message : undefined} />
      </div>
    );
  }
}