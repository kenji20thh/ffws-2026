export type Status = "UPCOMING" | "LIVE" | "COMPLETED";
export interface Tournament { name: string; tagline: string; startDate: string; location?: string; status: Status; teamCount: number; playerCount: number; stages: { name: string; description: string }[]; format: string[]; schedule: { date?: string; label: string }[]; }
export interface TeamStats { matches?: number; points?: number; kills?: number; avgPlacement?: number; booyahs?: number }
export interface Team { slug: string; name: string; country: string; countryCode: string; region: string; logo?: string; stats?: TeamStats; isPlaceholder?: boolean }
export interface PlayerStats { matches?: number; kills?: number; assists?: number; firstBlood?: number; avgPlacement?: number }
export interface Player { slug: string; nickname: string; teamSlug: string; country: string; countryCode: string; role?: string; photo?: string; stats?: PlayerStats; isPlaceholder?: boolean }
export interface Match { id: string; stage: string; date: string; teams: string[]; status: Status; room?: string }
export interface NewsArticle { slug: string; title: string; excerpt: string; category: string; date: string; image?: string; isPlaceholder?: boolean }
