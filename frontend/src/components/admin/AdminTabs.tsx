"use client";

import { useState } from "react";
import AdminConsole from "./AdminConsole";
import PlayerWeaponsPanel from "./PlayerWeaponsPanel";

const TABS = [
  { id: "results", label: "Room results" },
  { id: "weapons", label: "Player weapons" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Both panels stay mounted and the inactive one is only hidden, so switching tabs
 * never loses what was typed into the room results.
 */
export default function AdminTabs() {
  const [tab, setTab] = useState<TabId>("results");

  return (
    <div>
      <div role="tablist" className="mb-8 flex gap-1 border-b border-bone/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-3 font-display text-lg font-bold uppercase tracking-wider transition-colors ${
              tab === t.id ? "border-ember text-ember" : "border-transparent text-bone/60 hover:text-bone"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div hidden={tab !== "results"}>
        <AdminConsole />
      </div>
      <div hidden={tab !== "weapons"}>
        <PlayerWeaponsPanel />
      </div>
    </div>
  );
}
