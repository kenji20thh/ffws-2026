"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError, googleAuth } from "@/lib/api";
import { saveSession } from "@/lib/auth";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// Minimal typing for Google Identity Services (loaded from the script above).
interface GoogleId {
  initialize(cfg: { client_id: string; callback: (r: { credential: string }) => void }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

export const GOOGLE_SIGNUP_KEY = "ffws_google_signup";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Could not load Google")));
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

export default function GoogleButton() {
  const router = useRouter();
  const holder = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    async function onCredential(credential: string) {
      setError("");
      try {
        const res = await googleAuth(credential);
        if ("needs_username" in res) {
          // New Google user: pick a username first.
          sessionStorage.setItem(
            GOOGLE_SIGNUP_KEY,
            JSON.stringify({
              token: res.signup_token,
              email: res.email,
              suggestion: res.suggested_username,
            })
          );
          router.push("/auth/google/username");
          return;
        }
        saveSession(res.token, res.role, res.username);
        router.replace(res.role === "admin" ? "/admin" : "/");
        router.refresh();
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) setError("Too many attempts. Please wait a minute.");
        else setError(err instanceof Error ? err.message : "Google sign-in failed");
      }
    }

    loadScript()
      .then(() => {
        if (cancelled || !holder.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (r) => onCredential(r.credential),
        });
        window.google.accounts.id.renderButton(holder.current, {
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 320,
        });
      })
      .catch((e) => !cancelled && setError(e.message));

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
        <span className="h-px flex-1 bg-bone/10" />
        or
        <span className="h-px flex-1 bg-bone/10" />
      </div>
      <div ref={holder} className="flex min-h-10 justify-center" />
      {error && <p className="font-stat text-xs text-danger">{error}</p>}
    </div>
  );
}
