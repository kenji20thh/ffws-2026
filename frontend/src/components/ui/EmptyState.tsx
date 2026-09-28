export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="chamfer border border-dashed border-bone/15 bg-char-2 px-6 py-16 text-center">
      <p className="font-display text-3xl font-black uppercase text-bone/80">{title}</p>
      {hint && <p className="mt-2 text-ash">{hint}</p>}
    </div>
  );
}