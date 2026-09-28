"use client";

import { useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import type { Team } from "@/types";
import TeamCard from "./TeamCard";

export default function TeamGrid({ teams }: { teams: Team[] }) {
  const [region, setRegion] = useState("All");

  const regions = useMemo(
    () => ["All", ...Array.from(new Set(teams.map((t) => t.region).filter(Boolean)))],
    [teams]
  );

  const visible = region === "All" ? teams : teams.filter((t) => t.region === region);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter by region">
        {regions.map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={region === r}
            onClick={() => setRegion(r)}
            className={`chamfer-sm px-4 py-1.5 font-display text-base font-bold uppercase tracking-wider transition-colors ${
              region === r ? "bg-ember text-char" : "border border-bone/20 text-bone/70 hover:text-ember"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No teams yet" hint="Teams will appear here once they're announced." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((t) => (
            <TeamCard key={t.id} team={t} />
          ))}
        </div>
      )}
    </div>
  );
}