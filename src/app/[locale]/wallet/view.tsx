/**
 * Wallet page — balance + transaction history.
 *
 * GET /api/wallet/balance → { balance: number }
 * GET /api/wallet/history?limit=20&offset=N → { entries: LedgerEntryDto[], total: number }
 *
 * Transfer is hidden (the backend route is broken — see audit).
 */
"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Download,
  Gift,
  RotateCcw,
  ShoppingCart,
  Wallet as WalletIcon,
  type LucideIcon,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/edubek/empty-state";
import { useCurrentUser } from "@/hooks/use-current-user";

interface LedgerEntryDto {
  id: string;
  walletId: string;
  delta: number;            // signed
  balanceAfter: number;
  reason: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

interface BalanceDto { balance: number }
interface HistoryDto { entries: LedgerEntryDto[]; total: number }

const PAGE_SIZE = 10;

const REASON_ICON: Record<string, LucideIcon> = {
  marketplace_purchase: ShoppingCart,
  marketplace_sale: Coins,
  platform_fee: Coins,
  refund: RotateCcw,
  Live_quiz_reward: Gift,
  transfer_in: ArrowDownLeft,
  transfer_out: ArrowUpRight,
  default: Coins,
};

export function WalletView() {
  const t = useTranslations("wallet");
  const tCommon = useTranslations("common");
  const { user } = useCurrentUser();
  const [page, setPage] = React.useState(0);

  const balanceQ = useQuery<BalanceDto>({
    queryKey: ["wallet", "balance"],
    queryFn: () => api.get<BalanceDto>("/api/wallet/balance"),
    enabled: !!user,
    staleTime: 30_000,
  });
  const historyQ = useQuery<HistoryDto>({
    queryKey: ["wallet", "history", page],
    queryFn: () => api.get<HistoryDto>(`/api/wallet/history?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`),
    enabled: !!user,
    staleTime: 30_000,
  });

  if (!user) {
    return (
      <EmptyState
        icon={WalletIcon}
        title={t("signInRequired")}
        description={t("signInRequiredDesc")}
        action={
          <Button asChild>
            <Link href="/login">{tCommon("signIn")}</Link>
          </Button>
        }
      />
    );
  }

  const balance = balanceQ.data?.balance ?? 0;
  const entries = historyQ.data?.entries ?? [];
  const total = historyQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Balance card */}
      <Card className="overflow-hidden border-border/60">
        <div className="h-1.5 w-full bg-gradient-to-r from-teacher via-ai to-creator" />
        <CardHeader>
          <CardDescription>{t("balanceLabel")}</CardDescription>
          <CardTitle className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{balance.toLocaleString()}</span>
            <span className="text-base font-normal text-muted-foreground">EDU</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{t("balanceHint")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/marketplace">
                <ShoppingCart className="size-4" aria-hidden />
                {t("spendInMarketplace")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/live-quiz">
                <Gift className="size-4" aria-hidden />
                {t("earnFromQuiz")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction history */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {t("history")}
          </h2>
          <span className="text-xs text-muted-foreground">
            {t("historyCount", { count: total })}
          </span>
        </div>

        {historyQ.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="mt-1 h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </Card>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Coins}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={
              <Button asChild>
                <Link href="/marketplace">{t("spendInMarketplace")}</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const positive = entry.delta >= 0;
              const Icon = REASON_ICON[entry.reason] ?? REASON_ICON.default;
              return (
                <Card key={entry.id} className="border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${
                          positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium capitalize">
                          {entry.reason.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                          {entry.referenceType && ` · ${entry.referenceType}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className={`text-sm font-semibold ${positive ? "text-success" : "text-destructive"}`}>
                        {positive ? "+" : ""}{entry.delta}
                        <span className="ms-1 text-xs font-normal text-muted-foreground">EDU</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("balanceAfter")}: {entry.balanceAfter}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  {tCommon("previous")}
                </Button>
                <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  {tCommon("next")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// silence unused import
void Download;
