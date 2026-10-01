import FantasyScheduleList from "@/components/fantasy/FantasyScheduleList";
import ErrorState from "@/components/ui/ErrorState";
import { getFantasySchedule, getTournament } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule · Fantasy · FFWS 2026" };

export default async function FantasySchedulePage() {
  try {
    const t = await getTournament("ffws-2026");
    const schedule = await getFantasySchedule(t.id);
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <FantasyScheduleList schedule={schedule} />
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