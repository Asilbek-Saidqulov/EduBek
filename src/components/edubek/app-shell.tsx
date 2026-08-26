"use client";

import * as React from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Compass,
  Store,
  FolderOpen,
  Sparkles,
  BrainCircuit,
  Gamepad2,
  Users,
  Wallet,
  Bell,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Search,
  ChevronLeft,
  ChevronRight,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/edubek/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useCurrentUser } from "@/hooks/use-current-user";
import { GlobalSearchDialog } from "@/components/edubek/global-search-dialog";

interface AppShellProps {
  user?: any;
  t?: any;
  children: React.ReactNode;
}

export function AppShell({ user: initialUser, children }: AppShellProps) {
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const { user: fetchedUser } = useCurrentUser();
  const user = fetchedUser || initialUser;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Global keyboard shortcut '/' or 'Cmd+K' to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const primaryNavItems = [
    { href: "/dashboard", label: tNav("dashboard"), icon: LayoutDashboard },
    { href: "/tutor", label: tNav("tutor"), icon: BrainCircuit },
    { href: "/discover", label: tNav("discover"), icon: Compass },
    { href: "/library", label: tNav("library"), icon: FolderOpen },
    { href: "/marketplace", label: tNav("marketplace"), icon: Store },
    { href: "/live-quiz", label: tNav("liveQuiz"), icon: Gamepad2 },
    { href: "/ai-workspace", label: tNav("aiWorkspace"), icon: Sparkles },
    { href: "/classrooms", label: tNav("classrooms"), icon: Users },
  ];

  const secondaryNavItems = [
    { href: "/wallet", label: tNav("wallet"), icon: Wallet },
    { href: "/notifications", label: tNav("notifications"), icon: Bell },
    { href: "/settings", label: tNav("settings"), icon: Settings },
  ];

  if (user?.platformRoles?.includes("ADMIN") || user?.platformRoles?.includes("SUPERADMIN") || user?.platformRoles?.includes("admin") || user?.platformRoles?.includes("superadmin")) {
    secondaryNavItems.push({ href: "/admin", label: tNav("admin"), icon: Shield });
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
      router.refresh();
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const isNavActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-background antialiased">
      {/* Global Search Dialog */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r bg-card/70 backdrop-blur-md transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  EduBek
                </span>
                <span className="text-[10px] font-medium text-muted-foreground -mt-1 tracking-wider uppercase">
                  Learning OS
                </span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground hidden lg:flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Search Quick Action */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={() => setSearchOpen(true)}
            className={`w-full flex items-center gap-2.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
              collapsed ? "justify-center px-2" : "justify-between"
            }`}
            title="Search EduBek (Press /)"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Search EduBek...</span>}
            </div>
            {!collapsed && (
              <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                /
              </kbd>
            )}
          </button>
        </div>

        {/* Nav list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {/* Main learning sections */}
          <div>
            {!collapsed && (
              <p className="px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                Ecosystem
              </p>
            )}
            <div className="space-y-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } ${collapsed ? "justify-center px-2" : ""}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Tools & Account */}
          <div>
            {!collapsed && (
              <p className="px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                Workspace & Tools
              </p>
            )}
            <div className="space-y-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } ${collapsed ? "justify-center px-2" : ""}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Card & Balance */}
        <div className="border-t p-3 bg-card/40">
          {!collapsed ? (
            <div className="flex items-center justify-between rounded-xl p-2 hover:bg-muted/60 transition-colors">
              <Link href="/profile" className="flex items-center gap-2.5 overflow-hidden">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                    {getInitials(user?.name || user?.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate text-xs">
                  <div className="font-semibold text-foreground truncate">
                    {user?.name || user?.username || "Student"}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground font-mono text-[11px]">
                    <Coins className="h-3 w-3 text-amber-500" />
                    <span>{user?.balanceEduTokens ?? 1250} EDU</span>
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link href="/profile" title={user?.name || "Profile"}>
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                    {getInitials(user?.name || user?.username)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Breadcrumb Context */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/dashboard" className="font-medium hover:text-foreground transition-colors">
                EduBek
              </Link>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-semibold text-foreground capitalize">
                {pathname.replace("/", "") || "Launchpad"}
              </span>
            </div>
          </div>

          {/* Search bar & Top actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search platform...</span>
              <kbd className="rounded border bg-background px-1 font-mono text-[10px]">
                /
              </kbd>
            </button>

            {/* EduToken Balance Chip */}
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
              title="EduTokens Balance"
            >
              <Coins className="h-3.5 w-3.5" />
              <span>{user?.balanceEduTokens ?? 1250}</span>
              <span className="text-[10px] text-amber-600/70 font-normal">EDU</span>
            </Link>

            {/* Notification Bell */}
            <Button variant="ghost" size="icon" asChild className="relative h-9 w-9 text-muted-foreground">
              <Link href="/notifications">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary" />
              </Link>
            </Button>

            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
            <div className="relative flex w-72 flex-col bg-card p-4 shadow-2xl z-50">
              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-bold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <span>EduBek</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {[...primaryNavItems, ...secondaryNavItems].map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        active
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t pt-3 mt-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{tNav("logout")}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
