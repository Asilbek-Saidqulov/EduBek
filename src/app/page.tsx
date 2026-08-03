import type { Metadata } from "next"
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

export const metadata: Metadata = {
  title: "EduBek — AI-Powered Education Ecosystem",
  description:
    "Reuse existing knowledge first. Create new knowledge only when necessary. EduBek unites a Marketplace, an AI Assistant, a Quiz Platform, and a Creator Economy into one connected platform.",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { href: "#philosophy", label: "Philosophy" },
  { href: "#systems", label: "Systems" },
  { href: "#ecosystem", label: "Ecosystem" },
  { href: "#lifecycle", label: "Lifecycle" },
  { href: "#economy", label: "Economy" },
  { href: "#principles", label: "Principles" },
  { href: "#vision", label: "Vision" },
]

const ROLE_ACCENTS: Record<string, string> = {
  teacher: "from-emerald-500/15 to-teal-500/10 text-emerald-300 border-emerald-500/30",
  student: "from-sky-500/15 to-cyan-500/10 text-sky-300 border-sky-500/30",
  creator: "from-pink-500/15 to-rose-500/10 text-pink-300 border-pink-500/30",
  school: "from-amber-500/15 to-orange-500/10 text-amber-300 border-amber-500/30",
  admin: "from-slate-500/15 to-gray-500/10 text-slate-300 border-slate-500/30",
  ai: "from-violet-500/15 to-purple-500/10 text-violet-300 border-violet-500/30",
}

const AI_DECISION_STEPS = [
  {
    step: 1,
    action: "Search the Marketplace",
    question: "Do we already have something similar?",
    outcome: "If yes, recommend it.",
  },
  {
    step: 2,
    action: "Evaluate quality",
    question: "Is the existing resource good enough?",
    outcome: "If yes, recommend it.",
  },
  {
    step: 3,
    action: "Customize with AI",
    question: "Does it only need small changes?",
    outcome: "If yes, customize it.",
  },
  {
    step: 4,
    action: "Combine resources",
    question: "Can multiple resources be combined?",
    outcome: "If yes, combine them.",
  },
  {
    step: 5,
    action: "Generate new content",
    question: "Is there no suitable resource?",
    outcome: "Only then — last resort.",
  },
] as const

const SYSTEMS_DATA = [
  {
    id: "marketplace",
    icon: "Store",
    color: "from-amber-500 to-orange-600",
    name: "Marketplace",
    responsibility: "Store & distribute educational knowledge — listings, prices, purchases, reviews, refunds.",
  },
  {
    id: "ai-assistant",
    icon: "Sparkles",
    color: "from-violet-500 to-purple-600",
    name: "AI Assistant",
    responsibility: "Educational intelligence — understand, recommend, customize, combine, generate (in that order).",
  },
  {
    id: "quiz-platform",
    icon: "Brain",
    color: "from-blue-500 to-cyan-600",
    name: "Quiz Platform",
    responsibility: "Deliver learning activities — live quizzes, homework, exams, real-time scoring.",
  },
  {
    id: "organization",
    icon: "Building2",
    color: "from-emerald-500 to-teal-600",
    name: "Organization System",
    responsibility: "Manage educational institutions — orgs, memberships, roles, cohorts, billing.",
  },
  {
    id: "creator-economy",
    icon: "Wallet",
    color: "from-pink-500 to-rose-600",
    name: "Creator Economy",
    responsibility: "Manage creators & their work — publishing, tiers, earnings, payouts, reputation.",
  },
  {
    id: "economy",
    icon: "Coins",
    color: "from-yellow-500 to-amber-600",
    name: "Economy System",
    responsibility: "Manage financial transactions — EduTokens, real money, subscriptions, invoices.",
  },
  {
    id: "analytics",
    icon: "BarChart3",
    color: "from-indigo-500 to-blue-600",
    name: "Analytics System",
    responsibility: "Educational insights — student progress, class performance, org reports, trends.",
  },
  {
    id: "search",
    icon: "Search",
    color: "from-sky-500 to-indigo-600",
    name: "Search System",
    responsibility: "Connect users with knowledge — indexing, ranking, filtering, recommendations.",
  },
  {
    id: "user",
    icon: "Users",
    color: "from-slate-500 to-gray-600",
    name: "User System",
    responsibility: "Manage people — registration, auth, profiles, roles, permissions, notifications.",
  },
  {
    id: "library",
    icon: "Library",
    color: "from-green-500 to-emerald-600",
    name: "Library System",
    responsibility: "Teacher's permanent workspace — purchased, created, saved, AI-generated resources.",
  },
] as const

