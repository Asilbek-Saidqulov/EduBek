/**
 * EduBek Dashboard — complete desktop SaaS layout.
 *
 * Design: Google Classroom + Notion + Linear + Eduten warmth.
 * Warm white / cream / paper palette with hand-drawn mascot illustrations
 * in empty states, loading cards, and AI assistant sections.
 *
 * Sections:
 *   1. Greeting header (role-aware)
 *   2. Quick actions grid
 *   3. Continue Learning (in-progress courses/quizzes)
 *   4. AI Quiz Generator card
 *   5. Recent Quizzes
 *   6. Recommended Subjects
 *   7. Progress Section (stats + chart)
 *   8. Marketplace highlights
 *   9. Upcoming Assignments
 *   10. Recent Activity feed
 *   + Right column: Wallet preview + Notifications
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Compass,
  GraduationCap,
  Lightbulb,
  Loader2,
  Megaphone,
  PenTool,
  Rocket,
  Search,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Wallet as WalletIcon,
  type LucideIcon,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { useCurrentUser, type CurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Mascot } from "@/components/edubek/mascots";

// ===========================================================================
// Main dashboard component
// ===========================================================================

export function DashboardView({ initialUser }: { initialUser: { id: string; email: string; name: string | null; username: string | null; platformRoles: string[] } | null }) {
  const { user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const t = useTranslations("dashboard");
  const currentUser = (user ?? initialUser) as CurrentUser | null;

  React.useEffect(() => {
    if (!userLoading && !user) router.replace("/login");
  }, [userLoading, user, router]);

  // Fetch wallet
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => api.get<{ balance: number }>("/api/wallet/balance"),
    enabled: !!currentUser?.id,
    staleTime: 30_000,
  });

  // Fetch notifications
  const { data: notifData } = useQuery({
    queryKey: ["dash-notifs"],
    queryFn: () => api.get<{ notifications: any[] }>("/api/notifications/inbox?limit=5"),
    enabled: !!currentUser?.id,
    staleTime: 10_000,
  });

  if (userLoading && !currentUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Mascot name="owl" size={80} className="text-primary" />
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;
  const role = getPrimaryRole(currentUser);

  return (
    <div className="space-y-6">
      {/* 1. Greeting header */}
      <GreetingHeader name={currentUser.name ?? currentUser.username ?? currentUser.email} role={role} t={t} />

      {/* 2. Quick actions */}
      <QuickActionGrid role={role} t={t} />

      {/* Main content — 2-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left/main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* 3. Continue Learning */}
          <ContinueLearning t={t} />

          {/* 4. AI Quiz Generator */}
          <AiQuizGenerator t={t} />

          {/* 5. Recent Quizzes */}
          <RecentQuizzes t={t} />

          {/* 6. Recommended Subjects */}
          <RecommendedSubjects t={t} />

          {/* 7. Progress */}
          <ProgressSection t={t} />

          {/* 8. Marketplace */}
          <MarketplaceHighlights t={t} />

          {/* 9. Upcoming Assignments */}
          <UpcomingAssignments t={t} />

          {/* 10. Recent Activity */}
          <RecentActivity t={t} />
        </div>

        {/* Right column — widgets */}
        <div className="space-y-6">
          <WalletPreview balance={wallet?.balance} loading={walletLoading} t={t} />
          <NotificationsPreview notifications={notifData?.notifications ?? []} t={t} />
          <AiAssistantCard t={t} />
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 1. Greeting Header
// ===========================================================================

