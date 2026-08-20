import { setRequestLocale, getTranslations } from "next-intl/server";
import { AppShell } from "@/components/edubek/app-shell";
import { AiWorkspaceClient } from "./view";

export const dynamic = "force-dynamic";

export default async function AiWorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("aiWorkspace");

  return (
    <AppShell>
      <AiWorkspaceClient t={t} />
    </AppShell>
  );
}
