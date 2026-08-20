/**
 * Wallet page — Server Component.
 */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/edubek/app-shell";
import { WalletView } from "./view";

export const dynamic = "force-dynamic";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations("wallet");
  return (
    <AppShell>
      <WalletView />
    </AppShell>
  );
}
