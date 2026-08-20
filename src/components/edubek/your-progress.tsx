"use client";

import * as React from "react";
import {
  Flame,
  CheckCircle2,
  Trophy,
  Target,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface YourProgressProps {
  className?: string;
  initialStreak?: number;
  longestStreak?: number;
  totalQuizzes?: number;
  weeklyQuizzes?: number;
  averageAccuracy?: number;
  studyMinutes?: number;
}

// 7-day activity data for quizzes and study time
const WEEKLY_DATA = [
  { day: "Mon", fullDay: "Monday", quizzes: 3, minutes: 45, accuracy: 88, active: true },
  { day: "Tue", fullDay: "Tuesday", quizzes: 5, minutes: 70, accuracy: 92, active: true },
  { day: "Wed", fullDay: "Wednesday", quizzes: 2, minutes: 30, accuracy: 80, active: true },
  { day: "Thu", fullDay: "Thursday", quizzes: 6, minutes: 85, accuracy: 95, active: true },
  { day: "Fri", fullDay: "Friday", quizzes: 4, minutes: 55, accuracy: 85, active: true },
  { day: "Sat", fullDay: "Saturday", quizzes: 3, minutes: 40, accuracy: 90, active: true },
  { day: "Sun", fullDay: "Sunday", quizzes: 5, minutes: 65, accuracy: 94, active: true },
];

// 14-day extended data
const TWO_WEEKS_DATA = [
  { day: "08/07", quizzes: 2, minutes: 30 },
  { day: "08/08", quizzes: 4, minutes: 50 },
  { day: "08/09", quizzes: 3, minutes: 45 },
  { day: "08/10", quizzes: 1, minutes: 20 },
  { day: "08/11", quizzes: 5, minutes: 60 },
  { day: "08/12", quizzes: 4, minutes: 55 },
  { day: "08/13", quizzes: 3, minutes: 40 },
  { day: "08/14", quizzes: 3, minutes: 45 },
  { day: "08/15", quizzes: 5, minutes: 70 },
  { day: "08/16", quizzes: 2, minutes: 30 },
  { day: "08/17", quizzes: 6, minutes: 85 },
  { day: "08/18", quizzes: 4, minutes: 55 },
  { day: "08/19", quizzes: 3, minutes: 40 },
  { day: "08/20", quizzes: 5, minutes: 65 },
];

// Subject breakdown
const SUBJECT_BREAKDOWN = [
  { name: "Mathematics", count: 18, color: "bg-blue-500", percent: 38 },
  { name: "Physics", count: 14, color: "bg-amber-500", percent: 29 },
  { name: "Biology", count: 9, color: "bg-emerald-500", percent: 19 },
  { name: "Computer Science", count: 7, color: "bg-violet-500", percent: 14 },
];

// Custom Chart Tooltip declared at top level
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isQuizzes = payload[0].dataKey === "quizzes";
    return (
      <div className="rounded-lg border border-border bg-popover/95 p-2.5 shadow-md backdrop-blur-sm text-xs space-y-1">
        <p className="font-semibold text-foreground">{data.fullDay || label}</p>
        {isQuizzes ? (
          <div className="flex items-center gap-2 text-primary font-medium">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>{payload[0].value} Quizzes Completed</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-violet-500 font-medium">
            <Clock className="size-3.5" />
            <span>{payload[0].value} Minutes Practiced</span>
          </div>
        )}
        {data.accuracy && (
          <p className="text-[11px] text-muted-foreground">
            Average Accuracy: <span className="text-foreground font-semibold">{data.accuracy}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
}

export function YourProgress({
  className,
  initialStreak = 7,
  longestStreak = 14,
  totalQuizzes = 48,
  weeklyQuizzes = 28,
  averageAccuracy = 89,
  studyMinutes = 390,
}: YourProgressProps) {
  const [activeTab, setActiveTab] = React.useState<"quizzes" | "studyTime" | "subjects">("quizzes");
  const [timeRange, setTimeRange] = React.useState<"7d" | "14d">("7d");

  const chartData = timeRange === "7d" ? WEEKLY_DATA : TWO_WEEKS_DATA;
  const currentStreak = initialStreak;
  const dailyGoalQuizzes = 4;
  const todayCompletedQuizzes = 5;
  const dailyGoalProgress = Math.min(100, Math.round((todayCompletedQuizzes / dailyGoalQuizzes) * 100));

  return (
    <Card className={`border-border/80 shadow-xs overflow-hidden ${className || ""}`} id="your-progress-card">
      {/* Header */}
      <CardHeader className="pb-4 border-b bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="size-4" />
              </div>
              <CardTitle className="text-base font-semibold">Your Progress</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Daily learning consistency, streaks, and quiz completion analytics.
            </CardDescription>
          </div>

          {/* View Mode Pills */}
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 shrink-0 text-xs">
            <button
              onClick={() => setActiveTab("quizzes")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeTab === "quizzes"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Quiz Counts
            </button>
            <button
              onClick={() => setActiveTab("studyTime")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeTab === "studyTime"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Study Time
            </button>
            <button
              onClick={() => setActiveTab("subjects")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeTab === "subjects"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Subjects
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Top Highlight Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Streak Tile */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1.5 transition-all hover:border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-900 dark:text-amber-300">Active Streak</span>
              <Flame className="size-4 text-amber-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-foreground">{currentStreak}</span>
              <span className="text-xs font-semibold text-muted-foreground">Days</span>
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-medium">
              <Trophy className="size-3" />
              <span>Record: {longestStreak} days</span>
            </div>
          </div>

          {/* Quizzes Completed Tile */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1.5 transition-all hover:border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-900 dark:text-emerald-300">Quizzes Completed</span>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-foreground">{totalQuizzes}</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{weeklyQuizzes} this wk</span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span>Goal: {todayCompletedQuizzes}/{dailyGoalQuizzes} today</span>
            </div>
          </div>

          {/* Average Accuracy Tile */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-1.5 transition-all hover:border-blue-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-900 dark:text-blue-300">Average Accuracy</span>
              <Target className="size-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-foreground">{averageAccuracy}%</span>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">+3.5%</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Based on last 30 attempts
            </div>
          </div>

          {/* Study Minutes Tile */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5 space-y-1.5 transition-all hover:border-violet-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-violet-900 dark:text-violet-300">Study Time</span>
              <Clock className="size-4 text-violet-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-foreground">{(studyMinutes / 60).toFixed(1)}</span>
              <span className="text-xs font-semibold text-muted-foreground">Hours</span>
            </div>
            <div className="text-[11px] text-violet-700 dark:text-violet-400 font-medium">
              ~55 mins daily avg
            </div>
          </div>
        </div>

        {/* 7-Day Day-by-Day Streak Bar Tracker */}
        <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">This Week&apos;s Consistency</span>
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                100% Active
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Daily Target: <span className="font-semibold text-foreground">{dailyGoalQuizzes} Quizzes</span> ({dailyGoalProgress}% reached today)
            </div>
          </div>

          {/* Days bubbles */}
          <div className="grid grid-cols-7 gap-2">
            {WEEKLY_DATA.map((item, idx) => (
              <div
                key={item.day}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                  item.active
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
                    : "border-border/60 bg-muted/20 text-muted-foreground"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{item.day}</span>
                <div className="my-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-foreground">
                  {item.quizzes} qz
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Clean Recharts Area / Bar Visualization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                {activeTab === "quizzes"
                  ? "Completed Quizzes Trend"
                  : activeTab === "studyTime"
                  ? "Study Duration (Minutes)"
                  : "Subject Distribution"}
              </span>
            </div>

            {activeTab !== "subjects" && (
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setTimeRange("7d")}
                  className={`px-2 py-0.5 rounded font-medium ${
                    timeRange === "7d" ? "bg-muted text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  7 Days
                </button>
                <span className="text-muted-foreground">/</span>
                <button
                  onClick={() => setTimeRange("14d")}
                  className={`px-2 py-0.5 rounded font-medium ${
                    timeRange === "14d" ? "bg-muted text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  14 Days
                </button>
              </div>
            )}
          </div>

          {/* Chart Display Area */}
          <div className="rounded-xl border border-border/70 bg-muted/10 p-3 pt-4">
            {activeTab === "quizzes" && (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "currentColor", fontSize: 11, opacity: 0.6 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "currentColor", fontSize: 10, opacity: 0.6 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Bar
                      dataKey="quizzes"
                      fill="var(--color-primary, #0284c7)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeTab === "studyTime" && (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "currentColor", fontSize: 11, opacity: 0.6 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "currentColor", fontSize: 10, opacity: 0.6 }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMinutes)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeTab === "subjects" && (
              <div className="space-y-3 py-1">
                {SUBJECT_BREAKDOWN.map((subj) => (
                  <div key={subj.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${subj.color}`} />
                        <span className="font-semibold text-foreground">{subj.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-mono">
                        <span>{subj.count} quizzes</span>
                        <span className="font-bold text-foreground">({subj.percent}%)</span>
                      </div>
                    </div>
                    <Progress value={subj.percent} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
