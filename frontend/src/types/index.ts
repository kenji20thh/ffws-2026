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
  players: { player_id: number; kills: number, first_blood: boolean }[];
}

export interface LoginResponse {
  token: string;
  role: "user" | "admin";
}

export interface PlayerProfilePlayer {
  id: number;
  ign: string;
  real_name: string;
  role: string;
  photo_url: string;
  region: string;
  country: string;
}

export interface PlayerProfileTeam {
  id: number;
  name: string;
  tag: string;
  logo_url: string;
  region: string;
  country: string;
}

export interface PlayerOverallStats {
  total_kills: number;
  rooms_played: number;
  kills_per_room: number;
  placement_points_per_room: number;
  average_placement: number;
  booyahs: number;
  first_bloods: number;
  kill_participation: number;
}

export interface PlayerRoomStats {
  room_id: number;
  room_number: number;
  map_name: string;
  placement: number;
  placement_points: number;
  kills: number;
  first_blood: boolean;
  team_kills: number;
  kill_participation: number;
}

export interface PlayerDayStats {
  day_id: number;
  day_name: string;
  day_order: number;
  date: string;
  total_kills: number;
  placement_points: number;
  first_bloods: number;
  booyahs: number;
  rooms_played: number;
  rooms: PlayerRoomStats[];
}

export interface PlayerProfile {
  player: PlayerProfilePlayer;
  team: PlayerProfileTeam;
  overall: PlayerOverallStats;
  days: PlayerDayStats[];
}

export interface TeamStaff {
  id: number;
  team_id: number;
  name: string;
  role: string;
  photo_url: string;
  country: string;
}

export interface TeamProfileTeam {
  id: number; name: string; tag: string; logo_url: string; region: string; country: string;
}

export interface TeamOverallStats {
  total_kills: number; rooms_played: number; kills_per_room: number;
  average_placement: number; booyahs: number;
}

export interface TeamPlayerStats {
  player_id: number; ign: string; role: string; photo_url: string; country: string;
  total_kills: number; rooms_played: number; kill_participation: number;
}

export interface TeamRoomHistory {
  room_id: number; room_number: number; map_name: string; day_name: string;
  placement: number; team_kills: number; placement_points: number; total_points: number;
}

export interface TeamMapStats {
  map_name: string; rooms_played: number; total_kills: number;
  average_placement: number; booyahs: number;
}

export interface TeamProfile {
  team: TeamProfileTeam;
  overall: TeamOverallStats;
  players: TeamPlayerStats[];
  rooms: TeamRoomHistory[];
  maps: TeamMapStats[];
}

export interface FantasyTeam {
  id: number;
  user_id: number;
  tournament_id: number;
  team_name: string;
  country: string;
  created_at: string;
}

export interface FantasyPlayerOption {
  player_id: number;
  ign: string;
  role: string;
  country: string;
  team_id: number;
  team_name: string;
  team_tag: string;
  fantasy_price: number;
}

export interface FantasyPick {
  player_id: number;
  is_captain: boolean;
}

export interface FantasySelectionEntry {
  id: number;
  fantasy_team_id: number;
  tournament_day_id: number;
  player_id: number;
  is_captain: boolean;
  player: Player;
}

export interface FantasyPlayerDayScore {
  player_id: number;
  ign: string;
  is_captain: boolean;
  kills: number;
  first_bloods: number;
  placement_points: number;
  base_points: number;
  final_points: number;
}

export interface FantasySelectionResponse {
  selections: FantasySelectionEntry[];
  breakdown: FantasyPlayerDayScore[];
  total_points: number;
  lock_time: string | null;
}

export interface FantasyStanding {
  fantasy_team_id: number;
  team_name: string;
  country: string;
  points: number;
}

export interface FantasyTeamProfile {
  team: FantasyTeam;
  selections?: FantasySelectionEntry[];
  breakdown?: FantasyPlayerDayScore[];
  total_points?: number;
}