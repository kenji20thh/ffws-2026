export interface Tournament {
  id: number;
  name: string;
  slug: string;
  season: string;
  start_date: string;
  end_date: string;
  status: "upcoming" | "ongoing" | "completed" | string;
}

export interface Player {
  id: number;
  team_id: number;
  ign: string;
  real_name: string;
  role: string;
  photo_url: string;
  region: string;
  country: string;
}

export interface Team {
  id: number;
  tournament_id: number;
  name: string;
  tag: string;
  logo_url: string;
  region: string;
  country: string;
  slot_number: number;
  players?: Player[];
}

export interface Room {
  id: number;
  tournament_day_id: number;
  room_number: number;
  map_name: string;
  scheduled_at: string;
  status: "upcoming" | "live" | "completed" | string;
}

export interface TournamentDay {
  id: number;
  tournament_id: number;
  name: string;
  day_order: number;
  date: string;
  rooms?: Room[];
}

export interface DayTeam {
  id: number;
  tournament_day_id: number;
  team_id: number;
  team: Team;
}

export interface RoomTeamSummary {
  team_id: number;
  team_name: string;
  placement: number;
  total_kills: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
}

export interface TeamStanding {
  team_id: number;
  team_name: string;
  rooms_played: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
}

export interface PlayerLeaderboardEntry {
  player_id: number;
  ign: string;
  team_id: number;
  team_name: string;
  total_kills: number;
  rooms_played: number;
}

export interface SubmitTeamResult {
  team_id: number;
  placement: number;
  players: { player_id: number; kills: number }[];
}

export interface LoginResponse {
  token: string;
  role: "user" | "admin";
}