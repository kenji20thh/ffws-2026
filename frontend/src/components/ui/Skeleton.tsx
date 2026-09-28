export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-char-3 ${className}`} aria-hidden="true" />;
}