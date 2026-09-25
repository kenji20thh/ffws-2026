import { Clock } from "lucide-react";
export default function EmptyState({ title, text }: { title: string; text?: string }) {
  return (<div className="flex flex-col items-center gap-2 border border-dashed border-line bg-panel px-6 py-10 text-center">
    <Clock className="h-6 w-6 text-accent" aria-hidden /><p className="font-semibold">{title}</p>{text && <p className="max-w-md text-sm text-muted">{text}</p>}</div>);
}
