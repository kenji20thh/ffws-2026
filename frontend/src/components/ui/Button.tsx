import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary: "bg-ember text-char hover:bg-amber",
  ghost: "border border-bone/25 text-bone hover:border-ember hover:text-ember",
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      className={`chamfer-sm font-display text-lg font-extrabold uppercase tracking-wider px-7 py-3 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}