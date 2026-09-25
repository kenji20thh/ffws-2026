import Link from "next/link"; import type { Player } from "@/data/types"; import { getTeam } from "@/data/teams"; import Media from "./Placeholder"; import CountryFlag from "./CountryFlag";
export default function PlayerCard({ player }: { player: Player }) {
  const team = getTeam(player.teamSlug);
  return (<Link href={`/players/${player.slug}`} className="group overflow-hidden border border-line bg-panel transition-colors hover:border-accent">
    <Media src={player.photo} alt={`${player.nickname} photo`} label={player.nickname} className="aspect-[4/5] w-full" />
    <div className="border-t-2 border-accent p-3"><p className="truncate font-display text-xl">{player.nickname}</p>
      <p className="truncate text-sm text-muted">{team?.name}</p>
      <p className="mt-1 text-sm"><CountryFlag code={player.countryCode} /> {player.country}</p>
      <span className="mt-2 inline-block text-xs font-semibold text-accent group-hover:underline">View profile</span></div>
  </Link>);
}
