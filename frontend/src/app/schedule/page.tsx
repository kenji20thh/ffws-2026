import PageHeader from "@/components/layout/PageHeader";
import ScheduleView from "@/components/schedule/ScheduleView";
import ErrorState from "@/components/ui/ErrorState";
import { getDays, getTournament } from "@/lib/api";
import type { TournamentDay } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule · FFWS 2026" };

export default async function SchedulePage() {
  let days: TournamentDay[] = [];
  let error: string | null = null;
  try {
    const t = await getTournament("ffws-2026");
    days = await getDays(t.id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load schedule";
  }

  return (
    <>
      <PageHeader eyebrow="Match days" title="Schedule">
        Pick a day, then a room. Times are shown in your local timezone.
      </PageHeader>
      <div className="mx-auto max-w-7xl px-5 py-10">
        {error ? <ErrorState message={error} /> : <ScheduleView days={days} />}
      </div>
    </>
  );
}