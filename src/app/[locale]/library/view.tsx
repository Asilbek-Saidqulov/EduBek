/**
 * Library page — list of resources owned by / visible to the user.
 *
 * GET /api/resources?limit=&offset=&search=&resourceType=&status=&ownerId=
 *
 * Filter by resource type + search + status (draft/ready/archived).
 * Click → /library/[id]
 */
"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Layers,
  Library,
  PenTool,
  Presentation,
  type LucideIcon,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/edubek/empty-state";

interface ResourceListItemDto {
  id: string;
  ownerId: string;
  orgId: string | null;
  resourceType: string;
  title: string;
  description: string | null;
  subject: string | null;
  grade: string | null;
  language: string;
  visibility: string;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
interface ResourceListResult { resources: ResourceListItemDto[]; total: number }

const RESOURCE_TYPES = [
  "quiz", "worksheet", "lesson_plan", "presentation",
  "flashcards", "notes", "exam", "homework", "practice_material",
] as const;
type ResourceType = (typeof RESOURCE_TYPES)[number];

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

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-warning/10 text-warning",
  ready: "bg-success/10 text-success",
  archived: "bg-muted text-muted-foreground",
};

export function LibraryView() {
  const t = useTranslations("library");
  const tCommon = useTranslations("common");
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [type, setType] = React.useState<ResourceType | "">("");
  const [status, setStatus] = React.useState<string>("");
  const [page, setPage] = React.useState(0);
  const pageSize = 9;

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  React.useEffect(() => { setPage(0); }, [debounced, type, status]);

  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String(page * pageSize),
  });
  if (debounced) params.set("search", debounced);
  if (type) params.set("resourceType", type);
  if (status) params.set("status", status);

  const q = useQuery<ResourceListResult>({
    queryKey: ["resources", "list", params.toString()],
    queryFn: () => api.get<ResourceListResult>(`/api/resources?${params}`),
    staleTime: 30_000,
  });

  const resources = q.data?.resources ?? [];
  const total = q.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="flex-1"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ResourceType | "")}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          aria-label={t("filterByType")}
        >
          <option value="">{tCommon("all")}</option>
          {RESOURCE_TYPES.map((rt) => (
            <option key={rt} value={rt}>{t(`types.${rt}`)}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          aria-label={t("filterByStatus")}
        >
          <option value="">{tCommon("all")}</option>
          <option value="ready">{t("statusReady")}</option>
          <option value="draft">{t("statusDraft")}</option>
          <option value="archived">{t("statusArchived")}</option>
        </select>
      </div>

      {/* Results */}
      {q.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/60 p-4">
              <Skeleton className="mb-3 size-10 rounded-lg" />
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={Library}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          ctaLabel={t("goToMarketplace")}
          ctaHref="/marketplace"
        />
      ) : (
        <>
          <div className="mb-2 text-xs text-muted-foreground">{t("resultCount", { count: total })}</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => {
              const Icon = TYPE_ICON[r.resourceType] ?? BookOpen;
              return (
                <Card key={r.id} className="border-border/60 transition-colors hover:border-teacher/30">
                  <Link href={`/library/${r.id}`} className="block">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-teacher/10 text-teacher">
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="line-clamp-2 text-sm font-medium">{r.title}</CardTitle>
                          <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                            {r.description ?? tCommon("noDescription")}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">{t(`types.${r.resourceType}`)}</Badge>
                        <Badge className={`text-[10px] ${STATUS_COLOR[r.status] ?? ""}`}>{t(`status_${r.status}`)}</Badge>
                        <Badge variant="outline" className="text-[10px] uppercase">{r.visibility}</Badge>
                        {r.subject && <Badge variant="outline" className="text-[10px]">{r.subject}</Badge>}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                {tCommon("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                {tCommon("next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
