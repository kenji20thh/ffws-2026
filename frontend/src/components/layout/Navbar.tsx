"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const read = () =>
      setSession(getToken() ? { name: getName(), role: getRole() } : null);

    read();

    return onAuthChange(read);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function logout() {
    clearSession();
    setProfileOpen(false);
    setOpen(false);
    router.replace("/");
  }

  const linkClass = (active: boolean) =>
    `chamfer-sm block px-5 py-2 font-display text-lg font-bold uppercase tracking-wider transition-colors ${
      active ? "bg-ember text-char" : "text-bone/70 hover:text-ember"
    }`;

  const username = session?.name || "User";
  const avatarLetter = username.charAt(0).toUpperCase();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-bone/10 bg-char/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        {/* Logo */}
        <Link
          href="/"
          className="flex h-14 items-center"
          onClick={() => {
            setOpen(false);
            setProfileOpen(false);
          }}
          aria-label="FFWS World Series"
        >
          <Image
            src="/logo.png"
            alt="FFWS World Series"
            width={170}
            height={60}
            priority
            className="h-14 w-auto object-contain"
          />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center md:flex">
          {/* Main navigation */}
          <ul className="flex items-center gap-1">
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

            {/* Fantasy CTA */}
            <li className="ml-2">
              <Link
                href="/fantasy"
                className={`chamfer-sm relative block border-2 border-ember px-5 py-2 font-display text-lg font-black uppercase tracking-wider transition-all ${
                  pathname.startsWith("/fantasy")
                    ? "bg-ember text-char"
                    : "bg-ember/10 text-ember hover:bg-ember hover:text-char"
                }`}
              >
                Fantasy
                <span className="absolute -right-1 -top-1 h-2 w-2 bg-ember" />
              </Link>
            </li>

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
          </ul>

          {/* Auth area */}
          <div className="ml-5 flex items-center border-l border-bone/15 pl-5">
            {!session ? (
              <div className="flex items-center gap-2">
                {/* Login */}
                <Link
                  href="/login"
                  className={`px-4 py-2 font-display text-lg font-bold uppercase tracking-wider transition-colors ${
                    pathname === "/login"
                      ? "text-ember"
                      : "text-bone/70 hover:text-bone"
                  }`}
                >
                  Login
                </Link>

                {/* Register */}
                <Link
                  href="/register"
                  className="chamfer-sm border border-ember bg-ember px-5 py-2 font-display text-lg font-bold uppercase tracking-wider text-char transition-colors hover:bg-transparent hover:text-ember"
                >
                  Register
                </Link>
              </div>
            ) : (
              /* Logged in profile */
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-3 border border-bone/10 bg-bone/[0.03] px-3 py-2 transition-colors hover:border-bone/25 hover:bg-bone/[0.06]"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  {/* Avatar */}
                  <span className="flex h-9 w-9 items-center justify-center bg-ember font-display text-lg font-black uppercase text-char">
                    {avatarLetter}
                  </span>

                  {/* Username */}
                  <span className="max-w-[140px] truncate font-display text-base font-bold uppercase tracking-wide text-bone">
                    {username}
                  </span>

                  {/* Chevron */}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`transition-transform ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="square"
                    />
                  </svg>
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-64 border border-bone/10 bg-[#171717] shadow-2xl">
                    {/* Profile header */}
                    <div className="border-b border-bone/10 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-ember font-display text-2xl font-black uppercase text-char">
                          {avatarLetter}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate font-display text-lg font-black uppercase text-bone">
                            {username}
                          </p>

                          <p className="mt-0.5 font-stat text-[9px] uppercase tracking-[0.2em] text-ash">
                            {session.role === "admin"
                              ? "Administrator"
                              : "FFWS Member"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu */}
                    <div className="p-2">
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 font-display text-base font-bold uppercase tracking-wide transition-colors ${
                          pathname.startsWith("/profile")
                            ? "bg-ember text-char"
                            : "text-bone/80 hover:bg-bone/[0.06] hover:text-bone"
                        }`}
                      >
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <circle
                            cx="12"
                            cy="8"
                            r="3.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M5 20C5.8 16.7 8.2 15 12 15C15.8 15 18.2 16.7 19 20"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>

                        Profile
                      </Link>

                      <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 px-3 py-3 font-display text-base font-bold uppercase tracking-wide text-bone/80 transition-colors hover:bg-bone/[0.06] hover:text-ember"
                      >
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M10 17L15 12L10 7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M15 12H3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M15 4H19C20.1 4 21 4.9 21 6V18C21 19.1 20.1 20 19 20H15"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>

                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="font-stat text-xs uppercase tracking-widest text-bone md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? "Close ✕" : "Menu ☰"}
        </button>
      </nav>

      {/* Mobile navigation */}
      {open && (
        <div className="border-t border-bone/10 bg-char px-5 py-3 md:hidden">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block py-3 font-display text-2xl font-extrabold uppercase ${
                    pathname.startsWith(l.href)
                      ? "text-ember"
                      : "text-bone"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}

            {/* Mobile Fantasy CTA */}
            <li className="mt-2 border-t border-bone/10 pt-2">
              <Link
                href="/fantasy"
                onClick={() => setOpen(false)}
                className={`chamfer-sm block border-2 border-ember px-4 py-3 font-display text-2xl font-black uppercase tracking-wide ${
                  pathname.startsWith("/fantasy")
                    ? "bg-ember text-char"
                    : "bg-ember/10 text-ember"
                }`}
              >
                Fantasy
              </Link>
            </li>

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
          </ul>

          {/* Mobile auth */}
          <div className="mt-2 border-t border-bone/10 pt-3">
            {!session ? (
              <div className="flex gap-3 pb-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-bone/15 py-3 text-center font-display text-xl font-extrabold uppercase text-bone"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-ember py-3 text-center font-display text-xl font-extrabold uppercase text-char"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="pb-2">
                {/* Mobile user header */}
                <div className="mb-2 flex items-center gap-3 border border-bone/10 bg-bone/[0.03] p-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-ember font-display text-xl font-black uppercase text-char">
                    {avatarLetter}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-black uppercase text-bone">
                      {username}
                    </p>

                    <p className="font-stat text-[9px] uppercase tracking-[0.2em] text-ash">
                      {session.role === "admin"
                        ? "Administrator"
                        : "FFWS Member"}
                    </p>
                  </div>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="block py-3 font-display text-2xl font-extrabold uppercase text-bone"
                >
                  Profile
                </Link>

                <button
                  onClick={logout}
                  className="block py-3 font-display text-2xl font-extrabold uppercase text-bone"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}