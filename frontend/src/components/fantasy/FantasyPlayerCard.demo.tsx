"use client";

// TEMPORARY visual playground for <FantasyPlayerCard>. Delete this file together with
// src/app/dev/fantasy-card/ once the card has been integrated.
//
// Everything below is MOCK DATA for looking at the layout. None of it is real, and none
// of it lives inside the card component itself.

import { useState } from "react";
import { tierFromPrice } from "@/lib/cardTier";
import FantasyPlayerCard, {
  type FantasyCardPlayer,
  type FantasyCardStats,
  type FantasyCardTeam,
} from "./FantasyPlayerCard";

interface MockEntry {
  id: number;
  player: FantasyCardPlayer;
  team: FantasyCardTeam;
  overall?: number;
  stats?: FantasyCardStats;
  price: number;
}

const BASE_ENTRIES: MockEntry[] = [
  {
    id: 1,
    player: { ign: "MockRush", role: "rusher", country: "Brazil" },
    team: { name: "Mock Team Alpha", tag: "MTA" },
    overall: 90,
    stats: { kills: 128, placements: 54, avgPlacement: 4.2, avgKills: 3.1 },
    price: 32,
  },
  {
    id: 2,
    player: { ign: "MockBomber", role: "bomber", country: "Indonesia" },
    team: { name: "Mock Team Beta", tag: "MTB" },
    overall: 84,
    stats: { kills: 96, placements: 41, avgPlacement: 5.8, avgKills: 2.4 },
    price: 26,
  },
  {
    id: 3,
    player: { ign: "AVeryLongMockName", role: "support", country: "Thailand" },
    team: { name: "Mock Team With A Long Name", tag: "MTL" },
    overall: 77,
    stats: { kills: 61, placements: 33, avgPlacement: 7.0, avgKills: 1.6 },
    price: 18,
  },
  {
    // nothing known yet: every missing value renders as a dash
    id: 4,
    player: { ign: "NoStats", role: "sniper", country: "" },
    team: {},
    price: 10,
  },
];

export default function FantasyPlayerCardDemo({
  photoUrl,
  logoUrl,
}: {
  photoUrl?: string;
  logoUrl?: string;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set([1]));
  const [captainId, setCaptainId] = useState<number | null>(1);

  const entries = BASE_ENTRIES.map((e) => ({
    ...e,
    player: { ...e.player, photo_url: photoUrl },
    team: e.team.name ? { ...e.team, logo_url: logoUrl } : e.team,
  }));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-5 py-10">
      <header>
        <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Dev preview</p>
        <h1 className="font-display text-5xl font-black uppercase">Fantasy player card</h1>
        <p className="mt-2 max-w-2xl text-bone/70">
          Mock data only. Add <code>?photo=https://…</code> (a transparent PNG) and optionally{" "}
          <code>&amp;logo=https://…</code> to the URL to see real images. This page does not exist in
          production builds.
        </p>
      </header>

      <section>
        <h2 className="mb-4 font-stat text-xs uppercase tracking-widest text-ash">
          Medium · click to select · tier comes from the price (temporary thresholds)
        </h2>
        <div className="flex flex-wrap gap-8">
          {entries.map((e) => (
            <div key={e.id} className="space-y-2">
              <FantasyPlayerCard
                size="md"
                player={e.player}
                team={e.team}
                overall={e.overall}
                stats={e.stats}
                price={e.price}
                selected={selected.has(e.id)}
                captain={captainId === e.id && selected.has(e.id)}
                onClick={() => toggle(e.id)}
              />
              <div className="flex items-center justify-between font-stat text-[10px] uppercase tracking-widest text-ash">
                <span>tier: {tierFromPrice(e.price)}</span>
                <button
                  type="button"
                  className="text-ember hover:underline disabled:opacity-40"
                  disabled={!selected.has(e.id)}
                  onClick={() => setCaptainId(e.id)}
                >
                  Make captain
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-stat text-xs uppercase tracking-widest text-ash">
          Small (stats hidden) · disabled
        </h2>
        <div className="flex flex-wrap items-start gap-6">
          {entries.slice(0, 3).map((e) => (
            <FantasyPlayerCard
              key={e.id}
              size="sm"
              player={e.player}
              team={e.team}
              overall={e.overall}
              price={e.price}
              onClick={() => toggle(e.id)}
              selected={selected.has(e.id)}
            />
          ))}
          <FantasyPlayerCard
            size="sm"
            player={entries[1].player}
            team={entries[1].team}
            overall={entries[1].overall}
            price={entries[1].price}
            onClick={() => undefined}
            disabled
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-stat text-xs uppercase tracking-widest text-ash">
          Large · not clickable (plain display)
        </h2>
        <FantasyPlayerCard
          size="lg"
          player={entries[0].player}
          team={entries[0].team}
          overall={entries[0].overall}
          stats={entries[0].stats}
          price={entries[0].price}
        />
      </section>
    </div>
  );
}
