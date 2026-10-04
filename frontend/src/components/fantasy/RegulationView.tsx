import type { ReactNode } from "react";

export interface RuleSection {
  title: string;
  content: ReactNode;
}

export function RuleTable({ head, rows }: { head: [string, string]; rows: [string, string][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[260px] text-left">
        <thead>
          <tr className="border-b border-bone/15 font-stat text-[10px] uppercase tracking-widest text-ash">
            <th className="py-2 pr-4 font-normal">{head[0]}</th>
            <th className="py-2 text-right font-normal">{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-bone/5">
              <td className="py-2 pr-4 text-bone/80">{label}</td>
              <td className="py-2 text-right font-stat tabular-nums text-ember">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RegulationView({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: RuleSection[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">{eyebrow}</p>
      <h2 className="font-display text-[clamp(2.5rem,7vw,4rem)] font-black uppercase leading-[0.9]">{title}</h2>
      <p className="mt-3 max-w-xl text-bone/70">{intro}</p>

      <ol className="mt-8 space-y-4">
        {sections.map((s, i) => (
          <li key={s.title} className="chamfer border border-bone/10 bg-char-2 p-6">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-black text-ember">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-2xl font-extrabold uppercase">{s.title}</h3>
            </div>
            <div className="mt-3 space-y-3 text-bone/80">{s.content}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
