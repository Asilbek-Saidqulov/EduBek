import { setRequestLocale, getTranslations } from "next-intl/server";
import { AppShell } from "@/components/edubek/app-shell";
import { AdminClient } from "./view";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <AppShell>
      <AdminClient t={t} />
    </AppShell>
  );
}
