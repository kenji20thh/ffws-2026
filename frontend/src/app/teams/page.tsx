import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import TeamGrid from "@/components/teams/TeamGrid";
import ErrorState from "@/components/ui/ErrorState";
import Monogram from "@/components/ui/Monogram";
import { getTeams, getTournament } from "@/lib/api";
import type { Team } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Teams · FFWS 2026" };

export default async function TeamsPage() {
  let teams: Team[] = [];
  let error: string | null = null;

  try {
    const t = await getTournament("ffws-2026");
    teams = await getTeams(t.id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load teams";
  }

  return (
    <>
      <PageHeader eyebrow="The contenders" title="Teams">
        Every squad fighting for the last zone.
      </PageHeader>

      {!error && teams.length > 0 && (
        <div className="relative overflow-hidden border-y border-white/10 bg-char-2 py-5">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-char-2 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-char-2 to-transparent" />

          <div className="team-marquee flex w-max">
            {/* First copy */}
            <div className="flex shrink-0 items-center gap-10 px-5">
              {teams.map((team) => (
                <Link
                  key={`first-${team.id}`}
                  href={`/teams/${team.id}`}
                  className="group flex h-20 w-20 shrink-0 items-center justify-center transition-transform duration-300 hover:scale-110"
                  aria-label={`View ${team.name}`}
                >
                  <div className="opacity-45 transition-opacity duration-300 group-hover:opacity-100">
                    <Monogram
                      label={team.tag || team.name}
                      imageUrl={team.logo_url}
                      size={64}
                    />
                  </div>
                </Link>
              ))}
            </div>

            {/* Second copy — creates the seamless loop */}
            <div className="flex shrink-0 items-center gap-10 px-5">
              {teams.map((team) => (
                <Link
                  key={`second-${team.id}`}
                  href={`/teams/${team.id}`}
                  className="group flex h-20 w-20 shrink-0 items-center justify-center transition-transform duration-300 hover:scale-110"
                  aria-label={`View ${team.name}`}
                >
                  <div className="opacity-45 transition-opacity duration-300 group-hover:opacity-100">
                    <Monogram
                      label={team.tag || team.name}
                      imageUrl={team.logo_url}
                      size={64}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <style>{`
            .team-marquee {
              animation: team-marquee-scroll 35s linear infinite;
            }

            .team-marquee:hover {
              animation-play-state: paused;
            }

            @keyframes team-marquee-scroll {
              from {
                transform: translateX(0);
              }

              to {
                transform: translateX(-50%);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .team-marquee {
                animation: none;
              }
            }
          `}</style>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-5 py-10">
        {error ? <ErrorState message={error} /> : <TeamGrid teams={teams} />}
      </div>
    </>
  );
}