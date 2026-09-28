"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/teams", label: "Teams" },
  { href: "/schedule", label: "Schedule" },
  { href: "/standings", label: "Standings" },
  { href: "/players", label: "Players" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-bone/10 bg-char/90">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-3xl font-black uppercase leading-none tracking-tight">
            FF<span className="text-ember">WS</span>
          </span>
          <span className="font-stat text-[10px] uppercase tracking-widest text-ash">2026</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`chamfer-sm block px-5 py-2 font-display text-lg font-bold uppercase tracking-wider transition-colors ${
                    active ? "bg-ember text-char" : "text-bone/70 hover:text-ember"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          className="font-stat text-xs uppercase tracking-widest text-bone md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? "Close ✕" : "Menu ☰"}
        </button>
      </nav>

      {open && (
        <ul className="border-t border-bone/10 bg-char px-5 py-3 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block py-3 font-display text-2xl font-extrabold uppercase ${
                  pathname.startsWith(l.href) ? "text-ember" : "text-bone"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}