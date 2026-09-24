'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowUpRight, CalendarDays, ChevronRight, Menu, Search, X } from 'lucide-react'
import type { NewsArticle, TournamentMatch, TournamentPlayer, TournamentTeam } from '@/data/site'

const nav = [['Tournament','/tournament'],['Teams','/teams'],['Players','/players'],['Stats','/stats'],['Matches','/matches'],['Fantasy','/fantasy'],['News','/news']]

export function Logo() { return <Link href="/" className="brand"><span className="brand-mark">F</span><span>FFWS <b>WORLD CUP</b></span></Link> }
export function Header() {
  const [open, setOpen] = useState(false)
  return <header className="site-header"><div className="nav-wrap"><Logo /><nav className="desktop-nav">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav><button className="menu-button" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button></div>{open && <nav className="mobile-nav">{nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<ChevronRight size={16}/></Link>)}</nav>}</header>
}
export function Footer() { return <footer className="footer"><Logo /><span>© 2026 FFWS World Cup platform concept</span><span>Official tournament data will be published here.</span></footer> }
export function Shell({ children }: { children: React.ReactNode }) { return <><Header/><main>{children}</main><Footer/></> }
export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: string }) { return <div className="section-header"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>{action && <span className="section-action">{action}<ArrowUpRight size={15}/></span>}</div> }
export function Countdown() { return <div className="countdown"><div className="countdown-label"><span className="live-dot"/> Countdown to first drop</div><div className="countdown-grid"><div><strong>42</strong><span>Days</span></div><div><strong>08</strong><span>Hours</span></div><div><strong>16</strong><span>Minutes</span></div><div><strong>24</strong><span>Seconds</span></div></div><p>November 6, 2026 · FFWS World Cup</p></div> }
export function EmptyState({ title, message, icon = '—' }: { title: string; message: string; icon?: string }) { return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{message}</p></div> }
export function SearchFilters({ placeholder, filters = ['All', 'Region', 'Country'] }: { placeholder: string; filters?: string[] }) { return <div className="filters"><label className="search-field"><Search size={17}/><input placeholder={placeholder}/></label><div className="filter-row">{filters.map((filter, i) => <button key={filter} className={i === 0 ? 'filter active' : 'filter'}>{filter}{i > 0 && <ChevronRight size={14}/>}</button>)}</div></div> }
export function TeamCard({ team }: { team: TournamentTeam }) { return <Link href={`/teams/${team.slug}`} className="team-card"><div className="avatar-placeholder">{team.shortName.slice(0, 2)}</div><div><h3>{team.name}</h3><p>{team.country} · {team.region}</p></div><ArrowUpRight className="card-arrow" size={18}/></Link> }
export function PlayerCard({ player }: { player: TournamentPlayer }) { return <Link href={`/players/${player.slug}`} className="player-card"><div className="player-portrait"><span>{player.nickname.slice(0, 1)}</span><div className="player-index">PLAYER</div></div><div className="player-card-info"><span className="eyebrow">{player.role || 'Competitor'}</span><h3>{player.nickname}</h3><p>{player.country}{player.teamSlug ? ` · ${player.teamSlug}` : ''}</p></div><ChevronRight size={18}/></Link> }
export function MatchCard({ match }: { match: TournamentMatch }) { return <div className="match-card"><div><span className="eyebrow">{match.stage}</span><h3>{match.date || 'Date to be announced'}</h3><p>{match.venue || 'Match details to be announced'}</p></div><span className="status-pill">{match.status === 'tbd' ? 'TBD' : 'Scheduled'}</span></div> }
export function NewsCard({ article }: { article: NewsArticle }) { return <article className="news-card"><div className="news-image"><span>{article.eyebrow}</span></div><div className="news-copy"><div className="eyebrow">{article.date}</div><h3>{article.title}</h3><p>{article.excerpt}</p><Link href={`/news/${article.slug}`}>Read story <ArrowUpRight size={15}/></Link></div></article> }
export function StatCard({ label, value = '—' }: { label: string; value?: string }) { return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div> }
export function PageHero({ eyebrow, title, description, meta }: { eyebrow: string; title: string; description?: string; meta?: string }) { return <section className="page-hero"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}{meta && <span className="hero-meta">{meta}</span>}</section> }
export function CalendarMark() { return <CalendarDays size={16} /> }
