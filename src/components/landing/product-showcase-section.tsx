"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Compass,
  Swords,
  Sparkles,
  School,
  ShoppingBag,
  ArrowRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Award,
  Users,
  BarChart3,
  Star,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProductShowcaseSection() {
  const t = useTranslations("landing.showcase");
  const [activeTab, setActiveTab] = React.useState<"quiz" | "discover" | "ai" | "teacher" | "marketplace">("quiz");

  return (
    <section className="py-16 md:py-24 bg-muted/30 border-b border-border/60" id="product-showcase-section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
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

        {/* Tab Selection Row */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border border-border bg-card shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === "quiz"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              id="showcase-tab-quiz"
            >
              <Swords className="h-4 w-4" />
              <span>{t("tabs.quiz")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("discover")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === "discover"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              id="showcase-tab-discover"
            >
              <Compass className="h-4 w-4" />
              <span>{t("tabs.discover")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === "ai"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              id="showcase-tab-ai"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t("tabs.ai")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("teacher")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === "teacher"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              id="showcase-tab-teacher"
            >
              <School className="h-4 w-4" />
              <span>{t("tabs.teacher")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("marketplace")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === "marketplace"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              id="showcase-tab-marketplace"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{t("tabs.marketplace")}</span>
            </button>
          </div>
        </div>

        {/* Live Active Showcase Window */}
        <div className="rounded-2xl border border-border/90 bg-card shadow-lg overflow-hidden">
          
          {/* Top simulated app header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-muted/40 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="ml-3 font-mono text-[11px]">edubek.app/{activeTab}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] hidden sm:inline">{t("activeSession")}</span>
              <Button size="sm" variant="ghost" asChild className="h-7 text-xs px-2.5 font-medium">
                <Link href={`/${activeTab === "teacher" ? "classrooms" : activeTab === "ai" ? "ai-workspace" : activeTab === "quiz" ? "live-quiz" : activeTab}`}>
                  <span>{t("openScreen")}</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Dynamic Content Panel */}
          <div className="p-6 sm:p-8">
            
            {/* 1. QUIZ ARENA VIEW */}
            {activeTab === "quiz" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                        {t("quiz.badge")}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{t("quiz.pin")}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mt-1">{t("quiz.title")}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                      <Flame className="h-4 w-4" />
                      <span>{t("quiz.streak")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                      <Clock className="h-4 w-4" />
                      <span>{t("quiz.timeLeft")}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 rounded-xl border border-border/80 bg-background/60 space-y-4">
                  <span className="text-xs text-primary font-semibold">{t("quiz.questionCount")}</span>
                  <p className="text-base sm:text-lg font-medium text-foreground">
                    {t("quiz.question")}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-border/70 bg-card text-xs sm:text-sm font-medium flex items-center justify-between">
                      <span>{t("quiz.optA")}</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs sm:text-sm flex items-center justify-between">
                      <span>{t("quiz.optB")}</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/70 bg-card text-xs sm:text-sm font-medium flex items-center justify-between">
                      <span>{t("quiz.optC")}</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/70 bg-card text-xs sm:text-sm font-medium flex items-center justify-between">
                      <span>{t("quiz.optD")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span>{t("quiz.reward")}</span>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/live-quiz">{t("quiz.cta")}</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* 2. DISCOVER VIEW */}
            {activeTab === "discover" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{t("discover.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("discover.subtitle")}</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      readOnly
                      value={t("discover.searchPlaceholder")}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{t("discover.card1Badge")}</Badge>
                      <span className="text-[11px] text-muted-foreground">{t("discover.card1Quizzes")}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">{t("discover.card1Title")}</h4>
                    <p className="text-xs text-muted-foreground">{t("discover.card1Desc")}</p>
                    <div className="pt-2 text-xs font-semibold text-primary">{t("discover.card1Cta")}</div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{t("discover.card2Badge")}</Badge>
                      <span className="text-[11px] text-muted-foreground">{t("discover.card2Quizzes")}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">{t("discover.card2Title")}</h4>
                    <p className="text-xs text-muted-foreground">{t("discover.card2Desc")}</p>
                    <div className="pt-2 text-xs font-semibold text-primary">{t("discover.card2Cta")}</div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{t("discover.card3Badge")}</Badge>
                      <span className="text-[11px] text-muted-foreground">{t("discover.card3Quizzes")}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">{t("discover.card3Title")}</h4>
                    <p className="text-xs text-muted-foreground">{t("discover.card3Desc")}</p>
                    <div className="pt-2 text-xs font-semibold text-primary">{t("discover.card3Cta")}</div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" asChild>
                    <Link href="/discover">{t("discover.cta")}</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* 3. AI WORKSPACE VIEW */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{t("ai.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("ai.subtitle")}</p>
                  </div>
                  <Badge variant="secondary" className="gap-1 text-xs font-mono">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>{t("ai.modelBadge")}</span>
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/40 flex items-start gap-3 text-xs">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary font-bold text-[10px]">{t("ai.you")}</div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{t("ai.userQuery")}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{t("ai.tutorLabel")}</span>
                    </div>
                    <p className="text-foreground/90 leading-relaxed">
                      {t("ai.tutorResponse")}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="px-2.5 py-1 rounded-lg border border-primary/30 bg-background text-[11px] font-medium text-primary">
                        {t("ai.chip1")}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg border border-primary/30 bg-background text-[11px] font-medium text-primary">
                        {t("ai.chip2")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" asChild>
                    <Link href="/ai-workspace">{t("ai.cta")}</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* 4. TEACHER WORKSPACE VIEW */}
            {activeTab === "teacher" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{t("teacher.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("teacher.subtitle")}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{t("teacher.classBadge")}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{t("teacher.stat1Label")}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{t("teacher.stat1Value")}</p>
                    <span className="text-[11px] text-emerald-500 font-medium">{t("teacher.stat1Note")}</span>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BarChart3 className="h-4 w-4 text-emerald-500" />
                      <span>{t("teacher.stat2Label")}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{t("teacher.stat2Value")}</p>
                    <span className="text-[11px] text-emerald-500 font-medium">{t("teacher.stat2Note")}</span>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <XCircle className="h-4 w-4 text-rose-500" />
                      <span>{t("teacher.stat3Label")}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground truncate">{t("teacher.stat3Value")}</p>
                    <span className="text-[11px] text-rose-500 font-medium">{t("teacher.stat3Note")}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" asChild>
                    <Link href="/classrooms">{t("teacher.cta")}</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* 5. MARKETPLACE VIEW */}
            {activeTab === "marketplace" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{t("marketplace.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("marketplace.subtitle")}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{t("marketplace.badge")}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary">{t("marketplace.pack1Category")}</span>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        <span>{t("marketplace.pack1Rating")}</span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">{t("marketplace.pack1Title")}</h4>
                    <p className="text-xs text-muted-foreground">{t("marketplace.pack1Desc")}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-mono text-sm font-bold text-foreground">{t("marketplace.pack1Price")}</span>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" asChild>
                        <Link href="/marketplace">
                          <Download className="h-3 w-3" />
                          <span>{t("marketplace.viewPack")}</span>
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t("marketplace.pack2Category")}</span>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        <span>{t("marketplace.pack2Rating")}</span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">{t("marketplace.pack2Title")}</h4>
                    <p className="text-xs text-muted-foreground">{t("marketplace.pack2Desc")}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-mono text-sm font-bold text-foreground">{t("marketplace.pack2Price")}</span>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" asChild>
                        <Link href="/marketplace">
                          <Download className="h-3 w-3" />
                          <span>{t("marketplace.viewPack")}</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" asChild>
                    <Link href="/marketplace">{t("marketplace.cta")}</Link>
                  </Button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
