"use client"

/**
 * QuizPlayer — shared interactive quiz-taking widget.
 *
 * Used by:
 *   - <AiQuizGenerator />      (renders AI-generated quizzes)
 *   - <MarketplaceBrowser />   (renders the "Play Sample" modal)
 *
 * Local grading: the API returns `correctIndex` for every question so the
 * client can grade answers without a round-trip. This is intentional for
 * the public preview surface.
 */

import * as React from "react"
import {
  Award,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { PlayableQuestion } from "@/features/quiz"

export interface QuizPlayerProps {
  title: string
  description?: string | null
  questions: PlayableQuestion[]
  difficulty?: string
  category?: string
  /**
   * Optional callback when the user clicks the "Try again" / reset button
   * at the end. If omitted, the player resets its own internal state.
   */
  onReset?: () => void
  resetLabel?: string
  /** Hide the reset button entirely (useful inside a Dialog). */
  hideReset?: boolean
  className?: string
}

interface AnswerState {
  selectedIndex: number
  revealed: boolean
}

export function QuizPlayer({
  title,
  description,
  questions,
  difficulty,
  category,
  onReset,
  resetLabel = "Try again",
  hideReset = false,
  className,
}: QuizPlayerProps) {
  // Stable key per question slot. AI-generated quizzes don't have ids,
  // so we fall back to the array index.
  const slotIds = React.useMemo(
    () => questions.map((q, i) => q.id ?? `slot-${i}`),
    [questions]
  )

  const [answers, setAnswers] = React.useState<Record<string, AnswerState>>({})

  const handleSelect = (slotId: string, optionIndex: number) => {
    setAnswers((prev) => {
      if (prev[slotId]?.revealed) return prev // lock once revealed
      return {
        ...prev,
        [slotId]: { selectedIndex: optionIndex, revealed: true },
      }
    })
  }

  const answeredCount = Object.values(answers).filter((a) => a.revealed).length
  const totalCount = questions.length
  const correctCount = questions.reduce((acc, q, i) => {
    const state = answers[slotIds[i]]
    if (state?.revealed && state.selectedIndex === q.correctIndex) return acc + 1
    return acc
  }, 0)
  const allAnswered = answeredCount === totalCount && totalCount > 0
  const scorePct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0

  const resetInternal = () => {
    setAnswers({})
    onReset?.()
  }

  if (totalCount === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No questions available.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* Quiz header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {category && (
            <Badge variant="secondary" className="capitalize">
              {category}
            </Badge>
          )}
          {difficulty && (
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                difficulty === "easy" && "border-emerald-500/40 text-emerald-400",
                difficulty === "medium" && "border-amber-500/40 text-amber-400",
                difficulty === "hard" && "border-rose-500/40 text-rose-400"
              )}
            >
              {difficulty}
            </Badge>
          )}
          <Badge variant="outline">{totalCount} questions</Badge>
        </div>
        <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Answered <span className="font-medium text-foreground">{answeredCount}</span> of {totalCount}
          </span>
          <span>
            Score <span className="font-medium text-foreground">{correctCount}</span> / {totalCount}
          </span>
        </div>
        <Progress value={scorePct} className="h-1.5 bg-emerald-500/15 [&>div]:bg-emerald-500" />
      </div>

      {/* Questions */}
      <ol className="flex flex-col gap-4">
        {questions.map((q, i) => {
          const slotId = slotIds[i]
          const state = answers[slotId]
          const revealed = state?.revealed ?? false
          const userIndex = state?.selectedIndex
          const isCorrect = revealed && userIndex === q.correctIndex

          return (
            <Card
              key={slotId}
              className={cn(
                "overflow-hidden border-border/60 py-0",
                revealed && isCorrect && "border-emerald-500/40",
                revealed && !isCorrect && "border-rose-500/40"
              )}
            >
              <CardHeader className="gap-2 px-4 pt-4 pb-3 sm:px-5">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      revealed && isCorrect
                        ? "bg-emerald-500/15 text-emerald-400"
                        : revealed && !isCorrect
                          ? "bg-rose-500/15 text-rose-400"
                          : "bg-muted text-muted-foreground"
                    )}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <h4 className="text-sm font-medium leading-relaxed sm:text-base">
                    {q.question}
                  </h4>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-5">
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isUserPick = revealed && userIndex === optIdx
                    const isCorrectOption = optIdx === q.correctIndex

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={revealed}
                        onClick={() => handleSelect(slotId, optIdx)}
                        aria-pressed={isUserPick}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all sm:px-4 sm:py-3 sm:text-base",
                          "border-border/60 bg-card/40 hover:border-emerald-500/40 hover:bg-emerald-500/5",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                          revealed && !isCorrectOption && !isUserPick && "opacity-50",
                          revealed && isCorrectOption &&
                            "border-emerald-500/60 bg-emerald-500/10 text-emerald-100",
                          revealed && isUserPick && !isCorrectOption &&
                            "border-rose-500/60 bg-rose-500/10 text-rose-100",
                          revealed && "cursor-default"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                            "border-border/60 group-hover:border-emerald-500/50",
                            revealed && isCorrectOption && "border-emerald-500/60 bg-emerald-500/20",
                            revealed && isUserPick && !isCorrectOption && "border-rose-500/60 bg-rose-500/20"
                          )}
                          aria-hidden
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {revealed && isCorrectOption ? (
                          <CheckCircle2 className="size-4 text-emerald-400" aria-hidden />
                        ) : null}
                        {revealed && isUserPick && !isCorrectOption ? (
                          <XCircle className="size-4 text-rose-400" aria-hidden />
                        ) : null}
                      </button>
                    )
                  })}
                </div>

                {revealed && q.explanation ? (
                  <div
                    className={cn(
                      "mt-3 flex gap-2 rounded-lg border px-3 py-2.5 text-xs sm:text-sm",
                      isCorrect
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-100"
                        : "border-amber-500/30 bg-amber-500/5 text-amber-100"
                    )}
                    role="status"
                  >
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {isCorrect ? "Correct!" : "Not quite."}
                      </span>
                      <span className="text-muted-foreground">{q.explanation}</span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </ol>

      {/* Final score + reset */}
      {allAnswered ? (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <Award className="size-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your score</p>
                <p className="text-2xl font-semibold tracking-tight">
                  {correctCount} / {totalCount}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({Math.round((correctCount / totalCount) * 100)}%)
                  </span>
                </p>
              </div>
            </div>
            {!hideReset ? (
              <Button
                variant="outline"
                onClick={resetInternal}
                className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
              >
                <RefreshCw className="size-4" aria-hidden />
                {resetLabel}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
