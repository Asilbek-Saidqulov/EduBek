import { setRequestLocale } from "next-intl/server";

import { AppShell } from "@/components/edubek/app-shell";
import { DiscoverView } from "./view";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AppShell>
      <DiscoverView />
    </AppShell>
  );
}
