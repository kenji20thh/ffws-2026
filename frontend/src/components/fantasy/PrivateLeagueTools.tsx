"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { ApiError, createPrivateLeague, joinPrivateLeague } from "@/lib/api";
import type { FantasyLeague } from "@/types";

const input =
  "chamfer-sm w-full border border-bone/20 bg-char-2 px-4 py-3 font-stat text-sm text-bone focus:border-ember focus:outline-none";

type Mode = "none" | "create" | "join";

/** Create-a-league and join-with-a-code forms. */
export default function PrivateLeagueTools({
  tournamentId,
  initialCode = "",
  onDone,
}: {
  tournamentId: number;
  /** Prefills the join form (from an invite link). */
  initialCode?: string;
  /** Called with the league the player just created or joined. */
  onDone: (league: FantasyLeague) => void;
}) {
  const [mode, setMode] = useState<Mode>(initialCode ? "join" : "none");
  const [name, setName] = useState("");
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setMode("join");
    }
  }, [initialCode]);

  function open(next: Mode) {
    setMode((m) => (m === next ? "none" : next));
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const league =
        mode === "create"
          ? await createPrivateLeague(tournamentId, name.trim())
          : await joinPrivateLeague(tournamentId, code.trim());
      setName("");
      setCode("");
      setMode("none");
      onDone(league);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong, try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chamfer border border-bone/10 bg-char-2 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Private leagues</p>
          <p className="mt-1 text-sm text-bone/70">
            Play against your friends. Only people with the code can see or join.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "create" ? "primary" : "ghost"}
            className="!px-5 !py-2 !text-base"
            onClick={() => open("create")}
          >
            Create
          </Button>
          <Button
            type="button"
            variant={mode === "join" ? "primary" : "ghost"}
            className="!px-5 !py-2 !text-base"
            onClick={() => open("join")}
          >
            Join
          </Button>
        </div>
      </div>

      {mode !== "none" && (
        <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          {mode === "create" ? (
            <>
              <label htmlFor="league-name" className="sr-only">
                League name
              </label>
              <input
                id="league-name"
                className={input}
                placeholder="League name (3–30 characters)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={3}
                maxLength={30}
                required
                autoFocus
              />
            </>
          ) : (
            <>
              <label htmlFor="league-code" className="sr-only">
                League code
              </label>
              <input
                id="league-code"
                className={`${input} uppercase tracking-[0.25em]`}
                placeholder="ABCD-2345"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={12}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                required
                autoFocus
              />
            </>
          )}
          <Button type="submit" disabled={busy} className="shrink-0 !py-3">
            {busy ? "…" : mode === "create" ? "Create league" : "Join league"}
          </Button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
