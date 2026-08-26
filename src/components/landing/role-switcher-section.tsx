"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("landing.roleSwitcher");
  const [activeRole, setActiveRole] = React.useState<"student" | "teacher" | "creator">("student");

  const roles = {
    student: {
      id: "student",
      label: t("roles.student.label"),
      icon: GraduationCap,
      color: "text-blue-500",
      accentBg: "bg-blue-500/10",
      badge: t("roles.student.badge"),
      headline: t("roles.student.headline"),
      description: t("roles.student.description"),
      benefits: [
        t("roles.student.benefit1"),
        t("roles.student.benefit2"),
        t("roles.student.benefit3"),
        t("roles.student.benefit4"),
      ],
      ctaText: t("roles.student.ctaText"),
      ctaLink: "/register?role=student",
      preview: {
        title: t("roles.student.preview.title"),
        stat1: { label: t("roles.student.preview.stat1Label"), value: "88.4%", icon: TrendingUp, color: "text-emerald-500" },
        stat2: { label: t("roles.student.preview.stat2Label"), value: `7 ${t("roles.student.preview.daysStreak")}`, icon: Award, color: "text-amber-500" },
        stat3: { label: t("roles.student.preview.stat3Label"), value: "145 EDU", icon: Coins, color: "text-primary" },
        detail: t("roles.student.preview.detail"),
      },
    },
    teacher: {
      id: "teacher",
      label: t("roles.teacher.label"),
      icon: School,
      color: "text-indigo-500",
      accentBg: "bg-indigo-500/10",
      badge: t("roles.teacher.badge"),
      headline: t("roles.teacher.headline"),
      description: t("roles.teacher.description"),
      benefits: [
        t("roles.teacher.benefit1"),
        t("roles.teacher.benefit2"),
        t("roles.teacher.benefit3"),
        t("roles.teacher.benefit4"),
      ],
      ctaText: t("roles.teacher.ctaText"),
      ctaLink: "/classrooms",
      preview: {
        title: t("roles.teacher.preview.title"),
        stat1: { label: t("roles.teacher.preview.stat1Label"), value: `32 ${t("roles.teacher.preview.online")}`, icon: Users, color: "text-blue-500" },
        stat2: { label: t("roles.teacher.preview.stat2Label"), value: "84.2%", icon: BarChart, color: "text-emerald-500" },
        stat3: { label: t("roles.teacher.preview.stat3Label"), value: `28 ${t("roles.teacher.preview.completed")}`, icon: Award, color: "text-indigo-500" },
        detail: t("roles.teacher.preview.detail"),
      },
    },
    creator: {
      id: "creator",
      label: t("roles.creator.label"),
      icon: Sparkles,
      color: "text-emerald-500",
      accentBg: "bg-emerald-500/10",
      badge: t("roles.creator.badge"),
      headline: t("roles.creator.headline"),
      description: t("roles.creator.description"),
      benefits: [
        t("roles.creator.benefit1"),
        t("roles.creator.benefit2"),
        t("roles.creator.benefit3"),
        t("roles.creator.benefit4"),
      ],
      ctaText: t("roles.creator.ctaText"),
      ctaLink: "/marketplace",
      preview: {
        title: t("roles.creator.preview.title"),
        stat1: { label: t("roles.creator.preview.stat1Label"), value: "$480.00", icon: DollarSign, color: "text-emerald-500" },
        stat2: { label: t("roles.creator.preview.stat2Label"), value: `312 ${t("roles.creator.preview.students")}`, icon: Users, color: "text-blue-500" },
        stat3: { label: t("roles.creator.preview.stat3Label"), value: "4.9 ★", icon: Award, color: "text-amber-500" },
        detail: t("roles.creator.preview.detail"),
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
            {t("badge")}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            {t("title")}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
            {t("subtitle")}
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
                  <span className="text-[11px] font-mono uppercase text-muted-foreground">{t("activeViewLabel")}</span>
                  <h4 className="text-base sm:text-lg font-bold text-foreground">{current.preview.title}</h4>
                </div>
                <Badge variant="secondary" className="text-xs font-mono">{t("liveDemoBadge")}</Badge>
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
                <span className="font-semibold text-primary shrink-0 ml-2">{t("syncedBadge")}</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
