/**
 * Discover page — personalized feed + topic tree.
 *
 * GET /api/discovery/feed — main feed (sections of FeedItem[]).
 * GET /api/discovery/topics — root topic tree.
 * POST /api/search — cross-entity search.
 *
 * Auth required for feed + search; topics are public.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Compass,
  Lightbulb,
  Rocket,
  Search,
  Sparkles,
  Store,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { api, ApiError } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/edubek/empty-state";

// --- DTOs (verbatim from src/features/discovery/types.ts and semantic-search/types.ts) ---

interface FeedItem {
  entityType: string;
  entityId: string;
  title: string;
  description: string | null;
  score: number;
  reason: string;
  reasonKey: string;
  language: string;
  thumbnailUrl?: string | null;
}
interface FeedSection {
  id: string;
  title: string;
  titleKey: string;
  items: FeedItem[];
}
interface PersonalizedFeed {
  userId: string;
  sections: FeedSection[];
  generatedAt: string;
  ttlSeconds: number;
}

interface TopicDto {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  difficulty: string;
  language: string;
  children: TopicDto[];
}
interface TopicsResult { topics: TopicDto[] }

interface SearchDocument {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  body: string;
  tags: string[];
  language: string;
}
interface SearchResult {
  documents: Array<{ document: SearchDocument; score: number }>;
  total: number;
}

const SECTION_ICON: Record<string, LucideIcon> = {
  continue_learning: Compass,
  recommended_today: Sparkles,
  weak_topics: Lightbulb,
  next_prerequisites: Rocket,
  trending: TrendingUp,
  marketplace_picks: Store,
};

const ENTITY_HREF: Record<string, string> = {
  resource: "/library",
  quiz: "/library",
  marketplace_listing: "/marketplace",
  topic: "/discover",
};

export function DiscoverView() {
  const t = useTranslations("discover");
  const tCommon = useTranslations("common");
  const { user } = useCurrentUser();

  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [searchSubmitted, setSearchSubmitted] = React.useState("");

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  // Search query — only fires when user has typed something.
  const searchQ = useQuery<SearchResult>({
    queryKey: ["search", searchSubmitted],
    queryFn: () =>
      api.post<SearchResult>("/api/search", { query: searchSubmitted, page: 1, pageSize: 20 }),
    enabled: !!searchSubmitted,
    staleTime: 60_000,
  });

  const feedQ = useQuery<PersonalizedFeed>({
    queryKey: ["discovery", "feed"],
    queryFn: () => api.get<PersonalizedFeed>("/api/discovery/feed"),
    enabled: !!user && !searchSubmitted,
    staleTime: 60_000,
  });

  const topicsQ = useQuery<TopicsResult>({
    queryKey: ["discovery", "topics"],
    queryFn: () => api.get<TopicsResult>("/api/discovery/topics"),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Hero / search */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card className="overflow-hidden border-border/60">
        <CardContent className="p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); setSearchSubmitted(debounced); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="ps-9"
                aria-label={t("searchPlaceholder")}
              />
            </div>
            <Button type="submit" disabled={!debounced.trim()}>
              <Search className="size-4" aria-hidden />
              {tCommon("search")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search results */}
      {searchSubmitted ? (
        <section aria-label={t("resultsLabel")}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {t("searchResults")}
            </h2>
            {searchQ.data && (
              <span className="text-xs text-muted-foreground">
                {t("resultCount", { count: searchQ.data.total })}
              </span>
            )}
          </div>
          {searchQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : searchQ.isError ? (
            <EmptyState icon={Search} title={t("searchError")} description={(searchQ.error as ApiError)?.message ?? ""} />
          ) : (searchQ.data?.documents ?? []).length === 0 ? (
            <EmptyState
              icon={Search}
              title={t("noResults")}
              description={t("noResultsDesc")}
              ctaLabel={tCommon("retry")}
              ctaHref="/discover"
            />
          ) : (
            <div className="space-y-2">
              {searchQ.data!.documents.map((d) => (
                <Card key={d.document.id} className="border-border/60 p-3">
                  <Link href={`${ENTITY_HREF[d.document.entityType] ?? "/discover"}/${d.document.entityId}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{d.document.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.document.body}</p>
                        <Badge variant="outline" className="mt-1.5 text-[10px] uppercase">{d.document.entityType}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">score: {d.score.toFixed(2)}</span>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Personalized feed */}
          {user && (
            <section aria-label={t("feedLabel")}>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-ai" aria-hidden />
                <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {t("forYou")}
                </h2>
              </div>
              {feedQ.isLoading ? (
                <FeedSkeleton />
              ) : feedQ.isError ? (
                <EmptyState icon={Compass} title={t("feedError")} description={(feedQ.error as ApiError)?.message ?? ""} />
              ) : (feedQ.data?.sections ?? []).length === 0 ? (
                <EmptyState icon={Compass} title={t("feedEmpty")} description={t("feedEmptyDesc")} />
              ) : (
                <div className="space-y-6">
                  {feedQ.data!.sections.map((sec) => {
                    const Icon = SECTION_ICON[sec.id] ?? Sparkles;
                    return (
                      <div key={sec.id}>
                        <div className="mb-2 flex items-center gap-2">
                          <Icon className="size-4 text-ai" aria-hidden />
                          <h3 className="text-sm font-medium">{sec.title}</h3>
                          <span className="text-xs text-muted-foreground">{sec.items.length}</span>
                        </div>
                        {sec.items.length === 0 ? (
                          <p className="text-xs text-muted-foreground">{t("noItems")}</p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {sec.items.slice(0, 6).map((item) => (
                              <Card key={`${sec.id}-${item.entityType}-${item.entityId}`} className="border-border/60 p-3">
                                <Link href={`${ENTITY_HREF[item.entityType] ?? "/discover"}/${item.entityId}`} className="block">
                                  <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                                  {item.description && (
                                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                                  )}
                                  <Badge variant="outline" className="mt-2 text-[10px] uppercase">{item.entityType}</Badge>
                                </Link>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Topic tree */}
          <section aria-label={t("topicsLabel")}>
            <div className="mb-3 flex items-center gap-2">
              <Compass className="size-4 text-teacher" aria-hidden />
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {t("topics")}
              </h2>
            </div>
            {topicsQ.isLoading ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : (topicsQ.data?.topics ?? []).length === 0 ? (
              <EmptyState icon={Compass} title={t("topicsEmpty")} description={t("topicsEmptyDesc")} />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {topicsQ.data!.topics.map((topic) => (
                  <Card key={topic.id} className="border-border/60 p-3 transition-colors hover:border-teacher/30">
                    <p className="text-sm font-medium">{topic.name}</p>
                    {topic.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{topic.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{topic.difficulty}</Badge>
                      <Badge variant="secondary" className="text-[10px] uppercase">{topic.language}</Badge>
                      {topic.children.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {topic.children.length} {t("subtopics")}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-2 h-4 w-32" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-24" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
