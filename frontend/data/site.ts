export type TournamentTeam = {
  slug: string
  name: string
  shortName: string
  country: string
  region: string
  logo?: string
  roster: string[]
  status: 'demo' | 'confirmed'
}

export type TournamentPlayer = {
  slug: string
  nickname: string
  name?: string
  teamSlug?: string
  country: string
  role?: string
  avatar?: string
  status: 'demo' | 'confirmed'
}

export type TournamentMatch = {
  id: string
  stage: string
  date?: string
  venue?: string
  teams?: string[]
  status: 'scheduled' | 'tbd'
}

export type NewsArticle = {
  slug: string
  eyebrow: string
  title: string
  excerpt: string
  date: string
  image?: string
}

export const tournament = {
  name: 'FFWS World Cup',
  date: 'November 6, 2026',
  location: 'Global',
  status: 'Upcoming',
}

// Demo records intentionally contain no fictional competing teams or results.
export const teams: TournamentTeam[] = []
export const players: TournamentPlayer[] = []
export const matches: TournamentMatch[] = []

export const news: NewsArticle[] = [
  { slug: 'world-cup-countdown', eyebrow: 'Tournament', title: 'The road to the FFWS World Cup begins here', excerpt: 'Follow the official tournament hub as the world’s best Free Fire teams prepare for November 6, 2026.', date: 'Coming soon' },
  { slug: 'fantasy-coming-soon', eyebrow: 'Fantasy', title: 'Build your dream roster. Compete with fans.', excerpt: 'A new way to experience every drop, rotation, and clutch moment is coming to FFWS World Cup.', date: 'Coming soon' },
  { slug: 'official-platform', eyebrow: 'Platform', title: 'One home for every tournament moment', excerpt: 'Teams, players, matches, and stats will live together in one official-style competition platform.', date: 'Coming soon' },
]

export function getTeam(slug: string) { return teams.find((team) => team.slug === slug) }
export function getPlayer(slug: string) { return players.find((player) => player.slug === slug) }
export function getTeamPlayers(slug: string) { return players.filter((player) => player.teamSlug === slug) }

export const emptyMessages = {
  stats: 'Statistics will appear once the tournament begins.',
  results: 'Results will appear here once the tournament begins.',
  matches: 'Match schedule will appear here.',
}
