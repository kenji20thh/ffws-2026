"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { ApiError, changePassword, changeUsername } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import type { Me } from "@/types";

const input =
  "block w-full border border-bone/15 bg-char px-4 py-3 font-stat text-sm text-bone placeholder:text-ash/70 transition focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember/30 disabled:cursor-not-allowed disabled:opacity-60";

const USERNAME_RE = /^[A-Za-z0-9_.-]+$/;
type Panel = "username" | "password" | null;

function SettingIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-bone/10 bg-char text-lg text-ember" aria-hidden="true">
      {children}
    </span>
  );
}

function ToggleButton({ open, onClick, children }: { open: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="inline-flex min-h-10 shrink-0 items-center justify-center border border-bone/20 px-4 py-2 font-stat text-[10px] font-bold uppercase tracking-[0.16em] text-bone transition hover:border-ember hover:text-ember focus:outline-none focus:ring-2 focus:ring-ember/50"
    >
      {open ? "Cancel" : children}
    </button>
  );
}

function SettingRow({
  icon,
  label,
  description,
  value,
  action,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <SettingIcon>{icon}</SettingIcon>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-extrabold uppercase leading-tight text-bone">{label}</h3>
              <p className="mt-1 font-stat text-xs leading-relaxed text-ash">{description}</p>
              <div className="mt-3 break-words font-stat text-sm text-bone">{value}</div>
            </div>
            {action && <div className="sm:pt-0.5">{action}</div>}
          </div>
          {children}
        </div>
      </div>
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
      <div className="flex items-center justify-between gap-4 border-b border-bone/10 bg-char/50 px-4 py-4 sm:px-5">
        <div>
          <p className="font-stat text-[10px] font-bold uppercase tracking-[0.25em] text-ember">Your details</p>
          <h2 className="mt-1 font-display text-xl font-black uppercase text-bone">Login & security</h2>
        </div>
        <span className="border border-bone/10 px-2.5 py-1 font-stat text-[9px] font-bold uppercase tracking-widest text-ash">Account</span>
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-2 border-b border-emerald-500/15 bg-emerald-500/[0.07] px-4 py-3 font-stat text-xs text-emerald-300 sm:px-5">
          <span aria-hidden="true">✓</span>{notice}
        </p>
      )}

      <div className="divide-y divide-bone/[0.08]">
        <SettingRow
          icon="◎"
          label="Username"
          description="This is the name other players see around FFWS."
          value={<span className="font-semibold">@{me.username}</span>}
          action={<ToggleButton open={panel === "username"} onClick={() => toggle("username")}>Edit username</ToggleButton>}
        >
          {panel === "username" && (
            <div className="mt-5 border border-bone/10 bg-char/70 p-4 sm:p-5">
              <p className="font-stat text-[10px] font-bold uppercase tracking-[0.2em] text-ember">Choose a new username</p>
              <UsernameForm
                current={me.username}
                onDone={(username) => {
                  onChanged({ username });
                  setPanel(null);
                  setNotice("Your username has been updated successfully.");
                }}
              />
            </div>
          )}
        </SettingRow>

        <SettingRow
          icon="✉"
          label="Email address"
          description="Your email is used for account access and recovery."
          value={me.email ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span>{me.email}</span>
              {me.email_verified ? (
                <span className="inline-flex items-center gap-1 border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-stat text-[9px] font-bold uppercase tracking-widest text-emerald-300">✓ Verified</span>
              ) : (
                <span className="inline-flex items-center gap-1 border border-amber-500/20 bg-amber-500/10 px-2 py-1 font-stat text-[9px] font-bold uppercase tracking-widest text-amber-200">Unverified</span>
              )}
            </span>
          ) : <span className="text-ash">No email associated with this account.</span>}
        />

        <SettingRow
          icon="⌑"
          label="Password"
          description={me.has_password ? "Update your password regularly to help keep your account secure." : "Add a password so you can also sign in without Google."}
          value={me.has_password ? (
            <span className="inline-flex items-center gap-2"><span className="tracking-[0.2em] text-ash">••••••••••</span><span className="font-stat text-[10px] uppercase tracking-widest text-emerald-300">Enabled</span></span>
          ) : <span className="text-ash">No password set</span>}
          action={<ToggleButton open={panel === "password"} onClick={() => toggle("password")}>{me.has_password ? "Change password" : "Set password"}</ToggleButton>}
        >
          {panel === "password" && (
            <div className="mt-5 border border-bone/10 bg-char/70 p-4 sm:p-5">
              <p className="font-stat text-[10px] font-bold uppercase tracking-[0.2em] text-ember">{me.has_password ? "Update credentials" : "Create a password"}</p>
              <PasswordForm
                hasPassword={me.has_password}
                onDone={() => {
                  const wasSet = me.has_password;
                  onChanged({ has_password: true });
                  setPanel(null);
                  setNotice(wasSet ? "Your password has been updated." : "Password created. You can now also sign in with it.");
                }}
              />
            </div>
          )}
        </SettingRow>
      </div>
      <div className="flex items-start gap-3 border-t border-bone/10 bg-char/40 px-4 py-4 sm:px-5">
        <span className="mt-0.5 text-ember" aria-hidden="true">ⓘ</span>
        <p className="font-stat text-[11px] leading-relaxed text-ash">Never share your password with anyone. FFWS staff will never ask you to send it by message.</p>
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
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div>
        <label htmlFor="new-username" className="mb-2 block font-stat text-[10px] font-bold uppercase tracking-widest text-ash">New username</label>
        <input id="new-username" className={input} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required minLength={3} maxLength={32} />
        <p className="mt-2 font-stat text-[10px] leading-relaxed text-ash">3–32 characters. Letters, numbers, . _ - are allowed.</p>
      </div>
      <p aria-live="polite" className="min-h-5 font-stat text-xs text-danger">
        {error}
        {suggestion && <> {" "}<button type="button" onClick={() => { setUsername(suggestion); setError(""); setSuggestion(""); }} className="font-bold text-ember underline underline-offset-2">Use {suggestion}</button></>}
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
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      {!hasPassword && <p className="border-l-2 border-ember bg-ember/[0.06] px-3 py-2 font-stat text-xs leading-relaxed text-ash">You currently sign in with Google. Creating a password gives you another way to access your account.</p>}
      {hasPassword && (
        <div>
          <label htmlFor="current-password" className="mb-2 block font-stat text-[10px] font-bold uppercase tracking-widest text-ash">Current password</label>
          <input id="current-password" type={type} className={input} placeholder="Enter current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus required />
        </div>
      )}
      <div>
        <label htmlFor="new-password" className="mb-2 block font-stat text-[10px] font-bold uppercase tracking-widest text-ash">New password</label>
        <input id="new-password" type={type} className={input} placeholder="At least 8 characters" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} autoFocus={!hasPassword} required minLength={8} maxLength={72} />
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((step) => <span key={step} className={`h-1 flex-1 ${next.length >= step * 4 ? "bg-ember" : "bg-bone/10"}`} />)}
        </div>
        <p className="mt-1 font-stat text-[10px] text-ash">Use at least 8 characters. Avoid reusing a password from another site.</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-2 block font-stat text-[10px] font-bold uppercase tracking-widest text-ash">Confirm new password</label>
        <input id="confirm-password" type={type} className={input} placeholder="Enter the new password again" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} maxLength={72} />
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 font-stat text-xs text-ash">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 accent-ember" />
        Show passwords
      </label>
      <p aria-live="polite" className="min-h-5 font-stat text-xs text-danger">{error}</p>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : hasPassword ? "Update password" : "Create password"}</Button>
    </form>
  );
}
