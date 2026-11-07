import Image from "next/image";
import Link from "next/link";
import Flag from "@/components/ui/Flag";
import Monogram from "@/components/ui/Monogram";
import { roleIcon, roleLabel } from "@/lib/roles";
import type { Player, Team } from "@/types";

export type MvpEntry = Player & {
  team: Team;
  kills: number;
  rooms: number;
  firstBloods: number;
};

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 border-l border-bone/10 px-3 py-2 sm:px-4">
      <p
        className={`font-display text-xl font-black leading-none tabular-nums sm:text-2xl ${
          accent ? "text-ember" : "text-bone"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 truncate font-stat text-[8px] uppercase tracking-[0.15em] text-ash">
        {label}
      </p>
    </div>
  );
}

export function MvpCard({
  mvp,
  title,
  dayLabel,
}: {
  mvp: MvpEntry | null;
  title: string;
  dayLabel: string;
}) {
  if (!mvp) {
    return (
      <div className="relative overflow-hidden border border-bone/10 bg-char-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bone/10 px-4 py-3">
          <span className="font-stat text-[10px] font-bold uppercase tracking-[0.2em] text-ember">
            ★ {title}
          </span>
          <span className="font-stat text-[9px] uppercase tracking-wider text-ash">
            {dayLabel}
          </span>
        </div>

        <div className="flex min-h-36 items-center justify-center px-5 py-8">
          <div className="text-center">
            <p className="font-display text-2xl font-black uppercase text-bone">
              Awaiting greatness
            </p>
            <p className="mt-2 font-stat text-[9px] uppercase tracking-[0.2em] text-ash">
              Results will appear here once matches are played.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const icon = roleIcon(mvp.role);
  const perRoom =
    mvp.rooms > 0 ? (mvp.kills / mvp.rooms).toFixed(1) : "0.0";
  const remote = /^https?:\/\//.test(mvp.photo_url ?? "");

  return (
    <Link
      href={`/players/${mvp.id}`}
      className="group relative block overflow-hidden border border-ember/30 bg-char-2 transition-colors duration-300 hover:border-ember"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bone/10 px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center bg-ember font-display text-sm font-black text-char">
            ★
          </span>
          <span className="font-stat text-[10px] font-bold uppercase tracking-[0.2em] text-bone">
            {title}
          </span>
        </div>

        <span className="font-stat text-[9px] uppercase tracking-widest text-ash">
          {dayLabel}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        {/* Portrait */}
        <div className="relative min-h-[190px] overflow-hidden bg-char-3 sm:min-h-[230px]">
          {mvp.photo_url ? (
            <Image
              src={mvp.photo_url}
              alt={mvp.ign}
              fill
              quality={90}
              sizes="(max-width: 640px) 40vw, 320px"
              unoptimized={remote}
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Monogram label={mvp.ign} size={64} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-char via-char/10 to-transparent" />

          <div className="absolute bottom-3 left-3 right-2 flex items-center gap-2 sm:bottom-4 sm:left-4">
            {mvp.team.logo_url ? (
              <Image
                src={mvp.team.logo_url}
                alt=""
                width={32}
                height={32}
                unoptimized
                className="h-8 w-8 shrink-0 object-contain drop-shadow-lg"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-char/80 font-display text-[10px] font-black text-bone">
                {mvp.team.tag.slice(0, 3)}
              </span>
            )}

            <span className="truncate font-stat text-[9px] font-bold uppercase tracking-wider text-bone drop-shadow-lg">
              {mvp.team.name}
            </span>
          </div>

          <div className="absolute left-3 top-3 border border-ember/50 bg-char/80 px-2 py-1 backdrop-blur-sm">
            <span className="font-stat text-[8px] font-bold uppercase tracking-widest text-ember">
              #01 · MVP
            </span>
          </div>
        </div>

        {/* Player information */}
        <div className="flex min-w-0 flex-col justify-between">
          <div className="p-3 sm:p-5">
            <p className="font-stat text-[8px] uppercase tracking-[0.25em] text-ember">
              PLAYER OF THE MATCHDAY
            </p>

            <div className="mt-2 flex min-w-0 items-center gap-1.5">
              <h3 className="truncate font-display text-xl font-black uppercase leading-none text-bone sm:text-3xl lg:text-4xl">
                {mvp.ign}
              </h3>
              <Flag country={mvp.country} height={15} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex items-center gap-1 font-stat text-[9px] uppercase tracking-wider text-ember">
                {icon && (
                  <Image
                    src={icon}
                    alt=""
                    width={16}
                    height={16}
                    unoptimized
                    className="h-4 w-4 object-contain"
                  />
                )}
                {roleLabel(mvp.role)}
              </span>

              {mvp.real_name && (
                <span className="truncate font-stat text-[9px] uppercase text-ash">
                  {mvp.real_name}
                </span>
              )}
            </div>

            <div className="mt-5 flex items-end gap-2 sm:mt-7">
              <span className="font-display text-5xl font-black leading-[0.85] tracking-tight text-ember sm:text-6xl">
                {mvp.kills}
              </span>
              <span className="pb-0.5 font-stat text-[9px] uppercase tracking-[0.2em] text-ash">
                Total kills
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 border-t border-bone/10">
            <Stat label="Kills / room" value={perRoom} />
            <Stat label="Rooms" value={mvp.rooms} />
            <Stat label="First bloods" value={mvp.firstBloods} />
          </div>
        </div>
      </div>

      <div className="h-[2px] w-full origin-left scale-x-0 bg-ember transition-transform duration-500 group-hover:scale-x-100" />
    </Link>
  );
}