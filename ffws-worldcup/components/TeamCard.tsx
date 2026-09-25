import Link from "next/link"; import type { Team } from "@/data/types"; import Media from "./Placeholder"; import CountryFlag from "./CountryFlag";
export default function TeamCard({ team }: { team: Team }) {
  return (<Link href={`/teams/${team.slug}`} className="group flex items-center gap-4 border border-line bg-panel p-4 transition-colors hover:border-accent">
    <Media src={team.logo} alt={`${team.name} logo`} label={team.name} className="h-16 w-16 shrink-0 overflow-hidden" />
    <div className="min-w-0"><p className="truncate font-display text-lg">{team.name}</p>
      <p className="text-sm text-muted"><CountryFlag code={team.countryCode} /> {team.country} · {team.region}</p>
      <span className="text-xs font-semibold text-accent group-hover:underline">View team</span>{team.isPlaceholder && <span className="ml-2 text-[10px] text-muted">DEMO</span>}</div>
  </Link>);
}
