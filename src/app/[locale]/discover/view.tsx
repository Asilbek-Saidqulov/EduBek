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
    enabled: !!user && !searchSubmitted,
    staleTime: 60_000,
  });

  const topicsQ = useQuery<TopicsResult>({
    queryKey: ["discovery", "topics"],
    queryFn: () => api.get<TopicsResult>("/api/discovery/topics"),
    staleTime: 5 * 60_000,
  });

  // Curated fallback subjects
  const subjects = [
    { id: "all", label: "All Disciplines", icon: Compass },
    { id: "math", label: "Mathematics", icon: GraduationCap },
    { id: "physics", label: "Physics", icon: Rocket },
    { id: "biology", label: "Biology", icon: Sparkles },
    { id: "cs", label: "Computer Science", icon: Brain },
    { id: "history", label: "History", icon: BookOpen },
  ];

  // Knowledge Network Hierarchy
  const knowledgeNetwork = [
    {
      id: "math",
      title: "Mathematics",
      children: [
        {
          id: "math-algebra",
          title: "Algebra & Functions",
          topics: [
            { id: "linear", title: "Linear Equations", difficulty: "Beginner", quizzes: 14, resources: 8 },
            { id: "quadratic", title: "Quadratic Equations", difficulty: "Intermediate", quizzes: 18, resources: 12 },
            { id: "polynomials", title: "Polynomial Functions", difficulty: "Advanced", quizzes: 9, resources: 6 },
          ],
        },
        {
          id: "math-geom",
          title: "Geometry & Trigonometry",
          topics: [
            { id: "euclid", title: "Euclidean Geometry", difficulty: "Beginner", quizzes: 11, resources: 7 },
            { id: "trig-identities", title: "Trigonometric Identities", difficulty: "Intermediate", quizzes: 15, resources: 10 },
          ],
        },
      ],
    },
    {
      id: "physics",
      title: "Physics",
      children: [
        {
          id: "phys-mechanics",
          title: "Classical Mechanics",
          topics: [
            { id: "newton", title: "Newton's Laws & Dynamics", difficulty: "Foundational", quizzes: 22, resources: 15 },
            { id: "energy", title: "Work, Energy & Power", difficulty: "Intermediate", quizzes: 16, resources: 11 },
          ],
        },
      ],
    },
  ];

  const featuredTopics = [
    {
      id: "ft-1",
      title: "Quadratic Equations & Complex Roots",
      subject: "Mathematics",
      desc: "Complete conceptual guide covering discriminant analysis, factoring, and parabolic graphing.",
      quizzes: 18,
      resources: 12,
      difficulty: "Intermediate",
      popularity: "98% satisfaction",
    },
    {
      id: "ft-2",
      title: "Newton's Laws & Inertial Frames",
      subject: "Physics",
      desc: "Core dynamics covering force diagrams, momentum conservation, and real-world mechanics.",
      quizzes: 24,
      resources: 16,
      difficulty: "Beginner - Inter.",
      popularity: "99% satisfaction",
    },
    {
      id: "ft-3",
      title: "Cellular Respiration & ATP Cycle",
      subject: "Biology",
      desc: "Detailed breakdown of glycolysis, Krebs cycle, and oxidative phosphorylation with 3D models.",
      quizzes: 15,
      resources: 9,
      difficulty: "Intermediate",
      popularity: "95% satisfaction",
    },
    {
      id: "ft-4",
      title: "Data Structures & Time Complexity (Big O)",
      subject: "Computer Science",
      desc: "Understand arrays, linked lists, trees, graphs, and algorithmic efficiency benchmarks.",
      quizzes: 20,
      resources: 14,
      difficulty: "Advanced",
      popularity: "97% satisfaction",
    },
  ];

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
            Explore topic maps, human-created resources, interactive quizzes, and verified creator materials.
          </p>
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
          {/* Knowledge Network — Interactive Hierarchy Graph */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Layers className="size-4 text-blue-500" />
                  Knowledge Network
                </h2>
                <p className="text-xs text-muted-foreground">
                  Explore structured learning progressions, prerequisite maps, and concept trees.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {knowledgeNetwork.map((domain) => (
                <Card key={domain.id} className="border-border/80 shadow-xs overflow-hidden">
                  <CardHeader className="p-4 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <GraduationCap className="size-4 text-primary" />
                      {domain.title} Syllabus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {domain.children.map((branch) => (
                      <div key={branch.id} className="space-y-2">
                        <div className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                          <ChevronRight className="size-3 text-primary" />
                          <span>{branch.title}</span>
                        </div>
                        <div className="pl-4 space-y-1.5 border-l-2 border-border/80">
                          {branch.topics.map((t) => (
                            <Link
                              key={t.id}
                              href="/live-quiz"
                              className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                  {t.title}
                                </span>
                                <div className="text-[10px] text-muted-foreground">
                                  {t.quizzes} quizzes · {t.resources} resources
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[9px] shrink-0">
                                {t.difficulty}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Featured Topics Cards */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-500" />
                  Featured & High-Impact Topics
                </h2>
                <p className="text-xs text-muted-foreground">
                  Comprehensive topic blueprints with step-by-step learning materials and practice quizzes.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featuredTopics.map((topic) => (
                <Card key={topic.id} className="border-border/80 shadow-xs hover:border-primary/40 transition-all p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-semibold text-primary bg-primary/10">
                          {topic.subject}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{topic.difficulty}</span>
                      </div>
                      <h3 className="text-base font-bold text-foreground hover:text-primary transition-colors">
                        {topic.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{topic.desc}</p>

                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>{topic.quizzes} Quizzes</span>
                      <span>{topic.resources} Resources</span>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="gap-1 text-xs text-primary font-semibold">
                      <Link href="/live-quiz">
                        Start Practice <ArrowRight className="size-3" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
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
