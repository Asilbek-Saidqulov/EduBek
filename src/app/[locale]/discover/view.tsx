"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Brain, Compass, Gamepad2, Search } from "lucide-react";

import { api } from "@/lib/api-client";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/edubek/empty-state";

type FeedItem = {
  entityType?: string;
  entityId?: string;
  title?: string;
  description?: string | null;
  reasonKey?: string;
};

type FeedSection = {
  id?: string;
  title?: string;
  items?: FeedItem[];
};

type TopicDto = {
  id?: string;
  name?: string;
  description?: string | null;
  quizCount?: number;
};

class DiscoverBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { error: error?.message || "Discover failed to render" };
  }
  render() {
    if (this.state.error) {
      return (
        <EmptyState
          icon={Compass}
          title="Discover hit an error"
          description={this.state.error}
        />
      );
    }
    return this.props.children;
  }
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function DiscoverBody() {
  const [search, setSearch] = React.useState("");
  const [selectedSubject, setSelectedSubject] = React.useState("all");

  const feedQ = useQuery({
    queryKey: ["discovery", "feed"],
    queryFn: () => api.get<{ sections?: FeedSection[] }>("/api/discovery/feed"),
    staleTime: 60_000,
    retry: 1,
  });

  const topicsQ = useQuery({
    queryKey: ["discovery", "topics"],
    queryFn: () => api.get<{ topics?: TopicDto[] } | TopicDto[]>("/api/discovery/topics"),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const rawTopics = topicsQ.data && "topics" in (topicsQ.data as object)
    ? (topicsQ.data as { topics?: TopicDto[] }).topics
    : topicsQ.data;
  const topicList = asArray<TopicDto>(rawTopics).filter((topic) => topic?.id && topic?.name);
  const sections = asArray<FeedSection>(feedQ.data?.sections);
  const feedItems = sections.flatMap((section) =>
    asArray<FeedItem>(section.items).map((item) => ({
      ...item,
      sectionId: section.id || "feed",
    })),
  );

  const subjects = [
    { id: "all", label: "All", icon: Compass },
    ...topicList.map((topic) => ({
      id: String(topic.id),
      label: String(topic.name),
      icon: BookOpen,
    })),
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Discover</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Published quizzes and marketplace listings from the database.
          </p>
          <Button asChild size="sm" className="mt-3 gap-1.5">
            <Link href="/live-quiz?tab=discover&first=1">
              <Gamepad2 className="size-3.5" />
              Local practice pack
            </Link>
          </Button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter published items..."
              className="h-10 bg-card ps-10"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {subjects.map((sub) => {
            const Icon = sub.icon;
            const active = selectedSubject === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubject(sub.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/60 bg-muted/50 text-muted-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {feedQ.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : feedItems.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No published quizzes yet"
          description="Discover only shows quizzes and listings saved in the database. Publish a quiz or run npm run db:seed."
        />
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Published now
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {feedItems
              .filter((item) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                return `${item.title || ""} ${item.description || ""}`.toLowerCase().includes(q);
              })
              .map((item) => (
                <Link
                  key={`${item.sectionId}-${item.entityId}`}
                  href={
                    item.reasonKey === "listing"
                      ? `/marketplace/${encodeURIComponent(String(item.entityId || ""))}`
                      : `/live-quiz?quizId=${encodeURIComponent(String(item.entityId || ""))}`
                  }
                  className="rounded-xl border p-4 transition-colors hover:border-primary/40"
                >
                  <p className="text-sm font-semibold">{item.title || "Untitled"}</p>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                </Link>
              ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Published topics</h2>
        {topicsQ.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : topicList.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No published topics yet"
            description="Topics appear after quizzes are published in the database."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {topicList
              .filter((topic) => selectedSubject === "all" || topic.id === selectedSubject)
              .map((topic) => (
                <Card key={String(topic.id)} className="border-border/80 p-4">
                  <CardTitle className="text-sm">{topic.name}</CardTitle>
                  {topic.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{topic.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">{topic.quizCount ?? 0} published quizzes</p>
                </Card>
              ))}
          </div>
        )}
      </section>

      <Card className="border-violet-500/30 p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <Badge className="bg-violet-600 text-[10px] text-white">AI Workspace</Badge>
            <h3 className="text-base font-bold">Need a topic that is not published yet?</h3>
            <p className="max-w-xl text-xs text-muted-foreground">
              Generate a practice quiz in AI Workspace. Publishing it will make it show up here.
            </p>
          </div>
          <Button asChild className="shrink-0 gap-2 bg-violet-600 text-white hover:bg-violet-700">
            <Link href="/ai-workspace">
              <Brain className="size-4" />
              Create quiz with AI
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function DiscoverView() {
  return (
    <DiscoverBoundary>
      <DiscoverBody />
    </DiscoverBoundary>
  );
}
