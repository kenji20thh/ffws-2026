import type { Metadata } from "next"; import { Anton, Inter } from "next/font/google"; import "./globals.css"; import Header from "@/components/Header"; import Footer from "@/components/Footer";
const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
export const metadata: Metadata = { title: "FFWS World Cup", description: "Official-style tournament hub, stats and fantasy for the FFWS World Cup." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className={`${display.variable} ${body.variable}`}><body className="font-sans"><Header /><main>{children}</main><Footer /></body></html>);
}
