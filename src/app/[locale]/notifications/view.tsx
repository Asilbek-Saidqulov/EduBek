/**
 * Notifications inbox page.
 *
 * GET /api/notifications/inbox?limit=&offset=&status=&category=
 * PUT /api/notifications/inbox  body: { action: "read" | "archive" | "dismiss" | "pin" | "delete" | "markAllRead" | "clear", itemId? }
 *
 * Caveat: in-memory store — items don't survive server restart.
 */
"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Archive,
  Bell,
  CheckCheck,
  Delete,
  Inbox as InboxIcon,
  Pin,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/edubek/empty-state";

interface InboxItem {
  id: string;
  userId: string;
  notificationId: string;
  registryKey: string;
  title: string;
  body: string;
  summary: string | null;
  category: string;
  priority: string;
  iconKey: string | null;
  deepLink: string | null;
  status: string;
  deliveredAt: string;
  readAt: string | null;
  pinnedAt: string | null;
}
interface InboxResult {
  items: InboxItem[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
  summary: { total: number; unread: number; read: number; archived: number; pinned: number; dismissed: number };
  statuses: string[];
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive",
  high: "bg-warning/10 text-warning",
  medium: "bg-ai/10 text-ai",
  low: "bg-muted text-muted-foreground",
  informational: "bg-muted text-muted-foreground",
};

export function NotificationsView() {
  const t = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const qc = useQueryClient();

  const [status, setStatus] = React.useState<string>("");
  const q = useQuery<InboxResult>({
    queryKey: ["notifications", "inbox", status],
    queryFn: () => api.get<InboxResult>(`/api/notifications/inbox?limit=50&offset=0${status ? `&status=${status}` : ""}`),
    staleTime: 15_000,
  });

  const actionMut = useMutation({
    mutationFn: (vars: { action: string; itemId?: string }) =>
      api.put<{ item: InboxItem | null; updated?: number; deleted?: number }>(`/api/notifications/inbox`, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "inbox"] }),
    onError: () => toast({ title: tCommon("error"), variant: "destructive" }),
  });

  const items = q.data?.items ?? [];
  const summary = q.data?.summary;
  const filters = [
    { value: "", label: tCommon("all") },
    { value: "unread", label: t("unread") },
    { value: "read", label: t("read") },
    { value: "pinned", label: t("pinned") },
    { value: "archived", label: t("archived") },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {summary && summary.unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => actionMut.mutate({ action: "markAllRead" })}
            disabled={actionMut.isPending}
          >
            <CheckCheck className="size-4" aria-hidden />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <StatCard label={t("total")} value={summary.total} />
          <StatCard label={t("unread")} value={summary.unread} highlight />
          <StatCard label={t("read")} value={summary.read} />
          <StatCard label={t("pinned")} value={summary.pinned} />
          <StatCard label={t("archived")} value={summary.archived} />
          <StatCard label={t("dismissed")} value={summary.dismissed} />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            aria-pressed={status === f.value}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              status === f.value ? "bg-teacher/10 text-teacher" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={InboxIcon} title={t("empty")} description={t("emptyDesc")} />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const unread = item.status === "unread";
            const pinned = item.status === "pinned";
            return (
              <Card
                key={item.id}
                className={`border-border/60 p-3 transition-colors ${unread ? "bg-teacher/5" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-ai/10 text-ai">
                    <Sparkles className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      {pinned && (
                        <Pin className="size-3 text-creator" aria-hidden />
                      )}
                      <p className={`text-sm ${unread ? "font-semibold" : "font-medium"}`}>
                        {item.title}
                      </p>
                      {unread && (
                        <Badge className="bg-teacher/20 text-teacher text-[10px]">{t("unread")}</Badge>
                      )}
                      <Badge className={`text-[10px] ${PRIORITY_COLOR[item.priority] ?? ""}`}>
                        {item.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] uppercase">{item.category}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(item.deliveredAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {unread && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => actionMut.mutate({ action: "read", itemId: item.id })}
                        disabled={actionMut.isPending}
                        aria-label={t("markRead")}
                      >
                        <CheckCheck className="size-4" aria-hidden />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => actionMut.mutate({ action: pinned ? "unpin" : "pin", itemId: item.id })}
                      disabled={actionMut.isPending}
                      aria-label={t("pin")}
                    >
                      <Pin className="size-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => actionMut.mutate({ action: "archive", itemId: item.id })}
                      disabled={actionMut.isPending}
                      aria-label={t("archive")}
                    >
                      <Archive className="size-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => actionMut.mutate({ action: "delete", itemId: item.id })}
                      disabled={actionMut.isPending}
                      aria-label={t("delete")}
                    >
                      <Delete className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={`border-border/60 p-3 text-center ${highlight ? "bg-teacher/5" : ""}`}>
      <p className={`text-2xl font-semibold ${highlight ? "text-teacher" : ""}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </Card>
  );
}

// silence unused import
void Bell;
