"use client";

import Image from "next/image";
import { useState } from "react";
import Monogram from "@/components/ui/Monogram";
import Flag from "@/components/ui/Flag";
import type { TeamStaff } from "@/types";

export default function CoachingStaff({ staff }: { staff: TeamStaff[] }) {
  if (staff.length === 0) return null;

  return (
    <div>
      <h2 className="mb-6 font-display text-4xl font-extrabold uppercase">
        Coaching staff
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {staff.map((s) => (
          <StaffCard key={s.id} staff={s} />
        ))}
      </div>
    </div>
  );
}

function StaffCard({ staff }: { staff: TeamStaff }) {
  const [imageError, setImageError] = useState(false);

  const showPlaceholder = !staff.photo_url || imageError;

  return (
    <div className="chamfer overflow-hidden border border-bone/10 bg-char-2">
      {/* Same 3:4 portrait frame as the player cards, anchored to the top so heads aren't cut */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-char-3">
        {showPlaceholder ? (
          <div className="flex h-full w-full items-center justify-center">
            <Monogram label={staff.name} size={72} />
          </div>
        ) : (
          <Image
            src={staff.photo_url}
            alt={staff.name}
            fill
            quality={90}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
            // remote photos can't go through the optimizer without extra config
            unoptimized={/^https?:\/\//.test(staff.photo_url)}
            className="object-cover object-top"
            onError={() => setImageError(true)}
          />
        )}
      </div>

      <div className="p-3">
        <p className="truncate font-display text-xl font-extrabold uppercase leading-none">
          {staff.name}
        </p>

        {staff.real_name && (
          <p className="mt-1 truncate font-stat text-[0.625rem] text-ash">
            {staff.real_name}
          </p>
        )}

        <p className="mt-2 flex items-center gap-1.5 font-stat text-[0.625rem] uppercase tracking-widest text-ash">
          {staff.role}
          {staff.country && (
            <>
              <span aria-hidden="true">·</span>
              <Flag country={staff.country} height={14} />
            </>
          )}
        </p>
      </div>
    </div>
  );
}