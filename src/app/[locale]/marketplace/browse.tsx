/**
 * Marketplace Browse View — EduBek Educator Marketplace
 *
 * Designed as a professional, trusted marketplace for human-created
 * educational materials, lesson plans, study guides, and test banks.
 */
"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Clock,
  Heart,
  Search,
  ShoppingCart,
  Star,
  Store,
  Sparkles,
  TrendingUp,
  Filter,
  CheckCircle2,
  FileText,
  Coins,
  ShieldCheck,
  Award,
  BookOpen,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/edubek/empty-state";
import { useCurrentUser } from "@/hooks/use-current-user";

interface MpListingListItemDto {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  resourceType: string;
  price: number;
  currency: string;
  featured: boolean;
  viewCount: number;
  favoriteCount: number;
  ratingAverage: number;
  ratingCount: number;
  creatorName: string;
  categories: string[];
  publishedAt: string | null;
  createdAt: string;
}

interface MpCategoryDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
}

interface ListingListResult {
  listings: MpListingListItemDto[];
  total: number;
}

interface CategoryResult {
  categories: MpCategoryDto[];
}

interface FeaturedResult {
  listings: MpListingListItemDto[];
}

const SORTS = ["newest", "popular", "rated", "alphabetical"] as const;
type SortKey = (typeof SORTS)[number];

export function MarketplaceBrowse() {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const { user } = useCurrentUser();

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined);
  const [showFree, setShowFree] = React.useState(false);
  const [showPaid, setShowPaid] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const pageSize = 12;

  // Debounce search
  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch, sort, categoryId, showFree, showPaid]);

  const queryParams = new URLSearchParams({
    sort,
    limit: String(pageSize),
    offset: String(page * pageSize),
  });
  if (debouncedSearch) queryParams.set("search", debouncedSearch);
  if (categoryId) queryParams.set("categoryId", categoryId);
  if (showFree) queryParams.set("free", "true");
  if (showPaid) queryParams.set("paid", "true");

  const browseQ = useQuery<ListingListResult>({
    queryKey: ["marketplace", "browse", queryParams.toString()],
    queryFn: () => api.get<ListingListResult>(`/api/marketplace/listings?${queryParams}`),
    staleTime: 30_000,
  });

  const featuredQ = useQuery<FeaturedResult>({
    queryKey: ["marketplace", "featured"],
    queryFn: () => api.get<FeaturedResult>("/api/marketplace/featured?limit=6"),
    staleTime: 60_000,
  });

  const categoriesQ = useQuery<CategoryResult>({
    queryKey: ["marketplace", "categories"],
    queryFn: () => api.get<CategoryResult>("/api/marketplace/categories"),
    staleTime: 5 * 60_000,
  });

  const listings = browseQ.data?.listings ?? [];
  const total = browseQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header & Trust Banner */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Store className="size-3.5" />
              Verified Educator Marketplace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            {t("subtitle")}
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-10 h-10 bg-card border-border/80 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 rounded-lg border border-border/80 bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">{t("sorts.newest")}</option>
              <option value="popular">{t("sorts.popular")}</option>
              <option value="rated">{t("sorts.rated")}</option>
              <option value="alphabetical">{t("sorts.alphabetical")}</option>
            </select>

            <button
              onClick={() => {
                setShowFree(false);
                setShowPaid(false);
              }}
              className={`h-10 px-3.5 rounded-lg text-xs font-medium border transition-all ${
                !showFree && !showPaid
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border/80 hover:bg-muted"
              }`}
            >
              {tCommon("all")}
            </button>
            <button
              onClick={() => {
                setShowFree(true);
                setShowPaid(false);
              }}
              className={`h-10 px-3.5 rounded-lg text-xs font-medium border transition-all ${
                showFree
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border/80 hover:bg-muted"
              }`}
            >
              {t("free")}
            </button>
            <button
              onClick={() => {
                setShowPaid(true);
                setShowFree(false);
              }}
              className={`h-10 px-3.5 rounded-lg text-xs font-medium border transition-all ${
                showPaid
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border/80 hover:bg-muted"
              }`}
            >
              {t("paid")}
            </button>
          </div>
        </div>
      </div>

      {/* Creator Economy Transparency Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
          <span>
            <strong>Educator First Economy:</strong> 70–80% of every EduToken purchase goes directly to the content creator.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
          <Coins className="size-3.5 text-amber-500" />
          <span>AI credits are for tutoring only</span>
        </div>
      </div>

      {/* Product Listings Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {t("resultsLabel")} ({total})
          </h2>
        </div>

        {browseQ.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={<Store className="h-6 w-6" />}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={
              search || showFree || showPaid || categoryId ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setShowFree(false);
                    setShowPaid(false);
                    setCategoryId(undefined);
                  }}
                >
                  {t("clearFilters")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((item) => (
              <Card
                key={item.id}
                className="group flex flex-col justify-between border-border/80 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Visual Header / Cover */}
                  <div className="relative aspect-video bg-gradient-to-br from-muted via-muted/60 to-primary/5 flex items-center justify-center p-4 border-b">
                    <BookOpen className="size-10 text-muted-foreground/40 group-hover:text-primary/70 transition-colors" />
                    {item.featured && (
                      <Badge className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px]">
                        {t("featuredBadge")}
                      </Badge>
                    )}
                    {item.price === 0 ? (
                      <Badge variant="secondary" className="absolute bottom-2.5 left-2.5 bg-background/90 text-emerald-600 font-bold text-[10px]">
                        {t("freePrice")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="absolute bottom-2.5 left-2.5 bg-background/90 text-amber-600 font-mono font-bold text-[10px] flex items-center gap-1">
                        <Coins className="size-3 text-amber-500" />
                        {item.price} EDU
                      </Badge>
                    )}
                  </div>

                  {/* Content info */}
                  <div className="p-4 pt-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                        {item.resourceType}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1.5 border-t">
                      <Award className="size-3 text-primary shrink-0" />
                      <span className="truncate">{item.creatorName || "EduBek Creator"}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="size-3.5 fill-current" />
                    <span>{item.ratingAverage ? item.ratingAverage.toFixed(1) : "5.0"}</span>
                    <span className="text-muted-foreground font-normal">({item.ratingCount || 0})</span>
                  </div>

                  <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold">
                    <Link href={`/marketplace/${item.id}`}>
                      {item.price === 0 ? t("claimFree") : t("buyNow")}
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