const USER_ROLE_DATA = [
  {
    id: "teacher",
    icon: "GraduationCap",
    name: "Teachers",
    goal: "Save time and teach better.",
    actions: [
      "Create educational materials",
      "Search the Marketplace",
      "Buy materials from other teachers",
      "Customize materials with AI",
      "Host live quizzes",
      "Track student performance",
      "Publish and earn money",
    ],
  },
  {
    id: "student",
    icon: "BookOpen",
    name: "Students",
    goal: "Learn effectively and improve knowledge.",
    actions: [
      "Join quizzes using a code",
      "Complete homework",
      "Take exams",
      "Review answers",
      "Receive feedback",
      "Track progress",
    ],
  },
  {
    id: "creator",
    icon: "PenTool",
    name: "Content Creators",
    goal: "Share expertise and earn money.",
    actions: [
      "Publish quizzes, lessons, worksheets",
      "Set price and category",
      "Earn from every purchase",
      "Build a reputation",
      "AI helps improve materials",
    ],
  },
  {
    id: "school",
    icon: "Building2",
    name: "Schools & Institutions",
    goal: "Manage education efficiently and monitor performance.",
    actions: [
      "Create an organization",
      "Invite teachers and students",
      "Monitor performance",
      "Purchase institutional plans",
      "View school-wide reports",
    ],
  },
  {
    id: "admin",
    icon: "Shield",
    name: "Administrators",
    goal: "Keep the platform secure, organized, and high quality.",
    actions: [
      "Review reported content",
      "Moderate uploads",
      "Resolve disputes",
      "Manage categories",
      "Monitor platform health",
    ],
  },
  {
    id: "ai",
    icon: "Sparkles",
    name: "AI Assistant",
    goal: "Help every user make better decisions and reduce repetitive work.",
    actions: [
      "Search the Marketplace first",
      "Recommend the best resources",
      "Customize existing materials",
      "Generate new content only when necessary",
      "Analyze learning data",
    ],
  },
] as const

const CONTENT_LIFECYCLE_STEPS = [
  {
    step: 1,
    title: "Idea",
    description: "A teacher realizes they need something. EduBek helps determine the best way to obtain it.",
  },
  {
    step: 2,
    title: "Search Before Creating",
    description: "Check personal library → org library → global Marketplace. Reuse knowledge before creating new knowledge.",
  },
  {
    step: 3,
    title: "Create or Customize",
    description: "Create manually, generate with AI, customize an existing resource, or combine multiple resources.",
  },
  {
    step: 4,
    title: "Save",
    description: "Every resource is saved. Teachers build a personal library over time.",
  },
  {
    step: 5,
    title: "Use in Teaching",
    description: "Assign as homework, host a live quiz, present during class. The same resource may be used many times.",
  },
  {
    step: 6,
    title: "Collect Learning Data",
    description: "Completion rate, average score, difficult questions, common mistakes, time spent.",
  },
  {
    step: 7,
    title: "Improve",
    description: "Correct mistakes, rewrite explanations, replace confusing questions. Resources become better through real classroom experience.",
  },
  {
    step: 8,
    title: "Publish (Optional)",
    description: "Publish to the Marketplace — private, org-only, or public. Teacher always has complete ownership.",
  },
  {
    step: 9,
    title: "Help Other Teachers",
    description: "Other educators discover, purchase, customize, teach, and improve it. One teacher's work becomes valuable to many.",
  },
  {
    step: 10,
    title: "Continue Growing",
    description: "Updates, translations, grade adaptations. Educational content should improve over time rather than becoming outdated.",
  },
] as const

