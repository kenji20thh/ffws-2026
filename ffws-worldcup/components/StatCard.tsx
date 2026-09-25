export default function StatCard({ label, value }: { label: string; value?: string | number }) {
  return (<div className="border border-line bg-panel p-4"><p className="text-xs uppercase tracking-wider text-muted">{label}</p><p className="mt-1 font-display text-3xl">{value ?? "—"}</p></div>);
}
