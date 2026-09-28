"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { ApiError, login } from "@/lib/api";
import { saveSession } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await login(username, password);
      if (res.role !== "admin") {
        setError("Admin access required.");
        return;
      }
      saveSession(res.token, res.role);
      router.replace("/admin");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setError("Too many attempts. Wait a few seconds.");
      else setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "chamfer-sm w-full border border-bone/20 bg-char-2 px-4 py-3 font-stat text-sm text-bone focus:border-ember focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="chamfer w-full max-w-sm space-y-4 border border-bone/10 bg-char-2 p-6">
      <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Ops console</p>
      <h1 className="font-display text-5xl font-black uppercase leading-none">Admin login</h1>
      <div>
        <label htmlFor="u" className="sr-only">Username</label>
        <input id="u" className={input} placeholder="Username" autoComplete="username"
          value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="p" className="sr-only">Password</label>
        <input id="p" type="password" className={input} placeholder="Password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <p aria-live="polite" className="min-h-5 font-stat text-xs text-danger">{error}</p>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Checking…" : "Enter"}</Button>
    </form>
  );
}