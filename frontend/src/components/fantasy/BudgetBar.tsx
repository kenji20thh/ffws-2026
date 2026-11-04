export default function BudgetBar({
  spent,
  unlimited = false,
}: {
  spent: number;
  unlimited?: boolean;
}) {
  const over = !unlimited && spent > 100;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between font-stat text-[10px] uppercase tracking-widest">
        <span className="text-ash">
          Budget
          {over && <span className="ml-2 text-danger">· Over budget</span>}
        </span>
        <span
          className={`tabular-nums ${
            over ? "text-danger" : unlimited ? "text-amber" : "text-green-500"
          }`}
        >
          {unlimited ? `$${spent} · no limit` : `$${spent} / $100`}
        </span>
      </div>

      <div className="h-1.5 w-full bg-char-3">
        <div
          className={`h-full transition-all ${
            over ? "bg-danger" : unlimited ? "bg-amber" : "bg-green-500"
          }`}
          style={{
            width: unlimited ? "100%" : `${Math.min((spent / 100) * 100, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
