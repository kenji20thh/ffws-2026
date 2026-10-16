import PageHeader from "@/components/layout/PageHeader";
import StandingsExperience from "@/components/standings/StandingsExperience";

export const dynamic = "force-dynamic";
export const metadata = { title: "Placements · FFWS 2026" };

export default function StandingsPage() {
  return (
    <>
      <PageHeader eyebrow="Tournament" title="Placements">
        FFWS 2026 Global Finals
      </PageHeader>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <StandingsExperience />
      </div>
    </>
  );
}