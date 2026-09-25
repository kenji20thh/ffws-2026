import Link from "next/link";
export default function SectionHeader({ title, subtitle, href, hrefLabel }: { title: string; subtitle?: string; href?: string; hrefLabel?: string }) {
  return (<div className="mb-6 flex items-end justify-between gap-4 border-l-4 border-accent pl-4">
    <div><h2 className="font-display text-2xl tracking-wide sm:text-3xl">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>
    {href && <Link href={href} className="shrink-0 text-sm font-semibold text-accent hover:underline">{hrefLabel ?? "View all"}</Link>}
  </div>);
}
