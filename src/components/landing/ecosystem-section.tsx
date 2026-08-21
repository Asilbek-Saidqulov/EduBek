"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
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
  const [activePillar, setActivePillar] = React.useState<string>("discover");

  const pillars = [
    {
      id: "discover",
      title: "Discover",
      badge: "Knowledge Graph",
      icon: Compass,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      accentBorder: "border-blue-500",
      tagline: "Explore topics, curated quizzes, and structured learning paths.",
      description:
        "Instead of fragmented files, search topics organized by curriculum standards. Discover related quizzes, study guides, and flashcard sets in one click.",
      link: "/discover",
      linkText: "Explore Knowledge Graph",
      connectedTo: ["practice", "learn", "ai"],
    },
    {
      id: "practice",
      title: "Practice",
      badge: "4 Arena Modes",
      icon: Swords,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      accentBorder: "border-amber-500",
      tagline: "Master concepts through competitive and solo interactive quizzes.",
      description:
        "Engage in Classic Arena, Quiz Royale (100 HP shield), Treasure Heist (streak multipliers), or Empire Builder. Get instant feedback on every question.",
      link: "/live-quiz",
      linkText: "Launch Quiz Arena",
      connectedTo: ["ai", "learn"],
    },
    {
      id: "ai",
      title: "Contextual AI",
      badge: "Built-In Tutor",
      icon: Sparkles,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10 border-violet-500/20",
      accentBorder: "border-violet-500",
      tagline: "Instant step-by-step explanations, summarization, and question generation.",
      description:
        "AI is embedded right into your learning flow. When you miss a quiz question or review complex notes, get instant step-by-step guidance without switching apps.",
      link: "/ai-workspace",
      linkText: "Open AI Workspace",
      connectedTo: ["create", "practice"],
    },
    {
      id: "learn",
      title: "Learn & Track",
      badge: "Progress Intelligence",
      icon: GraduationCap,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      accentBorder: "border-emerald-500",
      tagline: "Organize notes, maintain daily streaks, and target weak areas.",
      description:
        "Your personal dashboard aggregates practice accuracy, daily streaks, assigned class homework, and weak-topic diagnostics to guide your daily study plan.",
      link: "/dashboard",
      linkText: "View Student Dashboard",
      connectedTo: ["discover", "create"],
    },
    {
      id: "create",
      title: "Create",
      badge: "Educator Studio",
      icon: PenTool,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10 border-rose-500/20",
      accentBorder: "border-rose-500",
      tagline: "Build quizzes, study guides, and interactive lessons in minutes.",
      description:
        "Generate multi-format questions manually or with AI assistance from your syllabus outlines, export them for live classroom games, or publish them.",
      link: "/classrooms",
      linkText: "Educator Classroom Studio",
      connectedTo: ["marketplace", "practice"],
    },
    {
      id: "marketplace",
      title: "Marketplace",
      badge: "Creator Economy",
      icon: ShoppingBag,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10 border-cyan-500/20",
      accentBorder: "border-cyan-500",
      tagline: "Access and monetize high-yield study materials from verified educators.",
      description:
        "Support educational creators. Buy premium exam preparation packs, verified school curricula, or earn revenue by publishing your own top-rated materials.",
      link: "/marketplace",
      linkText: "Browse Marketplace",
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
            <span>The Interconnected Architecture</span>
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            Not isolated tools. One connected ecosystem.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
            Every part of EduBek feeds directly into the next: discovering a topic leads to active quiz practice, mistakes trigger contextual AI explanations, and educators publish verified study sets.
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
                    <span>How it connects inside the ecosystem:</span>
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
                          <span>Feeds into <strong>{target.title}</strong></span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Direct CTA to that feature */}
              <div className="pt-4 border-t border-border/80 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ready to explore this component?</span>
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
