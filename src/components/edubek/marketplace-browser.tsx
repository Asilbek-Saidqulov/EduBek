"use client"

/**
 * MarketplaceBrowser — real-data marketplace section.
 *
 * Receives the SSR-fetched list of published quizzes as `initialQuizzes`,
 * then handles category filtering, search, and the "Play Sample" modal
 * fully client-side. Clicking "Play Sample" fetches the full quiz detail
 * from /api/quiz/[id] (which returns correctIndex for client grading) and
 * hands it to the shared <QuizPlayer />.
 */

import * as React from "react"
import {
  BadgeCheck,
  Coins,
  Loader2,
  Play,
  Search,
  Star,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  CATEGORIES,
  type MarketplaceQuizDto,
} from "@/features/marketplace"
import type { QuizDetailDto } from "@/features/quiz"
import { getQuizRating } from "@/lib/edubek/ratings"
import { QuizPlayer } from "./quiz-player"

interface MarketplaceBrowserProps {
  initialQuizzes: MarketplaceQuizDto[]
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label])
)

function difficultyClasses(difficulty: string): string {
  switch (difficulty) {
    case "easy":
      return "border-emerald-500/40 text-emerald-400"
    case "medium":
      return "border-amber-500/40 text-amber-400"
    case "hard":
      return "border-rose-500/40 text-rose-400"
    default:
      return ""
  }
}

function categoryColor(category: string): string {
  // A small palette so each category has its own accent in the card header.
  const map: Record<string, string> = {
    mathematics: "from-sky-500/15 to-cyan-500/15 text-sky-300",
    science: "from-emerald-500/15 to-teal-500/15 text-emerald-300",
    language: "from-amber-500/15 to-orange-500/15 text-amber-300",
    history: "from-rose-500/15 to-red-500/15 text-rose-300",
    technology: "from-violet-500/15 to-purple-500/15 text-violet-300",
    geography: "from-lime-500/15 to-green-500/15 text-lime-300",
  }
  return map[category] ?? "from-slate-500/15 to-gray-500/15 text-slate-300"
}

function formatPrice(quiz: MarketplaceQuizDto): string {
  if (quiz.tier === "free" || (quiz.priceFiat === 0 && quiz.priceEduTokens === 0)) {
    return "Free"
  }
  if (quiz.priceFiat > 0) {
    return `$${quiz.priceFiat.toFixed(2)}`
  }
  return `${quiz.priceEduTokens} EduTokens`
}

