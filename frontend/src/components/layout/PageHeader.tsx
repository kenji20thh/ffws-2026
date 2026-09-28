export default function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="map-grid border-b border-bone/10">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">{eyebrow}</p>
        <h1 className="font-display text-[clamp(3.5rem,10vw,8rem)] font-black uppercase leading-[0.85]">
          {title}
        </h1>
        {children && <div className="mt-4 max-w-xl text-bone/70">{children}</div>}
      </div>
    </div>
  );
}