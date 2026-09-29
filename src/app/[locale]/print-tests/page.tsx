import { setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/edubek/app-shell";
import { PrintTestsView } from "./view";

export const dynamic = "force-dynamic";

export default async function PrintTestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AppShell>
      <PrintTestsView />
    </AppShell>
  );
}
