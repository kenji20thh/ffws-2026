"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import {
  ApiError,
  getDayTeams,
  getDays,
  getRoomResults,
  getRooms,
  getTeam,
  getTournament,
  submitRoomResults,
} from "@/lib/api";
import { clearSession, isAdmin } from "@/lib/auth";
import type {
  Room,
  RoomTeamSummary,
  SubmitTeamResult,
  Team,
  TournamentDay,
} from "@/types";
import DayRoomPicker from "./DayRoomPicker";
import TeamResultRow, { Draft, draftError, emptyDraft } from "./TeamResultRow";
import DayDeadlineEditor from "./DayDeadlineEditor";
import ScorePredictionsButton from "./ScorePredictionsButton";

function toPayload(team: Team, d: Draft): SubmitTeamResult {
  return {
    team_id: team.id,
    placement: Number(d.placement),
    players: (team.players ?? []).map((p) => ({
      player_id: p.id,
      kills:
        d.kills[p.id] === undefined || d.kills[p.id] === ""
          ? 0
          : Number(d.kills[p.id]),
      first_blood: d.firstBloodPlayerId === p.id,
    })),
  };
}

export default function AdminConsole() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [days, setDays] = useState<TournamentDay[]>([]);
  const [dayId, setDayId] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [saved, setSaved] = useState<RoomTeamSummary[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [busy, setBusy] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      const text =
        e instanceof ApiError && e.status === 429
          ? "Too many requests. Wait a moment and retry."
          : e instanceof Error
            ? e.message
            : "Something went wrong";
      setNotice({ tone: "err", text });
    },
    [router],
  );

  // auth guard + initial days
  useEffect(() => {
    if (!isAdmin()) {
      router.replace("/login");
      return;
    }
    setReady(true);
    getTournament("ffws-2026")
      .then((t) => getDays(t.id))
      .then((d) => {
        setDays(d);
        setDayId(d[0]?.id ?? 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [router]);

  // day change: rooms + teams (with players)
  useEffect(() => {
    if (!dayId) return;
    let cancelled = false;
    Promise.all([getRooms(dayId), getDayTeams(dayId)])
      .then(async ([r, dt]) => {
        const full = await Promise.all(dt.map((x) => getTeam(x.team_id)));
        if (cancelled) return;
        setRooms(r);
        setTeams(full);
        setRoomId((r.find((x) => x.status === "live") ?? r[0])?.id ?? null);
      })
      .catch(fail);
    return () => {
      cancelled = true;
    };
  }, [dayId, fail]);

  const loadSaved = useCallback(() => {
    if (!roomId) return setSaved([]);
    getRoomResults(roomId)
      .then(setSaved)
      .catch(() => {});
  }, [roomId]);

  // room change: reset drafts, load saved
  useEffect(() => {
    setDrafts({});
    setNotice(null);
    loadSaved();
  }, [roomId, loadSaved]);

  const savedByTeam = useMemo(
    () => new Map(saved.map((s) => [s.team_id, s])),
    [saved],
  );

  const duplicates = useMemo(() => {
    const count = new Map<string, number>();
    Object.values(drafts).forEach(
      (d) =>
        d.placement &&
        count.set(d.placement, (count.get(d.placement) ?? 0) + 1),
    );
    return count;
  }, [drafts]);

  async function save(list: Team[]) {
    if (!roomId || list.length === 0) return;
    setBusy((b) => [...b, ...list.map((t) => t.id)]);
    try {
      await submitRoomResults(
        roomId,
        list.map((t) => toPayload(t, drafts[t.id] ?? emptyDraft)),
      );
      setNotice({
        tone: "ok",
        text: `Saved ${list.map((t) => t.name).join(", ")}`,
      });
      loadSaved();
    } catch (e) {
      fail(e);
    } finally {
      setBusy((b) => b.filter((id) => !list.some((t) => t.id === id)));
    }
  }

  const fillable = teams.filter(
    (t) =>
      (drafts[t.id]?.placement ?? "") !== "" && !draftError(t, drafts[t.id]),
  );

  if (!ready) return null;
  if (error) return <ErrorState message={error} />;
  if (loading) return <Skeleton className="h-40" />;
  if (days.length === 0)
    return (
      <EmptyState title="No days yet" hint="Create tournament days first." />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DayRoomPicker
          days={days}
          rooms={rooms}
          dayId={dayId}
          roomId={roomId}
          onDay={setDayId}
          onRoom={setRoomId}
        />
        <div className="flex gap-3">
          <Button
            type="button"
            disabled={fillable.length === 0 || busy.length > 0}
            onClick={() => save(fillable)}
          >
            Submit all filled ({fillable.length})
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
          >
            Log out
          </Button>
        </div>
      </div>
      {days.find((d) => d.id === dayId) && (
        <>
          <DayDeadlineEditor
            day={days.find((d) => d.id === dayId)!}
            onUpdated={(ud) =>
              setDays((prev) => prev.map((d) => (d.id === ud.id ? ud : d)))
            }
          />
          <ScorePredictionsButton day={days.find((d) => d.id === dayId)!} />
        </>
      )}

      <p className="border-l-2 border-amber pl-3 text-sm text-bone/70">
        Re-submitting a team replaces its previous result. To correct a team,
        re-enter <b>every</b> player&apos;s kills.
      </p>

      <p
        aria-live="polite"
        className={`min-h-5 font-stat text-xs ${notice?.tone === "ok" ? "text-amber" : "text-danger"}`}
      >
        {notice?.text}
      </p>

      {!roomId ? (
        <EmptyState
          title="No room selected"
          hint="Create a room for this day first."
        />
      ) : teams.length === 0 ? (
        <EmptyState title="No teams assigned to this day" />
      ) : (
        <div className="space-y-4">
          {teams.map((t) => {
            const d = drafts[t.id] ?? emptyDraft;
            return (
              <TeamResultRow
                key={t.id}
                team={t}
                draft={d}
                saved={savedByTeam.get(t.id)}
                duplicate={
                  !!d.placement && (duplicates.get(d.placement) ?? 0) > 1
                }
                busy={busy.includes(t.id)}
                onChange={(nd) => setDrafts((all) => ({ ...all, [t.id]: nd }))}
                onSubmit={() => !draftError(t, d) && save([t])}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
