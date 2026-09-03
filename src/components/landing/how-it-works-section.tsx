"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Compass,
  BookOpen,
  Swords,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");
  const [activeStep, setActiveStep] = React.useState<number>(1);

  const steps = [
    {
      num: 1,
      title: t("steps.1.title"),
      subtitle: t("steps.1.subtitle"),
      icon: Compass,
      color: "text-blue-500",
      borderColor: "border-blue-500/30",
      bgLight: "bg-blue-500/10",
      description: t("steps.1.description"),
      previewTitle: t("steps.1.previewTitle"),
      previewContent: [
        t("steps.1.item1"),
        t("steps.1.item2"),
        t("steps.1.item3"),
      ],
    },
    {
      num: 2,
      title: t("steps.2.title"),
      subtitle: t("steps.2.subtitle"),
      icon: BookOpen,
      color: "text-emerald-500",
      borderColor: "border-emerald-500/30",
      bgLight: "bg-emerald-500/10",
      description: t("steps.2.description"),
      previewTitle: t("steps.2.previewTitle"),
      previewContent: [
        t("steps.2.item1"),
        t("steps.2.item2"),
        t("steps.2.item3"),
      ],
    },
    {
      num: 3,
      title: t("steps.3.title"),
      subtitle: t("steps.3.subtitle"),
      icon: Swords,
      color: "text-amber-500",
      borderColor: "border-amber-500/30",
      bgLight: "bg-amber-500/10",
      description: t("steps.3.description"),
      previewTitle: t("steps.3.previewTitle"),
      previewContent: [
        t("steps.3.item1"),
        t("steps.3.item2"),
        t("steps.3.item3"),
      ],
    },
    {
      num: 4,
      title: t("steps.4.title"),
      subtitle: t("steps.4.subtitle"),
      icon: TrendingUp,
      color: "text-violet-500",
      borderColor: "border-violet-500/30",
      bgLight: "bg-violet-500/10",
      description: t("steps.4.description"),
      previewTitle: t("steps.4.previewTitle"),
      previewContent: [
        t("steps.4.item1"),
        t("steps.4.item2"),
        t("steps.4.item3"),
      ],
    },
  ];

  const current = steps.find((s) => s.num === activeStep) || steps[0];
  const CurrentIcon = current.icon;

  return (
    <section className="py-16 md:py-24 border-b border-border/60" id="how-it-works-section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
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

        {/* 4-Step Interactive Horizontal / Grid Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Step Selector List */}
          <div className="lg:col-span-6 space-y-3">
            {steps.map((step) => {
              const Icon = step.icon;
              const isSelected = activeStep === step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setActiveStep(step.num)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-card shadow-sm"
                      : "border-border/60 bg-card/40 hover:bg-card hover:border-border"
                  }`}
                  id={`step-card-${step.num}`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border font-bold text-sm ${step.bgLight} ${step.borderColor} ${step.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground">{step.title}</h3>
                      <span className="text-xs text-muted-foreground font-medium">{step.subtitle}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-normal">
                      {step.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step Live Visual Card Preview */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-md space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${current.bgLight}`}>
                    <CurrentIcon className={`h-6 w-6 ${current.color}`} />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      {t("stage", { num: current?.num ?? 1 })}
                    </span>
                    <h4 className="text-lg font-bold text-foreground">{current.previewTitle}</h4>
                  </div>
                </div>
              </div>

              {/* Simulated stage card content */}
              <div className="space-y-3">
                {current.previewContent.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-muted/40 text-xs sm:text-sm font-medium text-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Dynamic Next Step Trigger */}
              <div className="pt-4 border-t border-border/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>{t("realtimeLoop")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => (prev % 4) + 1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span>{t("seeNext", { next: activeStep < 4 ? `0${activeStep + 1}` : "01" })}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
