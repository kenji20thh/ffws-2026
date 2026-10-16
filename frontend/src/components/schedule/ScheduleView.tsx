"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { getDayTeams, getRoomResults, getRooms } from "@/lib/api";
import type { DayTeam, Room, RoomTeamSummary, TournamentDay } from "@/types";
import RoomCard from "./RoomCard";
import RoomResultsTable from "./RoomResultsTable";
import TeamsOfDay from "./TeamsOfDay";
import {
  GROUPS,
  GROUP_BY_KEY,
  groupForTeam,
  phaseOneSlot,
  sessionGroups,
  PHASE_ONE_ROTATION,
  type GroupDef,
  type GroupKey,
  type SessionKey,
} from "@/lib/tournamentFormat";

type StageName = "knockout" | "last-chance" | "grand-final";

function stageForDay(day: TournamentDay): StageName {
  const name = day.name.toLowerCase();
  if (name.includes("last chance")) return "last-chance";
  if (name.includes("grand final")) return "grand-final";
  return "knockout";
}

function formatDate(date: string) {
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function Chevron({ open }: { open: boolean }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}

function StageHeading({ number, title, subtitle, open }: { number: string; title: string; subtitle: string; open: boolean }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center border font-display text-xl font-black ${open ? "border-ember bg-ember text-char" : "border-char-3 bg-char-2 text-ash"}`}>{number}</div>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-extrabold uppercase tracking-wide text-bone sm:text-2xl">{title}</h2>
        <p className="mt-1 font-stat text-[10px] uppercase tracking-[0.14em] text-ash sm:text-xs">{subtitle}</p>
      </div>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center border ${open ? "border-ember text-ember" : "border-char-3 text-ash"}`}><Chevron open={open} /></span>
    </div>
  );
}

