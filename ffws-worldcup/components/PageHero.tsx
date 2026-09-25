export default function PageHero({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (<section className="border-b border-line bg-panel"><div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
    {eyebrow && <p className="mb-2 text-sm font-semibold text-accent">{eyebrow}</p>}
    <h1 className="font-display text-4xl leading-none sm:text-6xl">{title}</h1>{children && <div className="mt-4 text-muted">{children}</div>}</div></section>);
}
