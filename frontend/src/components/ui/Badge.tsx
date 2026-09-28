type Tone = "neutral" | "ember" | "live" | "done";

const tones: Record<Tone, string> = {
  neutral: "border-bone/20 text-ash",
  ember: "border-ember text-ember",
  live: "border-danger bg-danger/15 text-danger",
  done: "border-khaki text-khaki",
};

export default function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-stat text-[10px] uppercase tracking-widest ${tones[tone]}`}
    >
      {tone === "live" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger" />
        </span>
      )}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  if (status === "live" || status === "ongoing") return "live";
  if (status === "completed") return "done";
  return "ember";
}