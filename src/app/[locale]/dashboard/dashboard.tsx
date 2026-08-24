/**
 * EduBek Dashboard — Home / Launchpad
 *
 * Designed as the central Launchpad answering:
 * - What should I do next?
 * - What am I currently learning?
 * - How am I progressing?
 * - What is recommended for me?
 */
"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
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
  Flame,
  Gamepad2,
  GraduationCap,
  Lightbulb,
  Loader2,
  Play,
  Rocket,
  Search,
  Sparkles,
  Store,
  Target,
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
import { YourProgress } from "@/components/edubek/your-progress";

export function DashboardView({
  initialUser,
}: {
  initialUser: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;
    platformRoles: string[];
  } | null;
}) {
  const { user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const t = useTranslations("dashboard");
  const currentUser = (user ?? initialUser) as CurrentUser | null;

  React.useEffect(() => {
    if (!userLoading && !user && !initialUser) {
      router.replace("/login");
    }
  }, [userLoading, user, initialUser, router]);

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
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading your Launchpad...</p>
        </div>
      </div>
    );
  }

  const name = currentUser?.name || currentUser?.username || "Student";
  const role = getPrimaryRole(currentUser);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* 1. Launchpad Hero Section */}
      <LaunchpadHero name={name} role={role} />

      {/* 2. Quick Action Grid */}
      <QuickActionGrid />

      {/* Main 2-Column Work Grid */}
      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* Left / Primary Column */}
        <div className="space-y-8 lg:col-span-2">
          {/* 3. Continue Learning Active Card */}
          <ContinueLearningSection />

          {/* 4. Your Progress & Learning Consistency */}
          <YourProgress />

          {/* 5. Recommended For You (with explicit reasoning) */}
          <RecommendedSection />

          {/* 6. Recent Quizzes & Practice Feed */}
          <RecentQuizzesSection />

          {/* 7. Marketplace & High-Quality Materials */}
          <MarketplaceHighlightsSection />

          {/* 8. Recent Activity Stream */}
          <RecentActivitySection />
        </div>

        {/* Right / Secondary Widgets Column */}
        <div className="space-y-6">
          {/* EduTokens Balance Widget */}
          <EduTokensWidget balance={wallet?.balance} loading={walletLoading} />

          {/* Contextual AI Assistant Quick Start */}
          <AiTutorQuickWidget />

          {/* Upcoming Assignments / Tasks */}
          <UpcomingTasksWidget />

          {/* Notification Center Snippet */}
          <NotificationsSnippetWidget notifications={notifData?.notifications ?? []} />
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 1. Launchpad Hero Header
// ===========================================================================

