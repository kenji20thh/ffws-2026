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

type Group = { name: string; color: string; teams: string[] };
type StageName = "knockout" | "last-chance" | "grand-final";

const GROUPS: Group[] = [
  { name: "Group A", color: "#ff5a1f", teams: ["LYON", "Team Flash", "ONIC Olympus", "LOS Grandes", "Horaa Esports", "XPROJEKT Esports"] },
  { name: "Group B", color: "#ffb000", teams: ["Bigetron by Vitality", "Blue Cheese", "P Esports", "Resurrection Esports", "Pirate Esports", "ParadoX Gaming"] },
  { name: "Group C", color: "#c42cff", teams: ["LOUD GG", "Team Apex Gaming", "GOW", "RRQ Kazu", "Gun Dynasty", "Total Winner Esports"] },
  { name: "Group D", color: "#25d366", teams: ["Team Infinity", "All Gamers Global", "Buriram United Esports", "TSG Pros", "Stellar Esports", "FLUXO"] },
];

const TEAM_LOGOS: Record<string, string> = {
  LYON: "/teams/LYON.png", "Team Flash": "/teams/FLASH.png", "ONIC Olympus": "/teams/ONIC.png", "LOS Grandes": "/teams/LOS.png", "Horaa Esports": "/teams/HE.png", "XPROJEKT Esports": "/teams/XP.png",
  "Bigetron by Vitality": "/teams/BTR.png", "Blue Cheese": "/teams/BlueCheese.png", "P Esports": "/teams/pe.png", "Resurrection Esports": "/teams/RES.png", "Pirate Esports": "/teams/PIRATE.png", "ParadoX Gaming": "/teams/PDX.png",
  "LOUD GG": "/teams/LOUD.png", "Team Apex Gaming": "/teams/APEX.png", GOW: "/teams/GOW.png", "RRQ Kazu": "/teams/RRQ.png", "Gun Dynasty": "/teams/GunDynasty.png", "Total Winner Esports": "/teams/TOTALWINNER.png",
  "Team Infinity": "/teams/INF.png", "All Gamers Global": "/teams/AG.png", "Buriram United Esports": "/teams/BRU.png", "TSG Pros": "/teams/TSG.png", "Stellar Esports": "/teams/STELLAR.png", FLUXO: "/teams/fluxo.png",
};

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
            <span className="text-ember"><Chevron open={open} /></span>
          </button>
          {open && <div className="space-y-3 border-t border-char-3 p-3 sm:p-4">
            <p className="text-sm leading-6 text-ash">Open this match day to see participating teams, assigned rooms, and available standings.</p>
            <button type="button" onClick={() => { setDayId(day.id); setShowDayDetails((current) => dayId === day.id ? !current : true); }} className="inline-flex items-center gap-2 bg-ember px-4 py-2.5 font-display text-xs font-black uppercase tracking-wide text-char transition hover:bg-ember/90">{showDayDetails && dayId === day.id ? "Hide teams & results" : "View teams & match details"}<Chevron open={showDayDetails && dayId === day.id} /></button>
            {showDayDetails && dayId === day.id && <div className="space-y-7 pt-3">
              {error ? <ErrorState message={error} /> : loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3].map((i) => <Skeleton key={i} className="h-32" />)}</div> : <>
                <section><h4 className="mb-3 font-stat text-[10px] uppercase tracking-[0.25em] text-ember">Teams playing</h4>{dayTeams.length === 0 ? <EmptyState title="Teams not assigned yet" hint="Participating teams will appear here once assigned to this day." /> : <TeamsOfDay teams={dayTeams} />}</section>
                <section><h4 className="mb-3 font-stat text-[10px] uppercase tracking-[0.25em] text-ember">Match rooms</h4>{rooms.length === 0 ? <EmptyState title="No rooms yet" hint="Room assignments will appear here when available." /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{rooms.map((item) => <RoomCard key={item.id} room={item} active={item.id === roomId} onSelect={() => setRoomId(item.id)} />)}</div>}</section>
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
        <div className="mt-6 grid gap-2 sm:grid-cols-3"><div className="border border-char-3 bg-char-2/80 p-3"><p className="font-stat text-[10px] uppercase tracking-widest text-ash">Knockout Phase 1</p><p className="mt-1 font-display text-lg font-black uppercase text-ember">Nov 6–15</p><p className="text-xs text-ash">24 teams · 4 groups</p></div><div className="border border-char-3 bg-char-2/80 p-3"><p className="font-stat text-[10px] uppercase tracking-widest text-ash">Knockout Phase 2</p><p className="mt-1 font-display text-lg font-black uppercase text-ember">Nov 19–22</p><p className="text-xs text-ash">Progression stage</p></div><div className="border border-char-3 bg-char-2/80 p-3"><p className="font-stat text-[10px] uppercase tracking-widest text-ash">Final stretch</p><p className="mt-1 font-display text-lg font-black uppercase text-ember">Nov 27–28</p><p className="text-xs text-ash">Last Chance · Grand Final</p></div></div>
      </div>
    </section>

    <section className="space-y-3">
      <div><p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">Tournament roadmap</p><h2 className="mt-1 font-display text-2xl font-black uppercase text-bone sm:text-3xl">Explore the stages</h2><p className="mt-2 text-sm text-ash">Choose a stage to see its format. Match-day details remain collapsed until you open them.</p></div>

      <section className={`border ${expandedStage === "knockout" ? "border-ember/60" : "border-char-3"} bg-char`}>
        <button type="button" onClick={() => setExpandedStage((current) => current === "knockout" ? null : "knockout")} aria-expanded={expandedStage === "knockout"} className="w-full p-4 text-left transition-colors hover:bg-char-2 sm:p-5"><StageHeading number="01" title="Knockout Stage" subtitle="Phase 1 · November 6–15  /  Phase 2 · November 19–22" open={expandedStage === "knockout"} /></button>
        {expandedStage === "knockout" && <div className="space-y-5 border-t border-char-3 p-4 sm:p-5">
          <div className="border-l-2 border-ember pl-4"><p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">Phase 1 · November 6–15</p><h3 className="mt-1 font-display text-xl font-extrabold uppercase text-bone">Group stage</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-ash">24 teams are split into four groups of six. The groups and match rotation are shown below. Open a group to inspect its teams, or expand a match day to see who is playing.</p></div>
          <div className="border border-char-3 bg-char-2">
            <ExpandButton open={expandedGroups} onClick={() => setExpandedGroups((open) => !open)}>Group distribution · 24 teams across 4 groups</ExpandButton>
            {expandedGroups && <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">{GROUPS.map((group, index) => <GroupPanel key={group.name} group={group} index={index} />)}</div>}
          </div>
          <div className="border border-char-3 bg-char-2 p-4"><p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">Match rotation</p><h4 className="mt-1 font-display text-lg font-extrabold uppercase text-bone">Two sessions per match day</h4><p className="mt-2 text-sm leading-6 text-ash">The group pairings rotate across the schedule. Expand a week and then a day to view the participating teams and match-room information.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">{[1,2].map((week) => <div key={week} className="border border-char-3 bg-char p-3"><p className="font-stat text-[10px] uppercase tracking-widest text-ember">Week {week}</p><p className="mt-1 font-display text-sm font-bold uppercase text-bone">{week === 1 ? "November 6–8" : "November 13–15"}</p><p className="mt-1 text-xs text-ash">Session 1 · Session 2</p></div>)}</div>
          </div>
          <div className="space-y-3"><div className="border-l-2 border-ember pl-4"><p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">Phase 1 · Match days</p><h3 className="mt-1 font-display text-lg font-extrabold uppercase text-bone">Choose a day to explore</h3></div>{renderDays(knockoutDays.filter((day) => day.day_order <= 6), "Phase 1")}</div>
          <div className="border-t border-char-3 pt-5"><div className="border-l-2 border-ember pl-4"><p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">Phase 2 · November 19–22</p><h3 className="mt-1 font-display text-xl font-extrabold uppercase text-bone">Knockout progression</h3><p className="mt-2 text-sm leading-6 text-ash">The second knockout phase takes place during Week 3. Expand a date below to see the teams and room details when they are available.</p></div><div className="mt-4">{renderDays(knockoutDays.filter((day) => day.day_order >= 7), "Phase 2")}</div></div>
        </div>}
      </section>

      <section className={`border ${expandedStage === "last-chance" ? "border-ember/60" : "border-char-3"} bg-char`}>
        <button type="button" onClick={() => setExpandedStage((current) => current === "last-chance" ? null : "last-chance")} aria-expanded={expandedStage === "last-chance"} className="w-full p-4 text-left transition-colors hover:bg-char-2 sm:p-5"><StageHeading number="02" title="Last Chance" subtitle="November 27 · Final opportunity to qualify" open={expandedStage === "last-chance"} /></button>
        {expandedStage === "last-chance" && <div className="space-y-4 border-t border-char-3 p-4 sm:p-5"><p className="max-w-3xl text-sm leading-6 text-ash">A final opportunity before the championship. Open the event day to reveal participating teams, rooms, and standings when those details are available.</p>{renderDays(lastChanceDays, "Last Chance")}</div>}
      </section>

      <section className={`border ${expandedStage === "grand-final" ? "border-ember/60" : "border-char-3"} bg-char`}>
        <button type="button" onClick={() => setExpandedStage((current) => current === "grand-final" ? null : "grand-final")} aria-expanded={expandedStage === "grand-final"} className="w-full p-4 text-left transition-colors hover:bg-char-2 sm:p-5"><StageHeading number="03" title="Grand Finals" subtitle="November 28 · Championship day" open={expandedStage === "grand-final"} /></button>
        {expandedStage === "grand-final" && <div className="space-y-4 border-t border-char-3 p-4 sm:p-5"><p className="max-w-3xl text-sm leading-6 text-ash">The tournament culminates in the Grand Finals. Expand the day to check team assignments and match information.</p>{renderDays(grandFinalDays, "Grand Final")}</div>}
      </section>
    </section>
  </div>;
}

function GroupPanel({ group, index }: { group: Group; index: number }) {
  const [open, setOpen] = useState(false);
  return <div className="overflow-hidden border border-char-3 bg-char">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-char-2">
      <span className="h-9 w-1 shrink-0" style={{ backgroundColor: group.color }} />
      <span className="min-w-0 flex-1"><span className="block font-display text-base font-extrabold uppercase text-bone">{group.name}</span><span className="mt-1 block text-xs text-ash">6 participating teams</span></span>
      <span className="font-stat text-[10px] uppercase tracking-widest" style={{ color: group.color }}>Group 0{index + 1}</span><span className="text-ash"><Chevron open={open} /></span>
    </button>
    {open && <div className="grid grid-cols-2 border-t border-char-3">{group.teams.map((team, teamIndex) => <div key={team} className={`flex min-h-[68px] items-center gap-2 px-3 py-2 ${teamIndex % 2 === 0 ? "border-r border-char-3" : ""} ${teamIndex >= 2 ? "border-t border-char-3" : ""}`}><div className="relative h-9 w-9 shrink-0"><Image src={TEAM_LOGOS[team]} alt={`${team} logo`} fill sizes="36px" className="object-contain" /></div><span className="text-xs font-semibold leading-4 text-bone">{team}</span></div>)}</div>}
  </div>;
}
