import Image from "next/image";
// Renders a real image when provided, otherwise a neutral initials placeholder (no fake official imagery).
export default function Media({ src, alt, label, className = "" }: { src?: string; alt: string; label: string; className?: string }) {
  if (src) return <div className={`relative ${className}`}><Image src={src} alt={alt} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" /></div>;
  return <div className={`flex items-center justify-center bg-gradient-to-b from-[#1a1a1e] to-[#0e0e10] font-display text-4xl text-white/25 ${className}`} aria-label={alt}>{label.slice(0, 2).toUpperCase()}</div>;
}
