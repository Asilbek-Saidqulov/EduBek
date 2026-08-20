/**
 * Marketplace listing detail page — Server Component.
 * Wraps the client detail component in the AppShell.
 */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/edubek/app-shell";
import { MarketplaceDetail } from "./detail";

export const dynamic = "force-dynamic";

export default async function MarketplaceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await getTranslations("marketplace");
  return (
    <AppShell>
      <MarketplaceDetail id={id} />
    </AppShell>
  );
}
