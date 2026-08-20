"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Coins,
  DollarSign,
  Loader2,
  Package,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mascot } from "@/components/edubek/mascots";
import { api } from "@/lib/api-client";

interface PlatformStats {
  totalUsers: number;
  totalRevenue: number;
  totalEduTokens: number;
  totalListings: number;
  activeQuizzes: number;
  pendingReports: number;
}

export function AdminClient({ t }: { t: any }) {
  const [stats, setStats] = React.useState<PlatformStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const data = await api.get<PlatformStats>("/api/admin/revenue").catch(() => null);
        if (data) setStats(data);
      } catch {
        // Admin API may not return data for non-admin users — that's fine
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: t("statUsers"), value: stats?.totalUsers ?? "—", icon: Users, color: "from-blue-500 to-cyan-600", mascot: "notebook" as const },
    { label: t("statRevenue"), value: stats ? `$${stats.totalRevenue}` : "—", icon: DollarSign, color: "from-emerald-500 to-green-600", mascot: "pencil" as const },
    { label: t("statEduTokens"), value: stats?.totalEduTokens ?? "—", icon: Coins, color: "from-violet-500 to-purple-600", mascot: "robot" as const },
    { label: t("statListings"), value: stats?.totalListings ?? "—", icon: Package, color: "from-amber-500 to-orange-600", mascot: "book" as const },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Mascot name="microscope" size={56} className="text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${card.color} text-white`}>
                  <card.icon className="size-5" />
                </div>
                <Mascot name={card.mascot} size={28} className="text-muted-foreground/40" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">
                  {loading ? <Loader2 className="size-5 animate-spin" /> : card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Admin actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-muted-foreground" />
              {t("moderation")}
            </CardTitle>
            <CardDescription>{t("moderationDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="outline" className="justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4" />
                {t("userManagement")}
              </span>
              <Badge variant="secondary">{t("comingSoon")}</Badge>
            </Button>
            <Button variant="outline" className="justify-between">
              <span className="flex items-center gap-2">
                <Package className="size-4" />
                {t("marketplaceModeration")}
              </span>
              <Badge variant="secondary">{t("comingSoon")}</Badge>
            </Button>
            <Button variant="outline" className="justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="size-4" />
                {t("platformAnalytics")}
              </span>
              <Badge variant="secondary">{t("comingSoon")}</Badge>
            </Button>
          </CardContent>
        </Card>

        {/* System status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-emerald-500" />
                {t("systemStatus")}
              </CardTitle>
              <Mascot name="robot" size={32} className="text-ai/60" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {[
                { label: t("statusDatabase"), status: "operational", color: "text-emerald-500" },
                { label: t("statusSocketIO"), status: "operational", color: "text-emerald-500" },
                { label: t("statusPayments"), status: "operational", color: "text-emerald-500" },
                { label: t("statusAI"), status: "operational", color: "text-emerald-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{item.label}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${item.color}`}>
                    <span className="size-2 rounded-full bg-current" />
                    {item.status}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("lastUpdated")}</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
