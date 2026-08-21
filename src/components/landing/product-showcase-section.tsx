"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
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
  const [activeTab, setActiveTab] = React.useState<"quiz" | "discover" | "ai" | "teacher" | "marketplace">("quiz");

  return (
    <section className="py-16 md:py-24 bg-muted/30 border-b border-border/60" id="product-showcase-section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20 bg-primary/5">
            Interface Preview
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            Explore the EduBek product experience
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
            A cohesive design system engineered for high-focus studying, rapid assessment, and seamless teaching.
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
              <span>Quiz Arena</span>
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
              <span>Knowledge Discovery</span>
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
              <span>Contextual AI</span>
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
              <span>Teacher Workspace</span>
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
              <span>Marketplace</span>
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
              <span className="font-mono text-[11px] hidden sm:inline">Active session: live-sync</span>
              <Button size="sm" variant="ghost" asChild className="h-7 text-xs px-2.5 font-medium">
                <Link href={`/${activeTab === "teacher" ? "classrooms" : activeTab === "ai" ? "ai-workspace" : activeTab === "quiz" ? "live-quiz" : activeTab}`}>
                  <span>Open Screen</span>
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
                        Quiz Royale Mode (100 HP Shield)
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">Pin: 849-201</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mt-1">Physics: Newton's Laws & Momentum</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                      <Flame className="h-4 w-4" />
                      <span>Streak x3</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                      <Clock className="h-4 w-4" />
                      <span>12s remaining</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 rounded-xl border border-border/80 bg-background/60 space-y-4">
                  <span className="text-xs text-primary font-semibold">Question 6 of 12</span>
                  <p className="text-base sm:text-lg font-medium text-foreground">
                    An astronaut in deep space throws a 2 kg wrench at 10 m/s. If the astronaut has a mass of 80 kg, what is their recoil speed?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-border/70 bg-card text-xs sm:text-sm font-medium flex items-center justify-between">
                      <span>A) 0.50 m/s</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs sm:text-sm flex items-center justify-between">
                      <span>B) 0.25 m/s</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/70 bg-card text-xs sm:text-sm font-medium flex items-center justify-between">
                      <span>C) 2.00 m/s</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/70 bg-card text-xs sm:text-sm font-medium flex items-center justify-between">
                      <span>D) 0.10 m/s</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span>Reward: <strong>+35 EDU Tokens</strong> for perfect accuracy</span>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/live-quiz">Join Live Practice Session</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* 2. DISCOVER VIEW */}
            {activeTab === "discover" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Explore Connected Syllabus Knowledge</h3>
                    <p className="text-xs text-muted-foreground">Search by national curriculum, grade level, or specific sub-topic.</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      readOnly
                      value="Calculus Derivatives"
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">Mathematics</Badge>
                      <span className="text-[11px] text-muted-foreground">18 Quizzes</span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">Chain Rule & Product Rule</h4>
                    <p className="text-xs text-muted-foreground">Step-by-step visual proofs, 40 practice problems, and interactive differentiation tests.</p>
                    <div className="pt-2 text-xs font-semibold text-primary">Explore 14 resources →</div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">Physics</Badge>
                      <span className="text-[11px] text-muted-foreground">24 Quizzes</span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">Electromagnetism & Induction</h4>
                    <p className="text-xs text-muted-foreground">Faraday's Law, Lenz's Law, magnetic flux equations with 3D diagram references.</p>
                    <div className="pt-2 text-xs font-semibold text-primary">Explore 21 resources →</div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">Computer Science</Badge>
                      <span className="text-[11px] text-muted-foreground">15 Quizzes</span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">Binary Search Trees & Graphs</h4>
                    <p className="text-xs text-muted-foreground">Traversal algorithms, balance rotation guides, and interactive time complexity drills.</p>
                    <div className="pt-2 text-xs font-semibold text-primary">Explore 19 resources →</div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" asChild>
                    <Link href="/discover">Open Full Discovery Catalog</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* 3. AI WORKSPACE VIEW */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Contextual AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">Embedded tools that explain, summarize, and generate targeted exercises.</p>
                  </div>
                  <Badge variant="secondary" className="gap-1 text-xs font-mono">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>Gemini 3.7 Pro Tutor</span>
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/40 flex items-start gap-3 text-xs">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary font-bold text-[10px]">YOU</div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Explain why sound waves travel faster in water than in air with a formula.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>EduBek AI Tutor</span>
                    </div>
                    <p className="text-foreground/90 leading-relaxed">
                      Sound speed is determined by <code className="px-1.5 py-0.5 rounded bg-muted font-mono font-bold">v = √(B / ρ)</code>, where <strong>B</strong> is the Bulk Modulus (elastic stiffness) and <strong>ρ</strong> is density. Although water is ~800x denser than air, its bulk modulus is over 15,000x greater! Because water particles are closely bound, elastic restoring forces dominate, causing sound to travel at ~1,480 m/s in water versus ~343 m/s in air.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="px-2.5 py-1 rounded-lg border border-primary/30 bg-background text-[11px] font-medium text-primary">
                        ✨ Generate 3 Quiz Questions on this
                      </span>
                      <span className="px-2.5 py-1 rounded-lg border border-primary/30 bg-background text-[11px] font-medium text-primary">
                        📝 Add formula to Revision Flashcards
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" asChild>
                    <Link href="/ai-workspace">Launch AI Workspace</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* 4. TEACHER WORKSPACE VIEW */}
            {activeTab === "teacher" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Classroom & Teacher Studio</h3>
                    <p className="text-xs text-muted-foreground">Manage classes, assign interactive quizzes, and inspect student performance.</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Class: Grade 10-A Science</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>Enrolled Students</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">32 Active</p>
                    <span className="text-[11px] text-emerald-500 font-medium">100% Submission rate</span>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BarChart3 className="h-4 w-4 text-emerald-500" />
                      <span>Class Average Accuracy</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">84.2%</p>
                    <span className="text-[11px] text-emerald-500 font-medium">+6.4% from last unit</span>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <XCircle className="h-4 w-4 text-rose-500" />
                      <span>Identified Weak Topic</span>
                    </div>
                    <p className="text-sm font-bold text-foreground truncate">Thermodynamics Law 2</p>
                    <span className="text-[11px] text-rose-500 font-medium">AI Remedial Quiz generated</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" asChild>
                    <Link href="/classrooms">Open Educator Portal</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* 5. MARKETPLACE VIEW */}
            {activeTab === "marketplace" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Educational Marketplace</h3>
                    <p className="text-xs text-muted-foreground">Verified lesson materials, exam preparation packs, and creator revenue sharing.</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Syllabus-Aligned</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary">National Olympiad Prep</span>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        <span>4.9 (128 reviews)</span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">Complete High School Olympiad Math Bundle</h4>
                    <p className="text-xs text-muted-foreground">Includes 15 full interactive quiz simulations with video solution breakdowns by Master Educator Alimov.</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-mono text-sm font-bold text-foreground">40 EDU ($8.00)</span>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" asChild>
                        <Link href="/marketplace">
                          <Download className="h-3 w-3" />
                          <span>View Pack</span>
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Medical School Biology</span>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        <span>5.0 (94 reviews)</span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">Human Anatomy & Physiology Mastery Deck</h4>
                    <p className="text-xs text-muted-foreground">Over 350 illustrated flashcards and 20 timed arena tests covering the cardiovascular and nervous systems.</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-mono text-sm font-bold text-foreground">25 EDU ($5.00)</span>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" asChild>
                        <Link href="/marketplace">
                          <Download className="h-3 w-3" />
                          <span>View Pack</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" asChild>
                    <Link href="/marketplace">Explore All Marketplace Items</Link>
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
