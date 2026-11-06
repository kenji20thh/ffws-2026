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

// `size` is given in px at the base 16px root; it is rendered in rem so it grows with the
// site's big-screen scaling (see globals.css) instead of staying a fixed pixel size.
const rem = (px: number) => `${px / 16}rem`;

export default function Monogram({ label, imageUrl, size = 64 }: Props) {
  const color = PALETTE[hash(label) % PALETTE.length];
  const dark = color === "#f1e9dc" || color === "#ffb000";
  const hex = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

  if (imageUrl) {
  return (
    <div
      style={{
        width: rem(size),
        height: rem(size),
      }}
      className="flex items-center justify-center"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={label}
        style={{
          width: "100%",
          height: "100%",
        }}
        className="object-contain"
      />
    </div>
  );
}

  return (
    <div
      aria-label={label}
      style={{ width: rem(size), height: rem(size), background: color, clipPath: hex }}
      className={`flex items-center justify-center font-display font-black uppercase leading-none ${
        dark ? "text-char" : "text-char"
      }`}
    >
      <span style={{ fontSize: rem(size * 0.34) }}>{label.slice(0, 3)}</span>
    </div>
  );
}