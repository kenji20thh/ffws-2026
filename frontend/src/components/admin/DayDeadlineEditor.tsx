"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { updateTournamentDayDeadline } from "@/lib/api";
import type { TournamentDay } from "@/types";

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function DayDeadlineEditor({
  day,
  onUpdated,
}: {
  day: TournamentDay;
  onUpdated: (d: TournamentDay) => void;
}) {
  const hasDeadline = day.deadline && !day.deadline.startsWith("0001");
  const [value, setValue] = useState(hasDeadline ? toLocalInputValue(day.deadline) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      const iso = new Date(value).toISOString();
      const updated = await updateTournamentDayDeadline(day.id, iso);
      onUpdated(updated);
    } catch {
      setError("Failed to save deadline");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chamfer-sm flex flex-wrap items-end gap-3 border border-bone/15 bg-char-2 p-4">
      <div>
        <label htmlFor="deadline" className="mb-1 block font-stat text-[10px] uppercase tracking-widest text-ash">
          Prediction & fantasy lock — {day.name}
        </label>
        <input
          id="deadline"
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="chamfer-sm border border-bone/20 bg-char px-3 py-2 font-stat text-sm text-bone focus:border-ember focus:outline-none"
        />
      </div>
      <Button type="button" onClick={save} disabled={busy || !value} className="!px-5 !py-2 !text-base">
        {busy ? "Saving…" : "Save deadline"}
      </Button>
      {hasDeadline && (
        <span className="font-stat text-[10px] uppercase tracking-widest text-ash">
          Current: {new Date(day.deadline).toLocaleString()}
        </span>
      )}
      {error && <span className="font-stat text-xs text-danger">{error}</span>}
    </div>
  );
}