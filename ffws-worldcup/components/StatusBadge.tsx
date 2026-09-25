export default function StatusBadge({ status }: { status: string }) {
  return <span className="inline-block bg-accent px-2 py-0.5 text-xs font-bold tracking-wider text-black">{status}</span>;
}
