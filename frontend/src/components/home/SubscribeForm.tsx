"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { ApiError, subscribe } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "info" | "error";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      await subscribe(email);
      setStatus("success");
      setMessage("You're on the list. We'll ping you when the zone opens.");
      setEmail("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStatus("info");
        setMessage("You're already on the list.");
      } else if (err instanceof ApiError && err.status === 429) {
        setStatus("error");
        setMessage("Too many attempts. Please try again in a minute.");
      } else {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Something went wrong");
      }
    }
  }

  const color =
    status === "success" ? "text-amber" : status === "info" ? "text-bone" : "text-danger";

  return (
    <div className="w-full max-w-lg">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email" className="sr-only">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="chamfer-sm flex-1 border border-bone/20 bg-char-2 px-4 py-3 font-stat text-sm text-bone placeholder:text-ash focus:border-ember focus:outline-none"
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Notify me"}
        </Button>
      </form>
      <p aria-live="polite" className={`mt-3 min-h-5 font-stat text-xs ${color}`}>
        {status !== "idle" && status !== "loading" ? message : ""}
      </p>
    </div>
  );
}