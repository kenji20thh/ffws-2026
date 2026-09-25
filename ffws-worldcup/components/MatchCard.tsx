import Link from "next/link"; import type { Match } from "@/data/types"; import { formatDate } from "@/lib/format";
export default function MatchCard({ match }: { match: Match }) {
  return (<Link href={`/matches/${match.id}`} className="block border border-line bg-panel p-4 hover:border-accent">
    <div className="flex justify-between text-xs text-muted"><span>{match.stage}</span><span>{match.status}</span></div>
    <p className="mt-2 font-display text-lg">{formatDate(match.date)}</p><p className="text-sm text-muted">{match.teams.length} teams</p></Link>);
}
