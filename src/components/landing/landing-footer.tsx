"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/edubek/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export function LandingFooter() {
  const t = useTranslations("landing.footer");

  return (
    <footer className="border-t border-border bg-card/60 text-muted-foreground" id="landing-footer">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Col 1: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-semibold text-foreground">EduBek</span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              {t("brandDescription")}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {/* Col 2: Core Learning */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t("ecosystemTitle")}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/discover" className="hover:text-foreground transition-colors">
                  {t("links.knowledgeDiscovery")}
                </Link>
              </li>
              <li>
                <Link href="/live-quiz" className="hover:text-foreground transition-colors">
                  {t("links.liveQuizArena")}
                </Link>
              </li>
              <li>
                <Link href="/ai-workspace" className="hover:text-foreground transition-colors">
                  {t("links.contextualAi")}
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-foreground transition-colors">
                  {t("links.creatorMarketplace")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: For Educators & Roles */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t("workspacesTitle")}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/classrooms" className="hover:text-foreground transition-colors">
                  {t("links.teacherClassrooms")}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  {t("links.studentDashboard")}
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-foreground transition-colors">
                  {t("links.personalLibrary")}
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-foreground transition-colors">
                  {t("links.tokenWallet")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Account & Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t("accountTitle")}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  {t("links.signIn")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  {t("links.createAccount")}
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-foreground transition-colors">
                  {t("links.settingsProfile")}
                </Link>
              </li>
              <li>
                <Link href="/notifications" className="hover:text-foreground transition-colors">
                  {t("links.notifications")}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} EduBek {t("allRightsReserved")}</p>
          <div className="flex items-center gap-6">
            <span>{t("curriculumStandards")}</span>
            <span>{t("multilingualPill")}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
