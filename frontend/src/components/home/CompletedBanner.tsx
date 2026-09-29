import PodiumTop3 from "@/components/standings/PodiumTop3";
import type { TeamStanding, Tournament } from "@/types";

export default function CompletedBanner({ tournament, standings }: { tournament: Tournament; standings: TeamStanding[] }) {
  const champion = standings[0];
  return (
    <section className="map-grid border-b border-bone/10 px-5 py-16">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">{tournament.name} · Final</p>
        {champion && (
          <h1 className="mt-3 font-display text-[clamp(3rem,10vw,7rem)] font-black uppercase leading-[0.85]">
            {champion.team_name} <span className="stencil">wins</span>
          </h1>
        )}
        <div className="mx-auto mt-12 max-w-2xl">
          <PodiumTop3 top={standings.slice(0, 3)} />
        </div>
      </div>
    </section>
  );
}