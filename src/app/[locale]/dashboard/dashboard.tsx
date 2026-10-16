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
  Compass,
  Gamepad2,
  Loader2,
  Plus,
  Sparkles,
  Users,
  UserPlus,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { useCurrentUser, type CurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractiveDashboard } from "@/components/edubek/interactive-dashboard";
import { TutorTranscript, type TranscriptMessage } from "@/components/tutor/tutor-transcript";


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
  const credits = 0;

  return (
    <div className="mx-auto max-w-3xl flex flex-col min-h-[70vh] pt-8">
      {/* Greeting + quick links — Gemini style */}
      <div className="text-center space-y-6 mb-10">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{greeting()} · {t(`roles.${role}`)}</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t("hello", { name })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === "teacher" ? t("teacherSubtitle") : t("studentSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <HomeAction href="/classrooms" icon={Users} title="Open Class" desc="" />
          <HomeAction href="/live-quiz?tab=create" icon={Gamepad2} title="Create Quiz" desc="" />
          <HomeAction href="/discover" icon={Compass} title="Discover" desc="" />
          <HomeAction href="/friends" icon={UserPlus} title="Friends" desc="" />
        </div>
      </div>

      {/* Last lesson continue — compact */}
      {lastLesson && (
        <div className="mb-6 flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          <div className="min-w-0">
            <span className="text-muted-foreground">Continue: </span>
            <span className="font-medium truncate">{lastLesson.title || "Last lesson"}</span>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/tutor?sessionId=${lastLesson.id}`}>Resume</Link>
          </Button>
        </div>
      )}

      {/* Main chat — prominent center */}
      <div className="flex-1 flex flex-col">
        <Card className="border-border/80 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[380px]">
          <CardContent className="p-0 flex-1 flex flex-col">
            <HomeTutorChat />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HomeAction({
  href,
  icon: Icon,
  title,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc?: string;
}) {
  return (
    <Link href={href}>
      <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
        <Icon className="size-3.5" />
        {title}
      </Button>
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

function HomeTutorChat() {
  const [messages, setMessages] = React.useState<TranscriptMessage[]>([
    {
      id: "welcome",
      role: "tutor",
      text: "Assalomu alaykum! Men sizning AI o'qituvchingizman. Oxirgi darsingizni davom ettirishni yoki yangi savol berishni xohlaysizmi?",
    },
  ]);
  const [loading, setLoading] = React.useState(false);

  const onSend = (text: string) => {
    const userMsg: TranscriptMessage = { id: Date.now().toString(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    // TODO: wire to /api/tutor/chat and merge blackboard sections into messages
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: (Date.now() + 1).toString(),
          role: "tutor",
          text: "Yaxshi savol! (Bu yerda real AI javobi va inline blackboard / savollar chiqadi)",
        },
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <TutorTranscript
      messages={messages}
      onSendMessage={onSend}
      isLoading={loading}
    />
  );
}