function ExpandButton({ open, children, onClick }: { open: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-expanded={open} className="flex w-full items-center justify-between gap-3 border border-char-3 bg-char-2 px-4 py-3 text-left transition-colors hover:border-ember/60"><span className="font-display text-sm font-bold uppercase tracking-wide text-bone">{children}</span><span className="text-ember"><Chevron open={open} /></span></button>;
}

export default function ScheduleView({ days }: { days: TournamentDay[] }) {
  const [expandedStage, setExpandedStage] = useState<StageName | null>("knockout");
  const [expandedGroups, setExpandedGroups] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [expandedDayId, setExpandedDayId] = useState<number | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [dayId, setDayId] = useState(days[0]?.id ?? 0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dayTeams, setDayTeams] = useState<DayTeam[]>([]);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [results, setResults] = useState<RoomTeamSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const knockoutDays = days.filter((day) => stageForDay(day) === "knockout").sort((a, b) => a.day_order - b.day_order);
  const lastChanceDays = days.filter((day) => stageForDay(day) === "last-chance").sort((a, b) => a.day_order - b.day_order);
  const grandFinalDays = days.filter((day) => stageForDay(day) === "grand-final").sort((a, b) => a.day_order - b.day_order);
  const activeDay = days.find((day) => day.id === dayId) ?? days[0];
  const room = rooms.find((item) => item.id === roomId) ?? null;
  const isLive = room?.status === "live";

  function chooseDay(day: TournamentDay) {
    setDayId(day.id);
    setExpandedDayId((current) => current === day.id ? null : day.id);
    setShowDayDetails(false);
  }

  useEffect(() => {
    if (!dayId || !showDayDetails) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRooms([]);
    setDayTeams([]);
    setRoomId(null);
    setResults([]);
    Promise.all([getRooms(dayId), getDayTeams(dayId)])
      .then(([loadedRooms, loadedTeams]) => {
        if (cancelled) return;
        setRooms(loadedRooms);
        setDayTeams(loadedTeams);
        const liveRoom = loadedRooms.find((item) => item.status === "live");
        setRoomId((liveRoom ?? loadedRooms[0])?.id ?? null);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load day"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dayId, showDayDetails]);

  useEffect(() => {
    if (!roomId || !showDayDetails) { setResults([]); return; }
    let cancelled = false;
    const loadResults = () => getRoomResults(roomId).then((data) => { if (!cancelled) setResults(data); }).catch(() => {});
    loadResults();
    if (!isLive) return () => { cancelled = true; };
    const intervalId = setInterval(loadResults, 10_000);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [roomId, isLive, showDayDetails]);

  if (days.length === 0) return <EmptyState title="Schedule not announced" hint="Tournament stages, groups, and match days will appear here." />;

  const renderDays = (stageDays: TournamentDay[], label: string) => (
    <div className="space-y-2">
      {stageDays.length === 0 ? <EmptyState title={`${label} schedule not announced`} /> : stageDays.map((day) => {
        const open = expandedDayId === day.id;
        return <div key={day.id} className={`border ${open ? "border-ember/60" : "border-char-3"} bg-char`}>
          <button type="button" onClick={() => chooseDay(day)} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-char-2 sm:p-4">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center font-display text-sm font-black ${open ? "bg-ember text-char" : "bg-char-2 text-ash"}`}>{String(day.day_order).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1"><span className="block font-display text-sm font-bold uppercase text-bone">{day.name}</span><span className="mt-1 block font-stat text-[10px] uppercase tracking-widest text-ash">{day.date ? `${formatDate(day.date)} 2026` : "Date to be confirmed"}</span></span>
            <DayGroupsSummary day={day} />
            <span className="text-ember"><Chevron open={open} /></span>
          </button>
          {open && <div className="space-y-3 border-t border-char-3 p-3 sm:p-4">
            <p className="text-sm leading-6 text-ash">Open this match day to see participating teams, assigned rooms, and available standings.</p>
            <button type="button" onClick={() => { setDayId(day.id); setShowDayDetails((current) => dayId === day.id ? !current : true); }} className="inline-flex items-center gap-2 bg-ember px-4 py-2.5 font-display text-xs font-black uppercase tracking-wide text-char transition hover:bg-ember/90">{showDayDetails && dayId === day.id ? "Hide teams & results" : "View teams & match details"}<Chevron open={showDayDetails && dayId === day.id} /></button>
            {showDayDetails && dayId === day.id && <div className="space-y-7 pt-3">
              {error ? <ErrorState message={error} /> : loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3].map((i) => <Skeleton key={i} className="h-32" />)}</div> : <>
                {phaseOneSlot(day.day_order) ? <PhaseOneDay day={day} dayTeams={dayTeams} rooms={rooms} roomId={roomId} onSelectRoom={setRoomId} /> : <>
                <section><h4 className="mb-3 font-stat text-[10px] uppercase tracking-[0.25em] text-ember">Teams playing</h4>{dayTeams.length === 0 ? <EmptyState title="Teams not assigned yet" hint="Participating teams will appear here once assigned to this day." /> : <TeamsOfDay teams={dayTeams} />}</section>
                <section><h4 className="mb-3 font-stat text-[10px] uppercase tracking-[0.25em] text-ember">Match rooms</h4>{rooms.length === 0 ? <EmptyState title="No rooms yet" hint="Room assignments will appear here when available." /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{rooms.map((item) => <RoomCard key={item.id} room={item} active={item.id === roomId} onSelect={() => setRoomId(item.id)} />)}</div>}</section>
                </>}
                {room && <section><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">{isLive ? "Live results" : "Room standings"}</p><h4 className="mt-1 font-display text-2xl font-extrabold uppercase text-bone">Room {room.room_number}</h4></div>{isLive && <span className="flex items-center gap-2 font-stat text-[10px] uppercase tracking-widest text-ember"><span className="h-2 w-2 animate-pulse rounded-full bg-ember" />Live · refreshes every 10s</span>}</div>{results.length === 0 ? <EmptyState title="No results yet" hint="Room results will appear here when available." /> : <RoomResultsTable rows={results} />}</section>}
              </>}
            </div>}
          </div>}
        </div>;
      })}
    </div>
  );

  return <div className="space-y-8 sm:space-y-10">
    <section className="relative overflow-hidden border border-char-3 bg-char p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 85% 10%, rgba(255,176,0,.22), transparent 32%), linear-gradient(135deg, transparent 40%, rgba(116,65,180,.16) 40%, rgba(116,65,180,.16) 60%, transparent 60%)" }} />
      <div className="relative max-w-3xl">
        <p className="font-stat text-[10px] uppercase tracking-[0.3em] text-ember">Free Fire World Series · 2026</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase leading-none text-bone sm:text-5xl">Tournament <span className="text-ember">Format</span></h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-ash sm:text-base">Follow the road to the championship. Expand a stage to understand how it works, open a match day when you need it, and reveal teams or results only when you want to see them.</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-3"><div className="border border-char-3 bg-char-2/80 p-3"><p className="font-stat text-[10px] uppercase tracking-widest text-ash">Knockout Phase 1</p><p className="mt-1 font-display text-lg font-black uppercase text-ember">Nov 6–15</p><p className="text-xs text-ash">24 teams · 4 groups · 36 matches</p></div><div className="border border-char-3 bg-char-2/80 p-3"><p className="font-stat text-[10px] uppercase tracking-widest text-ash">Knockout Phase 2</p><p className="mt-1 font-display text-lg font-black uppercase text-ember">Nov 19–22</p><p className="text-xs text-ash">Top 18 in 4 pools · 8 Grand Finals spots</p></div><div className="border border-char-3 bg-char-2/80 p-3"><p className="font-stat text-[10px] uppercase tracking-widest text-ash">Final stretch</p><p className="mt-1 font-display text-lg font-black uppercase text-ember">Nov 27–28</p><p className="text-xs text-ash">Last Chance (4 spots) · Grand Finals</p></div></div>
      </div>
    </section>

    <section className="space-y-3">
      <div><p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">Tournament roadmap</p><h2 className="mt-1 font-display text-2xl font-black uppercase text-bone sm:text-3xl">Explore the stages</h2><p className="mt-2 text-sm text-ash">Choose a stage to see its format. Match-day details remain collapsed until you open them.</p></div>

      <section className={`border ${expandedStage === "knockout" ? "border-ember/60" : "border-char-3"} bg-char`}>
        <button type="button" onClick={() => setExpandedStage((current) => current === "knockout" ? null : "knockout")} aria-expanded={expandedStage === "knockout"} className="w-full p-4 text-left transition-colors hover:bg-char-2 sm:p-5"><StageHeading number="01" title="Knockout Stage" subtitle="Phase 1 · November 6–15  /  Phase 2 · November 19–22" open={expandedStage === "knockout"} /></button>
        {expandedStage === "knockout" && <div className="space-y-5 border-t border-char-3 p-4 sm:p-5">
          <div className="border-l-2 border-ember pl-4"><p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">Phase 1 · November 6–15</p><h3 className="mt-1 font-display text-xl font-extrabold uppercase text-bone">Group stage</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-ash">24 teams are split into four groups of six and battle for ranking points over two weeks (Friday to Sunday, 6 match days, 36 matches). Every match day all 24 teams play, in two separate sessions of 12 teams. After Phase 1, the top 12 enter Pool 1 of Phase 2, places 13–18 fill Pools 2–4, places 19–20 go to Last Chance and the rest are eliminated.</p></div>
          <div className="border border-char-3 bg-char-2">
            <ExpandButton open={expandedGroups} onClick={() => setExpandedGroups((open) => !open)}>Group distribution · 24 teams across 4 groups</ExpandButton>
            {expandedGroups && <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">{GROUPS.map((group, index) => <GroupPanel key={group.name} group={group} index={index} />)}</div>}
          </div>
          <MatchRotation />
          <div className="space-y-3"><div className="border-l-2 border-ember pl-4"><p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">Phase 1 · Match days</p><h3 className="mt-1 font-display text-lg font-extrabold uppercase text-bone">Choose a day to explore</h3></div>{renderDays(knockoutDays.filter((day) => day.day_order <= 6), "Phase 1")}</div>
          <div className="border-t border-char-3 pt-5"><div className="border-l-2 border-ember pl-4"><p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">Phase 2 · November 19–22</p><h3 className="mt-1 font-display text-xl font-extrabold uppercase text-bone">Knockout progression</h3><p className="mt-2 text-sm leading-6 text-ash">Teams are placed in pools by their Phase 1 ranking. Each day 12 teams play and the top 2 qualify for the Grand Finals. Day 1: all of Pool 1 · Day 2: remaining 10 + 2 from Pool 2 · Day 3: remaining 10 + 2 from Pool 3 · Day 4: remaining 10 + 2 from Pool 4. The bottom 10 teams on Day 4 move to Last Chance.</p></div><div className="mt-4">{renderDays(knockoutDays.filter((day) => day.day_order >= 7), "Phase 2")}</div></div>
        </div>}
      </section>

      <section className={`border ${expandedStage === "last-chance" ? "border-ember/60" : "border-char-3"} bg-char`}>
        <button type="button" onClick={() => setExpandedStage((current) => current === "last-chance" ? null : "last-chance")} aria-expanded={expandedStage === "last-chance"} className="w-full p-4 text-left transition-colors hover:bg-char-2 sm:p-5"><StageHeading number="02" title="Last Chance" subtitle="November 27 · Final opportunity to qualify" open={expandedStage === "last-chance"} /></button>
        {expandedStage === "last-chance" && <div className="space-y-4 border-t border-char-3 p-4 sm:p-5"><p className="max-w-3xl text-sm leading-6 text-ash">12 teams (2 from Phase 1 and 10 from Phase 2) play 10 matches. The top 4 teams advance to the Grand Finals and the rest are eliminated.</p>{renderDays(lastChanceDays, "Last Chance")}</div>}
      </section>

      <section className={`border ${expandedStage === "grand-final" ? "border-ember/60" : "border-char-3"} bg-char`}>
        <button type="button" onClick={() => setExpandedStage((current) => current === "grand-final" ? null : "grand-final")} aria-expanded={expandedStage === "grand-final"} className="w-full p-4 text-left transition-colors hover:bg-char-2 sm:p-5"><StageHeading number="03" title="Grand Finals" subtitle="November 28 · Championship day" open={expandedStage === "grand-final"} /></button>
        {expandedStage === "grand-final" && <div className="space-y-4 border-t border-char-3 p-4 sm:p-5"><p className="max-w-3xl text-sm leading-6 text-ash">12 teams play in Champion Rush format at BITEC LIVE, Bangkok: 2 teams from each Phase 2 day plus 4 from Last Chance. Expand the day to check team assignments and match information.</p>{renderDays(grandFinalDays, "Grand Final")}</div>}
      </section>
    </section>
  </div>;
}

function GroupPanel({ group, index }: { group: GroupDef; index: number }) {
  const [open, setOpen] = useState(false);
  return <div className="overflow-hidden border border-char-3 bg-char">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-char-2">
      <span className="h-9 w-1 shrink-0" style={{ backgroundColor: group.color }} />
      <span className="min-w-0 flex-1"><span className="block font-display text-base font-extrabold uppercase text-bone">{group.name}</span><span className="mt-1 block text-xs text-ash">6 participating teams</span></span>
      <span className="font-stat text-[10px] uppercase tracking-widest" style={{ color: group.color }}>Group 0{index + 1}</span><span className="text-ash"><Chevron open={open} /></span>
    </button>
    {open && <div className="grid grid-cols-2 border-t border-char-3">{group.teams.map((team, teamIndex) => <div key={team.name} className={`flex min-h-[68px] items-center gap-2 px-3 py-2 ${teamIndex % 2 === 0 ? "border-r border-char-3" : ""} ${teamIndex >= 2 ? "border-t border-char-3" : ""}`}><div className="relative h-9 w-9 shrink-0"><Image src={team.logo} alt={`${team.name} logo`} fill sizes="36px" className="object-contain" /></div><span className="text-xs font-semibold leading-4 text-bone">{team.name}</span></div>)}</div>}
  </div>;
}

function GroupChip({ group, size = "sm" }: { group: GroupKey; size?: "sm" | "xs" }) {
  return <span className={`inline-flex items-center font-stat font-bold uppercase text-char ${size === "xs" ? "h-5 px-1.5 text-[9px]" : "h-6 px-2 text-[10px]"}`} style={{ backgroundColor: GROUP_BY_KEY[group].color }}>{size === "xs" ? group : `Group ${group}`}</span>;
}

function Pair({ pair }: { pair: [GroupKey, GroupKey] }) {
  return <span className="inline-flex items-center gap-1"><GroupChip group={pair[0]} size="xs" /><span className="text-[10px] text-ash">×</span><GroupChip group={pair[1]} size="xs" /></span>;
}

/** Official Phase 1 rotation grid: 2 weeks × 3 days × 2 sessions. */
function MatchRotation() {
  const sessions: { key: SessionKey; label: string }[] = [{ key: "session-1", label: "Session 1" }, { key: "session-2", label: "Session 2" }];
  return <div className="border border-char-3 bg-char-2 p-4">
    <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">Match format</p>
    <h4 className="mt-1 font-display text-lg font-extrabold uppercase text-bone">Two sessions per match day · all 24 teams play every day</h4>
    <p className="mt-2 text-sm leading-6 text-ash">Each session is played separately by 12 teams (two groups). Matchdays run Friday to Sunday, so every group faces every other group once per week.</p>
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      {[1, 2].map((week) => <div key={week} className="border border-char-3 bg-char p-3">
        <div className="flex items-baseline justify-between"><p className="font-stat text-[10px] uppercase tracking-widest text-ember">Week {week}</p><p className="font-display text-sm font-bold uppercase text-bone">{week === 1 ? "November 6–8" : "November 13–15"}</p></div>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[300px] text-left"><thead><tr className="font-stat text-[10px] uppercase tracking-wider text-ash"><th className="py-2 pr-2 font-normal" />{[1, 2, 3].map((d) => <th key={d} className="px-2 py-2 font-normal">Day {d}</th>)}</tr></thead>
          <tbody>{sessions.map((session) => <tr key={session.key} className="border-t border-char-3"><th className="py-2.5 pr-2 font-display text-xs font-bold uppercase text-bone">{session.label}</th>{[1, 2, 3].map((d) => <td key={d} className="px-2 py-2.5"><Pair pair={PHASE_ONE_ROTATION[week][d][session.key]} /></td>)}</tr>)}</tbody></table></div>
      </div>)}
    </div>
  </div>;
}

/** Compact "S1 A×B · S2 C×D" summary shown on a Phase 1 day header. */
function DayGroupsSummary({ day }: { day: TournamentDay }) {
  const s1 = sessionGroups(day.day_order, "session-1");
  const s2 = sessionGroups(day.day_order, "session-2");
  if (!s1 || !s2) return null;
  return <span className="hidden shrink-0 items-center gap-3 sm:flex"><span className="flex items-center gap-1.5"><span className="font-stat text-[9px] uppercase tracking-widest text-ash">S1</span><Pair pair={s1} /></span><span className="flex items-center gap-1.5"><span className="font-stat text-[9px] uppercase tracking-widest text-ash">S2</span><Pair pair={s2} /></span></span>;
}

/** Phase 1 match day: 24 teams, split into two separately played 12-team sessions. */
function PhaseOneDay({ day, dayTeams, rooms, roomId, onSelectRoom }: { day: TournamentDay; dayTeams: DayTeam[]; rooms: Room[]; roomId: number | null; onSelectRoom: (id: number) => void }) {
  const sortedRooms = [...rooms].sort((a, b) => a.room_number - b.room_number);
  const midpoint = Math.ceil(sortedRooms.length / 2);
  const sessions: { key: SessionKey; label: string; rooms: Room[] }[] = [
    { key: "session-1", label: "Session 1", rooms: sortedRooms.slice(0, midpoint) },
    { key: "session-2", label: "Session 2", rooms: sortedRooms.slice(midpoint) },
  ];

  return <>
    {sessions.map((session) => {
      const pair = sessionGroups(day.day_order, session.key);
      const sessionTeams = pair ? dayTeams.filter((dt) => { const g = groupForTeam(dt.team); return g !== undefined && pair.includes(g); }) : [];
      // if team names did not match the group list, still show everyone rather than hide teams
      const matched = sessionTeams.length > 0;
      return <section key={session.key} className="space-y-4 border border-char-3 bg-char-2/40 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-display text-lg font-extrabold uppercase text-bone">{session.label}</h4>{pair && <span className="flex items-center gap-2"><GroupChip group={pair[0]} /><span className="text-xs text-ash">×</span><GroupChip group={pair[1]} /><span className="ml-1 font-stat text-[10px] uppercase tracking-widest text-ash">12 teams</span></span>}</div>
        <div><p className="mb-3 font-stat text-[10px] uppercase tracking-[0.25em] text-ember">Teams playing</p>{dayTeams.length === 0 ? <EmptyState title="Teams not assigned yet" hint="Participating teams will appear here once assigned to this day." /> : <TeamsOfDay teams={matched ? sessionTeams : dayTeams} />}</div>
        <div><p className="mb-3 font-stat text-[10px] uppercase tracking-[0.25em] text-ember">Match rooms</p>{session.rooms.length === 0 ? <EmptyState title="No rooms yet" hint="Room assignments will appear here when available." /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{session.rooms.map((item) => <RoomCard key={item.id} room={item} active={item.id === roomId} onSelect={() => onSelectRoom(item.id)} />)}</div>}</div>
      </section>;
    })}
  </>;
}
