/**
 * Marketplace browse page.
 * Server Component — wraps the client browse UI in the AppShell.
 */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/edubek/app-shell";
import { MarketplaceBrowse } from "./browse";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations("marketplace");
  return (
    <AppShell>
      <MarketplaceBrowse />
    </AppShell>
  );
}
