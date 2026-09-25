"use client";
import Link from "next/link"; import { usePathname } from "next/navigation"; import { useState } from "react"; import { Menu, X } from "lucide-react"; import Logo from "./Logo";
const links = ["tournament", "teams", "players", "stats", "matches", "fantasy", "news"];
export default function Header() {
  const [open, setOpen] = useState(false); const path = usePathname();
  const cls = (h: string) => `text-sm font-semibold tracking-wider ${path.startsWith(h) && h !== "/" || path === h ? "text-accent" : "text-white/80 hover:text-white"}`;
  return (<header className="sticky top-0 z-50 border-b border-line bg-ink/95 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
      <Logo />
      <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
        <Link href="/" className={cls("/")}>HOME</Link>
        {links.map((l) => <Link key={l} href={`/${l}`} className={cls(`/${l}`)}>{l.toUpperCase()}</Link>)}
      </nav>
      <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav className="border-t border-line lg:hidden" aria-label="Mobile">
      {["", ...links].map((l) => <Link key={l} href={`/${l}`} onClick={() => setOpen(false)} className="block border-b border-line px-4 py-3 text-sm font-semibold tracking-wider">{l ? l.toUpperCase() : "HOME"}</Link>)}
    </nav>}
  </header>);
}
