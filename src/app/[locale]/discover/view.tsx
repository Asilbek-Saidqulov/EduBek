"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search, Star, User, Award } from "lucide-react";

import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Material = {
  id: string;
  title: string;
  description?: string | null;
  subject?: string;
  grade?: string;
  type?: string;
  featured?: boolean;
  rating?: number;
  ratingCount?: number;
  creator?: string;
};

export function DiscoverView() {
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("newest");

  const { data, isLoading } = useQuery({
    queryKey: ["discover-materials", search, sort],
    queryFn: async () => {
      try {
        const res = await api.get<{ assessments: any[] }>("/api/assessments?limit=24");
        return (res.assessments || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          subject: a.subject || "General",
          grade: a.grade || "",
          type: "QUIZ",
          featured: true,
          rating: 5.0,
          ratingCount: 0,
          creator: "EduBek",
        }));
      } catch {
        return [] as Material[];
      }
    },
  });

  const materials = (data || []).filter((m) =>
    !search ||
    m.title?.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          Reliable Materials by EduBek
        </Badge>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
        <p className="text-muted-foreground mt-1">
          Discover and use ready-made educational resources for free.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
        </select>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          All Materials ({materials.length})
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No materials found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {materials.map((m) => (
              <Card key={m.id} className="overflow-hidden border-border/80 hover:shadow-md transition-shadow">
                <div className="relative h-28 bg-gradient-to-br from-muted/40 to-muted/20 flex items-center justify-center">
                  <BookOpen className="size-10 text-muted-foreground/40" />
                  {m.featured && (
                    <Badge className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px]">Featured</Badge>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-[10px]">Free</Badge>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase">{m.type || "QUIZ"}</div>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">{m.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {m.description || `${m.subject} · ${m.grade}`}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                    <User className="size-3" />
                    <span>{m.creator || "EduBek"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      <span>{m.rating?.toFixed(1) || "5.0"} ({m.ratingCount || 0})</span>
                    </div>
                    <div className="flex gap-1">
                      <Button asChild size="sm" className="h-7 text-xs px-3">
                        <Link href={`/live-quiz?quiz=${m.id}`}>Practice</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2">
                        <Link href={`/live-quiz?quiz=${m.id}&preview=1`}>Show questions</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}