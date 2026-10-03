import PredictionSubNav from "@/components/predictions/PredictionSubNav";

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <section className="map-grid border-b border-bone/10 px-5 py-14 text-center">
        <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Call the final order</p>
        <h1 className="mt-2 font-display text-[clamp(2.5rem,8vw,5rem)] font-black uppercase leading-[0.9]">
          Predict<span className="text-ember">ions</span>
        </h1>
      </section>
      <PredictionSubNav />
      {children}
    </div>
  );
}