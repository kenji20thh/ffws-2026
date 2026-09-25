import Link from "next/link"; import Logo from "./Logo";
export default function Footer() {
  return (<footer className="mt-20 border-t border-line">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:justify-between">
      <div className="max-w-sm space-y-2"><Logo /><p className="text-sm text-muted">Tournament hub, statistics and fantasy for the FFWS World Cup. Demo content is marked as such until official data is available.</p></div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        {["tournament", "teams", "players", "stats", "matches", "fantasy", "news"].map((l) => <Link key={l} href={`/${l}`} className="capitalize hover:text-white">{l}</Link>)}
      </div>
    </div>
    <div className="border-t border-line py-4 text-center text-xs text-muted">© 2026 FFWS World Cup. Fan platform frontend, first version.</div>
  </footer>);
}
