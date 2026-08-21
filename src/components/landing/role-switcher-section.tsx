"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import {
  GraduationCap,
  School,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  Coins,
  DollarSign,
  BarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function RoleSwitcherSection() {
  const [activeRole, setActiveRole] = React.useState<"student" | "teacher" | "creator">("student");

  const roles = {
    student: {
      id: "student",
      label: "For Students",
      icon: GraduationCap,
      color: "text-blue-500",
      accentBg: "bg-blue-500/10",
      badge: "Self-Paced Mastery",
      headline: "Practice with purpose, eliminate weak spots, and earn rewards.",
      description:
        "EduBek gives you structured topic roads, live game arenas to test yourself against peers, instant step-by-step AI hints when you are stuck, and streak rewards that keep you motivated.",
      benefits: [
        "Interactive Quiz Arenas with 4 distinct game modes",
        "Automated diagnostic review of every missed question",
        "Contextual AI Tutor ready to explain complex steps",
        "Earn EDU tokens and maintain daily practice streaks",
      ],
      ctaText: "Start Learning as Student",
      ctaLink: "/register?role=student",
      preview: {
        title: "Student Progress & Mastery",
        stat1: { label: "Weekly Accuracy", value: "88.4%", icon: TrendingUp, color: "text-emerald-500" },
        stat2: { label: "Current Streak", value: "7 Days 🔥", icon: Award, color: "text-amber-500" },
        stat3: { label: "EDU Token Balance", value: "145 EDU", icon: Coins, color: "text-primary" },
        detail: "Next recommended practice: Organic Chemistry (3 weak topics detected)",
      },
    },
    teacher: {
      id: "teacher",
      label: "For Teachers & Schools",
      icon: School,
      color: "text-indigo-500",
      accentBg: "bg-indigo-500/10",
      badge: "Educator Workspace",
      headline: "Engage your classroom in seconds and understand student gaps instantly.",
      description:
        "Host live multi-player quiz sessions with a simple 6-digit PIN, distribute homework sets, automate grading, and get instant item-level analytics identifying where students struggle.",
      benefits: [
        "Host live classroom games (Classic, Royale, Heist, Empire)",
        "Generate multi-choice quizzes with AI from your syllabus",
        "Real-time class accuracy heatmaps & student breakdowns",
        "Export grades, assign homework, and manage multiple classes",
      ],
      ctaText: "Launch Teacher Workspace",
      ctaLink: "/classrooms",
      preview: {
        title: "Grade 10 Biology • Live Class 10-A",
        stat1: { label: "Active Students", value: "32 Online", icon: Users, color: "text-blue-500" },
        stat2: { label: "Class Average", value: "84.2%", icon: BarChart, color: "text-emerald-500" },
        stat3: { label: "Quizzes Hosted", value: "28 Completed", icon: Award, color: "text-indigo-500" },
        detail: "Live Game PIN: 849-201 • Round 4 of 10 in progress",
      },
    },
    creator: {
      id: "creator",
      label: "For Content Creators",
      icon: Sparkles,
      color: "text-emerald-500",
      accentBg: "bg-emerald-500/10",
      badge: "Creator Economy",
      headline: "Turn your subject expertise into verified study sets and direct revenue.",
      description:
        "Publish high-yield exam preparation guides, comprehensive quiz banks, and curated video courses. Set your prices in EDU tokens or fiat and earn reliable royalties from eager students.",
      benefits: [
        "Monetize study decks, Olympiad packs, and syllabus guides",
        "Keep up to 85% of marketplace sales royalties",
        "Detailed performance analytics: downloads, ratings, and views",
        "Build a verified educator profile with follower updates",
      ],
      ctaText: "Become an EduBek Creator",
      ctaLink: "/marketplace",
      preview: {
        title: "Creator Studio Dashboard",
        stat1: { label: "Monthly Royalties", value: "$480.00", icon: DollarSign, color: "text-emerald-500" },
        stat2: { label: "Active Buyers", value: "312 Students", icon: Users, color: "text-blue-500" },
        stat3: { label: "Avg Material Rating", value: "4.9 ★", icon: Award, color: "text-amber-500" },
        detail: "Top item: 'Complete High School Olympiad Math Bundle' (128 sales)",
      },
    },
  };

  const current = roles[activeRole];
  const CurrentIcon = current.icon;

  return (
    <section className="py-16 md:py-24 bg-muted/20 border-b border-border/60" id="role-switcher-section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20 bg-primary/5">
            Built for Everyone in Education
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            Tailored experiences for students, teachers, and creators
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
            Switch between roles to see how EduBek adapts its tools for your unique educational goals.
          </p>
        </div>

        {/* Role Tab Buttons */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl border border-border bg-card shadow-xs gap-2">
            {(["student", "teacher", "creator"] as const).map((roleKey) => {
              const r = roles[roleKey];
              const Icon = r.icon;
              const isSelected = activeRole === roleKey;
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => setActiveRole(roleKey)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  id={`role-btn-${roleKey}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left: Role Description & Bullet benefits */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${current.accentBg}`}>
                <CurrentIcon className={`h-5 w-5 ${current.color}`} />
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {current.badge}
              </Badge>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight text-balance">
              {current.headline}
            </h3>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {current.description}
            </p>

            <div className="space-y-2.5 pt-2">
              {current.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground/90">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <div className="pt-3">
              <Button size="lg" asChild className="gap-2">
                <Link href={current.ctaLink}>
                  <span>{current.ctaText}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Dynamic Role Preview UI Card */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div>
                  <span className="text-[11px] font-mono uppercase text-muted-foreground">Active Interface View</span>
                  <h4 className="text-base sm:text-lg font-bold text-foreground">{current.preview.title}</h4>
                </div>
                <Badge variant="secondary" className="text-xs font-mono">Live Demo</Badge>
              </div>

              {/* 3 Metric cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-border/80 bg-muted/40 space-y-1">
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">{current.preview.stat1.label}</span>
                  <p className={`text-sm sm:text-base font-bold ${current.preview.stat1.color}`}>{current.preview.stat1.value}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/80 bg-muted/40 space-y-1">
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">{current.preview.stat2.label}</span>
                  <p className={`text-sm sm:text-base font-bold ${current.preview.stat2.color}`}>{current.preview.stat2.value}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/80 bg-muted/40 space-y-1">
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">{current.preview.stat3.label}</span>
                  <p className={`text-sm sm:text-base font-bold ${current.preview.stat3.color}`}>{current.preview.stat3.value}</p>
                </div>
              </div>

              {/* Detail notification */}
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground/90 flex items-center justify-between">
                <span>{current.preview.detail}</span>
                <span className="font-semibold text-primary shrink-0 ml-2">Synced</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