const ECONOMY_DATA = {
  realMoney: {
    name: "Real Money",
    usedFor: "Marketplace purchases",
    represents: "Human expertise — educational materials with long-term value",
  },
  eduTokens: {
    name: "EduTokens",
    usedFor: "AI services",
    represents: "Computational work — temporary value, performs a task once",
    examples: [
      "Generating",
      "Customizing",
      "Translating",
      "Summarizing",
      "Explaining",
      "Analyzing",
      "Improving",
    ],
  },
} as const

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <PhilosophySection />
        <SystemsSection />
        <EcosystemSection />
        <LifecycleSection />
        <EconomySection />
        <PrinciplesSection />
        <CycleSection />
        <VisionSection />
      </main>
      <SiteFooter />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2" aria-label="EduBek home">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-violet-500 text-sm font-black text-white shadow-lg shadow-emerald-500/20">
            E
          </span>
          <span className="text-lg font-bold tracking-tight">EduBek</span>
          <Badge
            variant="secondary"
            className="ml-1 hidden bg-emerald-500/10 text-emerald-300 sm:inline-flex"
          >
            Phase 1
          </Badge>
        </a>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
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
            Get the Vision
          </a>
        </Button>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section
      id="top"
      className="relative overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Decorative gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-background to-background" />
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute top-10 right-0 size-96 rounded-full bg-violet-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-amber-500/15 blur-[120px]" />
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
            <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-emerald-400" />
            AI-Powered Education Ecosystem
          </Badge>

          <h1
            id="hero-heading"
            className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-7xl lg:text-8xl"
          >
            EduBek
          </h1>

          <p className="mt-6 bg-gradient-to-r from-emerald-400 via-teal-300 to-violet-300 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl">
            AI-Powered Education Ecosystem
          </p>

          <figure className="mx-auto mt-10 max-w-3xl">
            <blockquote className="relative rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur-sm sm:p-8">
              <span
                className="absolute -top-4 left-6 select-none text-5xl text-emerald-500/50"
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <p className="text-lg font-medium italic leading-relaxed text-foreground sm:text-xl">
                Reuse existing knowledge first. Create new knowledge only when necessary.
              </p>
              <figcaption className="mt-3 text-sm text-muted-foreground">
                — The core philosophy of EduBek
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
                Explore the Vision
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-border/60 bg-card/40 backdrop-blur-sm transition-transform hover:scale-[1.02] sm:w-auto"
            >
              <a href="#principles">Read the Philosophy</a>
            </Button>
          </div>

          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {PLATFORM_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/50 bg-card/40 p-4 text-center backdrop-blur-sm transition-colors hover:border-emerald-500/30"
              >
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
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
          aria-label="Scroll to learn more"
        >
          Scroll to explore
          <ArrowDown className="size-3 animate-bounce" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 2. The Core Philosophy
// ---------------------------------------------------------------------------

function PhilosophySection() {
  return (
    <SectionWrapper
      id="philosophy"
      eyebrow="The Core Philosophy"
      title="Marketplace First, AI Second"
      subtitle="EduBek's AI never starts by creating something new. It first searches everything teachers have already built, evaluates it, customizes it, combines it — and only generates new content as the absolute last resort."
    >
      <Card className="overflow-hidden border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="size-5 text-violet-400" aria-hidden="true" />
            The 5-Step AI Decision Process
          </CardTitle>
          <CardDescription>
            Every AI request flows through these five gates, in order. Generation is the
            last option, not the first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-4 lg:grid-cols-5">
            {AI_DECISION_STEPS.map((step, index) => {
              const isLast = step.step === AI_DECISION_STEPS.length
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
                        Last resort
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/15 text-emerald-300"
                      >
                        Step {step.step}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground">
                    {step.action}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {step.question}
                  </p>
                  <p className="mt-2 text-xs font-medium text-foreground/80">
                    {step.outcome}
                  </p>

                  {/* Connector arrow */}
                  {index < AI_DECISION_STEPS.length - 1 && (
                    <span
                      className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-muted-foreground lg:block"
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
  )
}

// ---------------------------------------------------------------------------
// 3. The 10 Systems
// ---------------------------------------------------------------------------

function SystemsSection() {
  return (
    <SectionWrapper
      id="systems"
      eyebrow="The 10 Systems"
      title="One Platform, Ten Connected Systems"
      subtitle="Each system owns one responsibility. Together they form a single connected ecosystem — boundaries exist for developers, never for users."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {SYSTEMS_DATA.map((system) => {
          const Icon: LucideIcon = getIcon(system.icon)
          return (
            <Card
              key={system.id}
              className="group relative overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5"
            >
              {/* Top gradient accent bar */}
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
                    <CardTitle className="text-lg">{system.name}</CardTitle>
                    <CardDescription className="mt-1 text-xs uppercase tracking-wider text-muted-foreground/70">
                      System {String(SYSTEMS_DATA.indexOf(system) + 1).padStart(2, "0")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {system.responsibility}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </SectionWrapper>
  )
}

// ---------------------------------------------------------------------------
// 4. The Ecosystem — 6 User Roles
// ---------------------------------------------------------------------------

function EcosystemSection() {
  return (
    <SectionWrapper
      id="ecosystem"
      eyebrow="The Ecosystem"
      title="Six Roles, One Connected Loop"
      subtitle="Teachers, students, creators, schools, admins, and the AI Assistant itself — each role has a clear goal, and every action strengthens the others."
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {USER_ROLE_DATA.map((role) => {
          const Icon: LucideIcon = getIcon(role.icon)
          const accent =
            ROLE_ACCENTS[role.id] ?? "from-emerald-500/15 to-teal-500/10 text-emerald-300 border-emerald-500/30"
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
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">{role.goal}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <Separator className="mb-4 opacity-50" />
                <ul className="space-y-2">
                  {role.actions.map((action) => (
                    <li
                      key={action}
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
  )
}

// ---------------------------------------------------------------------------
// 5. Content Lifecycle
// ---------------------------------------------------------------------------

function LifecycleSection() {
  return (
    <SectionWrapper
      id="lifecycle"
      eyebrow="Content Lifecycle"
      title="How Knowledge Lives and Grows"
      subtitle="Every piece of content in EduBek moves through this ten-step cycle. Step ten feeds back into step one — for new teachers, the work of past teachers is already waiting."
    >
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/60 via-teal-500/40 to-violet-500/60 sm:left-6"
          aria-hidden="true"
        />

        <ol className="space-y-5">
          {CONTENT_LIFECYCLE_STEPS.map((item) => (
            <li key={item.step} className="relative pl-16 sm:pl-20">
              <span className="absolute left-0 top-0 flex size-11 items-center justify-center rounded-full border border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 font-mono text-sm font-bold text-emerald-300 shadow-lg sm:size-12">
                {String(item.step).padStart(2, "0")}
              </span>
              <Card className="border-border/60 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-md">
                <CardContent className="py-5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-foreground">
                        {item.title}
                      </h3>
                      {item.step === CONTENT_LIFECYCLE_STEPS.length && (
                        <Badge className="bg-violet-500/15 text-violet-300">
                          <Repeat className="size-3" aria-hidden="true" />
                          Loops to step 1
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>

        {/* Loop indicator */}
        <div className="mt-6 flex justify-center pl-16 sm:pl-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
            <Repeat className="size-4 animate-pulse" aria-hidden="true" />
            Step 10 → Step 1: future teachers inherit a richer library
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

// ---------------------------------------------------------------------------
// 6. The Dual-Currency Economy
// ---------------------------------------------------------------------------

function EconomySection() {
  return (
    <SectionWrapper
      id="economy"
      eyebrow="The Dual-Currency Economy"
      title="Real Money Rewards Expertise. EduTokens Power AI."
      subtitle="Two currencies, two purposes. Real Money preserves long-term value from human expertise. EduTokens pay for short-lived computational work performed by the AI."
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
                <CardTitle className="text-xl">{ECONOMY_DATA.realMoney.name}</CardTitle>
                <CardDescription className="text-xs uppercase tracking-wider">
                  {ECONOMY_DATA.realMoney.usedFor}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-background/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Represents
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {ECONOMY_DATA.realMoney.represents}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-300">
                <Heart className="size-3" aria-hidden="true" />
                Long-term value
              </Badge>
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-300">
                <GraduationCap className="size-3" aria-hidden="true" />
                Human expertise
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
                <CardTitle className="text-xl">{ECONOMY_DATA.eduTokens.name}</CardTitle>
                <CardDescription className="text-xs uppercase tracking-wider">
                  {ECONOMY_DATA.eduTokens.usedFor}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-background/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                Represents
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {ECONOMY_DATA.eduTokens.represents}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Spent on
              </p>
              <div className="flex flex-wrap gap-2">
                {ECONOMY_DATA.eduTokens.examples.map((ex) => (
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
  )
}

// ---------------------------------------------------------------------------
// 7. The 14 Design Principles
// ---------------------------------------------------------------------------

function PrinciplesSection() {
  return (
    <SectionWrapper
      id="principles"
      eyebrow="The 14 Design Principles"
      title="The Constitution of EduBek"
      subtitle="Every feature, decision, and line of code is measured against these fourteen principles. Explore them by group:"
    >
      <PrinciplesTabs />

      {/* Quick reference — all principles at a glance */}
      <div className="mt-12">
        <Separator className="mb-8 opacity-50" />
        <h3 className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          All 14 principles at a glance
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {DESIGN_PRINCIPLES.map((p) => (
            <Badge
              key={p.id}
              variant="outline"
              className="border-border/60 bg-card/40 py-1.5 font-medium text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-foreground"
              title={p.title}
            >
              <span className="mr-1 font-mono text-emerald-400">
                {String(p.id).padStart(2, "0")}
              </span>
              {p.title}
            </Badge>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

// ---------------------------------------------------------------------------
// 8. The Continuous Cycle
// ---------------------------------------------------------------------------

const CYCLE_STAGES = [
  { step: 1, label: "Teachers create content", icon: PenTool },
  { step: 2, label: "Published to Marketplace", icon: Store },
  { step: 3, label: "Other teachers discover", icon: Search },
  { step: 4, label: "AI customizes", icon: Sparkles },
  { step: 5, label: "Students learn", icon: BookOpen },
  { step: 6, label: "Data collected", icon: BarChart3 },
  { step: 7, label: "AI analyzes", icon: Brain },
  { step: 8, label: "Teachers improve", icon: Lightbulb },
  { step: 9, label: "Republished", icon: Layers },
  { step: 10, label: "Future teachers benefit", icon: Rocket },
] as const

function CycleSection() {
  const radius = 42 // percentage of container

  return (
    <SectionWrapper
      id="cycle"
      eyebrow="The Continuous Cycle"
      title="A Self-Improving Ecosystem"
      subtitle="Knowledge never disappears in EduBek — it compounds. Each loop makes the library richer for the next teacher who joins."
    >
      <div className="mx-auto max-w-3xl">
        <div className="relative aspect-square w-full">
          {/* Outer rotating ring */}
          <div
            className="absolute inset-[8%] rounded-full border border-dashed border-emerald-500/30"
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 animate-spin rounded-full border-t-2 border-emerald-400/60"
              style={{ animationDuration: "20s" }}
            />
          </div>

          {/* Inner solid ring */}
          <div
            className="absolute inset-[18%] rounded-full border border-border/40 bg-card/20 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Center label */}
          <div className="absolute left-1/2 top-1/2 flex size-[28%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-violet-500/20 text-center shadow-2xl">
            <Repeat className="size-5 text-emerald-300" aria-hidden="true" />
            <p className="mt-1 px-2 text-[10px] font-semibold leading-tight text-foreground sm:text-xs">
              Self-Improving Ecosystem
            </p>
          </div>

          {/* Stage nodes positioned around the circle */}
          <ol className="absolute inset-0" aria-label="Self-improving ecosystem cycle">
            {CYCLE_STAGES.map((stage, index) => {
              const angle = (-90 + index * (360 / CYCLE_STAGES.length)) * (Math.PI / 180)
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
                      {stage.label}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Each pass through the loop leaves the library richer than it was before —
          for the next teacher, the next class, and the next generation of learners.
        </p>
      </div>
    </SectionWrapper>
  )
}

// ---------------------------------------------------------------------------
// 9. The Long-Term Vision
// ---------------------------------------------------------------------------

const VISION_PILLARS = [
  {
    title: "AI amplifies human expertise",
    description: "Teachers remain the decision-makers. AI removes repetitive work so educators can focus on what only humans can do.",
    icon: Sparkles,
    accent: "from-violet-500 to-purple-600",
  },
  {
    title: "Every teacher saves time",
    description: "Reuse, customize, and combine — instead of starting from scratch every lesson.",
    icon: GraduationCap,
    accent: "from-emerald-500 to-teal-600",
  },
  {
    title: "Every creator is rewarded",
    description: "Real Money flows back to the teachers whose materials the community relies on.",
    icon: CircleDollarSign,
    accent: "from-amber-500 to-orange-600",
  },
  {
    title: "Every student deserves better learning",
    description: "Materials that have been tested in real classrooms and improved through real data.",
    icon: BookOpen,
    accent: "from-sky-500 to-cyan-600",
  },
  {
    title: "The Marketplace becomes the world's educational library",
    description: "One shared, searchable, ever-growing home for educational knowledge — owned by the educators who built it.",
    icon: Layers,
    accent: "from-pink-500 to-rose-600",
  },
] as const

function VisionSection() {
  return (
    <SectionWrapper
      id="vision"
      eyebrow="The Long-Term Vision"
      title="Why EduBek Exists"
      subtitle=""
    >
      <figure className="mx-auto max-w-4xl text-center">
        <blockquote className="text-2xl font-bold leading-snug text-foreground sm:text-3xl">
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-violet-300 bg-clip-text text-transparent">
            EduBek exists to connect educators, knowledge, and artificial intelligence
            into one ecosystem where everyone benefits.
          </span>
        </blockquote>
      </figure>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {VISION_PILLARS.map((pillar, index) => {
          const Icon = pillar.icon
          const isWide = index === VISION_PILLARS.length - 1
          return (
            <Card
              key={pillar.title}
              className={`group relative overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isWide ? "lg:col-span-3" : ""
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
                    {pillar.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
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
              Ready to see what education can become?
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              EduBek is being built in the open. This page is a live preview of the
              architecture being assembled — the foundation of a smarter, more
              connected education ecosystem.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.02]"
            >
              <a href="#top">
                <Sparkles className="size-4" aria-hidden="true" />
                Back to the top
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </SectionWrapper>
  )
}

// ---------------------------------------------------------------------------
// 10. Footer
// ---------------------------------------------------------------------------

function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-violet-500 text-sm font-black text-white shadow-lg">
              E
            </span>
            <div className="text-left">
              <p className="text-base font-bold">EduBek</p>
              <p className="text-xs text-muted-foreground">
                AI-Powered Education Ecosystem
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-300"
            >
              <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-emerald-400" />
              Phase 1 — Architecture Preview
            </Badge>
            <p className="max-w-md text-xs text-muted-foreground">
              This is a live preview of the platform foundation being built. All
              systems, principles, and lifecycle stages shown here are the
              architectural blueprint of EduBek.
            </p>
          </div>
        </div>

        <Separator className="my-8 opacity-50" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} EduBek. Reuse existing knowledge first.
            Create new knowledge only when necessary.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Users className="size-3" aria-hidden="true" />
              For educators, by educators
            </span>
          </div>
        </div>
      </div>
    </footer>
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
