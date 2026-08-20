/**
 * Notifications inbox page — Server Component wrapper.
 *
 * The 6G.17 notifications-platform is in-memory; items don't survive a
 * server restart. UX is best-effort.
 */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/edubek/app-shell";
import { NotificationsView } from "./view";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations("notifications");
  return (
    <AppShell>
      <NotificationsView />
    </AppShell>
  );
}
