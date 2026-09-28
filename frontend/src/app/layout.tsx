import type { Metadata } from "next";
import { Big_Shoulders, Barlow_Semi_Condensed, Martian_Mono } from "next/font/google";
import "./globals.css";

const display = Big_Shoulders({
  subsets: ["latin"],
  variable: "--font-big-shoulders",
  display: "swap",
});

const sans = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const stat = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Free Fire World Series 2026",
  description: "Teams, players, schedule and live standings for FFWS 2026.",
  openGraph: {
    title: "Free Fire World Series 2026",
    description: "Teams, players, schedule and live standings for FFWS 2026.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${stat.variable}`}>
      <body>{children}</body>
    </html>
  );
}