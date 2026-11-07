export const metadata = {
  title: "Price Changes · Fantasy · FFWS 2026",
};

const priceChanges = [
  // Price increases
  { id: 80, name: "KRISH", oldPrice: 13, newPrice: 16 },
  { id: 81, name: "ZIYAN21", oldPrice: 13, newPrice: 15 },
  { id: 61, name: "BLUEE", oldPrice: 16, newPrice: 18 },
  { id: 115, name: "BUTZIN", oldPrice: 26, newPrice: 28 },
  { id: 39, name: "RANZ", oldPrice: 24, newPrice: 25 },
  { id: 105, name: "RAONE7", oldPrice: 26, newPrice: 28 },
  { id: 114, name: "BOPS", oldPrice: 23, newPrice: 25 },
  { id: 130, name: "DAVID444", oldPrice: 21, newPrice: 22 },
  { id: 79, name: "SIDAK07", oldPrice: 14, newPrice: 16 },
  { id: 82, name: "DAAFIQ20", oldPrice: 14, newPrice: 15 },

  // Price decreases
  { id: 128, name: "ANDREXZ", oldPrice: 20, newPrice: 18 },
  { id: 123, name: "KROWA", oldPrice: 23, newPrice: 21 },
  { id: 44, name: "POOM", oldPrice: 23, newPrice: 21 },
  { id: 125, name: "JOSTINN7", oldPrice: 22, newPrice: 21 },
  { id: 124, name: "ESTEBANZN", oldPrice: 22, newPrice: 21 },
  { id: 14, name: "KOJAA", oldPrice: 26, newPrice: 25 },
  { id: 33, name: "THEGOD", oldPrice: 28, newPrice: 27 },
  { id: 13, name: "C1B3NK", oldPrice: 27, newPrice: 26 },
  { id: 108, name: "TRAP", oldPrice: 29, newPrice: 28 },
  { id: 111, name: "NICKZ", oldPrice: 27, newPrice: 26 },
  { id: 15, name: "FELLOW", oldPrice: 24, newPrice: 23 },
  { id: 51, name: "MOSHI", oldPrice: 29, newPrice: 28 },
];

const increases = priceChanges.filter((p) => p.newPrice > p.oldPrice);
const decreases = priceChanges.filter((p) => p.newPrice < p.oldPrice);

function PriceCard({
  player,
}: {
  player: (typeof priceChanges)[number];
}) {
  const difference = player.newPrice - player.oldPrice;
  const increased = difference > 0;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-4">
      <div className="min-w-0">
        <p className="font-display text-base font-black uppercase tracking-wide text-bone">
          {player.name}
        </p>
        <p className="mt-1 font-stat text-xs uppercase tracking-wider text-ash">
          Player #{player.id}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="font-stat text-xs text-ash line-through">
            ${player.oldPrice}
          </p>
          <p className="font-display text-xl font-black text-bone">
            ${player.newPrice}
          </p>
        </div>

        <span
          className={`min-w-[48px] rounded-lg px-2 py-1.5 text-center font-stat text-sm font-bold ${
            increased
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {increased ? "+" : ""}
          {difference}
        </span>
      </div>
    </div>
  );
}

export default function FantasyPricesPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-10 sm:pt-16">
      <div className="mb-10 text-center">
        <p className="font-stat text-xs font-bold uppercase tracking-[0.3em] text-[#ff5a1f]">
          FFWS 2026 · Fantasy
        </p>

        <h1 className="mt-3 font-display text-4xl font-black uppercase text-bone sm:text-5xl">
          Price Changes
        </h1>

        <p className="mt-3 font-stat text-sm uppercase tracking-widest text-ash">
          Day 3 · Based on Day 2 performances
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-3">
            <p className="font-display text-2xl font-black text-bone">
              {priceChanges.length}
            </p>
            <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
              Players changed
            </p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-5 py-3">
            <p className="font-display text-2xl font-black text-emerald-400">
              +{increases.length}
            </p>
            <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
              Price rises
            </p>
          </div>

          <div className="rounded-lg border border-red-500/20 bg-red-500/[0.05] px-5 py-3">
            <p className="font-display text-2xl font-black text-red-400">
              -{decreases.length}
            </p>
            <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
              Price drops
            </p>
          </div>
        </div>
      </div>

      <section className="mb-9">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-black uppercase text-emerald-400">
            Price increases
          </h2>
          <span className="font-stat text-xs uppercase tracking-widest text-ash">
            {increases.length} players
          </span>
        </div>

        <div className="space-y-2">
          {increases.map((player) => (
            <PriceCard key={player.id} player={player} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-black uppercase text-red-400">
            Price decreases
          </h2>
          <span className="font-stat text-xs uppercase tracking-widest text-ash">
            {decreases.length} players
          </span>
        </div>

        <div className="space-y-2">
          {decreases.map((player) => (
            <PriceCard key={player.id} player={player} />
          ))}
        </div>
      </section>

      <p className="mt-8 text-center font-stat text-[11px] uppercase tracking-wider text-ash">
        Prices are adjusted based on player performances during the tournament.
      </p>
    </main>
  );
}