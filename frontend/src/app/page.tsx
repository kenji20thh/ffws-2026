import { getTournament } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTournament("ffws-2026");

  return (
    <main className="map-grid flex min-h-screen flex-col items-start justify-center gap-4 px-8">
      <p className="font-stat text-xs uppercase tracking-[0.3em] text-ember">{t.status}</p>
      <h1 className="font-display text-[clamp(3.5rem,12vw,11rem)] font-black uppercase leading-[0.85]">
        {t.name}
      </h1>
      <p className="stencil font-display text-8xl font-black">{t.season}</p>
      <p className="font-stat text-sm text-ash">tournament id: {t.id}</p>
    </main>
  );
}