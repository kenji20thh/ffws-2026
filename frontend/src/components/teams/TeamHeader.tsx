import Monogram from "@/components/ui/Monogram";
import type { Team } from "@/types";

export default function TeamHeader({ team }: { team: Team }) {
  return (
    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
      <Monogram label={team.tag || team.name} imageUrl={team.logo_url} size={140} />
      <div>
        <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">
          {[team.country, team.region].filter(Boolean).join(" · ")}
        </p>
        <h1 className="font-display text-[clamp(3rem,8vw,7rem)] font-extrabold uppercase leading-[0.85]">
          {team.name}
        </h1>
        {team.tag && (
          <p className="stencil font-display text-5xl font-black leading-none">{team.tag}</p>
        )}
      </div>
    </div>
  );
}