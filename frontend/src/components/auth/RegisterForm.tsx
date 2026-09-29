"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { ApiError, login, register } from "@/lib/api";
import { saveSession } from "@/lib/auth";

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      await register(username, password);
      const res = await login(username, password);
      saveSession(res.token, res.role, username);
      router.replace("/");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setError("Too many attempts. Wait a few seconds.");
      else if (err instanceof ApiError && err.status === 500) setError("That username may already be taken.");
      else setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "chamfer-sm w-full border border-bone/20 bg-char-2 px-4 py-3 font-stat text-sm text-bone focus:border-ember focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="chamfer w-full max-w-sm space-y-4 border border-bone/10 bg-char-2 p-6">
      <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Join the fight</p>
      <h1 className="font-display text-5xl font-black uppercase leading-none">Register</h1>

      <div>
        <label htmlFor="u" className="sr-only">Username</label>
        <input id="u" className={input} placeholder="Username" autoComplete="username"
          value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
      </div>
      <div>
        <label htmlFor="p" className="sr-only">Password</label>
        <input id="p" type="password" className={input} placeholder="Password (min 8 characters)" autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </div>
      <div>
        <label htmlFor="c" className="sr-only">Confirm password</label>
        <input id="c" type="password" className={input} placeholder="Confirm password" autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
      </div>

      <p aria-live="polite" className="min-h-5 font-stat text-xs text-danger">{error}</p>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create account"}</Button>

      <p className="text-center font-stat text-xs text-ash">
        Already have an account?{" "}
        <Link href="/login" className="text-ember hover:underline">Log in</Link>
      </p>
    </form>
  );
}