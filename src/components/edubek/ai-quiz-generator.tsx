"use client"

/**
 * AiQuizGenerator — the killer feature of the EduBek landing page.
 *
 * Visitors can type any topic, pick a difficulty + question count, and
 * generate a real, playable quiz in 5-15s via POST /api/quiz/generate
 * (which calls the AI LLM under the hood).
 *
 * UX:
 *   1. Form (topic input + difficulty select + count select + example chips)
 *   2. Loading state (skeleton + "Generating your quiz..." + progress hints)
 *   3. Generated quiz rendered via <QuizPlayer />
 *   4. Error state with a "Try Again" button (never crashes the page)
 *   5. "Save to Marketplace" → toast (sign-up CTA), "Generate Another" → reset
 */

import * as React from "react"
import {
  AlertTriangle,
  Bookmark,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { AiQuizResultDto, AiDifficulty } from "@/features/ai"
import type { PlayableQuestion } from "@/features/quiz"
import { QuizPlayer } from "./quiz-player"

const EXAMPLE_TOPICS = [
  "Photosynthesis",
  "World War II",
  "Python loops",
  "Fractions",
  "The water cycle",
  "Shakespeare",
]

type Status = "idle" | "loading" | "success" | "error"

interface GeneratedQuiz {
  title: string
  description: string
  questions: PlayableQuestion[]
  metadata: AiQuizResultDto["metadata"]
}

const LOADING_HINTS = [
  "Understanding your topic…",
  "Drafting multiple-choice questions…",
  "Writing explanations…",
  "Polishing answer choices…",
  "Almost ready…",
]

export function AiQuizGenerator() {
  const { toast } = useToast()

  const [topic, setTopic] = React.useState("")
  const [difficulty, setDifficulty] = React.useState<AiDifficulty>("medium")
  const [count, setCount] = React.useState<number>(5)

  const [status, setStatus] = React.useState<Status>("idle")
  const [errorMsg, setErrorMsg] = React.useState<string>("")
  const [quiz, setQuiz] = React.useState<GeneratedQuiz | null>(null)
  const [hintIdx, setHintIdx] = React.useState(0)

  // Cycle the loading hint every ~1.8s while generating.
  React.useEffect(() => {
    if (status !== "loading") return
    setHintIdx(0)
    const id = window.setInterval(() => {
      setHintIdx((prev) => (prev + 1) % LOADING_HINTS.length)
    }, 1800)
    return () => window.clearInterval(id)
  }, [status])

  const canSubmit = topic.trim().length >= 3 && status !== "loading"

  const handleGenerate = async () => {
    if (!canSubmit) return
    setStatus("loading")
    setErrorMsg("")
    setQuiz(null)

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
          count,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate quiz.")
      }

      // Normalize questions into the shared PlayableQuestion shape (with stable ids).
      const questions: PlayableQuestion[] = (data.questions || []).map(
        (q: AiQuizResultDto["questions"][number], i: number) => ({
          id: `ai-q-${i}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          orderNum: i,
        })
      )

      if (questions.length === 0) {
        throw new Error("The AI didn't produce any usable questions. Try again.")
      }

      setQuiz({
        title: data.title,
        description: data.description,
        questions,
        metadata: data.metadata,
      })
      setStatus("success")
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      )
      setStatus("error")
    }
  }

  const handleReset = () => {
    setStatus("idle")
    setQuiz(null)
    setErrorMsg("")
  }

  const handleSaveToMarketplace = () => {
    toast({
      title: "Sign up to publish",
      description:
        "Create a free EduBek account to save, publish, and earn from your AI-generated quizzes.",
    })
  }

  return (
    <Card className="overflow-hidden border-violet-500/20 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <CardHeader className="gap-2 border-b border-border/40 px-5 pb-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="inline-flex size-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
            <Wand2 className="size-5" aria-hidden />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-tight">AI Quiz Generator</span>
            <span className="text-xs text-muted-foreground">
              Live · powered by EduBek AI
            </span>
          </div>
          <Badge
            variant="outline"
            className="ml-auto border-violet-500/40 text-violet-300"
          >
            <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-violet-400" />
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 px-5 py-5 sm:px-6">
        {/* ---------------------------------------------------------------- */}
        {/* Idle / loading / error: form                                     */}
        {/* ---------------------------------------------------------------- */}
        {status !== "success" ? (
          <div className="flex flex-col gap-5">
            {/* Topic */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="ai-topic" className="text-sm font-medium">
                What do you want to teach?
              </Label>
              <Input
                id="ai-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) handleGenerate()
                }}
                placeholder="e.g. Photosynthesis, World War II, Python loops"
                disabled={status === "loading"}
                maxLength={120}
                aria-describedby="ai-topic-help"
              />
              <div
                id="ai-topic-help"
                className="flex flex-wrap items-center gap-1.5"
              >
                <span className="text-xs text-muted-foreground">Try:</span>
                {EXAMPLE_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={status === "loading"}
                    onClick={() => setTopic(t)}
                    className="rounded-full border border-border/60 bg-background/40 px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-violet-500/50 hover:text-violet-300 disabled:opacity-50"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty + count */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ai-difficulty" className="text-sm font-medium">
                  Difficulty
                </Label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v as AiDifficulty)}
                  disabled={status === "loading"}
                >
                  <SelectTrigger id="ai-difficulty" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ai-count" className="text-sm font-medium">
                  Questions
                </Label>
                <Select
                  value={String(count)}
                  onValueChange={(v) => setCount(Number(v))}
                  disabled={status === "loading"}
                >
                  <SelectTrigger id="ai-count" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 questions</SelectItem>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error */}
            {status === "error" ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-3 text-sm text-rose-200"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-400" aria-hidden />
                <div className="flex flex-1 flex-col gap-2">
                  <span className="font-medium">Couldn&apos;t generate the quiz.</span>
                  <span className="text-rose-200/80">{errorMsg}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerate}
                    className="mt-1 w-fit border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
                  >
                    <RefreshCw className="size-3.5" aria-hidden />
                    Try again
                  </Button>
                </div>
              </div>
            ) : null}

            {/* CTA */}
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!canSubmit}
              className={cn(
                "w-full bg-violet-600 text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500",
                "focus-visible:ring-violet-500/50"
              )}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Generating your quiz…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" aria-hidden />
                  Generate Quiz
                </>
              )}
            </Button>

            {/* Loading skeleton */}
            {status === "loading" ? (
              <div
                className="flex flex-col gap-4 rounded-xl border border-violet-500/15 bg-violet-500/5 p-4"
                aria-live="polite"
              >
                <div className="flex items-center gap-2 text-sm text-violet-200">
                  <Loader2 className="size-4 animate-spin text-violet-400" aria-hidden />
                  <span>{LOADING_HINTS[hintIdx]}</span>
                </div>
                <Skeleton className="h-3 w-2/3 bg-violet-500/15" />
                <Skeleton className="h-20 w-full bg-violet-500/10" />
                <Skeleton className="h-20 w-full bg-violet-500/10" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Zap className="size-3 text-violet-400" aria-hidden />
                  <span>
                    AI quizzes take 5-15 seconds. We&apos;re crafting real questions, not a template.
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ---------------------------------------------------------------- */}
        {/* Success: rendered quiz                                           */}
        {/* ---------------------------------------------------------------- */}
        {status === "success" && quiz ? (
          <div className="flex flex-col gap-5">
            <QuizPlayer
              title={quiz.title}
              description={quiz.description}
              questions={quiz.questions}
              difficulty={quiz.metadata.difficulty}
              category={quiz.metadata.topic}
              hideReset
            />

            <div className="flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="border-violet-500/40 text-violet-300">
                  AI-generated
                </Badge>
                <span>
                  Model: <span className="font-mono text-foreground">{quiz.metadata.model}</span>
                </span>
                <span aria-hidden>·</span>
                <span>{quiz.questions.length} questions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveToMarketplace}
                  className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
                >
                  <Bookmark className="size-4" aria-hidden />
                  Save to Marketplace
                </Button>
                <Button
                  onClick={handleReset}
                  className="bg-violet-600 text-white hover:bg-violet-500"
                >
                  <RefreshCw className="size-4" aria-hidden />
                  Generate Another
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
