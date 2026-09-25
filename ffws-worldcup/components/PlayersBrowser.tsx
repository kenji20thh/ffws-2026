"use client";
import { useMemo, useState } from "react"; import type { Player, Team } from "@/data/types"; import PlayerCard from "./PlayerCard"; import EmptyState from "./EmptyState";
export default function PlayersBrowser({ players, teams }: { players: Player[]; teams: Team[] }) {
  const [q, setQ] = useState(""); const [team, setTeam] = useState("All"); const [country, setCountry] = useState("All"); const [region, setRegion] = useState("All"); const [sort, setSort] = useState("name");
  const countries = useMemo(() => [...new Set(players.map((p) => p.country))], [players]); const regions = useMemo(() => [...new Set(teams.map((t) => t.region))], [teams]);
  const regionOf = (p: Player) => teams.find((t) => t.slug === p.teamSlug)?.region;
  const list = players.filter((p) => p.nickname.toLowerCase().includes(q.toLowerCase()) && (team === "All" || p.teamSlug === team) && (country === "All" || p.country === country) && (region === "All" || regionOf(p) === region)).sort((a, b) => sort === "team" ? a.teamSlug.localeCompare(b.teamSlug) : a.nickname.localeCompare(b.nickname));
  const sel = "border border-line bg-panel px-3 py-2 text-sm";
  return (<div><div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players" aria-label="Search players" className={sel} />
    <select value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Team" className={sel}><option value="All">All teams</option>{teams.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select>
    <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country" className={sel}><option value="All">All countries</option>{countries.map((c) => <option key={c}>{c}</option>)}</select>
    <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region" className={sel}><option value="All">All regions</option>{regions.map((c) => <option key={c}>{c}</option>)}</select>
    <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className={sel}><option value="name">Sort: nickname</option><option value="team">Sort: team</option></select></div>
    {list.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{list.map((p) => <PlayerCard key={p.slug} player={p} />)}</div> : <EmptyState title="No players match your filters" />}</div>);
}
