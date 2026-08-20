"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/edubek/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export function LandingHeader({ t }: { t?: any }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            EduBek
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/discover" className="transition-colors hover:text-foreground">
            {t?.('nav.discover') || 'Discover'}
          </Link>
          <Link href="/marketplace" className="transition-colors hover:text-foreground">
            {t?.('nav.marketplace') || 'Marketplace'}
          </Link>
          <Link href="/live-quiz" className="transition-colors hover:text-foreground">
            {t?.('nav.liveQuiz') || 'Live Quiz'}
          </Link>
          <Link href="/ai-workspace" className="flex items-center gap-1 transition-colors hover:text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{t?.('nav.aiWorkspace') || 'AI Workspace'}</span>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/login">{t?.('auth.login') || 'Sign In'}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">{t?.('auth.register') || 'Get Started'}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
