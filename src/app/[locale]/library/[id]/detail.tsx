/**
 * Resource detail page.
 *
 * GET /api/resources/[id] — detail (with visibility check).
 * GET /api/resources/[id]/versions — version history.
 * POST /api/resources/[id]/favorite — toggle favorite.
 */
"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  Heart,
  History,
  Layers,
  PenTool,
  Play,
  Presentation,
  Tag,
  type LucideIcon,
} from "lucide-react";

import { api, ApiError } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/edubek/empty-state";

interface ResourceDto {
  id: string;
  ownerId: string;
  orgId: string | null;
  resourceType: string;
  title: string;
  description: string | null;
  content: string;
  subject: string | null;
  grade: string | null;
  language: string;
  visibility: string;
  status: string;
  duplicatedFromId: string | null;
  tags: string[];
  isFavorited: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ResourceVersionDetailDto {
  id: string;
  version: number;
  snapshot: string;
  changelog: string | null;
  createdById: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, LucideIcon> = {
  quiz: GraduationCap,
  worksheet: FileText,
  lesson_plan: PenTool,
  presentation: Presentation,
  flashcards: Layers,
  notes: BookOpen,
  exam: FileText,
  homework: FileText,
  practice_material: BookOpen,
};

export function ResourceDetail({ id }: { id: string }) {
  const t = useTranslations("library");
  const tCommon = useTranslations("common");
  const tErr = useTranslations("errors");
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const qc = useQueryClient();

  const detailQ = useQuery<ResourceDto>({
    queryKey: ["resources", "detail", id],
    queryFn: () => api.get<ResourceDto>(`/api/resources/${id}`),
    enabled: !!id,
    retry: false,
  });
  const versionsQ = useQuery<{ versions: ResourceVersionDetailDto[] }>({
    queryKey: ["resources", "versions", id],
    queryFn: () => api.get<{ versions: ResourceVersionDetailDto[] }>(`/api/resources/${id}/versions`),
    enabled: !!id,
  });

  const favMut = useMutation({
    mutationFn: () => api.post<{ favorited: boolean }>(`/api/resources/${id}/favorite`),
    onMutate: () => {
      qc.setQueryData<ResourceDto>(["resources", "detail", id], (old) =>
        old ? { ...old, isFavorited: !old.isFavorited } : old,
      );
    },
    onSuccess: (data) => {
      toast({ title: data.favorited ? t("favorited") : t("unfavorited") });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["resources", "detail", id] });
      toast({ title: tErr("error"), description: t("favoriteError"), variant: "destructive" });
    },
  });

  if (detailQ.isLoading) return <DetailSkeleton />;
  if (detailQ.isError) {
    const err = detailQ.error as ApiError;
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle>{t("loadFailed")}</CardTitle>
            <CardDescription>{err?.message ?? tErr("notFoundBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/library">
                <ArrowLeft className="size-4" aria-hidden />
                {t("backToLibrary")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const r = detailQ.data;
  if (!r) return null;
  const Icon = TYPE_ICON[r.resourceType] ?? BookOpen;
  const versions = versionsQ.data?.versions ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/library">
          <ArrowLeft className="size-4" aria-hidden />
          {t("backToLibrary")}
        </Link>
      </Button>

      <Card className="overflow-hidden border-border/60">
        <div className="h-1.5 w-full bg-gradient-to-r from-teacher to-ai" />
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-teacher/10 text-teacher">
              <Icon className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-2xl">{r.title}</CardTitle>
              {r.description && (
                <CardDescription className="mt-2">{r.description}</CardDescription>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[10px]">{t(`types.${r.resourceType}`)}</Badge>
                <Badge variant="outline" className="text-[10px] uppercase">{r.visibility}</Badge>
                <Badge variant="outline" className="text-[10px] uppercase">{r.status}</Badge>
                {r.subject && <Badge variant="outline" className="text-[10px]">{r.subject}</Badge>}
                {r.grade && <Badge variant="outline" className="text-[10px]">{r.grade}</Badge>}
                <Badge variant="outline" className="text-[10px] uppercase">{r.language}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {r.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <Tag className="size-3 text-muted-foreground" aria-hidden />
              {r.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {(r.resourceType === "quiz" || r.resourceType === "assessment" || r.resourceType === "lesson_plan") && (
              <Button asChild size="sm" className="gap-1.5 bg-primary text-primary-foreground font-bold">
                <Link href={`/live-quiz?assessmentId=${r.id}`}>
                  <Play className="size-4 fill-current" aria-hidden />
                  <span>Launch Live Quiz / Arena</span>
                </Link>
              </Button>
            )}
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => favMut.mutate()}
                disabled={favMut.isPending}
                aria-pressed={r.isFavorited}
              >
                <Heart className={`size-4 ${r.isFavorited ? "fill-creator text-creator" : ""}`} aria-hidden />
                {r.isFavorited ? t("unfavorite") : t("favorite")}
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/marketplace?creatorId=${r.ownerId}`}>
                <GraduationCap className="size-4" aria-hidden />
                {t("moreByCreator")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content preview (JSON or text) */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm">{t("contentPreview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-80 overflow-auto rounded-md bg-muted/60 p-3 text-xs leading-relaxed">
            {(() => {
              try {
                return JSON.stringify(JSON.parse(r.content), null, 2);
              } catch {
                return r.content || tCommon("noDescription");
              }
            })()}
          </pre>
        </CardContent>
      </Card>

      {/* Version history */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" aria-hidden />
            <CardTitle className="text-sm">{t("versionHistory")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {versionsQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <EmptyState
              icon={History}
              title={t("noVersions")}
              description={t("noVersionsDesc")}
            />
          ) : (
            <ol className="relative space-y-3 border-s border-border/60 ps-4">
              {versions.map((v) => (
                <li key={v.id} className="relative">
                  <span className="absolute -start-1.5 top-1 size-3 rounded-full bg-teacher" />
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium">{t("version", { n: v.version })}</span>
                    <span className="text-xs text-muted-foreground">
                      <Clock className="me-1 inline size-3" aria-hidden />
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {v.changelog && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{v.changelog}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-8 w-32" />
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Skeleton className="size-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
