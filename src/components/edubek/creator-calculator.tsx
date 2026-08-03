"use client"

/**
 * CreatorCalculator — client-side monthly earnings estimator.
 *
 * No API call: simple math applied to two inputs to give a ballpark of what
 * a creator might earn publishing on the EduBek marketplace. The 70% revenue
 * share mirrors the standard creator-economy split.
 */

import * as React from "react"
import { Coins, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const CREATOR_REVENUE_SHARE = 0.7
const DEFAULT_AVG_PRICE = 4.99
const DEFAULT_MONTHLY_PURCHASES_PER_QUIZ = 18

export function CreatorCalculator() {
  const [quizCount, setQuizCount] = React.useState<number>(10)
  const [avgPrice, setAvgPrice] = React.useState<number>(DEFAULT_AVG_PRICE)

  const monthlyPurchases = React.useMemo(
    () => Math.max(0, quizCount) * DEFAULT_MONTHLY_PURCHASES_PER_QUIZ,
    [quizCount]
  )
  const grossRevenue = monthlyPurchases * Math.max(0, avgPrice)
  const creatorEarnings = grossRevenue * CREATOR_REVENUE_SHARE
  const annualEarnings = creatorEarnings * 12

  return (
    <Card className="overflow-hidden border-pink-500/20 bg-card/60">
      <CardContent className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_1fr]">
        {/* Inputs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="quiz-count" className="text-sm font-medium">
              Quizzes published
            </Label>
            <Input
              id="quiz-count"
              type="number"
              min={0}
              max={500}
              value={quizCount}
              onChange={(e) => setQuizCount(Number(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              More quizzes means more surface area for discovery and purchase.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="avg-price" className="text-sm font-medium">
              Average price (USD)
            </Label>
            <Input
              id="avg-price"
              type="number"
              min={0}
              step={0.5}
              value={avgPrice}
              onChange={(e) => setAvgPrice(Number(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Free quizzes earn through EduToken AI usage; paid quizzes earn
              through real-money purchases.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-pink-500/40 text-pink-300">
              70% creator share
            </Badge>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
              ~{DEFAULT_MONTHLY_PURCHASES_PER_QUIZ} purchases / quiz / mo
            </Badge>
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-4 rounded-xl border border-pink-500/15 bg-gradient-to-br from-pink-500/5 to-rose-500/5 p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <TrendingUp className="size-3.5 text-pink-400" aria-hidden />
            Estimated earnings
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Per month</span>
            <span className="text-3xl font-bold tracking-tight text-pink-300 sm:text-4xl">
              ${creatorEarnings.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border/40 pt-3 text-sm">
            <span className="text-muted-foreground">Per year</span>
            <span className="font-semibold text-foreground">
              ${annualEarnings.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly purchases</span>
            <span className="font-semibold text-foreground">
              {monthlyPurchases.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">EduToken bonus (est.)</span>
            <span className="inline-flex items-center gap-1 font-semibold text-violet-300">
              <Coins className="size-3.5" aria-hidden />
              {Math.round(monthlyPurchases * 2).toLocaleString()} / mo
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Illustrative estimate only. Actual earnings depend on quiz quality,
            demand, and marketplace activity.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
