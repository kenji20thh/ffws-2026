import { notFound } from "next/navigation";
import FantasyPlayerCardDemo from "@/components/fantasy/FantasyPlayerCard.demo";

// TEMPORARY dev-only preview route. It 404s in production builds.
// Delete src/app/dev/ together with FantasyPlayerCard.demo.tsx after integration.

export const dynamic = "force-dynamic";
export const metadata = { title: "Fantasy card preview (dev)" };

function httpUrl(value: string | undefined): string | undefined {
  return value && /^https?:\/\//i.test(value) ? value : undefined;
}

export default async function FantasyCardPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ photo?: string; logo?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { photo, logo } = await searchParams;
  return <FantasyPlayerCardDemo photoUrl={httpUrl(photo)} logoUrl={httpUrl(logo)} />;
}
