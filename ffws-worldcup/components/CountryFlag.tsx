// Emoji flag from ISO-3166 alpha-2 code. Swap for /public/flags images later if desired.
export default function CountryFlag({ code, className = "" }: { code: string; className?: string }) {
  const flag = code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  return <span className={className} role="img" aria-label={code.toUpperCase()}>{flag}</span>;
}
