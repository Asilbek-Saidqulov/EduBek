/**
 * Register page — name + email + password + confirm form.
 *
 * Flow:
 *   1. Server-side: if already authenticated, redirect to /dashboard.
 *   2. Client form submits to /api/auth/register. The API issues a
 *      session cookie so we don't need a separate login step.
 *   3. On success, router.refresh() then redirect to /dashboard.
 *   4. On conflict (email already exists) → show "alreadyExists" error.
 */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";

import { RegisterForm } from "./register-form";
import { ThemeToggle } from "@/components/edubek/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getAuthContext } from "@/features/auth/auth.context";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

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
            <h1 className="text-2xl font-semibold tracking-tight">{t("register.title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("register.subtitle")}</p>
          </div>
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("register.haveAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-teacher hover:text-teacher/80 underline-offset-4 hover:underline"
            >
              {t("register.signInLink")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