function GreetingHeader({ name, role, t }: { name: string; role: string; t: any }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("goodMorning") : hour < 18 ? t("goodAfternoon") : t("goodEvening");
  const roleMascot: Record<string, "notebook" | "owl" | "pencil" | "globe" | "microscope" | "robot"> = {
    student: "owl", teacher: "notebook", creator: "pencil", admin: "microscope", ai: "robot",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Mascot name={roleMascot[role] ?? "notebook"} size={48} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}, {name}</h1>
          <p className="text-sm text-muted-foreground">{t(`role.${role}`)}</p>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 2. Quick Action Grid
// ===========================================================================

function QuickActionGrid({ role, t }: { role: string; t: any }) {
  const actions: { href: string; label: string; icon: LucideIcon; mascot: "notebook" | "owl" | "pencil" | "globe" | "microscope" | "robot" }[] = [
    { href: "/discover", label: t("actionDiscover"), icon: Compass, mascot: "globe" },
    { href: "/live-quiz", label: t("actionJoinQuiz"), icon: Rocket, mascot: "pencil" },
    { href: "/ai-workspace", label: t("actionAI"), icon: Brain, mascot: "robot" },
    { href: "/marketplace", label: t("actionMarketplace"), icon: Store, mascot: "notebook" },
    { href: "/library", label: t("actionLibrary"), icon: BookOpen, mascot: "owl" },
    { href: "/wallet", label: t("actionWallet"), icon: WalletIcon, mascot: "pencil" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-border/40">
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <action.icon className="size-5" />
              </div>
              <span className="text-xs font-medium text-center">{action.label}</span>
              <Mascot name={action.mascot} size={24} className="text-muted-foreground/30 transition-opacity group-hover:opacity-100" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ===========================================================================
// 3. Continue Learning
// ===========================================================================

function ContinueLearning({ t }: { t: any }) {
  // In a real app, this would fetch from /api/dashboard/continue-learning
  const courses = [
    { id: "1", title: "Algebra: Linear Equations", progress: 65, subject: "Mathematics", icon: "📐" },
    { id: "2", title: "Cell Biology: Photosynthesis", progress: 30, subject: "Biology", icon: "🧬" },
    { id: "3", title: "World History: Renaissance", progress: 85, subject: "History", icon: "📜" },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              {t("continueLearning")}
            </CardTitle>
            <CardDescription className="mt-1">{t("continueLearningDesc")}</CardDescription>
          </div>
          <Mascot name="owl" size={40} className="text-primary/60" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {courses.map((c) => (
          <Link key={c.id} href="/discover" className="block">
            <div className="flex items-center gap-3 rounded-lg border border-border/30 p-3 transition-colors hover:bg-secondary/40">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-lg">{c.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.subject}</p>
              </div>
              <div className="w-20">
                <Progress value={c.progress} className="h-1.5" />
                <p className="mt-1 text-[10px] text-right text-muted-foreground">{c.progress}%</p>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 4. AI Quiz Generator
// ===========================================================================

function AiQuizGenerator({ t }: { t: any }) {
  const [topic, setTopic] = React.useState("");
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              {t("aiQuizGenerator")}
            </CardTitle>
            <CardDescription className="mt-1">{t("aiQuizDesc")}</CardDescription>
          </div>
          <Mascot name="robot" size={48} className="text-primary/60" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t("aiQuizPlaceholder")}
            className="flex-1 rounded-lg border border-border/40 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button asChild className="gap-2">
            <Link href="/ai-workspace">
              <Brain className="size-4" />
              {t("generate")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 5. Recent Quizzes
// ===========================================================================

function RecentQuizzes({ t }: { t: any }) {
  const quizzes = [
    { id: "1", title: "Newton's Laws of Motion", score: 85, total: 100, subject: "Physics" },
    { id: "2", title: "Capitals of the World", score: 72, total: 100, subject: "Geography" },
    { id: "3", title: "Python Basics", score: 90, total: 100, subject: "CS" },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            {t("recentQuizzes")}
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <Link href="/library">{t("viewAll")} <ArrowRight className="size-3" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {quizzes.map((q) => (
          <div key={q.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/40 transition-colors">
            <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
              <CheckCircle2 className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{q.title}</p>
              <p className="text-xs text-muted-foreground">{q.subject}</p>
            </div>
            <Badge variant="secondary" className="font-mono">{q.score}/{q.total}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 6. Recommended Subjects
// ===========================================================================

function RecommendedSubjects({ t }: { t: any }) {
  const subjects = [
    { id: "math", name: "Mathematics", icon: "📐", color: "from-blue-500/10 to-cyan-500/5" },
    { id: "bio", name: "Biology", icon: "🧬", color: "from-green-500/10 to-emerald-500/5" },
    { id: "hist", name: "History", icon: "📜", color: "from-amber-500/10 to-orange-500/5" },
    { id: "cs", name: "Computer Science", icon: "💻", color: "from-violet-500/10 to-purple-500/5" },
    { id: "geo", name: "Geography", icon: "🌍", color: "from-teal-500/10 to-cyan-500/5" },
    { id: "phys", name: "Physics", icon: "🔬", color: "from-indigo-500/10 to-blue-500/5" },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-5 text-primary" />
            {t("recommended")}
          </CardTitle>
          <Mascot name="globe" size={40} className="text-primary/60" />
        </div>
        <CardDescription>{t("recommendedDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {subjects.map((s) => (
            <Link key={s.id} href={`/discover?subject=${s.id}`}>
              <div className={`flex flex-col items-center gap-2 rounded-lg border border-border/30 bg-gradient-to-br ${s.color} p-4 text-center transition-all hover:shadow-sm hover:-translate-y-0.5`}>
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs font-medium">{s.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 7. Progress Section
// ===========================================================================

function ProgressSection({ t }: { t: any }) {
  const stats = [
    { label: t("quizzesTaken"), value: 47, change: "+12%" },
    { label: t("avgScore"), value: 82, suffix: "%", change: "+5%" },
    { label: t("streak"), value: 7, suffix: " days", change: "🔥" },
    { label: t("eduTokens"), value: 1250, change: "+340" },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            {t("progress")}
          </CardTitle>
          <Mascot name="microscope" size={40} className="text-primary/60" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border/30 p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{s.value}</span>
                {s.suffix && <span className="text-sm text-muted-foreground">{s.suffix}</span>}
              </div>
              <p className="mt-0.5 text-[10px] text-primary">{s.change}</p>
            </div>
          ))}
        </div>
        {/* Weekly activity mini-chart */}
        <div className="mt-4 flex items-end gap-2 h-20">
          {[40, 65, 50, 80, 55, 70, 90].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/20 hover:bg-primary/40 transition-colors"
                style={{ height: `${h}%` }}
              />
              <span className="text-[9px] text-muted-foreground">
                {["M", "T", "W", "T", "F", "S", "S"][i]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 8. Marketplace Highlights
// ===========================================================================

function MarketplaceHighlights({ t }: { t: any }) {
  const listings = [
    { id: "1", title: "Complete Algebra Course", price: 0, rating: 4.8, downloads: 1240 },
    { id: "2", title: "Biology: Human Body 3D", price: 50, rating: 4.9, downloads: 890 },
    { id: "3", title: "World History Quiz Pack", price: 0, rating: 4.7, downloads: 2100 },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            {t("marketplace")}
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <Link href="/marketplace">{t("browse")} <ArrowRight className="size-3" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {listings.map((l) => (
            <Link key={l.id} href={`/marketplace/${l.id}`}>
              <div className="group flex flex-col gap-2 rounded-lg border border-border/30 p-3 transition-all hover:shadow-sm">
                <div className="aspect-video rounded-md bg-gradient-to-br from-secondary to-muted" />
                <p className="text-sm font-medium truncate">{l.title}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {l.price === 0 ? "Free" : `${l.price} EduTokens`}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">⭐ {l.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 9. Upcoming Assignments
// ===========================================================================

function UpcomingAssignments({ t }: { t: any }) {
  const assignments = [
    { id: "1", title: "Algebra Quiz: Chapter 5", due: "Tomorrow", subject: "Math", color: "bg-blue-500/10" },
    { id: "2", title: "Lab Report: Photosynthesis", due: "Fri, Jan 12", subject: "Biology", color: "bg-green-500/10" },
    { id: "3", title: "Essay: Causes of WWI", due: "Mon, Jan 15", subject: "History", color: "bg-amber-500/10" },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            {t("upcoming")}
          </CardTitle>
          <Mascot name="notebook" size={40} className="text-primary/60" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {assignments.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/40 transition-colors">
            <div className={`flex size-10 items-center justify-center rounded-lg ${a.color}`}>
              <Calendar className="size-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.subject}</p>
            </div>
            <Badge variant="outline" className="gap-1 text-xs">
              <Clock className="size-3" />
              {a.due}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 10. Recent Activity
// ===========================================================================

function RecentActivity({ t }: { t: any }) {
  const activities = [
    { id: "1", text: "Completed quiz: Newton's Laws of Motion", time: "2h ago", icon: CheckCircle2 },
    { id: "2", text: "Earned 100 EduTokens from quiz reward", time: "5h ago", icon: Coins },
    { id: "3", text: "Started course: Cell Biology", time: "1d ago", icon: BookOpen },
    { id: "4", text: "New comment on your resource", time: "2d ago", icon: Megaphone },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          {t("recentActivity")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {activities.map((a, i) => (
          <div key={a.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-secondary/40 transition-colors">
            <div className="flex size-8 items-center justify-center rounded-lg bg-secondary shrink-0">
              <a.icon className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{a.text}</p>
              <p className="text-xs text-muted-foreground">{a.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Right column widgets
// ===========================================================================

function WalletPreview({ balance, loading, t }: { balance: number | null | undefined; loading: boolean; t: any }) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <WalletIcon className="size-4 text-primary" />
            {t("wallet")}
          </CardTitle>
          <Mascot name="pencil" size={28} className="text-primary/40" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? <Skeleton className="h-8 w-24" /> : balance ?? 0}
          <span className="ml-1 text-sm font-normal text-muted-foreground">EduTokens</span>
        </div>
        <Separator className="my-3" />
        <Button asChild variant="ghost" size="sm" className="w-full justify-between">
          <Link href="/wallet">
            {t("viewWallet")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function NotificationsPreview({ notifications, t }: { notifications: any[]; t: any }) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="size-4 text-primary" />
            {t("notifications")}
          </CardTitle>
          <Mascot name="notebook" size={28} className="text-primary/40" />
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Mascot name="owl" size={48} className="text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">{t("noNotifications")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="flex items-start gap-2 rounded-lg p-2 hover:bg-secondary/40">
                <div className={`mt-0.5 size-2 rounded-full ${n.isRead ? "bg-muted-foreground/30" : "bg-primary"}`} />
                <p className={`flex-1 text-xs ${n.isRead ? "text-muted-foreground" : "font-medium"}`}>{n.title}</p>
              </div>
            ))}
            <Button asChild variant="ghost" size="sm" className="w-full justify-between">
              <Link href="/notifications">{t("viewAll")} <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AiAssistantCard({ t }: { t: any }) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-primary" />
            {t("aiAssistant")}
          </CardTitle>
          <Mascot name="robot" size={40} className="text-primary/60" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">{t("aiAssistantDesc")}</p>
        <Button asChild variant="outline" size="sm" className="w-full gap-2">
          <Link href="/ai-workspace">
            <Brain className="size-4" />
            {t("askAi")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================

function getPrimaryRole(user: CurrentUser): string {
  if (!user.platformRoles || user.platformRoles.length === 0) return "student";
  const roles = user.platformRoles;
  if (roles.includes("superadmin") || roles.includes("admin")) return "admin";
  if (roles.includes("creator")) return "creator";
  if (roles.includes("teacher")) return "teacher";
  return "student";
}
