import Monogram from "@/components/ui/Monogram";
import type { FantasyPlayerOption } from "@/types";

interface Props {
  option: FantasyPlayerOption;
  selected: boolean;
  isCaptain: boolean;
  disabled: boolean;
  onToggle: () => void;
  onCaptain: () => void;
}

export default function PlayerPickerCard({ option, selected, isCaptain, disabled, onToggle, onCaptain }: Props) {
  return (
    <div
      className={`chamfer-sm border p-3 transition-colors ${
        selected ? "border-ember bg-char-3" : disabled ? "border-bone/5 bg-char-2/40 opacity-40" : "border-bone/10 bg-char-2 hover:border-bone/30"
      }`}
    >
      <button type="button" onClick={onToggle} disabled={disabled && !selected} className="flex w-full items-center gap-3 text-left">
        <Monogram label={option.team_tag || option.team_name} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-extrabold uppercase leading-none">{option.ign}</p>
          <p className="truncate font-stat text-[9px] uppercase tracking-widest text-ash">{option.team_tag}</p>
        </div>
        <span className="font-stat text-sm font-bold tabular-nums text-ember">${option.fantasy_price}</span>
      </button>

      {selected && (
        <label className="mt-2 flex items-center gap-2 border-t border-bone/10 pt-2 font-stat text-[10px] uppercase tracking-widest text-amber">
          <input type="radio" name="captain" checked={isCaptain} onChange={onCaptain} />
          Captain (2x points)
        </label>
      )}
    </div>
  );
}