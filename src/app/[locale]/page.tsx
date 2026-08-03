import { getTranslations, setRequestLocale } from "next-intl/server"
import {
  ArrowRight,
  ArrowDown,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  GraduationCap,
  Heart,
  Layers,
  Lightbulb,
  PenTool,
  Repeat,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react"

import {
  AI_DECISION_PROCESS,
  CONTENT_LIFECYCLE,
  DESIGN_PRINCIPLES,
  ECONOMY,
  PLATFORM_STATS,
  SYSTEMS,
  USER_ROLES,
} from "@/lib/edubek/constants"
import { getIcon } from "@/components/edubek/icon-map"
import { PrinciplesTabs } from "@/components/edubek/principles-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");

  const navLinks = [
    { href: "#philosophy", label: t("nav.philosophy") },
    { href: "#systems", label: t("nav.systems") },
    { href: "#ecosystem", label: t("nav.ecosystem") },
    { href: "#lifecycle", label: t("nav.lifecycle") },
    { href: "#economy", label: t("nav.economy") },
    { href: "#principles", label: t("nav.principles") },
    { href: "#vision", label: t("nav.vision") },
  ]

  const roleAccents: Record<string, string> = {
    teacher: "from-emerald-500/15 to-teal-500/10 text-emerald-300 border-emerald-500/30",
    student: "from-sky-500/15 to-cyan-500/10 text-sky-300 border-sky-500/30",
    creator: "from-pink-500/15 to-rose-500/10 text-pink-300 border-pink-500/30",
    school: "from-amber-500/15 to-orange-500/10 text-amber-300 border-amber-500/30",
    admin: "from-slate-500/15 to-gray-500/10 text-slate-300 border-slate-500/30",
    ai: "from-violet-500/15 to-purple-500/10 text-violet-300 border-violet-500/30",
  }

  const cycleStages = [
    { step: 1, icon: PenTool },
    { step: 2, icon: Store },
    { step: 3, icon: Search },
    { step: 4, icon: Sparkles },
    { step: 5, icon: BookOpen },
    { step: 6, icon: BarChart3 },
    { step: 7, icon: Brain },
    { step: 8, icon: Lightbulb },
    { step: 9, icon: Layers },
    { step: 10, icon: Rocket },
  ] as const

  const visionPillars = [
    { id: 1, icon: Sparkles, accent: "from-violet-500 to-purple-600", isWide: false },
    { id: 2, icon: GraduationCap, accent: "from-emerald-500 to-teal-600", isWide: false },
    { id: 3, icon: CircleDollarSign, accent: "from-amber-500 to-orange-600", isWide: false },
    { id: 4, icon: BookOpen, accent: "from-sky-500 to-cyan-600", isWide: false },
    { id: 5, icon: Layers, accent: "from-pink-500 to-rose-600", isWide: true },
  ] as const

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2" aria-label={t("header.ariaHome")}>
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-violet-500 text-sm font-black text-white shadow-lg shadow-emerald-500/20">
              E
            </span>
            <span className="text-lg font-bold tracking-tight">EduBek</span>
            <Badge
              variant="secondary"
              className="ms-1 hidden bg-emerald-500/10 text-emerald-300 sm:inline-flex"
            >
              {t("header.phaseBadge")}
            </Badge>
          </a>
          <nav className="hidden items-center gap-1 lg:flex" aria-label={t("header.ariaPrimaryNav")}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90">
            <a href="#vision">
              <Sparkles className="size-4" aria-hidden="true" />
              {t("header.getVision")}
            </a>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* 1. Hero */}
        <section
          id="top"
          className="relative overflow-hidden"
          aria-labelledby="hero-heading"
        >
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-background to-background" />
            <div className="absolute -top-32 -start-32 size-96 rounded-full bg-emerald-500/20 blur-[120px]" />
            <div className="absolute top-10 end-0 size-96 rounded-full bg-violet-500/20 blur-[120px]" />
            <div className="absolute bottom-0 start-1/3 size-80 rounded-full bg-amber-500/15 blur-[120px]" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
            <div className="mx-auto max-w-4xl text-center">
              <Badge
                variant="secondary"
                className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              >
                <span className="me-1 inline-block size-1.5 animate-pulse rounded-full bg-emerald-400" />
                {t("hero.badge")}
              </Badge>

              <h1
                id="hero-heading"
                className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-7xl lg:text-8xl"
              >
                EduBek
              </h1>

              <p className="mt-6 bg-gradient-to-r from-emerald-400 via-teal-300 to-violet-300 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl">
                {t("hero.subtitle")}
              </p>

              <figure className="mx-auto mt-10 max-w-3xl">
                <blockquote className="relative rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur-sm sm:p-8">
                  <span
                    className="absolute -top-4 start-6 select-none text-5xl text-emerald-500/50"
                    aria-hidden="true"
                  >
                    &ldquo;
                  </span>
                  <p className="text-lg font-medium italic leading-relaxed text-foreground sm:text-xl">
                    {t("hero.quote")}
                  </p>
                  <figcaption className="mt-3 text-sm text-muted-foreground">
                    {t("hero.quoteAttribution")}
                  </figcaption>
                </blockquote>
              </figure>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.02] sm:w-auto"
                >
                  <a href="#systems">
                    {t("hero.exploreVision")}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-border/60 bg-card/40 backdrop-blur-sm transition-transform hover:scale-[1.02] sm:w-auto"
                >
                  <a href="#principles">{t("hero.readPhilosophy")}</a>
                </Button>
              </div>

              <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                {PLATFORM_STATS.map((stat) => (
                  <div
                    key={stat.key}
                    className="rounded-xl border border-border/50 bg-card/40 p-4 text-center backdrop-blur-sm transition-colors hover:border-emerald-500/30"
                  >
                    <dt className="text-xs text-muted-foreground">{t(`stats.${stat.key}`)}</dt>
                    <dd className="mt-1 bg-gradient-to-br from-emerald-300 to-teal-400 bg-clip-text text-3xl font-black text-transparent">
                      {stat.value}
                      {stat.suffix}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="flex justify-center pb-6">
            <a
              href="#philosophy"
              className="flex flex-col items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t("hero.ariaScrollToMore")}
            >
              {t("hero.scrollToExplore")}
              <ArrowDown className="size-3 animate-bounce" aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* 2. Philosophy */}
        <SectionWrapper
          id="philosophy"
          eyebrow={t("philosophy.eyebrow")}
          title={t("philosophy.title")}
          subtitle={t("philosophy.subtitle")}
        >
          <Card className="overflow-hidden border-border/60 bg-card/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="size-5 text-violet-400" aria-hidden="true" />
                {t("philosophy.decisionProcessTitle")}
              </CardTitle>
              <CardDescription>
                {t("philosophy.decisionProcessDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-4 lg:grid-cols-5">
                {AI_DECISION_PROCESS.map((step, index) => {
                  const isLast = step.step === AI_DECISION_PROCESS.length
                  return (
                    <li
                      key={step.step}
                      className="relative flex flex-col rounded-xl border border-border/60 bg-background/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex size-9 items-center justify-center rounded-full text-sm font-bold ${
                            isLast
                              ? "border border-rose-500/40 bg-rose-500/15 text-rose-300"
                              : "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {step.step}
                        </span>
                        {isLast ? (
                          <Badge
                            variant="secondary"
                            className="bg-rose-500/15 text-rose-300"
                          >
                            {t("philosophy.lastResort")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/15 text-emerald-300"
                          >
                            {t("philosophy.stepN", { n: step.step })}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-foreground">
                        {t(`aiDecision.${step.step}.action`)}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {t(`aiDecision.${step.step}.question`)}
                      </p>
                      <p className="mt-2 text-xs font-medium text-foreground/80">
                        {t(`aiDecision.${step.step}.outcome`)}
                      </p>

                      {index < AI_DECISION_PROCESS.length - 1 && (
                        <span
                          className="absolute -end-3 top-1/2 hidden -translate-y-1/2 text-muted-foreground lg:block"
                          aria-hidden="true"
                        >
                          <ArrowRight className="size-4" />
                        </span>
                      )}
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>
        </SectionWrapper>

        {/* 3. Systems */}
        <SectionWrapper
          id="systems"
          eyebrow={t("systems.eyebrow")}
          title={t("systems.title")}
          subtitle={t("systems.subtitle")}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {SYSTEMS.map((system) => {
              const Icon: LucideIcon = getIcon(system.icon)
              return (
                <Card
                  key={system.id}
                  className="group relative overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${system.color}`}
                    aria-hidden="true"
                  />
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${system.color} text-white shadow-lg`}
                      >
                        <Icon className="size-6" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{t(`systems.${system.id}.name`)}</CardTitle>
                        <CardDescription className="mt-1 text-xs uppercase tracking-wider text-muted-foreground/70">
                          {t("common.system")} {String(SYSTEMS.indexOf(system) + 1).padStart(2, "0")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(`systems.${system.id}.responsibility`)}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </SectionWrapper>

        {/* 4. Ecosystem */}
        <SectionWrapper
          id="ecosystem"
          eyebrow={t("ecosystem.eyebrow")}
          title={t("ecosystem.title")}
          subtitle={t("ecosystem.subtitle")}
        >
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {USER_ROLES.map((role) => {
              const Icon: LucideIcon = getIcon(role.icon)
              const accent =
                roleAccents[role.id] ?? "from-emerald-500/15 to-teal-500/10 text-emerald-300 border-emerald-500/30"
              return (
                <Card
                  key={role.id}
                  className="group flex flex-col border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-11 items-center justify-center rounded-xl border bg-gradient-to-br ${accent}`}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{t(`ecosystem.${role.id}.name`)}</CardTitle>
                        <p className="mt-0.5 text-xs text-muted-foreground">{t(`ecosystem.${role.id}.goal`)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <Separator className="mb-4 opacity-50" />
                    <ul className="space-y-2">
                      {t.raw(`ecosystem.${role.id}.actions`).map((action: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-emerald-400"
                            aria-hidden="true"
                          />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </SectionWrapper>

        {/* 5. Lifecycle */}
        <SectionWrapper
          id="lifecycle"
          eyebrow={t("lifecycle.eyebrow")}
          title={t("lifecycle.title")}
          subtitle={t("lifecycle.subtitle")}
        >
          <div className="relative">
            <div
              className="absolute start-5 top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/60 via-teal-500/40 to-violet-500/60 sm:start-6"
              aria-hidden="true"
            />

            <ol className="space-y-5">
              {CONTENT_LIFECYCLE.map((item) => (
                <li key={item.step} className="relative ps-16 sm:ps-20">
                  <span className="absolute start-0 top-0 flex size-11 items-center justify-center rounded-full border border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 font-mono text-sm font-bold text-emerald-300 shadow-lg sm:size-12">
                    {String(item.step).padStart(2, "0")}
                  </span>
                  <Card className="border-border/60 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-md">
                    <CardContent className="py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-semibold text-foreground">
                            {t(`lifecycle.steps.${item.step}.title`)}
                          </h3>
                          {item.step === CONTENT_LIFECYCLE.length && (
                            <Badge className="bg-violet-500/15 text-violet-300">
                              <Repeat className="size-3" aria-hidden="true" />
                              {t("lifecycle.loopsToStep1")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {t(`lifecycle.steps.${item.step}.description`)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex justify-center ps-16 sm:ps-20">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
                <Repeat className="size-4 animate-pulse" aria-hidden="true" />
                {t("lifecycle.loopIndicator")}
              </div>
            </div>
          </div>
        </SectionWrapper>

        {/* 6. Economy */}
        <SectionWrapper
          id="economy"
          eyebrow={t("economy.eyebrow")}
          title={t("economy.title")}
          subtitle={t("economy.subtitle")}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Real Money */}
            <Card className="relative overflow-hidden border-border/60">
              <div
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${ECONOMY.realMoney.color}`}
                aria-hidden="true"
              />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${ECONOMY.realMoney.color} text-white shadow-lg`}
                  >
                    <CircleDollarSign className="size-6" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{t("economy.realMoney.name")}</CardTitle>
                    <CardDescription className="text-xs uppercase tracking-wider">
                      {t("economy.realMoney.usedFor")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/50 bg-background/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    {t("economy.represents")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("economy.realMoney.represents")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-300">
                    <Heart className="size-3" aria-hidden="true" />
                    {t("economy.longTermValue")}
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-300">
                    <GraduationCap className="size-3" aria-hidden="true" />
                    {t("economy.humanExpertise")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* EduTokens */}
            <Card className="relative overflow-hidden border-border/60">
              <div
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${ECONOMY.eduTokens.color}`}
                aria-hidden="true"
              />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${ECONOMY.eduTokens.color} text-white shadow-lg`}
                  >
                    <Coins className="size-6" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{t("economy.eduTokens.name")}</CardTitle>
                    <CardDescription className="text-xs uppercase tracking-wider">
                      {t("economy.eduTokens.usedFor")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/50 bg-background/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                    {t("economy.represents")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("economy.eduTokens.represents")}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("economy.spentOn")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {t.raw("economy.eduTokenExamples").map((ex: string) => (
                      <Badge
                        key={ex}
                        variant="secondary"
                        className="bg-violet-500/15 text-violet-300"
                      >
                        {ex}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SectionWrapper>

        {/* 7. Principles */}
        <SectionWrapper
          id="principles"
          eyebrow={t("principles.eyebrow")}
          title={t("principles.title")}
          subtitle={t("principles.subtitle")}
        >
          <PrinciplesTabs />

          <div className="mt-12">
            <Separator className="mb-8 opacity-50" />
            <h3 className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("principles.allAtGlance")}
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {DESIGN_PRINCIPLES.map((p) => (
                <Badge
                  key={p.id}
                  variant="outline"
                  className="border-border/60 bg-card/40 py-1.5 font-medium text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-foreground"
                  title={t(`principles.items.${p.id}.title`)}
                >
                  <span className="me-1 font-mono text-emerald-400">
                    {String(p.id).padStart(2, "0")}
                  </span>
                  {t(`principles.items.${p.id}.title`)}
                </Badge>
              ))}
            </div>
          </div>
        </SectionWrapper>

        {/* 8. Cycle */}
        <SectionWrapper
          id="cycle"
          eyebrow={t("cycle.eyebrow")}
          title={t("cycle.title")}
          subtitle={t("cycle.subtitle")}
        >
          <div className="mx-auto max-w-3xl">
            <div className="relative aspect-square w-full">
              <div
                className="absolute inset-[8%] rounded-full border border-dashed border-emerald-500/30"
                aria-hidden="true"
              >
                <div
                  className="absolute inset-0 animate-spin rounded-full border-t-2 border-emerald-400/60"
                  style={{ animationDuration: "20s" }}
                />
              </div>

              <div
                className="absolute inset-[18%] rounded-full border border-border/40 bg-card/20 backdrop-blur-sm"
                aria-hidden="true"
              />

              <div className="absolute start-1/2 top-1/2 flex size-[28%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-violet-500/20 text-center shadow-2xl">
                <Repeat className="size-5 text-emerald-300" aria-hidden="true" />
                <p className="mt-1 px-2 text-[10px] font-semibold leading-tight text-foreground sm:text-xs">
                  {t("cycle.selfImproving")}
                </p>
              </div>

              <ol className="absolute inset-0" aria-label={t("cycle.selfImproving")}>
                {cycleStages.map((stage, index) => {
                  const radius = 42
                  const angle = (-90 + index * (360 / cycleStages.length)) * (Math.PI / 180)
                  const x = 50 + radius * Math.cos(angle)
                  const y = 50 + radius * Math.sin(angle)
                  const Icon = stage.icon
                  return (
                    <li
                      key={stage.step}
                      className="absolute"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="group flex w-24 flex-col items-center gap-1 sm:w-28">
                        <div className="flex size-10 items-center justify-center rounded-full border border-emerald-500/40 bg-background/90 text-emerald-300 shadow-lg transition-transform duration-300 group-hover:scale-110 sm:size-12">
                          <Icon className="size-5" aria-hidden="true" />
                        </div>
                        <span className="font-mono text-[10px] text-emerald-400">
                          {String(stage.step).padStart(2, "0")}
                        </span>
                        <span className="text-center text-[10px] font-medium leading-tight text-muted-foreground sm:text-xs">
                          {t(`cycle.stages.${stage.step}`)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t("cycle.footer")}
            </p>
          </div>
        </SectionWrapper>

        {/* 9. Vision */}
        <SectionWrapper
          id="vision"
          eyebrow={t("vision.eyebrow")}
          title={t("vision.title")}
          subtitle=""
        >
          <figure className="mx-auto max-w-4xl text-center">
            <blockquote className="text-2xl font-bold leading-snug text-foreground sm:text-3xl">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-violet-300 bg-clip-text text-transparent">
                {t("vision.quote")}
              </span>
            </blockquote>
          </figure>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visionPillars.map((pillar) => {
              const Icon = pillar.icon
              return (
                <Card
                  key={pillar.id}
                  className={`group relative overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    pillar.isWide ? "lg:col-span-3" : ""
                  }`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${pillar.accent}`}
                    aria-hidden="true"
                  />
                  <CardContent className="flex h-full items-start gap-4 py-6">
                    <div
                      className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${pillar.accent} text-white shadow-lg`}
                    >
                      <Icon className="size-6" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground">
                        {t(`vision.pillars.${pillar.id}.title`)}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {t(`vision.pillars.${pillar.id}.description`)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-14 text-center">
            <Card className="mx-auto max-w-2xl overflow-hidden border-border/60 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-violet-500/10">
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                <ShieldCheck className="size-10 text-emerald-400" aria-hidden="true" />
                <h3 className="text-2xl font-bold text-foreground">
                  {t("vision.ready")}
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  {t("vision.readyDescription")}
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.02]"
                >
                  <a href="#top">
                    <Sparkles className="size-4" aria-hidden="true" />
                    {t("vision.backToTop")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </SectionWrapper>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-start">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-violet-500 text-sm font-black text-white shadow-lg">
                E
              </span>
              <div className="text-start">
                <p className="text-base font-bold">EduBek</p>
                <p className="text-xs text-muted-foreground">
                  {t("hero.badge")}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 sm:items-end">
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-300"
              >
                <span className="me-1 inline-block size-1.5 animate-pulse rounded-full bg-emerald-400" />
                {t("footer.phaseBadge")}
              </Badge>
              <p className="max-w-md text-xs text-muted-foreground">
                {t("footer.description")}
              </p>
            </div>
          </div>

          <Separator className="my-8 opacity-50" />

          <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()} EduBek. {t("hero.quote")}
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Users className="size-3" aria-hidden="true" />
                {t("vision.eyebrow")}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared section wrapper
// ---------------------------------------------------------------------------

function SectionWrapper({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-20 border-t border-border/30 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="mb-4 bg-emerald-500/10 text-emerald-300"
          >
            {eyebrow}
          </Badge>
          <h2
            id={`${id}-heading`}
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}
