/**
 * Marketplace listing detail page.
 *
 * GET /api/marketplace/listings/[id] — detail (auth required).
 * POST /api/marketplace/listings/[id]/favorite — toggle favorite.
 * POST /api/marketplace/listings/[id]/purchase — buy with EduTokens.
 *
 * If unauthenticated → redirect to /login (handled by AppShell + useCurrentUser).
 */
"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Heart,
  Loader2,
  ShoppingCart,
  Star,
  Store,
  Tag,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";

import { api, ApiError } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface MpListingDto {
  id: string;
  resourceId: string;
  creatorId: string;
  orgId: string | null;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  estimatedDuration: string | null;
  difficulty: string | null;
  price: number;
  currency: string;
  licenseType: string;
  status: string;
  visibility: string;
  featured: boolean;
  viewCount: number;
  favoriteCount: number;
  downloadCount: number;
  ratingAverage: number;
  ratingCount: number;
  publishedAt: string | null;
  isFavorited: boolean;
  isOutOfSync: boolean;
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

interface PurchaseResultDto {
  id: string;
  buyerId: string;
  listingId: string;
  creatorId: string;
  resourceId: string;
  pricePaid: number;
  platformFee: number;
  creatorEarning: number;
  status: string;
  refundableUntil: string | null;
  refundedAt: string | null;
  createdAt: string;
  resourceTitle: string;
  resourceType: string;
  message: string;
}

interface WalletBalance {
  balance: number;
}

export function MarketplaceDetail({ id }: { id: string }) {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const tErr = useTranslations("errors");
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const qc = useQueryClient();

  const detailQ = useQuery<MpListingDto>({
    queryKey: ["marketplace", "detail", id],
    queryFn: () => api.get<MpListingDto>(`/api/marketplace/listings/${id}`),
    enabled: !!id,
    retry: false,
  });
  const walletQ = useQuery<WalletBalance>({
    queryKey: ["wallet", "balance"],
    queryFn: () => api.get<WalletBalance>("/api/wallet/balance"),
    enabled: !!user,
    staleTime: 30_000,
  });

  const favMut = useMutation({
    mutationFn: () => api.post<{ favorited: boolean }>(`/api/marketplace/listings/${id}/favorite`),
    onMutate: () => {
      // Optimistic toggle
      qc.setQueryData<MpListingDto>(["marketplace", "detail", id], (old) =>
        old ? { ...old, isFavorited: !old.isFavorited, favoriteCount: old.favoriteCount + (old.isFavorited ? -1 : 1) } : old,
      );
    },
    onSuccess: (data) => {
      toast({
        title: data.favorited ? t("favorited") : t("unfavorited"),
      });
      qc.invalidateQueries({ queryKey: ["marketplace", "browse"] });
    },
    onError: () => {
      // Rollback by refetching
      qc.invalidateQueries({ queryKey: ["marketplace", "detail", id] });
      toast({ title: tErr("error"), description: t("favoriteError"), variant: "destructive" });
    },
  });

  const purchaseMut = useMutation({
    mutationFn: () => api.post<PurchaseResultDto>(`/api/marketplace/listings/${id}/purchase`),
    onSuccess: (data) => {
      toast({
        title: t("purchaseSuccess"),
        description: data.message,
      });
      qc.invalidateQueries({ queryKey: ["wallet", "balance"] });
      qc.invalidateQueries({ queryKey: ["marketplace", "purchases"] });
    },
    onError: (err: ApiError) => {
      toast({
        title: t("purchaseFailed"),
        description: err.message,
        variant: "destructive",
      });
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
              <Link href="/marketplace">
                <ArrowLeft className="size-4" aria-hidden />
                {t("backToMarketplace")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const l = detailQ.data;
  if (!l) return null;

  const isOwn = user?.id === l.creatorId;
  const fmtPrice = (price: number, currency: string) => {
    if (price === 0) return t("freePrice");
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(price);
    } catch {
      return `${price} ${currency}`;
    }
  };
  const balance = walletQ.data?.balance ?? 0;
  const canAfford = balance >= l.price;
  const purchasePending = purchaseMut.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/marketplace">
          <ArrowLeft className="size-4" aria-hidden />
          {t("backToMarketplace")}
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: thumbnail + meta */}
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-lg border border-border/60 bg-muted">
            {l.thumbnailUrl ? (
              <img src={l.thumbnailUrl} alt={l.title} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <Store className="size-12" aria-hidden />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {l.featured && (
              <Badge className="bg-creator/10 text-creator border-creator/30">
                <Star className="me-1 size-3" aria-hidden />
                {t("featuredBadge")}
              </Badge>
            )}
            {l.difficulty && <Badge variant="outline">{l.difficulty}</Badge>}
            {l.licenseType && <Badge variant="outline">{l.licenseType}</Badge>}
            {l.categories.map((c) => (
              <Badge key={c} variant="secondary">{c}</Badge>
            ))}
          </div>
        </div>

        {/* Right: title, description, purchase card */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{l.title}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="size-4" aria-hidden />
              <span>{t("byCreator")}</span>
            </div>
          </div>
          {l.description && (
            <p className="text-sm text-muted-foreground">{l.description}</p>
          )}

          {/* Purchase card */}
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t("price")}</p>
                  <p className="text-2xl font-semibold">{fmtPrice(l.price, l.currency)}</p>
                </div>
                {l.price > 0 && user && (
                  <p className="text-xs text-muted-foreground">
                    {t("balance")}: <span className="font-medium text-foreground">{balance} EDU</span>
                  </p>
                )}
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <Stat icon={Star} label={t("rating")} value={`${l.ratingAverage.toFixed(1)} (${l.ratingCount})`} />
                <Stat icon={Heart} label={t("favorites")} value={String(l.favoriteCount)} />
                <Stat icon={Download} label={t("downloads")} value={String(l.downloadCount)} />
                <Stat icon={Clock} label={t("views")} value={String(l.viewCount)} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!user ? (
              <Button asChild>
                <Link href="/login">{tCommon("signIn")}</Link>
              </Button>
            ) : isOwn ? (
              <Button variant="outline" disabled>
                {t("ownListing")}
              </Button>
            ) : l.price === 0 ? (
              <Button onClick={() => purchaseMut.mutate()} disabled={purchasePending}>
                {purchasePending ? (
                  <><Loader2 className="size-4 animate-spin" aria-hidden /> {t("claiming")}</>
                ) : (
                  <><Download className="size-4" aria-hidden /> {t("claimFree")}</>
                )}
              </Button>
            ) : (
              <PurchaseDialog
                price={l.price}
                currency={l.currency}
                balance={balance}
                canAfford={canAfford}
                pending={purchasePending}
                onConfirm={() => purchaseMut.mutate()}
              />
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => favMut.mutate()}
              disabled={favMut.isPending}
              aria-label={l.isFavorited ? t("unfavorite") : t("favorite")}
              aria-pressed={l.isFavorited}
            >
              <Heart className={`size-4 ${l.isFavorited ? "fill-creator text-creator" : ""}`} aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      <span>{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function PurchaseDialog({
  price,
  currency,
  balance,
  canAfford,
  pending,
  onConfirm,
}: {
  price: number;
  currency: string;
  balance: number;
  canAfford: boolean;
  pending: boolean;
  onConfirm: () => void;
}) {
  const t = useTranslations("marketplace");
  const [open, setOpen] = React.useState(false);
  const fmt = (n: number, c: string) => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: c || "USD" }).format(n); } catch { return `${n} ${c}`; }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ShoppingCart className="size-4" aria-hidden />
          {t("buyNow")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("purchaseDialogTitle")}</DialogTitle>
          <DialogDescription>{t("purchaseDialogBody")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 rounded-md border border-border/60 bg-muted/40 p-3 text-sm">
          <Row label={t("price")} value={fmt(price, currency)} />
          <Row label={t("yourBalance")} value={`${balance} EDU`} />
          <Separator className="my-1" />
          {canAfford ? (
            <Row label={t("afterPurchase")} value={`${balance - price} EDU`} highlight />
          ) : (
            <p className="text-sm text-destructive">{t("insufficientBalance")}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button onClick={() => { onConfirm(); setOpen(false); }} disabled={!canAfford || pending}>
            {pending ? (
              <><Loader2 className="size-4 animate-spin" aria-hidden /> {t("processing")}</>
            ) : (
              <><CheckCircle2 className="size-4" aria-hidden /> {t("confirmPurchase")}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold text-success" : "font-medium"}>{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

// silence unused imports
void Tag;
