"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearSession,
  getName,
  getRole,
  getToken,
  onAuthChange,
} from "@/lib/auth";

const LINKS = [
  { href: "/teams", label: "Teams" },
  { href: "/schedule", label: "Schedule" },
  { href: "/standings", label: "Standings" },
  { href: "/players", label: "Players" },
];

interface Session {
  name: string | null;
  role: string | null;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const read = () =>
      setSession(getToken() ? { name: getName(), role: getRole() } : null);
    read();
    return onAuthChange(read);
  }, []);

  function logout() {
    clearSession();
    setOpen(false);
    router.replace("/");
  }

  const linkClass = (active: boolean) =>
    `chamfer-sm block px-5 py-2 font-display text-lg font-bold uppercase tracking-wider transition-colors ${
      active ? "bg-ember text-char" : "text-bone/70 hover:text-ember"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-bone/10 bg-char/90">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link
          href="/"
          className="flex items-baseline gap-2"
          onClick={() => setOpen(false)}
        >
          <span className="font-display text-3xl font-black uppercase leading-none tracking-tight">
            FF<span className="text-ember">WS</span>
          </span>
          <span className="font-stat text-[10px] uppercase tracking-widest text-ash">
            2026
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={linkClass(pathname.startsWith(l.href))}
              >
                {l.label}
              </Link>
            </li>
          ))}
          {session?.role === "admin" && (
            <li>
              <Link
                href="/admin"
                className={linkClass(pathname.startsWith("/admin"))}
              >
                Admin
              </Link>
            </li>
          )}
          <li className="ml-3 border-l border-bone/15 pl-4">
            {session ? (
              <div className="flex items-center gap-3">
                <span className="font-stat text-[11px] uppercase tracking-widest text-ash">
                  {session.name}
                </span>
                <button
                  onClick={logout}
                  className="font-display text-lg font-bold uppercase tracking-wider text-bone/70 hover:text-ember"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={linkClass(pathname === "/login")}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={linkClass(pathname === "/register")}
                >
                  Register
                </Link>
              </div>
            )}
          </li>
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
                className={`block py-3 font-display text-2xl font-extrabold uppercase ${pathname.startsWith(l.href) ? "text-ember" : "text-bone"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
          {session?.role === "admin" && (
            <li>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block py-3 font-display text-2xl font-extrabold uppercase text-amber"
              >
                Admin
              </Link>
            </li>
          )}
          <li>
            {session ? (
              <button
                onClick={logout}
                className="block py-3 font-display text-2xl font-extrabold uppercase text-bone"
              >
                Log out ({session.name})
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block py-3 font-display text-2xl font-extrabold uppercase text-bone"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="block py-3 font-display text-2xl font-extrabold uppercase text-bone"
                >
                  Register
                </Link>
              </>
            )}
          </li>
        </ul>
      )}
    </header>
  );
}
