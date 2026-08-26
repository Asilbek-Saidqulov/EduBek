"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  Zap,
  Globe2,
  Lock,
  Cpu,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PlatformTruthSection() {
  const t = useTranslations("landing.platformTruth");

  const highlights = [
    {
      icon: Zap,
      title: t("highlights.sync.title"),
      color: "text-amber-500",
      description: t("highlights.sync.description"),
    },
    {
      icon: Globe2,
      title: t("highlights.multilingual.title"),
      color: "text-blue-500",
      description: t("highlights.multilingual.description"),
    },
    {
      icon: Cpu,
      title: t("highlights.ai.title"),
      color: "text-violet-500",
      description: t("highlights.ai.description"),
    },
    {
      icon: ShieldCheck,
      title: t("highlights.verified.title"),
      color: "text-emerald-500",
      description: t("highlights.verified.description"),
    },
    {
      icon: Lock,
      title: t("highlights.privacy.title"),
      color: "text-rose-500",
      description: t("highlights.privacy.description"),
    },
    {
      icon: Layers,
      title: t("highlights.accessible.title"),
      color: "text-cyan-500",
      description: t("highlights.accessible.description"),
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/20 border-b border-border/60" id="platform-architecture-section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20 bg-primary/5">
            {t("badge")}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            {t("title")}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl border border-border bg-card shadow-xs hover:border-primary/40 transition-all space-y-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted border border-border/70">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
