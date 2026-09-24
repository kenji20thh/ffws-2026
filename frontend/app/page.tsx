import Link from "next/link";
import { ArrowUpRight, Trophy, Users, BarChart3, Swords } from "lucide-react";
import {
  Countdown,
  EmptyState,
  NewsCard,
  SectionHeader,
  Shell,
} from "@/components/site";
import { emptyMessages, news, tournament } from "@/data/site";

export default function Home() {
  return (
    <Shell>
      <section className="home-hero">
        <div className="hero-orbit" />
        <div className="eyebrow">FFWS World Cup · 01 / 06</div>
        <h1>
          WORLD&apos;S
          <br />
          <em>BEST</em> FREE FIRE
          <br />
          TEAMS.
        </h1>
        <div className="hero-bottom">
          <p>
            The global stage is set. Follow the teams, players, matches, and
            stories leading into the first drop.
          </p>
          <Link className="button button-primary" href="/tournament">
            Explore tournament <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="hero-date">
          <span>Starts</span>
          <strong>
            NOV 06
            <br />
            2026
          </strong>
        </div>
      </section>
      <section className="home-countdown">
        <Countdown />
      </section>
      <section className="platform-section">
        <SectionHeader
          eyebrow="The platform"
          title="Every angle of the World Cup."
        />
        <div className="feature-grid">
          <Link href="/tournament" className="feature feature-yellow">
            <Trophy />
            <span className="eyebrow">01 / Tournament</span>
            <h3>The global stage, tracked.</h3>
            <p>
              Follow the official competition hub from the first announcement to
              the final drop.
            </p>
            <ArrowUpRight />
          </Link>
          <Link href="/teams" className="feature">
            <Users />
            <span className="eyebrow">02 / Teams & players</span>
            <h3>Know the contenders.</h3>
            <p>Profiles built for the people and squads behind every play.</p>
            <ArrowUpRight />
          </Link>
          <Link href="/stats" className="feature">
            <BarChart3 />
            <span className="eyebrow">03 / Stats center</span>
            <h3>Data with context.</h3>
            <p>
              Leaderboards and match data, published when the tournament begins.
            </p>
            <ArrowUpRight />
          </Link>
          <Link href="/fantasy" className="feature feature-wide">
            <Swords />
            <span className="eyebrow">04 / Fantasy</span>
            <h3>Build your team. Compete with fans.</h3>
            <p>A new way to experience the World Cup is coming soon.</p>
            <ArrowUpRight />
          </Link>
        </div>
      </section>
      <section className="home-news">
        <SectionHeader
          eyebrow="From the newsroom"
          title="The latest from FFWS"
          action="View all news"
        />
        <div className="news-grid">
          {news.map((article) => (
            <NewsCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </Shell>
  );
}
