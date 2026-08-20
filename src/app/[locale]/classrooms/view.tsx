"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  GraduationCap,
  Layers,
  Plus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mascot } from "@/components/edubek/mascots";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";

interface Classroom {
  id: string;
  name: string;
  description?: string;
  grade?: string;
  subject?: string;
  studentCount: number;
  assignmentCount: number;
}

export function ClassroomsClient({ t }: { t: any }) {
  const { user } = useCurrentUser();
  const [classrooms, setClassrooms] = React.useState<Classroom[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const data = await api.get<{ classrooms: Classroom[] }>("/api/classrooms");
        setClassrooms(data.classrooms ?? []);
      } catch (err: any) {
        setError(err?.message ?? t("loadFailed"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Mascot name="notebook" size={56} className="text-teacher" />
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        {user && (
          <Button className="gap-2">
            <Plus className="size-4" />
            {t("createClassroom")}
          </Button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12">
            <Mascot name="book" size={64} className="text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="border-destructive/30">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && classrooms.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-16 text-center">
            <Mascot name="notebook" size={96} className="text-muted-foreground/40" />
            <div>
              <h3 className="text-lg font-semibold">{t("emptyTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
            </div>
            {user && (
              <Button className="gap-2">
                <Plus className="size-4" />
                {t("createClassroom")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Classroom grid */}
      {!loading && !error && classrooms.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((c) => (
            <Card key={c.id} className="group transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-teacher/10 text-teacher">
                      <BookOpen className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {c.grade ?? "—"} · {c.subject ?? "—"}
                      </CardDescription>
                    </div>
                  </div>
                  <Mascot name="pencil" size={32} className="text-muted-foreground/40 transition-opacity group-hover:opacity-100" />
                </div>
              </CardHeader>
              <CardContent>
                {c.description && (
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {c.studentCount} {t("students")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="size-3.5" />
                    {c.assignmentCount} {t("assignments")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tips section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="size-5 text-teacher" />
            {t("tipsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { mascot: "notebook" as const, title: t("tip1Title"), desc: t("tip1Desc") },
              { mascot: "pencil" as const, title: t("tip2Title"), desc: t("tip2Desc") },
              { mascot: "book" as const, title: t("tip3Title"), desc: t("tip3Desc") },
            ].map((tip, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Mascot name={tip.mascot} size={32} className="text-muted-foreground/60" />
                  <h4 className="text-sm font-semibold">{tip.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{tip.desc}</p>
                {i < 2 && <Separator className="mt-2 md:hidden" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
