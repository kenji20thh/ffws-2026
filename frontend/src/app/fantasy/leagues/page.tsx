import PageHeader from "@/components/layout/PageHeader";
import FantasyLeagues from "@/components/fantasy/FantasyLeagues";
import ErrorState from "@/components/ui/ErrorState";
import { getDays, getTournament } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leagues · Fantasy · FFWS 2026" };

export default async function FantasyLeaguesPage() {
  try {
    const t = await getTournament("ffws-2026");
    const days = await getDays(t.id);
    return (
      <>
        <PageHeader eyebrow="Compete" title="Leagues">
          You&apos;re placed in a region league based on your country, and everyone is in Global. Start a private league to play your friends.
        </PageHeader>
        <div className="mx-auto max-w-4xl px-5 py-10">
          <FantasyLeagues tournamentId={t.id} days={days} />
        </div>
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
