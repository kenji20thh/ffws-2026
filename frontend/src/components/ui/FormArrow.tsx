import type { CSSProperties } from "react";

// Form 1-5 -> arrow direction + colour. Only the arrow is shown, never the number.
// 5 = straight up (green) ... 3 = flat (yellow) ... 1 = straight down (red).
const FORM_STYLE: Record<number, { rotate: number; color: string; label: string }> = {
  5: { rotate: -90, color: "#22c55e", label: "Excellent form" },
  4: { rotate: -45, color: "#84cc16", label: "Good form" },
  3: { rotate: 0, color: "#facc15", label: "Average form" },
  2: { rotate: 45, color: "#f97316", label: "Poor form" },
  1: { rotate: 90, color: "#ef4444", label: "Bad form" },
};

/** Shows nothing when there is no form yet (form is 0, missing or out of range). */
export default function FormArrow({
  form,
  size = 18,
  className = "",
  style,
}: {
  form?: number | null;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}) {
  const f = form ? FORM_STYLE[form] : undefined;
  if (!f) return null;
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      role="img"
      aria-label={f.label}
      title={f.label}
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: px, height: px, ...style }}
    >
      <svg
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="none"
        stroke={f.color}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: `rotate(${f.rotate}deg)`, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.7))" }}
        aria-hidden="true"
      >
        <path d="M4 12h15" />
        <path d="M13 6l6 6-6 6" />
      </svg>
    </span>
  );
}
