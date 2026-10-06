"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

/** Shows a private league's invite code with copy / share / leave. Every member sees this. */
export default function LeagueCodeCard({
  name,
  code,
  onLeave,
}: {
  name: string;
  code: string;
  onLeave: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const inviteLink = () =>
    `${window.location.origin}/fantasy/leagues?join=${encodeURIComponent(code.replace("-", ""))}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy the league code:", code);
    }
  }

  async function share() {
    const text = `Join my FFWS fantasy league "${name}" with code ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url: inviteLink() });
        return;
      } catch {
        // dismissed or unsupported: fall through to copying the link
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${inviteLink()}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy the invite:", `${text}\n${inviteLink()}`);
    }
  }

  return (
    <div className="chamfer border border-ember/30 bg-ember/5 px-6 py-5">
      <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Invite code</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <p className="select-all font-display text-4xl font-black tracking-[0.2em]">{code}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="!px-5 !py-2 !text-base" onClick={copy}>
            {copied ? "Copied ✓" : "Copy code"}
          </Button>
          <Button type="button" variant="ghost" className="!px-5 !py-2 !text-base" onClick={share}>
            Share
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-bone/60">
        <span>Anyone with this code can join. Everyone in the league can see it.</span>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Leave "${name}"?`)) onLeave();
          }}
          className="font-stat text-xs uppercase tracking-widest text-bone/50 hover:text-red-400"
        >
          Leave league
        </button>
      </div>
    </div>
  );
}
