import Monogram from "@/components/ui/Monogram";
import { countryFlag } from "@/lib/flags";
import type { TeamStaff } from "@/types";

export default function CoachingStaff({ staff }: { staff: TeamStaff[] }) {
  if (staff.length === 0) return null;
  return (
    <div>
      <h2 className="mb-4 font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Coaching staff</h2>
      <div className="flex flex-wrap gap-4">
        {staff.map((s) => (
          <div key={s.id} className="chamfer flex items-center gap-3 border border-bone/10 bg-char-2 py-2 pl-2 pr-5">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-char-3">
              {s.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photo_url} alt={s.name} className="h-full w-full object-cover" />
              ) : (
                <Monogram label={s.name} size={56} />
              )}
            </div>
            <div>
              <p className="font-display text-lg font-extrabold uppercase leading-none">{s.name}</p>
              <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">
                {s.role}{s.country && ` · ${countryFlag(s.country)}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}