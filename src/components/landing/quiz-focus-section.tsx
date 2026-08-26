"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Swords,
  ShieldAlert,
  Coins,
  Castle,
  Timer,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function QuizFocusSection() {
  const t = useTranslations("landing.quizFocus");
  const [activeMode, setActiveMode] = React.useState<"classic" | "royale" | "heist" | "empire">("royale");

  const modes = [
    {
      id: "classic",
      name: t("modes.classic.name"),
      icon: Timer,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
      description: t("modes.classic.description"),
      tag: t("modes.classic.tag"),
    },
    {
      id: "royale",
      name: t("modes.royale.name"),
      icon: ShieldAlert,
      color: "text-rose-500",
      bg: "bg-rose-500/10 border-rose-500/20",
      description: t("modes.royale.description"),
      tag: t("modes.royale.tag"),
    },
    {
      id: "heist",
      name: t("modes.heist.name"),
      icon: Coins,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
      description: t("modes.heist.description"),
      tag: t("modes.heist.tag"),
    },
    {
      id: "empire",
      name: t("modes.empire.name"),
      icon: Castle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      description: t("modes.empire.description"),
      tag: t("modes.empire.tag"),
    },
  ];

  return (
    <section className="py-16 md:py-24 border-b border-border/60" id="quiz-focus-section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Focused Value Narrative */}
          <div className="lg:col-span-6 space-y-6">
            <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs font-semibold text-primary border-primary/20 bg-primary/5">
              <Swords className="h-3.5 w-3.5" />
              <span>{t("badge")}</span>
            </Badge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] text-balance">
              {t("title")}
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
              {t("subtitle")}
            </p>

            {/* 4 Distinct Game Mode Selector */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("modesHeader")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modes.map((m) => {
                  const Icon = m.icon;
                  const isSelected = activeMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveMode(m.id as any)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-card shadow-sm"
                          : "border-border/60 bg-card/40 hover:bg-card hover:border-border"
                      }`}
                      id={`quiz-mode-${m.id}`}
                    >
                      <div className={`p-2 rounded-lg border ${m.bg}`}>
                        <Icon className={`h-4 w-4 ${m.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground">{m.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {m.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {m.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button size="lg" asChild className="gap-2 shadow-xs">
                <Link href="/live-quiz">
                  <span>{t("cta")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Mistake Diagnosis & Arena Feedback UI Preview */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-lg space-y-5">
              
              {/* Top status bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border/80 text-xs">
                <div className="flex items-center gap-2">
                  <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-mono text-[11px]">
                    {t("shieldStatus")}
                  </Badge>
                  <span className="text-muted-foreground">{t("roundStatus")}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-amber-500">
                  <Flame className="h-3.5 w-3.5 fill-amber-500" />
                  <span>{t("comboStatus")}</span>
                </div>
              </div>

              {/* Sample mistake card */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-500">
                  <XCircle className="h-4 w-4" />
                  <span>{t("reviewingMistake")}</span>
                </div>

                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 text-xs space-y-2">
                  <p className="font-semibold text-foreground">
                    &quot;{t("sampleQuestion")}&quot;
                  </p>
                  
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                      <span>{t("yourAnswer")}</span>
                      <span className="text-[10px] font-mono uppercase">{t("incorrectBadge")}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                      <span>{t("correctAnswer")}</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                  </div>
                </div>

                {/* AI Automated Remedial Analysis */}
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-primary font-semibold text-[11px]">
                    <Sparkles className="h-3 w-3" />
                    <span>{t("remedialBreakdown")}</span>
                  </div>
                  <p className="text-foreground/90 text-[11px] leading-relaxed">
                    {t("remedialText")}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-medium text-primary">
                    <span>{t("addedToTargeted")}</span>
                    <span className="font-mono">{t("drillAdded")}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
