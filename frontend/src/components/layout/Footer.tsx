import Link from "next/link";

export default function Footer() {
return ( <footer className="border-t border-bone/10 bg-char-2"> <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 md:flex-row md:items-end md:justify-between"> <div> <p className="font-display text-5xl font-black uppercase leading-none">
Free Fire <span className="text-ember">World Series</span> </p> <p className="mt-2 font-stat text-[11px] uppercase tracking-widest text-ash">
Last zone standing · 2026 </p> </div>

    <ul className="flex flex-wrap gap-6 font-display text-lg font-bold uppercase tracking-wider text-bone/70">
      <li>
        <Link href="/teams" className="hover:text-ember">
          Teams
        </Link>
      </li>

      <li>
        <Link href="/schedule" className="hover:text-ember">
          Schedule
        </Link>
      </li>

      <li>
        <Link href="/standings" className="hover:text-ember">
          Standings
        </Link>
      </li>

      <li>
        <Link href="/players" className="hover:text-ember">
          Players
        </Link>
      </li>

      <li>
        <Link href="/fantasy" className="hover:text-ember">
          Fantasy
        </Link>
      </li>

      <li>
        <Link href="/news" className="hover:text-ember">
          News
        </Link>
      </li>
    </ul>
  </div>

  <p className="border-t border-bone/5 py-4 text-center font-stat text-[10px] uppercase tracking-widest text-ash">
    Fan project · not affiliated with Garena
  </p>
</footer>

);
}
