/** Settings page — Server Component wrapper. */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/edubek/app-shell";
import { SettingsView } from "./view";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations("settings");
  return (
    <AppShell>
      <SettingsView />
    </AppShell>
  );
}
