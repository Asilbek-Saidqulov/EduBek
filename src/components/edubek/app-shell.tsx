/**
 * AppShell — the authenticated layout (Notion/Linear-style).
 *
 * Design: Simple, calm, educational, warm.
 * - Left sidebar: brand + nav groups + user card at bottom
 * - Top bar: search bar + notifications + theme + avatar
 * - Mobile: bottom tab bar (5 items)
 *
 * The sidebar uses soft warm cream tones with subtle active states.
 * No gradients, no neon — just clean typography and gentle shadows.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bell,
  Compass,
  GraduationCap,
  Home,
  type LucideIcon,
  Megaphone,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Wallet,
  LogOut,
  Menu,
  Rocket,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/edubek/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useCurrentUser, type CurrentUser } from "@/hooks/use-current-user";
import { Mascot } from "@/components/edubek/mascots";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  roles: string[];
  hideOnMobile?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: Home, roles: [] },
  { href: "/discover", labelKey: "nav.discover", icon: Compass, roles: [] },
  { href: "/live-quiz", labelKey: "nav.liveQuiz", icon: Rocket, roles: [] },
  { href: "/marketplace", labelKey: "nav.marketplace", icon: Store, roles: [] },
];

const SECONDARY_NAV: NavItem[] = [
  { href: "/library", labelKey: "nav.library", icon: GraduationCap, roles: [] },
  { href: "/ai-workspace", labelKey: "nav.aiWorkspace", icon: Sparkles, roles: [] },
  { href: "/wallet", labelKey: "nav.wallet", icon: Wallet, roles: [] },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell, roles: [] },
  { href: "/classrooms", labelKey: "nav.classrooms", icon: Users, roles: ["teacher", "ta", "school_admin", "admin", "owner"] },
  { href: "/admin", labelKey: "nav.admin", icon: ShieldCheck, roles: ["admin", "superadmin"] },
];

const MOBILE_TABS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: Home, roles: [] },
  { href: "/discover", labelKey: "nav.discover", icon: Compass, roles: [] },
  { href: "/live-quiz", labelKey: "nav.liveQuiz", icon: Rocket, roles: [] },
  { href: "/marketplace", labelKey: "nav.marketplace", icon: Store, roles: [] },
  { href: "/profile", labelKey: "nav.profile", icon: Megaphone, roles: [] },
];

function itemIsVisible(item: NavItem, roles: string[]): boolean {
  if (item.roles.length === 0) return true;
  return item.roles.some((r) => roles.includes(r));
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// ---------------------------------------------------------------------------
// Brand — minimal, warm
// ---------------------------------------------------------------------------

function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="EduBek home">
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        E
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight">EduBek</span>
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Learn · Create · Earn
        </span>
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sidebar nav
// ---------------------------------------------------------------------------

function SidebarNav({ pathname, user }: { pathname: string; user: { platformRoles: string[] } | null }) {
  const t = useTranslations("nav");
  const roles = user?.platformRoles ?? [];

  return (
    <nav className="flex flex-col gap-5 px-3 py-4" aria-label="Primary">
      <NavGroup title={t("sections.main")} items={PRIMARY_NAV} pathname={pathname} roles={roles} t={t} />
      <NavGroup title={t("sections.tools")} items={SECONDARY_NAV} pathname={pathname} roles={roles} t={t} />
    </nav>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  roles,
  t,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  roles: string[];
  t: ReturnType<typeof useTranslations<"nav">>;
}) {
  const visible = items.filter((i) => itemIsVisible(i, roles));
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {title}
      </p>
      {visible.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              active
                ? "bg-secondary text-secondary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "")} aria-hidden />
            {t.raw(item.labelKey) as string}
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// User card — warm, minimal
// ---------------------------------------------------------------------------

function UserCard({ user }: { user: CurrentUser | null }) {
  const t = useTranslations("nav");
  if (!user) {
    return (
      <div className="flex flex-col gap-2 p-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/login">{t("login")}</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">{t("register")}</Link>
        </Button>
      </div>
    );
  }
  const initials = (user.name ?? user.email ?? "?").slice(0, 2).toUpperCase();
  const primaryRole = user.platformRoles[0] ?? "user";
  return (
    <Link href="/profile" className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-card/50 p-2.5 transition-colors hover:bg-card">
      <Avatar className="size-9 ring-1 ring-border/30">
        <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{user.name ?? user.email}</span>
        <Badge variant="secondary" className="mt-0.5 w-fit text-[10px] capitalize">
          {primaryRole}
        </Badge>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Search bar — in the top bar
// ---------------------------------------------------------------------------

function SearchBar() {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search quizzes, resources, people..."
        className="h-9 pl-9 text-sm bg-muted/50 border-0 focus-visible:bg-background focus-visible:border-border"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top bar — search + notifications + theme + avatar
// ---------------------------------------------------------------------------

function TopBar({ onOpenSidebar, user }: { onOpenSidebar: () => void; user: CurrentUser | null }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/40 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <Menu className="size-5" aria-hidden />
      </Button>

      <SearchBar />

      <div className="flex items-center gap-1">
        {user && (
          <Button asChild variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Link href="/notifications">
              <Bell className="size-5 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" />
            </Link>
          </Button>
        )}
        <ThemeToggle />
        <LanguageSwitcher />
        {user && (
          <Button asChild variant="ghost" size="icon" aria-label="Profile">
            <Link href="/profile">
              <Avatar className="size-8 ring-1 ring-border/30">
                <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                  {(user.name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Mobile tab bar
// ---------------------------------------------------------------------------

function MobileTabBar({ pathname, user }: { pathname: string; user: { platformRoles: string[] } | null }) {
  const t = useTranslations("nav");
  const roles = user?.platformRoles ?? [];
  const visible = MOBILE_TABS.filter((i) => itemIsVisible(i, roles));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden"
      aria-label="Mobile primary"
      style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}
    >
      {visible.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {(t.raw(item.labelKey) as string).slice(0, 10)}
          </Link>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// AppShell
// ---------------------------------------------------------------------------

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { user } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border/40 bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b border-border/40 px-4">
          <BrandMark />
        </div>
        <ScrollArea className="flex-1">
          <SidebarNav pathname={pathname} user={user} />
        </ScrollArea>
        <div className="border-t border-border/40 p-2">
          <UserCard user={user} />
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <button className="sr-only" aria-label="Open navigation" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-14 items-center border-b border-border/40 px-4">
            <BrandMark />
          </div>
          <ScrollArea className="h-[calc(100vh-3.5rem-1px)]">
            <SidebarNav pathname={pathname} user={user} />
            <div className="border-t border-border/40 p-2">
              <UserCard user={user} />
              <LogoutButton />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenSidebar={() => setSidebarOpen(true)} user={user} />
        <main className="flex-1 overflow-x-hidden px-4 pb-24 pt-4 sm:px-6 lg:pb-8 lg:pt-6">
          {children}
        </main>
        <MobileTabBar pathname={pathname} user={user} />
      </div>
    </div>
  );
}

function LogoutButton() {
  const t = useTranslations("nav");
  return (
    <form action="/api/auth/logout" method="POST" className="px-1 pt-2">
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground hover:text-destructive"
      >
        <LogOut className="size-4" aria-hidden />
        {t("logout")}
      </Button>
    </form>
  );
}

export { Settings, Separator };
