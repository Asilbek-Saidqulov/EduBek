/**
 * Login page — email + password form.
 *
 * Flow:
 *   1. User submits → POST /api/auth/login with email + password.
 *   2. On success, the API sets HTTP-only cookies. We `router.refresh()`
 *      so middleware picks up the new session, then redirect to /dashboard.
 *   3. On failure, show API error envelope: { error: { code, message } }.
 *      401 → invalidCredentials, 403 → accountBanned, 400 → validationError.
 */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";

import { LoginForm } from "./login-form";
import { ThemeToggle } from "@/components/edubek/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getAuthContext } from "@/features/auth/auth.context";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  // If already authenticated, bounce to the dashboard.
  const ctx = await getAuthContext();
  if (ctx.userId) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="EduBek home">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teacher to-ai text-sm font-black text-teacher-foreground shadow-sm">
            <GraduationCap className="size-4" aria-hidden />
          </span>
          <span className="text-sm font-semibold tracking-tight">EduBek</span>
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{t("login.title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("login.subtitle")}</p>
          </div>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link
              href="/register"
              className="font-medium text-teacher hover:text-teacher/80 underline-offset-4 hover:underline"
            >
              {t("login.signUpLink")}
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              {t("login.forgotLink")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
