"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Compass,
  GraduationCap,
  Swords,
  Sparkles,
  PenTool,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  Workflow,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EcosystemSection() {
  const t = useTranslations("landing.ecosystem");
  const [activePillar, setActivePillar] = React.useState<string>("discover");

  const pillars = [
    {
      id: "discover",
      title: t("discover.title"),
      badge: t("discover.badge"),
      icon: Compass,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      accentBorder: "border-blue-500",
      tagline: t("discover.tagline"),
      description: t("discover.description"),
      link: "/discover",
      linkText: t("discover.cta"),
      connectedTo: ["practice", "learn", "ai"],
    },
    {
      id: "practice",
      title: t("practice.title"),
      badge: t("practice.badge"),
      icon: Swords,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      accentBorder: "border-amber-500",
      tagline: t("practice.tagline"),
      description: t("practice.description"),
      link: "/live-quiz",
      linkText: t("practice.cta"),
      connectedTo: ["ai", "learn"],
    },
    {
      id: "ai",
      title: t("ai.title"),
      badge: t("ai.badge"),
      icon: Sparkles,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10 border-violet-500/20",
      accentBorder: "border-violet-500",
      tagline: t("ai.tagline"),
      description: t("ai.description"),
      link: "/ai-workspace",
      linkText: t("ai.cta"),
      connectedTo: ["create", "practice"],
    },
    {
      id: "learn",
      title: t("learn.title"),
      badge: t("learn.badge"),
      icon: GraduationCap,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      accentBorder: "border-emerald-500",
      tagline: t("learn.tagline"),
      description: t("learn.description"),
      link: "/dashboard",
      linkText: t("learn.cta"),
      connectedTo: ["discover", "create"],
    },
    {
      id: "create",
      title: t("create.title"),
      badge: t("create.badge"),
      icon: PenTool,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10 border-rose-500/20",
      accentBorder: "border-rose-500",
      tagline: t("create.tagline"),
      description: t("create.description"),
      link: "/classrooms",
      linkText: t("create.cta"),
      connectedTo: ["marketplace", "practice"],
    },
    {
      id: "marketplace",
      title: t("marketplace.title"),
      badge: t("marketplace.badge"),
      icon: ShoppingBag,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10 border-cyan-500/20",
      accentBorder: "border-cyan-500",
      tagline: t("marketplace.tagline"),
      description: t("marketplace.description"),
      link: "/marketplace",
      linkText: t("marketplace.cta"),
      connectedTo: ["discover", "create"],
    },
  ];

  const current = pillars.find((p) => p.id === activePillar) || pillars[0];
  const CurrentIcon = current.icon;

  return (
    <section className="py-16 md:py-24 bg-muted/20 border-b border-border/60" id="ecosystem-section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto mb-12">
          <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs font-semibold text-primary border-primary/20 bg-primary/5">
            <Workflow className="h-3.5 w-3.5" />
            <span>{t("badge")}</span>
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            {t("title")}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
            {t("subtitle")}
          </p>
        </div>

        {/* Interactive Ecosystem Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: 6 Core Pillars Selectable List */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = activePillar === pillar.id;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setActivePillar(pillar.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                    isActive
                      ? "border-primary bg-card shadow-md scale-[1.01]"
                      : "border-border/70 bg-card/60 hover:bg-card hover:border-border"
                  }`}
                  id={`pillar-tab-${pillar.id}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${pillar.bgColor}`}>
                    <Icon className={`h-5 w-5 ${pillar.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-foreground">{pillar.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {pillar.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {pillar.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Focused Live Deep-Dive Panel showing Connections */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-md relative overflow-hidden">
              
              {/* Pillar Title & Icon */}
              <div className="flex items-center justify-between pb-6 border-b border-border/80">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${current.bgColor}`}>
                    <CurrentIcon className={`h-6 w-6 ${current.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">{current.title}</h3>
                    <p className="text-xs text-muted-foreground">{current.tagline}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {current.badge}
                </Badge>
              </div>

              {/* Detailed Description */}
              <div className="py-6 space-y-4">
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                  {current.description}
                </p>

                {/* Connection Map */}
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4 space-y-2.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    <span>{t("connectsInside")}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {current.connectedTo.map((connId) => {
                      const target = pillars.find((p) => p.id === connId);
                      if (!target) return null;
                      return (
                        <div
                          key={connId}
                          className="flex items-center gap-1.5 text-xs rounded-lg border border-border bg-background px-3 py-1.5 font-medium text-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span>{t("feedsInto")} <strong>{target.title}</strong></span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Direct CTA to that feature */}
              <div className="pt-4 border-t border-border/80 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("readyToExplore")}</span>
                <Button size="sm" asChild className="gap-2">
                  <Link href={current.link}>
                    <span>{current.linkText}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
