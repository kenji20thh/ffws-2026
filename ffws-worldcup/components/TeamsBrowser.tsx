"use client";
import { useMemo, useState } from "react"; import type { Team } from "@/data/types"; import TeamCard from "./TeamCard"; import EmptyState from "./EmptyState";
export default function TeamsBrowser({ teams }: { teams: Team[] }) {
  const [q, setQ] = useState(""); const [region, setRegion] = useState("All"); const [country, setCountry] = useState("All");
  const regions = useMemo(() => ["All", ...new Set(teams.map((t) => t.region))], [teams]); const countries = useMemo(() => ["All", ...new Set(teams.map((t) => t.country))], [teams]);
  const list = teams.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()) && (region === "All" || t.region === region) && (country === "All" || t.country === country));
  const sel = "border border-line bg-panel px-3 py-2 text-sm";
  return (<div><div className="mb-6 grid gap-3 sm:grid-cols-3">
    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search teams" aria-label="Search teams" className={sel} />
    <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region" className={sel}>{regions.map((r) => <option key={r} value={r}>{r === "All" ? "All regions" : r}</option>)}</select>
    <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country" className={sel}>{countries.map((c) => <option key={c} value={c}>{c === "All" ? "All countries" : c}</option>)}</select></div>
    {list.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((t) => <TeamCard key={t.slug} team={t} />)}</div> : <EmptyState title="No teams match your filters" text="Clear the search or choose a different region." />}</div>);
}
