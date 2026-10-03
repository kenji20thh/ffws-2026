import Image from "next/image";
import EmptyState from "@/components/ui/EmptyState";
import { countryFlag } from "@/lib/flags";
import type { TeamStanding } from "@/types";

type StandingsRow = TeamStanding & {
logo_url: string;
country: string;
};

export default function StandingsTable({
rows,
}: {
rows: StandingsRow[];
}) {
if (rows.length === 0) {
return (
<EmptyState title="No results yet" hint="Standings appear after the first room." />
);
}

return (
<div className="overflow-x-auto">
<table className="w-full min-w-[620px] text-left">
<thead>
<tr className="border-b border-bone/15 font-stat text-[10px] uppercase tracking-widest text-ash">
<th className="py-3 pr-3">#</th>
<th className="py-3">Team</th>
<th className="py-3 text-right">Rooms</th>
<th className="py-3 text-right">Place</th>
<th className="py-3 text-right">Kills</th>
<th className="py-3 text-right text-ember">Total</th>
</tr>
</thead>

    <tbody>
      {rows.map((r, i) => (
        <tr
          key={r.team_id}
          className="border-b border-bone/5 transition-colors hover:bg-char-2"
        >
          <td
            className={`py-3 pr-3 font-display text-3xl font-black ${
              i === 0 ? "text-amber" : "text-bone/60"
            }`}
          >
            {i + 1}
          </td>

          <td className="py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-char-2">
                {r.logo_url ? (
                  <Image
                    src={r.logo_url}
                    alt={r.team_name}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <span className="font-display text-sm font-bold text-bone/30">
                    {r.team_name.slice(0, 2)}
                  </span>
                )}
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-display text-xl font-bold uppercase text-bone sm:text-2xl">
                  {r.team_name}
                </span>

                <span
                  className="shrink-0 text-base"
                  title={r.country || "Unknown"}
                >
                  {countryFlag(r.country)}
                </span>
              </div>
            </div>
          </td>

          <td className="py-3 text-right font-stat tabular-nums">
            {r.rooms_played}
          </td>

          <td className="py-3 text-right font-stat tabular-nums">
            {r.placement_points}
          </td>

          <td className="py-3 text-right font-stat tabular-nums">
            {r.kill_points}
          </td>

          <td className="py-3 text-right font-stat text-lg font-bold tabular-nums text-ember">
            {r.total_points}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

);
}