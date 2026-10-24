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
    <div className="bg-char-2 px-3 py-2.5">
      <p
        className={`font-display text-2xl font-black leading-none tabular-nums ${
          accent ? "text-ember" : "text-bone"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 font-stat text-[0.5625rem] uppercase tracking-[0.18em] text-ash">
        {label}
      </p>
    </div>
  );
}

/** Highlight card for the best player of the selected day (most kills). */
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
      <div className="chamfer border border-bone/10 bg-char-2">
        <div className="border-b border-bone/10 px-4 py-2 font-stat text-[0.625rem] font-bold uppercase tracking-[0.25em] text-ash">
          {title}
        </div>
        <div className="px-4 py-10 text-center">
          <p className="font-display text-xl font-extrabold uppercase text-bone">
            No MVP yet
          </p>
          <p className="mt-2 font-stat text-[0.625rem] uppercase tracking-widest text-ash">
            {dayLabel} · waiting for results
          </p>
        </div>
      </div>
    );
  }

  const icon = roleIcon(mvp.role);
  const perRoom = mvp.rooms > 0 ? (mvp.kills / mvp.rooms).toFixed(1) : "0.0";
  const remote = /^https?:\/\//.test(mvp.photo_url ?? "");

  return (
    <Link
      href={`/players/${mvp.id}`}
      className="group block chamfer overflow-hidden border border-ember/50 bg-char-2 transition-colors hover:border-ember"
    >
      {/* Title strip */}
      <div className="flex items-center justify-between gap-2 bg-ember px-4 py-2 font-stat text-[0.625rem] font-bold uppercase tracking-[0.25em] text-char">
        <span>★ {title}</span>
        <span className="truncate tracking-widest">{dayLabel}</span>
      </div>

      {/* Photo */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-char-3">
        {mvp.photo_url ? (
          <Image
            src={mvp.photo_url}
            alt={mvp.ign}
            fill
            quality={90}
            sizes="(max-width: 1024px) 100vw, 336px"
            unoptimized={remote}
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Monogram label={mvp.ign} size={96} />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-char-2 to-transparent" />

        {/* Team badge */}
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          {mvp.team.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mvp.team.logo_url}
              alt=""
              className="h-9 w-9 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center border border-bone/20 bg-char/70 font-display text-xs font-black text-bone">
              {mvp.team.tag.slice(0, 3)}
            </span>
          )}
          <span className="font-stat text-[0.6875rem] font-bold uppercase tracking-widest text-bone drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {mvp.team.name}
          </span>
        </div>
      </div>

      {/* Identity */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-3xl font-black uppercase leading-none text-bone">
            {mvp.ign}
          </h3>
          <Flag country={mvp.country} height={16} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-stat text-[0.625rem] uppercase tracking-widest">
          <span className="flex items-center gap-1.5 text-ember">
            {icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="" className="h-4 w-4 object-contain" />
            )}
            {roleLabel(mvp.role)}
          </span>

          {mvp.real_name && <span className="text-ash">{mvp.real_name}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-px bg-bone/10 border-t border-bone/10">
        <Stat label="Kills" value={mvp.kills} accent />
        <Stat label="Kills / room" value={perRoom} />
        <Stat label="Rooms" value={mvp.rooms} />
        <Stat label="First bloods" value={mvp.firstBloods} />
      </div>
    </Link>
  );
}
