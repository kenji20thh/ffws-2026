"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { ApiError, changePassword, changeUsername } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import type { Me } from "@/types";

const input =
  "block w-full max-w-xl border border-bone/15 bg-char px-3 py-2.5 font-stat text-sm text-bone placeholder:text-ash/70 transition focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember/30 disabled:cursor-not-allowed disabled:opacity-60";

const USERNAME_RE = /^[A-Za-z0-9_.-]+$/;
type Panel = "username" | "password" | null;

function EditButton({ open, onClick, children }: { open: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="shrink-0 px-2 py-1.5 font-stat text-xs font-semibold text-ember transition-colors hover:text-amber focus:outline-none focus:ring-1 focus:ring-ember"
    >
      {open ? "Cancel" : children}
    </button>
  );
}

function SettingRow({
  label,
  description,
  value,
  action,
  children,
}: {
  label: string;
  description?: string;
  value: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h3 className="font-stat text-sm font-semibold text-bone">{label}</h3>
          {description && <p className="mt-1 font-stat text-xs leading-relaxed text-ash">{description}</p>}
          <div className="mt-2 break-words font-stat text-sm text-bone">{value}</div>
        </div>
        {action && <div className="-ml-2 sm:ml-0 sm:pt-0.5">{action}</div>}
      </div>
      {children}
    </div>
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
    <section aria-label="Account settings" className="overflow-hidden border border-bone/10 bg-char-2">
      {notice && (
        <p role="status" className="border-b border-emerald-500/15 bg-emerald-500/[0.06] px-4 py-2.5 font-stat text-xs text-emerald-300 sm:px-5">
          <span aria-hidden="true" className="mr-2">✓</span>{notice}
        </p>
      )}

      <div className="divide-y divide-bone/[0.08]">
        <SettingRow
          label="Username"
          description="Your public name across FFWS."
          value={<span className="font-medium">@{me.username}</span>}
          action={<EditButton open={panel === "username"} onClick={() => toggle("username")}>Edit</EditButton>}
        >
          {panel === "username" && (
            <div className="mt-4 border-t border-bone/10 pt-4">
              <UsernameForm
                current={me.username}
                onDone={(username) => {
                  onChanged({ username });
                  setPanel(null);
                  setNotice("Username updated.");
                }}
              />
            </div>
          )}
        </SettingRow>

        <SettingRow
          label="Email address"
          description="Used for account access and recovery."
          value={me.email ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span>{me.email}</span>
              {me.email_verified ? (
                <span className="text-[11px] text-emerald-300">Verified</span>
              ) : (
                <span className="text-[11px] text-amber-200">Not verified</span>
              )}
            </span>
          ) : <span className="text-ash">No email associated with this account.</span>}
        />

        <SettingRow
          label="Password"
          description={me.has_password ? "Change the password used to sign in." : "Set a password to also sign in without Google."}
          value={me.has_password ? (
            <span className="inline-flex items-center gap-2"><span className="tracking-widest text-ash">••••••••</span><span className="text-[11px] text-emerald-300">Enabled</span></span>
          ) : <span className="text-ash">No password set</span>}
          action={<EditButton open={panel === "password"} onClick={() => toggle("password")}>{me.has_password ? "Change" : "Set password"}</EditButton>}
        >
          {panel === "password" && (
            <div className="mt-4 border-t border-bone/10 pt-4">
              <PasswordForm
                hasPassword={me.has_password}
                onDone={() => {
                  const wasSet = me.has_password;
                  onChanged({ has_password: true });
                  setPanel(null);
                  setNotice(wasSet ? "Password updated." : "Password set successfully.");
                }}
              />
            </div>
          )}
        </SettingRow>
      </div>
    </section>
  );
}

function UsernameForm({ current, onDone }: { current: string; onDone: (username: string) => void }) {
  const [username, setUsername] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuggestion("");

    const name = username.trim();
    if (name.length < 3 || name.length > 32 || !USERNAME_RE.test(name)) {
      setError("Use 3–32 characters: letters, numbers, periods, underscores, or hyphens.");
      return;
    }
    if (name === current) {
      setError("That is already your username.");
      return;
    }

    setBusy(true);
    try {
      const res = await changeUsername(name);
      // The API returns a replacement token with the updated username.
      saveSession(res.token, res.role, res.username);
      onDone(res.username);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.status === 409 && err.suggestedUsername) setSuggestion(err.suggestedUsername);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3">
      <div>
        <label htmlFor="new-username" className="mb-1.5 block font-stat text-xs text-ash">New username</label>
        <input id="new-username" className={input} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required minLength={3} maxLength={32} />
        <p className="mt-1.5 font-stat text-[11px] text-ash">3–32 characters. Letters, numbers, . _ - are allowed.</p>
      </div>
      <p aria-live="polite" className="min-h-4 font-stat text-xs text-danger">
        {error}
        {suggestion && <> {" "}<button type="button" onClick={() => { setUsername(suggestion); setError(""); setSuggestion(""); }} className="font-semibold text-ember underline underline-offset-2">Use {suggestion}</button></>}
      </p>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save username"}</Button>
    </form>
  );
}

function PasswordForm({ hasPassword, onDone }: { hasPassword: boolean; onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const type = show ? "text" : "password";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (hasPassword && !current) return setError("Enter your current password.");
    if (next.length < 8 || next.length > 72) return setError("New password must be 8–72 characters.");
    if (next !== confirm) return setError("The new passwords do not match.");
    if (hasPassword && next === current) return setError("Your new password must be different from the current one.");

    setBusy(true);
    try {
      await changePassword(hasPassword ? current : "", next);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3">
      {!hasPassword && <p className="mb-3 font-stat text-xs leading-relaxed text-ash">You currently sign in with Google. Setting a password adds another sign-in option.</p>}
      {hasPassword && (
        <div>
          <label htmlFor="current-password" className="mb-1.5 block font-stat text-xs text-ash">Current password</label>
          <input id="current-password" type={type} className={input} placeholder="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus required />
        </div>
      )}
      <div>
        <label htmlFor="new-password" className="mb-1.5 block font-stat text-xs text-ash">New password</label>
        <input id="new-password" type={type} className={input} placeholder="At least 8 characters" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} autoFocus={!hasPassword} required minLength={8} maxLength={72} />
        <p className="mt-1.5 font-stat text-[11px] text-ash">Use at least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block font-stat text-xs text-ash">Confirm new password</label>
        <input id="confirm-password" type={type} className={input} placeholder="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} maxLength={72} />
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 font-stat text-xs text-ash">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-3.5 w-3.5 accent-ember" />
        Show passwords
      </label>
      <p aria-live="polite" className="min-h-4 font-stat text-xs text-danger">{error}</p>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : hasPassword ? "Update password" : "Set password"}</Button>
    </form>
  );
}
