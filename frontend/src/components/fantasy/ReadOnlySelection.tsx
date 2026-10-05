import type { FantasyPlayerDayScore, FantasySelectionEntry } from "@/types";
import FormationBoard, { SlotPlayer } from "./FormationBoard";

export default function ReadOnlySelection({
  selections,
  breakdown,
  captainMultiplier = 2,
}: {
  selections: FantasySelectionEntry[];
  breakdown?: FantasyPlayerDayScore[];
  captainMultiplier?: number;
}) {
  if (selections.length === 0) {
    return <p className="font-stat text-xs uppercase tracking-widest text-ash">No selection made for this day</p>;
  }

  const scores = new Map((breakdown ?? []).map((b) => [b.player_id, b]));
  const scored = (breakdown ?? []).some((b) => b.final_points !== 0);

  const slots: (SlotPlayer | null)[] = [0, 1, 2, 3].map((i) => {
    const s = selections[i];
    if (!s) return null;
    const b = scored ? scores.get(s.player_id) : undefined;
    return {
      id: s.player_id,
      name: s.player.ign,
      role: s.player.role,
      photoUrl: s.player.photo_url,
      captain: s.is_captain,
      points: b?.final_points,
      detail: b ? `${b.kills}k · ${b.first_bloods}fb · ${b.placement_points}pp` : undefined,
    };
  });

  return (
    <div className="mx-auto max-w-md">
      <FormationBoard slots={slots} emptyLabel="—" captainMultiplier={captainMultiplier} />
    </div>
  );
}
