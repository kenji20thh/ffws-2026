import Link from "next/link";
import type { Room, RoomTeamSummary, TeamStanding, Tournament } from "@/types";
import Badge from "@/components/ui/Badge";
import CurrentRoomWidget from "./CurrentRoomWidget";
import ResultsTicker from "./ResultsTicker";
import StandingsPreview from "./StandingsPreview";

interface Props {
  tournament: Tournament;
  standings: TeamStanding[];
  currentRoom: Room | null;
  tickerRoom: Room | null;
  tickerResults: RoomTeamSummary[];
}

export default function LiveHub({ tournament, standings, currentRoom, tickerRoom, tickerResults }: Props) {
  return (
    <div>
      <section className="map-grid px-5 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3">
            <Badge tone="live">Live</Badge>
            <span className="font-stat text-[11px] uppercase tracking-widest text-ash">{tournament.name}</span>
          </div>
          <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-black uppercase leading-[0.9]">
            The zone is <span className="text-ember">active</span>
          </h1>
        </div>
      </section>

      <ResultsTicker room={tickerRoom} results={tickerResults} />

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-14 lg:grid-cols-[1fr_1.2fr]">
        <CurrentRoomWidget room={currentRoom} />
        <StandingsPreview rows={standings} />
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-5 pb-16">
        <Link href="/schedule" className="chamfer-sm border border-bone/20 px-5 py-2 font-display text-lg font-bold uppercase text-bone/80 hover:border-ember hover:text-ember">
          Full schedule
        </Link>
        <Link href="/players" className="chamfer-sm border border-bone/20 px-5 py-2 font-display text-lg font-bold uppercase text-bone/80 hover:border-ember hover:text-ember">
          Kill leaders
        </Link>
      </div>
    </div>
  );
}