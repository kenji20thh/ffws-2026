"use client";

import { useState } from "react";
import Monogram from "@/components/ui/Monogram";
import { countryFlag } from "@/lib/flags";
import type { TeamStaff } from "@/types";

export default function CoachingStaff({ staff }: { staff: TeamStaff[] }) {
if (staff.length === 0) return null;

return ( <div> <h2 className="mb-6 font-display text-4xl font-extrabold uppercase">
Coaching staff </h2>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

return ( <div className="chamfer overflow-hidden border border-bone/10 bg-char-2"> <div className="relative aspect-square w-full overflow-hidden bg-char-3">
{showPlaceholder ? ( <div className="flex h-full w-full items-center justify-center"> <Monogram label={staff.name} size={100} /> </div>
) : (
// eslint-disable-next-line @next/next/no-img-element
<img
src={staff.photo_url}
alt={staff.name}
className="h-full w-full object-cover"
onError={() => setImageError(true)}
/>
)} </div>

```
  <div className="p-4">
    <p className="font-display text-lg font-extrabold uppercase leading-none">
      {staff.name}
    </p>

    {staff.real_name && (
      <p className="mt-0.5 font-stat text-[10px] text-ash">
        {staff.real_name}
      </p>
    )}

    <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">
      {staff.role}
      {staff.country && ` · ${countryFlag(staff.country)}`}
    </p>
  </div>
</div>

);
}
