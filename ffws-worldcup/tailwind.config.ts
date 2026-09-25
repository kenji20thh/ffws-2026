import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { ink: "#0a0a0b", panel: "#121214", line: "#26262a", muted: "#9a9aa3", accent: "#ff5a1f", accent2: "#e02b20" },
    fontFamily: { display: ["var(--font-display)", "Impact", "sans-serif"], sans: ["var(--font-body)", "system-ui", "sans-serif"] },
  } },
  plugins: [],
};
export default config;