export function MarketplaceBrowser({ initialQuizzes }: MarketplaceBrowserProps) {
  const [activeCategory, setActiveCategory] = React.useState<string>("all")
  const [search, setSearch] = React.useState("")
  // Tiny "filtering" delay to make the perceived performance feel intentional.
  const [isFiltering, setIsFiltering] = React.useState(false)

  // Play Sample dialog state.
  const [playingQuiz, setPlayingQuiz] = React.useState<MarketplaceQuizDto | null>(null)
  const [detail, setDetail] = React.useState<QuizDetailDto | null>(null)
  const [detailStatus, setDetailStatus] = React.useState<"idle" | "loading" | "error">("idle")
  const [detailError, setDetailError] = React.useState<string>("")

  // Debounced search/filter effect.
  const filterTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(() => {
    setIsFiltering(true)
    if (filterTimer.current) clearTimeout(filterTimer.current)
    filterTimer.current = setTimeout(() => setIsFiltering(false), 220)
    return () => {
      if (filterTimer.current) clearTimeout(filterTimer.current)
    }
  }, [activeCategory, search])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return initialQuizzes.filter((quiz) => {
      if (activeCategory !== "all" && quiz.category !== activeCategory) return false
      if (q) {
        const hay = `${quiz.title} ${quiz.description ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [initialQuizzes, activeCategory, search])

  const openPlayer = React.useCallback(async (quiz: MarketplaceQuizDto) => {
    setPlayingQuiz(quiz)
    setDetail(null)
    setDetailStatus("loading")
    setDetailError("")
    try {
      const res = await fetch(`/api/quiz/${quiz.id}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Couldn't load this quiz.")
      }
      setDetail(data as QuizDetailDto)
      setDetailStatus("idle")
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : "Failed to load quiz."
      )
      setDetailStatus("error")
    }
  }, [])

  const closePlayer = () => {
    setPlayingQuiz(null)
    setDetail(null)
    setDetailStatus("idle")
    setDetailError("")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------------------------------------------------------- */}
      {/* Filter + search bar                                              */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes by title or topic…"
            aria-label="Search marketplace quizzes"
            className="h-11 pl-9"
          />
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
                  active
                    ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                    : "border-border/60 bg-card/40 text-muted-foreground hover:border-amber-500/40 hover:text-amber-200"
                )}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Result meta                                                      */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} {filtered.length === 1 ? "quiz" : "quizzes"} available
          {activeCategory !== "all" ? (
            <>
              {" "}in{" "}
              <span className="font-medium text-foreground">
                {CATEGORY_LABELS[activeCategory]}
              </span>
            </>
          ) : null}
        </span>
        {isFiltering ? (
          <span className="flex items-center gap-1.5 text-xs">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Filtering…
          </span>
        ) : null}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Grid                                                             */}
      {/* ---------------------------------------------------------------- */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-5" aria-hidden />
            </div>
            <p className="font-medium">No quizzes match your search</p>
            <p className="text-sm text-muted-foreground">
              Try a different category or clear the search to see all marketplace quizzes.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSearch("")
                setActiveCategory("all")
              }}
            >
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((quiz) => {
            const ratingInfo = getQuizRating(quiz.title)
            return (
              <MarketplaceQuizCard
                key={quiz.id}
                quiz={quiz}
                rating={ratingInfo.rating}
                purchases={ratingInfo.purchases}
                onPlay={() => openPlayer(quiz)}
              />
            )
          })}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Play Sample modal                                                */}
      {/* ---------------------------------------------------------------- */}
      <Dialog
        open={playingQuiz !== null}
        onOpenChange={(open) => {
          if (!open) closePlayer()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              {playingQuiz ? (
                <>
                  <Badge variant="secondary" className="capitalize">
                    {playingQuiz.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("capitalize", difficultyClasses(playingQuiz.difficulty))}
                  >
                    {playingQuiz.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {playingQuiz.questionCount} questions
                  </Badge>
                </>
              ) : null}
            </div>
            <DialogTitle className="text-xl pr-6">
              {playingQuiz?.title ?? "Play sample"}
            </DialogTitle>
            <DialogDescription>
              {playingQuiz?.description ?? "Try a sample quiz from the EduBek marketplace."}
            </DialogDescription>
          </DialogHeader>

          {detailStatus === "loading" ? (
            <div className="flex flex-col gap-3 py-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading quiz…
              </div>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : null}

          {detailStatus === "error" ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">{detailError}</p>
              <Button variant="outline" size="sm" onClick={closePlayer}>
                Close
              </Button>
            </div>
          ) : null}

          {detail ? (
            <QuizPlayer
              title={detail.title}
              description={detail.description}
              questions={detail.questions}
              difficulty={detail.difficulty}
              category={detail.category}
              hideReset
              resetLabel="Play again"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

interface MarketplaceQuizCardProps {
  quiz: MarketplaceQuizDto
  rating: number
  purchases: number
  onPlay: () => void
}

function MarketplaceQuizCard({
  quiz,
  rating,
  purchases,
  onPlay,
}: MarketplaceQuizCardProps) {
  const catColor = categoryColor(quiz.category)
  return (
    <Card
      className={cn(
        "group relative gap-0 overflow-hidden py-0 transition-all",
        "hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-900/10"
      )}
    >
      {/* Header strip with category color */}
      <div
        className={cn(
          "relative h-20 bg-gradient-to-br px-5 py-4",
          catColor
        )}
      >
        <div className="flex items-start justify-between">
          <Badge
            variant="outline"
            className="border-white/20 bg-black/20 capitalize text-white backdrop-blur-sm"
          >
            {quiz.category}
          </Badge>
          {quiz.isFeatured ? (
            <Badge className="bg-amber-500/90 text-amber-950 hover:bg-amber-500">
              <Star className="size-3" aria-hidden />
              Featured
            </Badge>
          ) : null}
        </div>
      </div>

      <CardContent className="flex flex-col gap-3 p-5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">
          {quiz.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {quiz.description ?? "No description provided."}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className={cn("capitalize", difficultyClasses(quiz.difficulty))}
          >
            {quiz.difficulty}
          </Badge>
          <span className="inline-flex items-center gap-1">
            <Star className="size-3 text-amber-400" aria-hidden />
            <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
            <span aria-hidden>·</span>
            <span>{purchases.toLocaleString()} sold</span>
          </span>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2 border-y border-border/40 py-2.5">
          <span
            className="inline-flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 text-xs font-semibold text-amber-200"
            aria-hidden
          >
            {quiz.creator.avatarInitials}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1 text-xs font-medium leading-tight">
              <span className="truncate">{quiz.creator.name}</span>
              {quiz.creator.verificationStatus === "verified" ? (
                <BadgeCheck className="size-3 shrink-0 text-sky-400" aria-hidden />
              ) : null}
            </span>
            <span className="text-[11px] text-muted-foreground">
              @{quiz.creator.username}
            </span>
          </div>
        </div>

        {/* Footer: price + CTA */}
        <CardFooter className="justify-between px-0 pb-1 pt-1">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Price
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                quiz.tier === "free" ? "text-emerald-400" : "text-amber-300"
              )}
            >
              {quiz.tier === "free" ? (
                "Free"
              ) : quiz.priceFiat > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <span>${quiz.priceFiat.toFixed(2)}</span>
                  {quiz.priceEduTokens > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-xs font-normal text-violet-300">
                      <Coins className="size-3" aria-hidden />
                      {quiz.priceEduTokens}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Coins className="size-3" aria-hidden />
                  {quiz.priceEduTokens} EduTokens
                </span>
              )}
            </span>
          </div>
          <Button
            size="sm"
            onClick={onPlay}
            className="bg-amber-500 text-amber-950 hover:bg-amber-400"
          >
            <Play className="size-3.5" aria-hidden />
            Play Sample
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  )
}
