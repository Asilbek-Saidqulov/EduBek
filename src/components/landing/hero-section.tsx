"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Sparkles,
  Gamepad2,
  CheckCircle2,
  Brain,
  Layers,
  Flame,
  Search,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function HeroSection() {
  const t = useTranslations("landing.hero");
  const router = useRouter();
  const [pin, setPin] = React.useState("");
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [isAnswered, setIsAnswered] = React.useState(false);

  const sampleQuestion = {
    subject: t("sampleSubject"),
    question: t("sampleQuestion"),
    options: [
      { id: 0, text: t("sampleOption0"), correct: false },
      { id: 1, text: t("sampleOption1"), correct: true },
      { id: 2, text: t("sampleOption2"), correct: false },
      { id: 3, text: t("sampleOption3"), correct: false },
    ],
    explanation: t("aiExplanation"),
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim()) {
      router.push(`/live-quiz?pin=${encodeURIComponent(pin.trim().toUpperCase())}`);
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/60" id="hero-section">
      {/* Background subtle structural grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Clear, Non-Generic Product Story */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">
            
            {/* Context pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>{t("pill")}</span>
            </div>

            {/* Core Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] text-balance">
              {t("titlePart1")} <br className="hidden sm:inline" />
              <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">
                {t("titleConnects")}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl text-balance">
              {t("subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto pt-2">
              <Button size="lg" asChild className="h-12 px-6 font-semibold shadow-sm gap-2" id="hero-cta-primary">
                <Link href="/register">
                  <span>{t("getStarted")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-6 font-medium" id="hero-cta-secondary">
                <Link href="/discover">
                  <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{t("exploreDiscover")}</span>
                </Link>
              </Button>
            </div>

            {/* Quick Live PIN Join box for students in class */}
            <div className="w-full max-w-md pt-3 border-t border-border/80">
              <form onSubmit={handlePinSubmit} className="flex items-center gap-2" id="hero-pin-form">
                <div className="relative flex-1">
                  <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.toUpperCase())}
                    placeholder={t("pinPlaceholder")}
                    maxLength={10}
                    className="pl-9 font-mono uppercase text-xs sm:text-sm tracking-wider h-10 bg-background"
                    id="hero-pin-input"
                  />
                </div>
                <Button type="submit" variant="secondary" size="sm" className="h-10 px-4 font-medium" disabled={!pin.trim()} id="hero-pin-submit">
                  {t("joinLive")}
                </Button>
              </form>
            </div>

            {/* Micro value badges */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {t("badgeModes")}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {t("badgeAi")}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {t("badgeMarketplace")}
              </span>
            </div>

          </div>

          {/* Right Column: High-Craft Live Product Composition */}
          <div className="lg:col-span-6 relative">
            
            {/* Outer window frame container */}
            <div className="rounded-2xl border border-border/90 bg-card p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
              
              {/* Window header simulation */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">{t("practiceUrl")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    <Flame className="h-3 w-3 text-amber-500" />
                    <span>{t("streak")}</span>
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {t("score")}
                  </Badge>
                </div>
              </div>

              {/* Live Interactive Quiz Sample */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5 text-primary">
                    <BookOpen className="h-3.5 w-3.5" />
                    {sampleQuestion.subject}
                  </span>
                  <span className="font-mono text-muted-foreground">Q 4/10</span>
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug">
                  {sampleQuestion.question}
                </h3>

                {/* Option grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {sampleQuestion.options.map((opt) => {
                    const isSelected = selectedAnswer === opt.id;
                    let stateClasses = "border-border/80 hover:border-primary/50 hover:bg-muted/40";
                    if (isAnswered) {
                      if (opt.correct) {
                        stateClasses = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold";
                      } else if (isSelected && !opt.correct) {
                        stateClasses = "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300";
                      } else {
                        stateClasses = "opacity-60 border-border/40";
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm text-left transition-all duration-150 ${stateClasses}`}
                        id={`hero-opt-${opt.id}`}
                      >
                        <span>{opt.text}</span>
                        {isAnswered && opt.correct && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Contextual AI Feedback Block (appears on click or shown as live preview) */}
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{t("aiExplanationTitle")}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{t("aiModel")}</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {sampleQuestion.explanation}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href="/ai-workspace"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      <span>{t("askAiTutor")}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Bottom connected ecosystem nodes preview */}
                <div className="pt-3 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{t("connectedSyllabus")} <strong>{t("syllabusName")}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <Brain className="h-3.5 w-3.5" />
                    <span>{t("xpBonus")}</span>
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
