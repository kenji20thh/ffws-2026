export default function CaptainBadge({
  className = "",
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const sizing =
    size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-ember font-stat font-bold uppercase tracking-widest text-black ${sizing} ${className}`}
    >
      <span
        aria-hidden
        className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] leading-none text-ember"
      >
        C
      </span>
      Captain
    </span>
  );
}
