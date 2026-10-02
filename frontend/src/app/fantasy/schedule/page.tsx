import FantasyScheduleList from "@/components/fantasy/FantasyScheduleList";
import ErrorState from "@/components/ui/ErrorState";
import { getDays, getTournament } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule · Fantasy · FFWS 2026" };

export default async function FantasySchedulePage() {
  try {
    const t = await getTournament("ffws-2026");
    const days = await getDays(t.id);
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <FantasyScheduleList schedule={days} />
      </div>
    );
  } catch (e) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={e instanceof Error ? e.message : undefined} />
      </div>
    );
  }
}