import { setRequestLocale, getTranslations } from "next-intl/server";
import { AppShell } from "@/components/edubek/app-shell";
import { ClassroomsClient } from "./view";

export const dynamic = "force-dynamic";

export default async function ClassroomsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("classrooms");

  return (
    <AppShell>
      <ClassroomsClient t={t} />
    </AppShell>
  );
}
