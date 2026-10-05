export default function BudgetBar({ spent, unlimited = false }: { spent: number; unlimited?: boolean }) {
  const over = !unlimited && spent > 100;
  return (
    <div className="chamfer-sm border border-bone/15 bg-char-2 p-4">
      <div className="mb-2 flex items-baseline justify-between font-stat text-xs uppercase tracking-widest">
        <span className="text-ash">Budget</span>
        <span className={`tabular-nums ${over ? "text-danger" : "text-ember"}`}>
          {unlimited ? `$${spent} · no limit` : `$${spent} / $100`}
        </span>
      </div>
      <div className="h-2.5 w-full bg-char-3">
        <div
          className={`h-full transition-all ${over ? "bg-danger" : unlimited ? "bg-amber" : "bg-ember"}`}
          style={{ width: unlimited ? "100%" : `${Math.min((spent / 100) * 100, 100)}%` }}
        />
      </div>
      {over && <p className="mt-2 font-stat text-[10px] uppercase tracking-widest text-danger">Over budget</p>}
    </div>
  );
}
