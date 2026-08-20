/**
 * Dashboard page — the destination after login.
 *
 * Server-side: getAuthContext() so we pre-render with the initial user
 * (avoids auth-flash). Client: re-fetches via useCurrentUser and
 * redirects to /login if unauthenticated.
 *
 * Renders a role-aware dashboard:
 *   - student → quick-action grid + wallet + notifications preview
 *   - teacher → classrooms + class insights + recommendations
 *   - creator → earnings + top resources
 *   - admin/superadmin → admin actions placeholder
 */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/edubek/app-shell";
import { DashboardView } from "./dashboard";
import { getAuthContext } from "@/features/auth/auth.context";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations("dashboard");
  const ctx = await getAuthContext();

  const initialUser = ctx.userId
    ? {
        id: ctx.userId,
        email: ctx.email ?? "",
        name: null as string | null,
        username: null as string | null,
        platformRoles: ctx.platformRoles,
      }
    : null;

  return (
    <AppShell>
      <DashboardView initialUser={initialUser} />
    </AppShell>
  );
}