function LaunchpadHero({ name, role }: { name: string; role: string }) {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Launchpad
            </span>
            <Badge variant="outline" className="text-xs uppercase tracking-wider text-muted-foreground">
              {role}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {timeGreeting}, {name}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Pick up where you left off, explore curated knowledge, or practice with interactive AI tools.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button asChild size="default" className="gap-2 shadow-xs">
            <Link href="/discover">
              <Play className="size-4 fill-current" />
              Continue Learning
            </Link>
          </Button>
          <Button asChild variant="outline" size="default" className="gap-2">
            <Link href="/discover">
              <Compass className="size-4" />
              Explore Nexus
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 2. Quick Action Grid
// ===========================================================================

function QuickActionGrid() {
  const actions = [
    {
      href: "/discover",
      title: "Explore Knowledge",
      desc: "Topic maps & syllabus",
      icon: Compass,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      href: "/live-quiz",
      title: "Play Practice Quiz",
      desc: "Join multiplayer or solo",
      icon: Gamepad2,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      href: "/ai-workspace",
      title: "Ask AI Tutor",
      desc: "Solve, summarize, quiz",
      icon: Brain,
      color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    },
    {
      href: "/marketplace",
      title: "Marketplace",
      desc: "Verified educator resources",
      icon: Store,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <Link key={act.href} href={act.href} className="group block">
            <div className="flex items-center gap-3.5 rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
              <div className={`flex size-10 items-center justify-center rounded-lg border ${act.color} shrink-0`}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {act.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">{act.desc}</p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ===========================================================================
// 3. Continue Learning Active Card
// ===========================================================================

function ContinueLearningSection() {
  const activeCourse = {
    title: "Algebra — Quadratic Equations & Polynomials",
    subject: "Mathematics",
    progress: 68,
    lastLesson: "Factoring quadratic expressions with real roots",
    timeRemaining: "15 min remaining",
  };

  return (
    <Card className="border-border/80 shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b bg-muted/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold">Active Learning in Progress</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-mono">
            Resume
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-medium text-blue-600 bg-blue-500/5">
                {activeCourse.subject}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />
                {activeCourse.timeRemaining}
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground">{activeCourse.title}</h3>
            <p className="text-xs text-muted-foreground">
              Current step: <span className="text-foreground/90 font-medium">{activeCourse.lastLesson}</span>
            </p>
          </div>

          <Button asChild className="gap-2 shrink-0">
            <Link href="/discover">
              <Play className="size-4 fill-current" />
              Continue Lesson
            </Link>
          </Button>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Course Completion</span>
            <span className="text-primary font-bold">{activeCourse.progress}%</span>
          </div>
          <Progress value={activeCourse.progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 5. Recommended For You (With Reasoning)
// ===========================================================================

function RecommendedSection() {
  const recommendations = [
    {
      id: "rec-1",
      title: "Newton's Laws of Motion & Momentum Practice",
      type: "Quiz",
      category: "Physics",
      reason: "Recommended because you reviewed Mechanics yesterday",
      questions: 10,
      difficulty: "Medium",
      href: "/live-quiz",
    },
    {
      id: "rec-2",
      title: "Cell Membrane Transport & Osmosis Visual Model",
      type: "Resource",
      category: "Biology",
      reason: "High mastery match for 10th Grade Biology syllabus",
      questions: null,
      difficulty: "Foundational",
      href: "/discover",
    },
    {
      id: "rec-3",
      title: "Essential Python Data Structures & Algorithmic Practice",
      type: "Marketplace",
      category: "Computer Science",
      reason: "Popular among peers in your grade level",
      questions: null,
      difficulty: "Intermediate",
      href: "/marketplace",
    },
  ];

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Recommended For You
            </CardTitle>
            <CardDescription className="text-xs">
              Contextual suggestions based on your learning history and recent mistakes.
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
            <Link href="/discover">
              View all <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => (
          <Link key={rec.id} href={rec.href} className="group block">
            <div className="rounded-xl border border-border/70 p-4 transition-all hover:border-primary/40 hover:bg-muted/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-semibold text-primary bg-primary/5">
                    {rec.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">{rec.category}</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                  {rec.difficulty}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {rec.title}
              </h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lightbulb className="size-3 text-amber-500 shrink-0" />
                <span>{rec.reason}</span>
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 6. Recent Quizzes Section
// ===========================================================================

function RecentQuizzesSection() {
  const quizzes = [
    { id: "q1", title: "Newton's Laws of Motion", score: "90%", total: "9/10 correct", date: "Today" },
    { id: "q2", title: "World Geography & Capitals", score: "80%", total: "8/10 correct", date: "Yesterday" },
    { id: "q3", title: "Python Syntax & Functions", score: "100%", total: "5/5 correct", date: "3 days ago" },
  ];

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Recent Quizzes & Scores
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
            <Link href="/live-quiz">
              Quiz Hub <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {quizzes.map((q) => (
          <div
            key={q.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/20 transition-colors"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{q.title}</p>
              <p className="text-xs text-muted-foreground">
                {q.total} · {q.date}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="font-mono text-xs font-bold text-emerald-600 bg-emerald-500/10">
                {q.score}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 7. Marketplace Highlights
// ===========================================================================

function MarketplaceHighlightsSection() {
  const listings = [
    {
      id: "mp1",
      title: "Interactive Trigonometry Step-by-Step Guide",
      author: "Prof. Dilshod R.",
      rating: "4.9",
      price: "Free",
      downloads: "1.2k",
    },
    {
      id: "mp2",
      title: "Olympiad Physics Mechanics Problem Sets",
      author: "Elena V.",
      rating: "5.0",
      price: "50 EDU",
      downloads: "840",
    },
  ];

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Store className="size-4 text-primary" />
            Featured Marketplace Materials
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
            <Link href="/marketplace">
              Browse All <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {listings.map((item) => (
          <Link key={item.id} href={`/marketplace`} className="group block">
            <div className="rounded-xl border border-border/70 p-3.5 space-y-2 hover:border-primary/40 hover:bg-muted/20 transition-all">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {item.title}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">By {item.author}</p>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-semibold text-primary">{item.price}</span>
                <span className="text-muted-foreground">⭐ {item.rating} ({item.downloads})</span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 8. Recent Activity Stream
// ===========================================================================

function RecentActivitySection() {
  const activities = [
    { text: "Completed 'Newton's Laws' quiz with 90% accuracy", time: "2 hours ago", icon: CheckCircle2 },
    { text: "Earned +50 EduTokens from daily learning streak", time: "5 hours ago", icon: Coins },
    { text: "Saved 'Cell Biology 3D Model' to your workspace", time: "Yesterday", icon: BookOpen },
    { text: "Asked AI Tutor to explain Quadratic Equation roots", time: "2 days ago", icon: Brain },
  ];

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((act, i) => {
          const Icon = act.icon;
          return (
            <div key={i} className="flex items-start gap-3 text-xs">
              <div className="flex size-6 items-center justify-center rounded-full bg-muted text-primary shrink-0 mt-0.5">
                <Icon className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium">{act.text}</p>
                <p className="text-muted-foreground text-[10px]">{act.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Right Column Widgets
// ===========================================================================

function EduTokensWidget({ balance, loading }: { balance: number | null | undefined; loading: boolean }) {
  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Coins className="size-4 text-amber-500" />
            EduTokens Balance
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            1 EDU = 1,000 UZS
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-foreground">
            {loading ? <Skeleton className="h-8 w-24" /> : `${balance ?? 1250} EDU`}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Available for AI Tutor queries, Quiz Generation & Marketplace
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="w-full justify-between">
          <Link href="/wallet">
            <span>Manage & Top-Up</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function AiTutorQuickWidget() {
  return (
    <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-card to-transparent shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Brain className="size-4 text-violet-500" />
          Contextual AI Tutor
        </CardTitle>
        <CardDescription className="text-xs">
          Get step-by-step problem explanations or instant quiz generation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button asChild size="sm" className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white">
          <Link href="/ai-workspace">
            <Sparkles className="size-3.5" />
            Open AI Workspace
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function UpcomingTasksWidget() {
  const tasks = [
    { title: "Algebra Chapter 5 Review", due: "Tomorrow, 5:00 PM", subject: "Math" },
    { title: "Biology Lab Summary", due: "Friday", subject: "Biology" },
  ];

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          Assignments & Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/30 border border-border/60">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">{task.title}</p>
              <p className="text-muted-foreground text-[11px]">{task.subject}</p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {task.due}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function NotificationsSnippetWidget({ notifications }: { notifications: any[] }) {
  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            Notifications
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="h-6 text-[11px] px-1 text-muted-foreground">
            <Link href="/notifications">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            You&apos;re all caught up! No unread notifications.
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="text-xs p-2 rounded-lg bg-muted/20 border border-border/40">
                <p className="font-medium text-foreground">{n.title}</p>
                <p className="text-muted-foreground text-[10px] line-clamp-1">{n.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Role Helper
// ===========================================================================

function getPrimaryRole(user: CurrentUser | null): string {
  if (!user?.platformRoles || user.platformRoles.length === 0) return "student";
  const roles = user.platformRoles;
  if (roles.includes("superadmin") || roles.includes("admin")) return "admin";
  if (roles.includes("creator")) return "creator";
  if (roles.includes("teacher")) return "teacher";
  return "student";
}
