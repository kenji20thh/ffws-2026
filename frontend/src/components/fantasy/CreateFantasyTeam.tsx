"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { ApiError, createFantasyTeam } from "@/lib/api";

export default function CreateFantasyTeamForm({
  tournamentId,
  onCreated,
}: {
  tournamentId: number;
  onCreated: () => void;
}) {
  const [teamName, setTeamName] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createFantasyTeam(tournamentId, teamName, country);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? err.message : "Failed to create fantasy team");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "chamfer-sm w-full border border-bone/20 bg-char-2 px-4 py-3 font-stat text-sm text-bone focus:border-ember focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="chamfer mx-auto w-full max-w-md space-y-4 border border-bone/10 bg-char-2 p-6">
      <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Build your squad</p>
      <h1 className="font-display text-4xl font-black uppercase leading-none">Create fantasy team</h1>

      <div>
        <label htmlFor="tn" className="sr-only">Team name</label>
        <input id="tn" className={input} placeholder="Team name" value={teamName}
          onChange={(e) => setTeamName(e.target.value)} required minLength={2} />
      </div>
      <div>
        <label htmlFor="co" className="sr-only">Country</label>
        <input id="co" className={input} placeholder="Country" value={country}
          onChange={(e) => setCountry(e.target.value)} />
      </div>

      <p aria-live="polite" className="min-h-5 font-stat text-xs text-danger">{error}</p>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create team"}</Button>
    </form>
  );
}