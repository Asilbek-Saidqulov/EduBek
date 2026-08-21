"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { GraduationCap, Sparkles, Menu, X, LayoutDashboard, Compass, Swords, ShoppingBag, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/edubek/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useCurrentUser } from "@/hooks/use-current-user";

export function LandingHeader() {
  const tNav = useTranslations("nav");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, isLoading } = useCurrentUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors" id="landing-header">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight group" id="landing-logo">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform duration-200 group-hover:scale-105">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold tracking-tight text-foreground text-lg leading-tight">
              EduBek
            </span>
          </div>
        </Link>

        {/* Center / Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground" id="landing-desktop-nav">
          <Link href="/discover" className="transition-colors hover:text-foreground">
            {tNav("discover")}
          </Link>
          <Link href="/live-quiz" className="transition-colors hover:text-foreground">
            {tNav("liveQuiz")}
          </Link>
          <Link href="/marketplace" className="transition-colors hover:text-foreground">
            {tNav("marketplace")}
          </Link>
          <Link href="/classrooms" className="transition-colors hover:text-foreground">
            {tNav("forEducators")}
          </Link>
          <Link href="/ai-workspace" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{tNav("aiWorkspace")}</span>
          </Link>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5" id="landing-auth-actions">
          <LanguageSwitcher />
          <ThemeToggle />

          {!isLoading && user ? (
            <Button size="sm" asChild className="gap-2 font-medium" id="landing-btn-dashboard">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                <span>{tNav("dashboard")}</span>
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex text-muted-foreground hover:text-foreground font-medium" id="landing-btn-signin">
                <Link href="/login">{tNav("login")}</Link>
              </Button>
              <Button size="sm" asChild className="font-medium shadow-xs" id="landing-btn-getstarted">
                <Link href="/register">{tNav("register")}</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground md:hidden hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            id="landing-mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 py-5 shadow-lg animate-in slide-in-from-top duration-200" id="landing-mobile-menu">
          <nav className="flex flex-col space-y-3">
            <Link
              href="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Compass className="h-4 w-4 text-primary" />
              <span>{tNav("discover")}</span>
            </Link>
            <Link
              href="/live-quiz"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Swords className="h-4 w-4 text-primary" />
              <span>{tNav("liveQuiz")}</span>
            </Link>
            <Link
              href="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span>{tNav("marketplace")}</span>
            </Link>
            <Link
              href="/classrooms"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <School className="h-4 w-4 text-primary" />
              <span>{tNav("forEducators")}</span>
            </Link>
            <Link
              href="/ai-workspace"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{tNav("aiWorkspace")}</span>
            </Link>
            <div className="pt-2 border-t flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {tNav("login")}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-xs"
              >
                {tNav("register")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
