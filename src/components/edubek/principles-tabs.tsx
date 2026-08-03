"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DESIGN_PRINCIPLES } from "@/lib/edubek/constants"

const GROUPS = [
  { id: "philosophy", range: "1–3" },
  { id: "ux", range: "4–5" },
  { id: "ecosystem", range: "6–7" },
  { id: "trust", range: "8–9" },
  { id: "quality", range: "10–11" },
  { id: "vision", range: "12–14" },
] as const

type Principle = (typeof DESIGN_PRINCIPLES)[number]

function principlesForGroup(range: string): Principle[] {
  const [start, end] = range.split("–").map((n) => parseInt(n, 10))
  return DESIGN_PRINCIPLES.filter((p) => p.id >= start && p.id <= end)
}

export function PrinciplesTabs() {
  const t = useTranslations("landing.principles")

  return (
    <Tabs defaultValue="philosophy" className="w-full">
      <TabsList className="h-auto flex-wrap justify-center gap-1 bg-card/60 p-1.5">
        {GROUPS.map((group) => (
          <TabsTrigger
            key={group.id}
            value={group.id}
            className="flex-col items-start gap-0.5 px-3 py-1.5 text-xs sm:flex-row sm:items-center sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="font-semibold">{t(`groups.${group.id}.label`)}</span>
            <span className="text-[10px] text-muted-foreground sm:text-xs">
              #{group.range}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {GROUPS.map((group) => {
        const principles = principlesForGroup(group.range)
        return (
          <TabsContent key={group.id} value={group.id} className="mt-8">
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {t(`groups.${group.id}.description`)}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {principles.map((p) => (
                <Card
                  key={p.id}
                  className="group relative overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-violet-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <CardContent className="flex h-full flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="h-8 min-w-8 justify-center bg-gradient-to-br from-emerald-500/15 to-teal-500/15 font-mono text-sm font-bold text-emerald-300"
                      >
                        {String(p.id).padStart(2, "0")}
                      </Badge>
                      <h3 className="text-base font-semibold leading-tight text-foreground">
                        {t(`items.${p.id}.title`)}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(`items.${p.id}.summary`)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
