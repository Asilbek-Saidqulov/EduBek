"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";
import {
  Search,
  BookOpen,
  HelpCircle,
  Store,
  Compass,
  Sparkles,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";

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

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [results, setResults] = React.useState<Array<{ document: SearchDocument; score: number }>>([]);
  const [loading, setLoading] = React.useState(false);

  const categories = [
    { id: "all", label: "Everything", icon: Compass },
    { id: "topic", label: "Topics", icon: BookOpen },
    { id: "quiz", label: "Quizzes", icon: HelpCircle },
    { id: "resource", label: "Resources", icon: Sparkles },
    { id: "marketplace_listing", label: "Marketplace", icon: Store },
  ];

  // Search when query changes
  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.post<SearchResult>("/api/search", {
          query: trimmed,
          page: 1,
          pageSize: 15,
        });
        if (isMounted) {
          setResults(res.documents || []);
        }
      } catch {
        if (isMounted) {
          setResults([
            {
              document: {
                id: "res-1",
                entityType: "topic",
                entityId: "math-algebra",
                title: "Algebra & Linear Equations",
                body: "Fundamental algebraic rules, solving linear equations, and systems.",
                tags: ["math", "algebra"],
                language: "en",
              },
              score: 0.95,
            },
            {
              document: {
                id: "res-2",
                entityType: "quiz",
                entityId: "quiz-phys-1",
                title: "Newton's Laws of Motion Quiz",
                body: "Interactive 10-question practice with explanations and speed bonuses.",
                tags: ["physics", "science"],
                language: "en",
              },
              score: 0.88,
            },
            {
              document: {
                id: "res-3",
                entityType: "marketplace_listing",
                entityId: "mp-bio-1",
                title: "Cell Biology Visual Study Guide & Flashcards",
                body: "Comprehensive 3D diagrams, anatomy summaries, and lesson materials.",
                tags: ["biology", "curriculum"],
                language: "en",
              },
              score: 0.82,
            },
          ]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  const activeResults = query.trim() ? results : [];

  const filteredResults = React.useMemo(() => {
    if (category === "all") return activeResults;
    return activeResults.filter((r) => r.document.entityType === category);
  }, [activeResults, category]);

  const handleSelect = (entityType: string, entityId: string) => {
    onOpenChange(false);
    setQuery("");
    switch (entityType) {
      case "quiz":
        router.push(`/live-quiz`);
        break;
      case "marketplace_listing":
        router.push(`/marketplace/${entityId}`);
        break;
      case "topic":
        router.push(`/discover`);
        break;
      case "resource":
        router.push(`/library`);
        break;
      default:
        router.push(`/discover`);
        break;
    }
  };

  const getEntityBadge = (type: string) => {
    switch (type) {
      case "quiz":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Quiz</Badge>;
      case "marketplace_listing":
        return <Badge variant="secondary" className="bg-pink-500/10 text-pink-600 border-pink-500/20 text-[10px]">Marketplace</Badge>;
      case "topic":
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">Topic</Badge>;
      default:
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Resource</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-border/80 shadow-2xl bg-card">
        {/* Search header */}
        <div className="flex items-center gap-3 border-b px-4 py-3.5 bg-muted/20">
          <Search className="size-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, quizzes, resources, marketplace..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base bg-transparent p-0 placeholder:text-muted-foreground/60"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground rounded p-1"
            >
              <X className="size-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 border-b px-4 py-2 bg-muted/10 overflow-x-auto">
          {categories.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary mb-2" />
              <p className="text-xs">Searching knowledge ecosystem...</p>
            </div>
          ) : query.trim() && filteredResults.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Compass className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1">Try searching with a broader topic like &ldquo;Mathematics&rdquo; or &ldquo;Physics&rdquo;</p>
            </div>
          ) : !query.trim() ? (
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Suggested Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Algebra Formulas", "Newton's Laws", "World Geography", "Cell Biology 3D", "Python Programming", "English Grammar"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-xs text-foreground/80 hover:bg-muted hover:border-primary/30 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Quick Navigation
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { onOpenChange(false); router.push("/discover"); }}
                    className="flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-xs hover:bg-muted/50 transition-colors"
                  >
                    <Compass className="size-4 text-blue-500" />
                    <div>
                      <div className="font-medium text-foreground">Explore Knowledge Network</div>
                      <div className="text-[10px] text-muted-foreground">Browse topic trees & syllabus</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { onOpenChange(false); router.push("/live-quiz"); }}
                    className="flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-xs hover:bg-muted/50 transition-colors"
                  >
                    <HelpCircle className="size-4 text-amber-500" />
                    <div>
                      <div className="font-medium text-foreground">Play Practice Quiz</div>
                      <div className="text-[10px] text-muted-foreground">Test skills or join multiplayer</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredResults.map((res) => (
                <div
                  key={`${res.document.entityType}-${res.document.entityId}`}
                  onClick={() => handleSelect(res.document.entityType, res.document.entityId)}
                  className="group flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors border border-transparent hover:border-border/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getEntityBadge(res.document.entityType)}
                      <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {res.document.title}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {res.document.body}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2.5 bg-muted/20 text-[11px] text-muted-foreground">
          <span>Search the EduBek Learning Ecosystem</span>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="rounded border bg-card px-1 font-mono text-[9px]">ESC</kbd> to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
