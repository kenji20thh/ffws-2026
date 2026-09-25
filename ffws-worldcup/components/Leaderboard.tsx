"use client";
import { useState } from "react"; import EmptyState from "./EmptyState";
// Rows are typed loosely on purpose: the API will supply them later.
export default function Leaderboard({ title, categories, entity }: { title: string; categories: string[]; entity: string }) {
  const [cat, setCat] = useState(categories[0]); const rows: { name: string; value: number }[] = [];
  return (<section className="border border-line bg-panel"><div className="border-b border-line p-4"><h3 className="font-display text-xl">{title}</h3>
    <div className="mt-3 flex flex-wrap gap-2" role="tablist">{categories.map((c) => <button key={c} role="tab" aria-selected={c === cat} onClick={() => setCat(c)} className={`border px-3 py-1 text-xs font-semibold ${c === cat ? "border-accent bg-accent text-black" : "border-line text-muted hover:text-white"}`}>{c}</button>)}</div></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[320px] text-left text-sm"><thead className="text-xs text-muted"><tr><th className="p-3">#</th><th className="p-3">{entity}</th><th className="p-3 text-right">{cat}</th></tr></thead>
      <tbody>{rows.map((r, i) => <tr key={r.name} className="border-t border-line"><td className="p-3">{i + 1}</td><td className="p-3">{r.name}</td><td className="p-3 text-right">{r.value}</td></tr>)}</tbody></table></div>
    {!rows.length && <div className="p-4"><EmptyState title="No tournament statistics available yet." text="Rankings appear once matches are played." /></div>}</section>);
}
