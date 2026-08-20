/** Resource detail page — Server Component wrapper. */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/edubek/app-shell";
import { ResourceDetail } from "./detail";

export const dynamic = "force-dynamic";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await getTranslations("library");
  return (
    <AppShell>
      <ResourceDetail id={id} />
    </AppShell>
  );
}
