import AdminConsole from "@/components/admin/AdminConsole";

export const metadata = { title: "Admin · FFWS 2026" };

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Ops console</p>
      <h1 className="mb-8 font-display text-6xl font-black uppercase leading-none">Enter results</h1>
      <AdminConsole />
    </div>
  );
}