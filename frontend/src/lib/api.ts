import type {
  DayTeam,
  LoginResponse,
  Player,
  PlayerLeaderboardEntry,
  PlayerProfile,
  Room,
  RoomTeamSummary,
  SubmitTeamResult,
  Team,
  TeamProfile,
  TeamStaff,
  TeamStanding,
  Tournament,
  TournamentDay,
  FantasyPick,
  FantasyPlayerOption,
  FantasySelectionResponse,
  FantasyStanding,
  FantasyTeam,
  FantasyTeamProfile,
  Prediction,
  PredictionDetail,
  PredictionPick,
  PredictionStanding,
  } from "@/types";
import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Cannot reach the server", 0);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error ?? "Something went wrong", res.status);
  }
  return body as T;
}

// Go can return null for empty lists, so normalise to [].
async function list<T>(path: string): Promise<T[]> {
  const res = await request<{ data: T[] | null }>(path);
  return res.data ?? [];
}

async function one<T>(path: string): Promise<T> {
  const res = await request<{ data: T }>(path);
  return res.data;
}

/* ---------- public ---------- */
export const getTournament = (slug: string) => one<Tournament>(`/tournaments/${slug}`);
export const getTeams = (tournamentId: number) => list<Team>(`/teams?tournament_id=${tournamentId}`);
export const getTeam = (id: number) => one<Team>(`/teams/${id}`);
export const getPlayers = (teamId: number) => list<Player>(`/players?team_id=${teamId}`);
export const getDays = (tournamentId: number) =>
  list<TournamentDay>(`/tournament-days?tournament_id=${tournamentId}`);
export const getDay = (id: number) => one<TournamentDay>(`/tournament-days/${id}`);
export const getDayTeams = (dayId: number) => list<DayTeam>(`/tournament-days/${dayId}/teams`);
export const getRooms = (dayId: number) => list<Room>(`/rooms?tournament_day_id=${dayId}`);
export const getRoomResults = (roomId: number) => list<RoomTeamSummary>(`/rooms/${roomId}/results`);
export const getStandings = (tournamentId: number) =>
  list<TeamStanding>(`/standings?tournament_id=${tournamentId}`);
export const getPlayerLeaderboard = (tournamentId: number) =>
  list<PlayerLeaderboardEntry>(`/player-leaderboard?tournament_id=${tournamentId}`);
export const getPlayerProfile = (playerId: number) =>
  one<PlayerProfile>(`/players/${playerId}`);

export const subscribe = (email: string) =>
  request<{ message: string }>("/subscribe", { method: "POST", body: JSON.stringify({ email }) });

/* ---------- auth ---------- */
// login is NOT wrapped in { data }
export const login = (username: string, password: string) =>
  request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

 export const register = (username: string, password: string) =>
  request<{ message: string; id: number }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  }); 

/* ---------- admin ---------- */
export const submitRoomResults = (roomId: number, teams: SubmitTeamResult[]) =>
  request<{ message: string }>(
    `/rooms/${roomId}/results`,
    { method: "POST", body: JSON.stringify({ teams }) },
    true
  );
export const getTeamProfile = (teamId: number) => one<TeamProfile>(`/teams/${teamId}/stats`);
export const getTeamStaff = (teamId: number) => list<TeamStaff>(`/teams/${teamId}/staff`);

/* ---------- fantasy ---------- */
export const getFantasyPlayerPool = (tournamentId: number) =>
  list<FantasyPlayerOption>(`/fantasy/players?tournament_id=${tournamentId}`);

export const getFantasyStandings = (tournamentId: number, dayId?: number) =>
  list<FantasyStanding>(
    `/fantasy/standings?tournament_id=${tournamentId}${dayId ? `&day_id=${dayId}` : ""}`
  );

export const createFantasyTeam = (tournamentId: number, teamName: string, country: string) =>
  request<{ data: FantasyTeam }>(
    "/fantasy/team",
    { method: "POST", body: JSON.stringify({ tournament_id: tournamentId, team_name: teamName, country }) },
    true
  ).then((r) => r.data);

export const getMyFantasyTeam = (tournamentId: number) =>
  request<{ data: FantasyTeam }>(`/fantasy/team?tournament_id=${tournamentId}`, {}, true).then((r) => r.data);

export const getMyFantasySelection = (tournamentId: number, dayId: number) =>
  request<{ data: FantasySelectionResponse }>(
    `/fantasy/team/selections/${dayId}?tournament_id=${tournamentId}`,
    {},
    true
  ).then((r) => ({
    ...r.data,
    selections: r.data.selections ?? [],
    breakdown: r.data.breakdown ?? [],
  }));

export const submitFantasySelection = (tournamentId: number, dayId: number, picks: FantasyPick[]) =>
  request<{ message: string }>(
    `/fantasy/team/selections/${dayId}?tournament_id=${tournamentId}`,
    { method: "POST", body: JSON.stringify({ picks }) },
    true
  );

export const getFantasyTeamProfile = (fantasyTeamId: number, dayId?: number) =>
  request<{ data: FantasyTeamProfile }>(
    `/fantasy/teams/${fantasyTeamId}${dayId ? `?day_id=${dayId}` : ""}`,
    {},
    true // optional on the server: lets the owner see their own picks before the deadline
  ).then((r) => ({
    ...r.data,
    selections: r.data.selections ?? [],
    breakdown: r.data.breakdown ?? [],
  }));


  /* ---------- predictions ---------- */
export const getPredictionStandings = (tournamentId: number, dayId?: number) =>
  list<PredictionStanding>(
    `/predictions/standings?tournament_id=${tournamentId}${dayId ? `&day_id=${dayId}` : ""}`
  );

export const getPredictionById = (predictionId: number) =>
  request<{ data: PredictionDetail }>(`/predictions/${predictionId}`).then((r) => ({
    ...r.data,
    teams: r.data.teams ?? [],
  }));

export const getMyPrediction = (dayId: number) =>
  request<{ data: PredictionDetail }>(`/predictions/mine/${dayId}`, {}, true).then((r) => ({
    ...r.data,
    teams: r.data.teams ?? [],
  }));

export const submitPrediction = (dayId: number, picks: PredictionPick[]) =>
  request<{ data: Prediction }>(
    `/predictions/${dayId}`,
    { method: "POST", body: JSON.stringify({ picks }) },
    true
  ).then((r) => r.data);

  export const updateTournamentDayDeadline = (dayId: number, deadlineIso: string) =>
  request<{ data: TournamentDay }>(
    `/tournament-days/${dayId}`,
    { method: "PUT", body: JSON.stringify({ deadline: deadlineIso }) },
    true
  ).then((r) => r.data);