import Link from "next/link";
import Monogram from "@/components/ui/Monogram";
import type { Team } from "@/types";

const countryFlags: Record<string, string> = {
  Morocco: "🇲🇦",
  Mexico: "🇲🇽",
  Indonesia: "🇮🇩",
  Vietnam: "🇻🇳",
  Thailand: "🇹🇭",
  Malaysia: "🇲🇾",
  Singapore: "🇸🇬",
  Philippines: "🇵🇭",
  India: "🇮🇳",
  Brazil: "🇧🇷",
  Pakistan: "🇵🇰",
  Bangladesh: "🇧🇩",
  Nepal: "🇳🇵",
};

export default function TeamCard({ team }: { team: Team }) {
  const flag = team.country ? countryFlags[team.country] : undefined;

  return (
    <Link
      href={`/teams/${team.id}`}
      className="group chamfer relative block border border-bone/10 bg-char-2 p-5 transition-colors hover:border-ember"
    >
      {/* corner brackets */}
      <span className="absolute left-2 top-2 h-3 w-3 border-l border-t border-ember opacity-0 transition-all group-hover:-left-0 group-hover:-top-0 group-hover:opacity-100" />

      <span className="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-ember opacity-0 transition-all group-hover:bottom-0 group-hover:right-0 group-hover:opacity-100" />

      {/* Country flag */}
      {flag && (
        <span
          className="absolute right-5 top-5 text-2xl leading-none"
          title={team.country}
        >
          {flag}
        </span>
      )}

      <div className="flex items-start">
        <Monogram
          label={team.tag || team.name}
          imageUrl={team.logo_url}
          size={72}
        />
      </div>

      <h3 className="mt-5 font-display text-3xl font-extrabold uppercase leading-none">
        {team.name}
      </h3>

      <p className="mt-2 font-stat text-[11px] uppercase tracking-widest text-ash">
        {[team.country, team.region].filter(Boolean).join(" · ") || "—"}
      </p>
    </Link>
  );
}
