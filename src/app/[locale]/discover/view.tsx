/**
 * Discover page — EduBek Nexus
 *
 * The central exploration layer combining:
 * - Knowledge Network & interactive Topic Tree
 * - Featured & Trending Topics
 * - Popular Quizzes & Resources
 * - Cross-Entity Search & Filter Bar
 */
"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
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
  BookOpen,
  HelpCircle,
  Users,
  ChevronRight,
  Filter,
  CheckCircle2,
  ArrowRight,
  Brain,
  Share2,
  Bookmark,
  Layers,
  GraduationCap,
  Gamepad2,
} from "lucide-react";

import { api, ApiError } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/edubek/empty-state";

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
  resourceCount?: number;
  quizCount?: number;
}

interface TopicsResult {
  topics: TopicDto[];
}

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

export function DiscoverView() {
  const t = useTranslations("discover");
  const tCommon = useTranslations("common");
  const { user } = useCurrentUser();

  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [searchSubmitted, setSearchSubmitted] = React.useState("");
  const [selectedSubject, setSelectedSubject] = React.useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>("all");
  const [activeTopicNode, setActiveTopicNode] = React.useState<string | null>("math-algebra");

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(id);
  }, [search]);

  // Search query
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
    enabled: !searchSubmitted,
    staleTime: 60_000,
  });

  const topicsQ = useQuery<TopicsResult>({
    queryKey: ["discovery", "topics"],
    queryFn: () => api.get<TopicsResult>("/api/discovery/topics"),
    staleTime: 5 * 60_000,
  });

  const topicList = topicsQ.data?.topics ?? [];
  const subjects = [{ id: "all", label: "All", icon: Compass }, ...topicList.map((topic) => ({
    id: topic.id,
    label: topic.name,
    icon: BookOpen,
  }))];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header & Nexus Search */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Compass className="size-3.5" />
              Nexus Knowledge Explorer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Discover & Explore Knowledge
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Pick a topic or start a short practice quiz. A wrong answer can open Tutor.
          </p>
          <Button asChild size="sm" className="mt-3 gap-1.5">
            <Link href="/live-quiz?tab=discover&first=1">
              <Gamepad2 className="size-3.5" />
              Local practice pack
            </Link>
          </Button>
        </div>

        {/* Search & Discipline Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchSubmitted(debounced);
            }}
            className="flex-1 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search across all topics, quizzes, and resources..."
                className="ps-10 h-10 border-border/80 bg-card"
              />
            </div>
            <Button type="submit" className="h-10 px-4 gap-2">
              <Search className="size-4" />
              Search
            </Button>
          </form>
        </div>

        {/* Disciplines Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {subjects.map((sub) => {
            const Icon = sub.icon;
            const active = selectedSubject === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubject(sub.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {feedQ.isFetched && !feedQ.data?.sections?.some((s) => s.items.length > 0) && (
        <EmptyState
          icon={Compass}
          title="No published quizzes yet"
          description="Discover only shows quizzes and listings saved in the database. Publish a quiz or run db:seed."
        />
      )}

      {feedQ.data?.sections?.some((s) => s.items.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Practice now</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {feedQ.data.sections.flatMap((section) =>
              section.items.map((item) => (
                <Link
                  key={`${section.id}-${item.entityId}`}
                  href={
                    item.reasonKey === "listing"
                      ? `/marketplace/${encodeURIComponent(item.entityId)}`
                      : `/live-quiz?quizId=${encodeURIComponent(item.entityId)}`
                  }
                  className="rounded-xl border p-4 hover:border-primary/40 transition-colors"
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                </Link>
              )),
            )}
          </div>
        </section>
      )}

      {/* Search Results Display if active */}
      {searchSubmitted ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Search Results for &ldquo;{searchSubmitted}&rdquo;
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchSubmitted("");
                setSearch("");
              }}
              className="text-xs text-muted-foreground"
            >
              Clear Search
            </Button>
          </div>

          {searchQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : searchQ.isError ? (
            <EmptyState
              icon={Search}
              title="Search Error"
              description={(searchQ.error as ApiError)?.message ?? "Failed to perform search"}
            />
          ) : (searchQ.data?.documents ?? []).length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching items found"
              description="Try adjusting your keywords or browse by topic below."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {searchQ.data!.documents.map((d) => (
                <Card key={d.document.id} className="border-border/80 p-4 hover:border-primary/40 transition-colors">
                  <Link href={`/discover`} className="block space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary">
                        {d.document.title}
                      </h4>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {d.document.entityType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{d.document.body}</p>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-bold">Published topics</h2>
            {topicsQ.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : topicList.length === 0 ? (
              <EmptyState
                icon={Compass}
                title="No published topics yet"
                description="Topics appear here after quizzes are published. Run db:seed on the server if this is a new database."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {topicList
                  .filter((topic) => selectedSubject === "all" || topic.id === selectedSubject)
                  .map((topic) => (
                    <Card key={topic.id} className="border-border/80 p-4">
                      <CardTitle className="text-sm">{topic.name}</CardTitle>
                      {topic.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{topic.description}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">{topic.quizCount ?? 0} published quizzes</p>
                    </Card>
                  ))}
              </div>
            )}
          </section>

          {/* Contextual AI Generator Callout */}
          <Card className="border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-card to-card shadow-xs p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-violet-600 text-white text-[10px]">Contextual AI</Badge>
                  <span className="text-xs text-muted-foreground font-medium">Private by default</span>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Can&apos;t find a specific topic in the syllabus?
                </h3>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Generate customized practice questions, detailed lesson summaries, or flashcards instantly with the AI Workspace.
                </p>
              </div>
              <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shrink-0">
                <Link href="/ai-workspace">
                  <Brain className="size-4" />
                  Generate Custom Topic
                </Link>
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
