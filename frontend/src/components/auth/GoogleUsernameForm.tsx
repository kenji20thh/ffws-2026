"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, googleComplete } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { GOOGLE_SIGNUP_KEY } from "./GoogleButton";

interface Pending {
  token: string;
  email: string;
  suggestion: string;
}

export default function GoogleUsernameForm() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(GOOGLE_SIGNUP_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Pending;
        setPending(p);
        setUsername(p.suggestion);
        return;
      }
    } catch {
      /* fall through */
    }
    router.replace("/login");
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      const res = await googleComplete(pending.token, username.trim());
      sessionStorage.removeItem(GOOGLE_SIGNUP_KEY);
      saveSession(res.token, res.role, res.username);
      router.replace("/");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Taken in the meantime: offer the next free one.
        setError("That username is taken.");
        if (err.suggestedUsername) setUsername(err.suggestedUsername);
      } else if (err instanceof ApiError && err.status === 401) {
        sessionStorage.removeItem(GOOGLE_SIGNUP_KEY);
        router.replace("/login");
      } else if (err instanceof ApiError && err.status === 429) {
        setError("Too many attempts. Please wait a minute and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Could not create account");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!pending) return <Skeleton className="h-64 w-full max-w-sm" />;

  const input =
    "chamfer-sm w-full border border-bone/20 bg-char-2 px-4 py-3 font-stat text-sm text-bone focus:border-ember focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="chamfer w-full max-w-sm space-y-4 border border-bone/10 bg-char-2 p-6">
      <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">One last step</p>
      <h1 className="font-display text-5xl font-black uppercase leading-none">Pick a username</h1>
      <p className="font-stat text-xs text-ash">
        Signed in as <span className="text-bone">{pending.email}</span>. This is the name other players will see — you
        can keep our suggestion or change it.
      </p>

      <div>
        <label htmlFor="gu" className="sr-only">Username</label>
        <input
          id="gu"
          className={input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          minLength={3}
          maxLength={32}
          pattern="[A-Za-z0-9_.\-]+"
          title="Letters, numbers, dot, underscore or dash"
        />
      </div>

      <p aria-live="polite" className="min-h-5 font-stat text-xs text-danger">{error}</p>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Creating…" : "Continue"}
      </Button>
    </form>
  );
}
