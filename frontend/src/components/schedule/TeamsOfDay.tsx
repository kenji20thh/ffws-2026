import Monogram from "@/components/ui/Monogram";
import type { DayTeam } from "@/types";

export default function TeamsOfDay({ teams }: { teams: DayTeam[] }) {
  if (teams.length === 0) {
    return <p className="font-stat text-xs uppercase tracking-widest text-ash">Teams not assigned yet</p>;
  }
  return (
    <ul className="flex flex-wrap gap-3">
      {teams.map((dt) => (
        <li key={dt.id} className="flex items-center gap-2 border border-bone/10 bg-char-2 py-1.5 pl-2 pr-4">
          <Monogram label={dt.team.tag || dt.team.name} imageUrl={dt.team.logo_url} size={32} />
          <span className="font-display text-lg font-bold uppercase">{dt.team.name}</span>
        </li>
      ))}
    </ul>
  );
}