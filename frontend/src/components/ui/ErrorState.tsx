export default function ErrorState({
  message = "Something went wrong",
}: {
  message?: string;
}) {
  return (
    <div role="alert" className="chamfer border border-danger/40 bg-danger/10 px-6 py-12 text-center">
      <p className="font-stat text-xs uppercase tracking-[0.3em] text-danger">Connection lost</p>
      <p className="mt-2 font-display text-2xl font-extrabold uppercase">{message}</p>
    </div>
  );
}