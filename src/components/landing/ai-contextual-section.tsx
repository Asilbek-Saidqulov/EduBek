"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  HelpCircle,
  FileText,
  Swords,
  RefreshCw,
  ArrowRight,
  Check,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AiContextualSection() {
  const t = useTranslations("landing.aiContextual");
  const [activeAction, setActiveAction] = React.useState<"explain" | "quiz" | "summarize" | "mistake">("explain");

  const actions = {
    explain: {
      title: t("actions.explain.title"),
      inputPrompt: t("actions.explain.inputPrompt"),
      output: t("actions.explain.output"),
      badge: t("actions.explain.badge"),
    },
    quiz: {
      title: t("actions.quiz.title"),
      inputPrompt: t("actions.quiz.inputPrompt"),
      output: t("actions.quiz.output"),
      badge: t("actions.quiz.badge"),
    },
    summarize: {
      title: t("actions.summarize.title"),
      inputPrompt: t("actions.summarize.inputPrompt"),
      output: t("actions.summarize.output"),
      badge: t("actions.summarize.badge"),
    },
    mistake: {
      title: t("actions.mistake.title"),
      inputPrompt: t("actions.mistake.inputPrompt"),
      output: t("actions.mistake.output"),
      badge: t("actions.mistake.badge"),
    },
  };

  const current = actions[activeAction];

  return (
    <section className="py-16 md:py-24 border-b border-border/60" id="ai-contextual-section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Narrative */}
          <div className="lg:col-span-6 space-y-6">
            <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs font-semibold text-primary border-primary/20 bg-primary/5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t("badge")}</span>
            </Badge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] text-balance">
              {t("title")}
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
              {t("subtitle")}
            </p>

            {/* Feature Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveAction("explain")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                  activeAction === "explain"
                    ? "border-primary bg-primary/5 text-foreground font-semibold shadow-xs"
                    : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                }`}
                id="ai-action-explain"
              >
                <HelpCircle className="h-4 w-4 text-violet-500 shrink-0" />
                <span>{t("btnExplain")}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction("quiz")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                  activeAction === "quiz"
                    ? "border-primary bg-primary/5 text-foreground font-semibold shadow-xs"
                    : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                }`}
                id="ai-action-quiz"
              >
                <Swords className="h-4 w-4 text-amber-500 shrink-0" />
                <span>{t("btnQuiz")}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction("summarize")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                  activeAction === "summarize"
                    ? "border-primary bg-primary/5 text-foreground font-semibold shadow-xs"
                    : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                }`}
                id="ai-action-summarize"
              >
                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                <span>{t("btnSummarize")}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction("mistake")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                  activeAction === "mistake"
                    ? "border-primary bg-primary/5 text-foreground font-semibold shadow-xs"
                    : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                }`}
                id="ai-action-mistake"
              >
                <RefreshCw className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{t("btnMistake")}</span>
              </button>
            </div>

            <div className="pt-2">
              <Button size="lg" asChild className="gap-2">
                <Link href="/ai-workspace">
                  <span>{t("cta")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Live Contextual AI Assistant UI Card */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-lg space-y-4">
              
              <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{current.title}</h4>
                    <span className="text-[11px] text-muted-foreground">{t("poweredBy")}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {current.badge}
                </Badge>
              </div>

              {/* Input Context preview */}
              <div className="p-3 rounded-xl border border-border/70 bg-muted/40 text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">{t("userContextLabel")}</span>
                <p className="font-medium text-foreground">{current.inputPrompt}</p>
              </div>

              {/* Output Response */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs space-y-2">
                <div className="flex items-center justify-between text-primary font-semibold text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    <span>{t("tutorResponseLabel")}</span>
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{t("responseTime")}</span>
                </div>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                  {current.output}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="h-3.5 w-3.5" />
                  <span>{t("integratedNotes")}</span>
                </span>
                <Link href="/ai-workspace" className="text-primary font-semibold hover:underline">
                  {t("tryOwnMaterials")}
                </Link>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
