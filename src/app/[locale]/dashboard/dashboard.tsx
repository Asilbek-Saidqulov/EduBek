/**
 * EduBek Home — one screen, one next step.
 * Student: continue tutor, practice, classes.
 * Teacher: classes, create quiz, preview tutor.
 */
"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Bell,
  BookOpen,
  BrainCircuit,
  Coins,
  Gamepad2,
  Loader2,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { useCurrentUser, type CurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type TutorSession = {
  id: string;
  title: string | null;
  updatedAt: string;
};

type ClassroomRow = {
  id: string;
  name: string;
  description?: string | null;
  studentCount?: number;
  assignmentCount?: number;
};

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
  const role = getPrimaryRole(currentUser);

  React.useEffect(() => {
    if (!userLoading && !user && !initialUser) {
      router.replace("/login");
    }
  }, [userLoading, user, initialUser, router]);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => api.get<{ balance: number }>("/api/wallet/balance"),
    enabled: !!currentUser?.id,
    staleTime: 30_000,
  });

  const { data: notifData } = useQuery({
    queryKey: ["dash-notifs"],
    queryFn: () => api.get<{ notifications: Array<{ id: string; title: string; body?: string }> }>("/api/notifications/inbox?limit=5"),
    enabled: !!currentUser?.id,
    staleTime: 10_000,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["tutor-history-home"],
    queryFn: () => api.get<{ sessions: TutorSession[] }>("/api/tutor/history"),
    enabled: !!currentUser?.id,
    staleTime: 20_000,
  });

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ["classrooms-home"],
    queryFn: () => api.get<{ classrooms: ClassroomRow[] }>("/api/classrooms"),
    enabled: !!currentUser?.id,
    staleTime: 20_000,
  });

  if (userLoading && !currentUser) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  const name = currentUser?.name || currentUser?.username || t("studentFallback");
  const sessions = historyData?.sessions ?? [];
  const classrooms = classData?.classrooms ?? [];
  const lastLesson = sessions[0];
  const credits = wallet?.balance ?? currentUser?.balanceEduTokens;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">{greeting()} · {t(`roles.${role}`)}</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("hello", { name })}
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg">
          {role === "teacher" ? t("teacherSubtitle") : t("studentSubtitle")}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {role === "teacher" ? (
          <>
            <HomeAction href="/classrooms" icon={Users} title={t("actions.openClass")} desc={t("actions.openClassDesc")} />
            <HomeAction href="/live-quiz?tab=create" icon={Gamepad2} title={t("actions.createQuiz")} desc={t("actions.createQuizDesc")} />
            <HomeAction href="/tutor" icon={BrainCircuit} title={t("actions.previewTutor")} desc={t("actions.previewTutorDesc")} />
          </>
        ) : (
          <>
            <HomeAction href="/tutor" icon={BrainCircuit} title={t("actions.askTutor")} desc={t("actions.askTutorDesc")} primary />
            <HomeAction href="/live-quiz" icon={Gamepad2} title={t("actions.practice")} desc={t("actions.practiceDesc")} />
            <HomeAction href="/classrooms" icon={Users} title={t("actions.classes")} desc={t("actions.classesDesc")} />
          </>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                {t("continue.title")}
              </CardTitle>
              <CardDescription>{t("continue.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : lastLesson ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {lastLesson.title || t("continue.untitled")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("continue.updated", { when: relativeTime(lastLesson.updatedAt) })}
                    </p>
                  </div>
                  <Button asChild size="sm" className="shrink-0">
                    <Link href={`/tutor?sessionId=${lastLesson.id}`}>
                      {t("continue.resume")}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">{t("continue.empty")}</p>
                  <Button asChild size="sm">
                    <Link href="/tutor">
                      <Sparkles className="size-3.5" />
                      {t("continue.start")}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  {role === "teacher" ? t("classes.teaching") : t("classes.yours")}
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  <Link href="/classrooms">
                    {t("viewAll")} <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {classLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : classrooms.length === 0 ? (
                <div className="rounded-xl border border-dashed p-5 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {role === "teacher" ? t("classes.emptyTeacher") : t("classes.emptyStudent")}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/classrooms">
                      <Plus className="size-3.5" />
                      {role === "teacher" ? t("classes.create") : t("classes.join")}
                    </Link>
                  </Button>
                </div>
              ) : (
                classrooms.slice(0, 4).map((c) => (
                  <Link key={c.id} href="/classrooms" className="block rounded-lg border p-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("classes.meta", {
                            students: c.studentCount ?? 0,
                            assignments: c.assignmentCount ?? 0,
                          })}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Coins className="size-4 text-amber-500" />
                {t("credits.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold tracking-tight">
                {walletLoading ? <Skeleton className="h-8 w-20" /> : t("credits.amount", { count: credits ?? 0 })}
              </div>
              <p className="text-xs text-muted-foreground">{t("credits.hint")}</p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/wallet">{t("credits.manage")}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="size-4 text-primary" />
                  {t("notifications")}
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="h-6 text-[11px] px-1">
                  <Link href="/notifications">{t("viewAll")}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(notifData?.notifications ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">{t("noNotifications")}</p>
              ) : (
                <div className="space-y-2">
                  {notifData!.notifications.slice(0, 3).map((n) => (
                    <div key={n.id} className="text-xs rounded-lg border p-2">
                      <p className="font-medium">{n.title}</p>
                      {n.body ? <p className="text-muted-foreground line-clamp-1">{n.body}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HomeAction({
  href,
  icon: Icon,
  title,
  desc,
  primary,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  primary?: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 h-full transition-colors ${
          primary
            ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
            : "border-border/80 bg-card hover:border-primary/30"
        }`}
      >
        <div className={`flex size-10 items-center justify-center rounded-lg shrink-0 ${primary ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
    </Link>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "☀️";
  if (hour < 18) return "👋";
  return "🌙";
}

function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 2) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function getPrimaryRole(user: CurrentUser | null): "admin" | "creator" | "teacher" | "student" {
  const roles = user?.platformRoles ?? [];
  if (roles.some((r) => /admin/i.test(r))) return "admin";
  if (roles.some((r) => /creator/i.test(r))) return "creator";
  if (roles.some((r) => /teacher/i.test(r))) return "teacher";
  return "student";
}
