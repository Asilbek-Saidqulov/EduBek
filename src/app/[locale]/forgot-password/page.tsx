/**
 * Forgot-password page — UI only.
 *
 * There is no /api/auth/forgot-password endpoint in the codebase, so this
 * page does NOT fake a backend. It shows the email-entry form and a
 * prominent banner explaining that password reset is not yet wired up —
 * users are directed to contact their administrator or sign up again.
 *
 * When the backend gains a reset endpoint, this page can be upgraded by
 * posting to it in the same pattern as LoginForm.
 */
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GraduationCap, Info } from "lucide-react";

import { ThemeToggle } from "@/components/edubek/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

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
            <h1 className="text-2xl font-semibold tracking-tight">{t("forgot.title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("forgot.subtitle")}</p>
          </div>

          <Alert className="mb-6">
            <Info className="size-4" aria-hidden />
            <AlertTitle>{t("forgot.unavailableTitle")}</AlertTitle>
            <AlertDescription>{t("forgot.unavailableBody")}</AlertDescription>
          </Alert>

          {/* Disabled form — UI only, no submission.
              When /api/auth/forgot-password lands, replace `disabled` with a real handler. */}
          <form
            className="flex flex-col gap-4"
            aria-describedby="forgot-notice"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="forgot-email">{t("login.emailLabel")}</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled
                aria-describedby="forgot-notice"
              />
            </div>
            <Button type="submit" disabled className="w-full">
              {t("forgot.submitDisabled")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-teacher hover:text-teacher/80 underline-offset-4 hover:underline"
            >
              {t("forgot.backToLogin")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
