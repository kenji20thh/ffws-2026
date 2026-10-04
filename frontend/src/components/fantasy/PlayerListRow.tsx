import Monogram from "@/components/ui/Monogram";
import { countryFlag } from "@/lib/flags";
import type { PoolPlayer } from "@/types";

interface Props {
  option: PoolPlayer;
  selected: boolean;
  active: boolean; // its detail card is open
  blockedReason: string | null; // why "+" is disabled (null = can add)
  onOpen: () => void;
  onToggle: () => void;
}

export default function PlayerListRow({ option, selected, active, blockedReason, onOpen, onToggle }: Props) {
  const canClick = selected || !blockedReason;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`chamfer-sm flex cursor-pointer items-center gap-3 border px-3 py-2 transition-colors ${
        active
          ? "border-ember bg-char-3"
          : selected
            ? "border-ember/50 bg-char-3/60"
            : "border-bone/10 bg-char-2 hover:border-bone/30"
      } ${!selected && blockedReason ? "opacity-50" : ""}`}
    >
      <Monogram label={option.team_tag || option.team_name} imageUrl={option.team_logo_url} size={34} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg font-extrabold uppercase leading-none">{option.ign}</p>
        <p className="mt-0.5 truncate font-stat text-[10px] uppercase tracking-widest text-ash">
          {option.role}
          <span className="mx-1.5 text-bone/20">·</span>
          {countryFlag(option.country)} {option.country}
        </p>
      </div>
      <span className="ml-3 font-stat text-sm font-bold tabular-nums text-ember">${option.fantasy_price}</span>
      <button
        type="button"
        disabled={!canClick}
        onClick={(e) => {
          e.stopPropagation();
          if (canClick) onToggle();
        }}
        title={selected ? "Remove from team" : (blockedReason ?? "Add to team")}
        aria-label={`${selected ? "Remove" : "Add"} ${option.ign}`}
        className={`flex h-8 w-8 shrink-0 items-center justify-center border font-stat text-lg font-black leading-none transition-colors ${
          selected
            ? "border-ember bg-ember text-char hover:bg-transparent hover:text-ember"
            : "border-bone/30 text-bone hover:border-ember hover:text-ember disabled:cursor-not-allowed disabled:hover:border-bone/30 disabled:hover:text-bone"
        }`}
      >
        {selected ? "−" : "+"}
      </button>
    </div>
  );
}
