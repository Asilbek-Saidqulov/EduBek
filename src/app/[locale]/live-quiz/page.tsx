import { setRequestLocale, getTranslations } from "next-intl/server";
import { AppShell } from "@/components/edubek/app-shell";
import { LiveQuizClient } from "./view";

export const dynamic = "force-dynamic";

export default async function LiveQuizPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("liveQuiz");

  return (
    <AppShell>
      <LiveQuizClient t={t} />
    </AppShell>
  );
}
