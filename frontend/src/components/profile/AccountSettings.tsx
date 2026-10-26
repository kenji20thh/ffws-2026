"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { ApiError, changePassword, changeUsername } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import type { Me } from "@/types";

const input =
  "chamfer-sm w-full border border-bone/20 bg-char-2 px-4 py-3 font-stat text-sm text-bone focus:border-ember focus:outline-none";

const USERNAME_RE = /^[A-Za-z0-9_.-]+$/;

type Panel = "username" | "password" | null;

function Row({
  label,
  value,
  action,
  children,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ash">{label}</p>
          <div className="mt-1 truncate font-stat text-sm text-bone">{value}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ToggleButton({ open, onClick, children }: { open: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="shrink-0 border border-bone/25 px-4 py-2 font-stat text-xs font-bold uppercase tracking-wider text-bone transition-colors hover:border-ember hover:text-ember"
    >
      {open ? "Cancel" : children}
    </button>
  );
}

export default function AccountSettings({
  me,
  onChanged,
}: {
  me: Me;
  onChanged: (patch: Partial<Me>) => void;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [notice, setNotice] = useState("");

  function toggle(next: Exclude<Panel, null>) {
    setNotice("");
    setPanel((current) => (current === next ? null : next));
  }

  return (
    <section aria-label="Account settings" className="chamfer border border-bone/10 bg-char-2">
      <h2 className="border-b border-bone/10 px-5 py-3 font-stat text-[11px] uppercase tracking-[0.3em] text-ember">
        Account
      </h2>

      {notice && (
        <p role="status" className="border-b border-bone/10 bg-ember/10 px-5 py-3 font-stat text-xs text-ember">
          {notice}
        </p>
      )}

      <div className="divide-y divide-bone/10">
        <Row
          label="Username"
          value={me.username}
          action={
            <ToggleButton open={panel === "username"} onClick={() => toggle("username")}>
              Change
            </ToggleButton>
          }
        >
          {panel === "username" && (
            <UsernameForm
              current={me.username}
              onDone={(username) => {
                onChanged({ username });
                setPanel(null);
                setNotice("Username updated.");
              }}
            />
          )}
        </Row>

        <Row
          label="Email"
          value={
            me.email ? (
              <>
                {me.email}
                {me.email_verified && (
                  <span className="ml-2 font-stat text-[10px] uppercase tracking-widest text-ember">Verified</span>
                )}
              </>
            ) : (
              <span className="text-ash">No email on this account</span>
            )
          }
        />

        <Row
          label="Password"
          value={me.has_password ? "••••••••" : <span className="text-ash">Not set (you sign in with Google)</span>}
          action={
            <ToggleButton open={panel === "password"} onClick={() => toggle("password")}>
              {me.has_password ? "Change" : "Set password"}
            </ToggleButton>
          }
        >
          {panel === "password" && (
            <PasswordForm
              hasPassword={me.has_password}
              onDone={() => {
                const wasSet = me.has_password;
                onChanged({ has_password: true });
                setPanel(null);
                setNotice(wasSet ? "Password updated." : "Password set. You can now also log in with it.");
              }}
            />
          )}
        </Row>
      </div>
    </section>
  );
}

/* ---------- change username ---------- */

function UsernameForm({ current, onDone }: { current: string; onDone: (username: string) => void }) {
  const [username, setUsername] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuggestion("");

    const name = username.trim();
    if (name.length < 3 || name.length > 32 || !USERNAME_RE.test(name)) {
      setError("Use 3 to 32 characters: letters, numbers, . _ -");
      return;
    }
    if (name === current) {
      setError("That is already your username.");
      return;
    }

    setBusy(true);
    try {
      const res = await changeUsername(name);
      // the server sends a new token carrying the new name
      saveSession(res.token, res.role, res.username);
      onDone(res.username);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.status === 409 && err.suggestedUsername) setSuggestion(err.suggestedUsername);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div>
        <label htmlFor="new-username" className="sr-only">New username</label>
        <input
          id="new-username"
          className={input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          required
          minLength={3}
          maxLength={32}
        />
        <p className="mt-2 font-stat text-[11px] text-ash">3 to 32 characters: letters, numbers, . _ -</p>
      </div>

      <p aria-live="polite" className="min-h-5 font-stat text-xs text-danger">
        {error}
        {suggestion && (
          <>
            {" "}
            <button
              type="button"
              onClick={() => {
                setUsername(suggestion);
                setError("");
                setSuggestion("");
              }}
              className="text-ember underline"
            >
              Use {suggestion}
            </button>
          </>
        )}
      </p>

      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save username"}
      </Button>
    </form>
  );
}

/* ---------- change / set password ---------- */

function PasswordForm({ hasPassword, onDone }: { hasPassword: boolean; onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (hasPassword && !current) {
      setError("Enter your current password.");
      return;
    }
    if (next.length < 8 || next.length > 72) {
      setError("New password must be 8 to 72 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (hasPassword && next === current) {
      setError("New password must be different from the current one.");
      return;
    }

    setBusy(true);
    try {
      await changePassword(hasPassword ? current : "", next);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const type = show ? "text" : "password";

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      {!hasPassword && (
        <p className="font-stat text-[11px] text-ash">
          You signed in with Google. Set a password to also log in with your email or username.
        </p>
      )}

      {hasPassword && (
        <div>
          <label htmlFor="current-password" className="sr-only">Current password</label>
          <input
            id="current-password"
            type={type}
            className={input}
            placeholder="Current password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoFocus
            required
          />
        </div>
      )}
      <div>
        <label htmlFor="new-password" className="sr-only">New password</label>
        <input
          id="new-password"
          type={type}
          className={input}
          placeholder="New password (min 8 characters)"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoFocus={!hasPassword}
          required
          minLength={8}
          maxLength={72}
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="sr-only">Confirm new password</label>
        <input
          id="confirm-password"
          type={type}
          className={input}
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          maxLength={72}
        />
      </div>

      <label className="flex items-center gap-2 font-stat text-xs text-ash">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-ember" />
        Show passwords
      </label>

      <p aria-live="polite" className="min-h-5 font-stat text-xs text-danger">{error}</p>

      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : hasPassword ? "Update password" : "Set password"}
      </Button>
    </form>
  );
}
