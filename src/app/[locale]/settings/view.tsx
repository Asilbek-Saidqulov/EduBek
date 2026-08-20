/**
 * Settings page — account + appearance + security shells.
 *
 * Sections:
 *   1. Account — name, username, bio, country, avatar (uses ProfileView's
 *      EditProfileForm pattern via PATCH /api/auth/me — but the Profile
 *      page already handles this, so Settings just links to /profile?edit=1)
 *   2. Language — locale radio (uses POST /api/auth/locale)
 *   3. Appearance — theme toggle (uses next-themes directly, no API call)
 *   4. Notifications — link to /api/notifications/preferences (separate page)
 *   5. Security — change password (UI-only — no /api/auth/change-password
 *      endpoint exists yet, same as forgot-password)
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  Bell,
  Globe,
  Info,
  KeyRound,
  Lock,
  Moon,
  Palette,
  ShieldCheck,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";

import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const LOCALES = [
  { code: "en", name: "English" },
  { code: "uz", name: "O'zbekcha" },
  { code: "ru", name: "Русский" },
] as const;

export function SettingsView() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const { user } = useCurrentUser();
  const { setTheme, theme } = useTheme();
  const locale = useLocale();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Account */}
      <SettingsSection
        icon={UserIcon}
        title={t("account.title")}
        description={t("account.desc")}
        accent="teacher"
      >
        <div className="space-y-3 text-sm">
          <Row label={t("account.email")} value={user?.email ?? "—"} />
          <Row label={t("account.name")} value={user?.name ?? "—"} />
          <Row label={t("account.username")} value={user?.username ? `@${user.username}` : "—"} />
          <Row label={t("account.country")} value={user?.country ?? "—"} />
        </div>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/profile">{t("account.edit")}</Link>
        </Button>
      </SettingsSection>

      {/* Language */}
      <SettingsSection
        icon={Globe}
        title={t("language.title")}
        description={t("language.desc")}
        accent="ai"
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={async () => {
                try {
                  await fetch("/api/auth/locale", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ locale: l.code }),
                    credentials: "same-origin",
                  });
                } catch {
                  // best-effort — URL change is the primary mechanism
                }
                router.replace("/settings", { locale: l.code });
              }}
              aria-pressed={locale === l.code}
              className={`rounded-md border p-3 text-sm font-medium transition-colors ${
                locale === l.code
                  ? "border-ai bg-ai/10 text-ai"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection
        icon={Palette}
        title={t("appearance.title")}
        description={t("appearance.desc")}
        accent="creator"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Moon className="size-4" aria-hidden />
            <Label htmlFor="theme-select">{t("appearance.theme")}</Label>
          </div>
          <select
            id="theme-select"
            value={theme ?? "light"}
            onChange={(e) => setTheme(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="light">{t("appearance.light")}</option>
            <option value="dark">{t("appearance.dark")}</option>
            <option value="system">{t("appearance.system")}</option>
          </select>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        icon={Bell}
        title={t("notifications.title")}
        description={t("notifications.desc")}
        accent="student"
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/notifications">
            {t("notifications.openInbox")}
            <ArrowRight className="ms-1 size-4" aria-hidden />
          </Link>
        </Button>
      </SettingsSection>

      {/* Security: change password */}
      <SettingsSection
        icon={ShieldCheck}
        title={t("security.title")}
        description={t("security.desc")}
        accent="admin"
      >
        <Alert>
          <Info className="size-4" aria-hidden />
          <AlertTitle>{t("security.changePasswordUnavailable")}</AlertTitle>
          <AlertDescription>{t("security.changePasswordDesc")}</AlertDescription>
        </Alert>
        <Separator className="my-3" />
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="flex items-center gap-1.5 text-xs">
              <Lock className="size-3" aria-hidden />
              {t("security.currentPassword")}
            </Label>
            <Input id="current-password" type="password" autoComplete="current-password" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="flex items-center gap-1.5 text-xs">
              <KeyRound className="size-3" aria-hidden />
              {t("security.newPassword")}
            </Label>
            <Input id="new-password" type="password" autoComplete="new-password" disabled />
          </div>
          <Button type="submit" disabled className="sm:col-span-2 sm:w-fit">
            {tCommon("save")}
          </Button>
        </form>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  accent,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: "teacher" | "ai" | "creator" | "student" | "admin";
  children: React.ReactNode;
}) {
  const accentBg = {
    teacher: "bg-teacher/10 text-teacher",
    ai: "bg-ai/10 text-ai",
    creator: "bg-creator/10 text-creator",
    student: "bg-student/10 text-student",
    admin: "bg-admin/10 text-admin",
  }[accent];
  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${accentBg}`}>
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
