/**
 * Marketplace browse page.
 *
 * Calls GET /api/marketplace/listings with filters + sorting.
 * Calls GET /api/marketplace/featured, /popular, /new for the hero row.
 * Calls GET /api/marketplace/categories for the filter chips.
 *
 * Auth-aware: works for anonymous visitors (browse is public).
 */
"use client";

import * as React from "react";
import Link from "next/link";
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
} from "lucide-react";

import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const featured = featuredQ.data?.listings ?? [];
  const categories = categoriesQ.data?.categories ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Featured strip */}
      {featured.length > 0 && !debouncedSearch && !categoryId && (
        <section aria-labelledby="featured-heading">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-creator" aria-hidden />
            <h2 id="featured-heading" className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {t("featured")}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l) => (
              <ListingCard key={l.id} listing={l} compact />
            ))}
          </div>
        </section>
      )}

      {/* Filters bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-3 sm:flex-row sm:items-center">
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
        <div className="flex flex-wrap items-center gap-2">
          <SortSelect value={sort} onChange={setSort} />
          <FilterChip active={!showFree && !showPaid} onClick={() => { setShowFree(false); setShowPaid(false); }}>
            {tCommon("all")}
          </FilterChip>
          <FilterChip active={showFree} onClick={() => { setShowFree(true); setShowPaid(false); }}>
            {t("free")}
          </FilterChip>
          <FilterChip active={showPaid} onClick={() => { setShowPaid(true); setShowFree(false); }}>
            {t("paid")}
          </FilterChip>
        </div>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label={t("categories")}>
          <CategoryChip
            active={!categoryId}
            onClick={() => setCategoryId(undefined)}
            label={tCommon("all")}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              active={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
              label={c.name}
            />
          ))}
        </div>
      )}

      {/* Results */}
      <section aria-label={t("resultsLabel")}>
        {browseQ.isLoading ? (
          <BrowseSkeleton />
        ) : browseQ.isError ? (
          <EmptyState
            icon={Store}
            title={t("errorTitle")}
            description={t("errorDescription")}
            ctaLabel={tCommon("retry")}
            ctaHref={`/${""}`}
          />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Store}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            ctaLabel={t("clearFilters")}
            ctaHref={`/${""}`}
          />
        ) : (
          <>
            <div className="mb-3 text-xs text-muted-foreground">
              {t("resultCount", { count: total })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  {tCommon("previous")}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  {tCommon("next")}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const t = useTranslations("marketplace");
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortKey)}
      className="h-9 rounded-md border border-border bg-background px-3 text-sm"
      aria-label={t("sort")}
    >
      {SORTS.map((s) => (
        <option key={s} value={s}>
          {t(`sorts.${s}`)}
        </option>
      ))}
    </select>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-9 rounded-full border px-3 text-xs font-medium transition-colors ${
        active
          ? "border-teacher bg-teacher/10 text-teacher"
          : "border-border text-muted-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-teacher/10 text-teacher"
          : "bg-muted text-muted-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}

function ListingCard({
  listing,
  compact = false,
}: {
  listing: MpListingListItemDto;
  compact?: boolean;
}) {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");

  const fmtPrice = (price: number, currency: string) => {
    if (price === 0) return t("freePrice");
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(price);
    } catch {
      return `${price} ${currency}`;
    }
  };

  return (
    <Card className="group overflow-hidden border-border/60 transition-colors hover:border-creator/30">
      <Link href={`/marketplace/${listing.id}`} className="block">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {listing.thumbnailUrl ? (
            <img
              src={listing.thumbnailUrl}
              alt={listing.title}
              className="size-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Store className="size-8" aria-hidden />
            </div>
          )}
          {listing.featured && (
            <Badge className="absolute end-2 top-2 bg-creator text-creator-foreground">
              <Sparkles className="me-1 size-3" aria-hidden />
              {t("featuredBadge")}
            </Badge>
          )}
        </div>
        {/* Body */}
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{listing.title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {listing.creatorName}
          </p>
          {!compact && listing.description && (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
              {listing.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {fmtPrice(listing.price, listing.currency)}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {listing.ratingCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="size-3 text-amber-500" aria-hidden />
                  {listing.ratingAverage.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Heart className="size-3" aria-hidden />
                {listing.favoriteCount}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}

function BrowseSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-border/60 p-0">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="p-3">
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="mb-3 h-3 w-1/2" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// silence unused imports used only by future variants
void Clock;
void ShoppingCart;
void TrendingUp;
