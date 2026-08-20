import { getTranslations, setRequestLocale } from "next-intl/server"

import { LandingHeader } from "@/components/edubek/landing-header"
import { QuickJoinPanel } from "@/components/edubek/quick-join-panel"
import { Mascot } from "@/components/edubek/mascots"

export const dynamic = "force-dynamic"

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations("nav")

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
        {/* Playful gradient blobs — no copy, just color */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-24 -top-24 size-72 rounded-full bg-teacher/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 size-80 rounded-full bg-ai/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 size-64 -translate-x-1/2 rounded-full bg-student/10 blur-3xl" />
        </div>

        <div className="relative flex w-full max-w-md flex-col items-center gap-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-2xl" />
            <Mascot name="robot" size={96} className="relative text-violet-500" />
          </div>

          <QuickJoinPanel locale={locale} />

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <a href="/login" className="hover:text-foreground">
              {tNav("login")}
            </a>
            <span aria-hidden>·</span>
            <a href="/register" className="hover:text-foreground">
              {tNav("register")}
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

// ===========================================================================
// Footer — one line, no fluff
// ===========================================================================

function SiteFooter() {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 text-xs text-muted-foreground">
        <Mascot name="notebook" size={16} />
        <span>EduBek © 2026</span>
      </div>
    </footer>
  )
}
