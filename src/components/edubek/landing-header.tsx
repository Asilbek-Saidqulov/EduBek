/**
 * LandingHeader — auth-aware landing page header.
 *
 * Replaces the inline <header> in [locale]/page.tsx so the Sign in / Sign
 * up CTAs can react to the current auth state (GET /api/auth/me). When
 * authenticated, the right-hand side swaps to Dashboard + Logout + avatar.
 *
 * Mobile: hamburger opens a Sheet with the same nav links + CTAs. The
 * previous inline header hid the nav entirely on mobile — this fixes that.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/edubek/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function LandingHeader() {
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const { user } = useCurrentUser();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="#top" className="flex items-center gap-2" aria-label={t("header.ariaHome")}>
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teacher via-ai to-student text-sm font-black text-teacher-foreground shadow-lg shadow-teacher/20">
            E
          </span>
          <span className="text-lg font-bold tracking-tight">EduBek</span>
        </Link>

        {/* Right side: theme + language + auth CTAs */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">{tNav("dashboard")}</Link>
              </Button>
              <Button asChild size="icon" variant="ghost" aria-label={tNav("profile")}>
                <Link href="/profile">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-gradient-to-br from-teacher to-ai text-xs font-semibold text-teacher-foreground">
                      {(user.name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{tNav("login")}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-gradient-to-r from-teacher to-ai text-teacher-foreground hover:opacity-90"
              >
                <Link href="/register">
                  {tNav("register")}
                  <ArrowRight className="ms-1 size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile menu trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label="Open menu"
              >
                {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teacher to-ai text-teacher-foreground">
                    <span className="text-sm font-black">E</span>
                  </span>
                  EduBek
                </SheetTitle>
              </SheetHeader>
              <div className="mt-auto flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <LanguageSwitcher />
                </div>
                {user ? (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline">
                        <Link href="/dashboard">{tNav("dashboard")}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="outline">
                        <Link href="/profile">{tNav("profile")}</Link>
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline">
                        <Link href="/login">{tNav("login")}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="bg-teacher text-teacher-foreground hover:bg-teacher/90">
                        <Link href="/register">{tNav("register")}</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
