const PALETTE = ["#ff5a1f", "#ffb000", "#e5322d", "#6b6b47", "#f1e9dc"];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface Props {
  label: string; // team tag or player IGN
  imageUrl?: string;
  size?: number;
}

export default function Monogram({ label, imageUrl, size = 64 }: Props) {
  const color = PALETTE[hash(label) % PALETTE.length];
  const dark = color === "#f1e9dc" || color === "#ffb000";
  const hex = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt={label}
        width={size}
        height={size}
        style={{ width: size, height: size, clipPath: hex }}
        className="object-cover"
      />
    );
  }

  return (
    <div
      aria-label={label}
      style={{ width: size, height: size, background: color, clipPath: hex }}
      className={`flex items-center justify-center font-display font-black uppercase leading-none ${
        dark ? "text-char" : "text-char"
      }`}
    >
      <span style={{ fontSize: size * 0.34 }}>{label.slice(0, 3)}</span>
    </div>
  );
}