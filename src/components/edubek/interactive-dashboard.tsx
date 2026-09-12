"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  Flame,
  Gamepad2,
  Play,
  Radio,
  Target,
  Trophy,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type Role = "admin" | "creator" | "teacher" | "student";

type DayPoint = {
  key: string;
  label: string;
  quizzes: number;
  accuracy: number;
  minutes: number;
};

const WEEK: DayPoint[] = [
  { key: "mon", label: "Mon", quizzes: 3, accuracy: 88, minutes: 42 },
  { key: "tue", label: "Tue", quizzes: 5, accuracy: 92, minutes: 70 },
  { key: "wed", label: "Wed", quizzes: 2, accuracy: 74, minutes: 28 },
  { key: "thu", label: "Thu", quizzes: 6, accuracy: 95, minutes: 81 },
  { key: "fri", label: "Fri", quizzes: 4, accuracy: 86, minutes: 55 },
  { key: "sat", label: "Sat", quizzes: 1, accuracy: 80, minutes: 18 },
  { key: "sun", label: "Sun", quizzes: 4, accuracy: 91, minutes: 60 },
];

const WEAK_TOPICS = [
  { id: "cell", name: "Cell energetics", accuracy: 62, subject: "Biology" },
  { id: "quad", name: "Quadratic roots", accuracy: 70, subject: "Math" },
  { id: "fifo", name: "Queues vs stacks", accuracy: 78, subject: "CS" },
];

const TEACHER_CLASSES = [
  { id: "c1", name: "Grade 10 Biology", students: 28, live: true, completion: 82, avg: 76 },
  { id: "c2", name: "Algebra Club", students: 16, live: false, completion: 64, avg: 81 },
  { id: "c3", name: "CS Foundations", students: 22, live: false, completion: 91, avg: 88 },
];

export function InteractiveDashboard({
  role,
  credits = 0,
}: {
  role: Role;
  credits?: number;
}) {
  if (role === "teacher" || role === "admin") {
    return <TeacherPulse />;
  }
  if (role === "creator") {
    return <CreatorBoard credits={credits} />;
  }
  return <StudentArena credits={credits} />;
}

function StudentArena({ credits }: { credits: number }) {
  const router = useRouter();
  const [range, setRange] = React.useState<"7d" | "14d">("7d");
  const [selected, setSelected] = React.useState<DayPoint>(WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [pin, setPin] = React.useState("");
  const [metric, setMetric] = React.useState<"quizzes" | "minutes">("quizzes");

  const data = range === "7d" ? WEEK : WEEK.concat(WEEK.map((d) => ({ ...d, key: `${d.key}2`, quizzes: Math.max(1, d.quizzes - 1) })));
  const totalQuizzes = WEEK.reduce((s, d) => s + d.quizzes, 0);
  const avgAcc = Math.round(WEEK.reduce((s, d) => s + d.accuracy, 0) / WEEK.length);

  const join = () => {
    const code = pin.replace(/\D/g, "").slice(0, 6);
    if (code.length >= 4) router.push(`/live-quiz?pin=${code}`);
  };

  return (
    <section className="space-y-4" id="interactive-student-dashboard">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="This week" value={`${totalQuizzes}`} hint="quizzes" />
        <StatTile label="Accuracy" value={`${avgAcc}%`} hint="last 7 days" />
        <StatTile label="Streak" value="5" hint="days" icon />
        <StatTile label="Credits" value={`${credits}`} hint="wallet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Activity</CardTitle>
              <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 text-xs">
                <ToggleChip on={metric === "quizzes"} onClick={() => setMetric("quizzes")}>
                  Quizzes
                </ToggleChip>
                <ToggleChip on={metric === "minutes"} onClick={() => setMetric("minutes")}>
                  Minutes
                </ToggleChip>
                <span className="mx-1 h-3 w-px bg-border" />
                <ToggleChip on={range === "7d"} onClick={() => setRange("7d")}>
                  7d
                </ToggleChip>
                <ToggleChip on={range === "14d"} onClick={() => setRange("14d")}>
                  14d
                </ToggleChip>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5B942" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F5B942" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [v, metric === "quizzes" ? "Quizzes" : "Minutes"]}
                  />
                  <Area
                    type="monotone"
                    dataKey={metric}
                    stroke="#F5B942"
                    strokeWidth={2}
                    fill="url(#dashFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEK.map((day) => {
                const on = selected.key === day.key;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelected(day)}
                    className={`rounded-xl border px-1 py-2 text-center transition-all ${
                      on
                        ? "border-[#F5B942] bg-[#F5B942]/15 shadow-xs"
                        : "border-border/70 hover:border-primary/30"
                    }`}
                  >
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground">{day.label}</div>
                    <div className="text-sm font-black">{day.quizzes}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs">
              <span>
                <span className="font-semibold">{selected.label}</span>
                {" · "}
                {selected.quizzes} quizzes · {selected.accuracy}% · {selected.minutes} min
              </span>
              <Button asChild size="sm" className="h-7 text-xs">
                <Link href="/live-quiz?tab=discover">Practice this pace</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Radio className="size-4 text-[#F5B942]" />
                Join live
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                inputMode="numeric"
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && join()}
                className="h-10 font-mono tracking-[0.3em]"
              />
              <Button className="h-10 px-4" onClick={join} disabled={pin.length < 4}>
                <Play className="size-4 fill-current" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="size-4" />
                Weak spots
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {WEAK_TOPICS.map((topic) => (
                <div key={topic.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{topic.name}</span>
                    <span className="text-muted-foreground">{topic.accuracy}%</span>
                  </div>
                  <Progress value={topic.accuracy} className="h-1.5" />
                  <Button asChild variant="ghost" size="sm" className="h-7 px-0 text-[11px]">
                    <Link href={`/live-quiz?tab=discover&topic=${encodeURIComponent(topic.name)}`}>
                      Drill {topic.subject}
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function TeacherPulse() {
  const [activeId, setActiveId] = React.useState(TEACHER_CLASSES[0].id);
  const room = TEACHER_CLASSES.find((c) => c.id === activeId) ?? TEACHER_CLASSES[0];

  return (
    <section className="space-y-4" id="interactive-teacher-dashboard">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TEACHER_CLASSES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveId(c.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              c.id === activeId ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
            }`}
          >
            {c.live ? "● " : ""}
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Students" value={`${room.students}`} hint={room.name} />
        <StatTile label="Completion" value={`${room.completion}%`} hint="this week" />
        <StatTile label="Class avg" value={`${room.avg}%`} hint="last quiz" />
        <StatTile label="Live" value={room.live ? "On" : "Off"} hint={room.live ? "PIN room open" : "no session"} />
      </div>

      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{room.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {room.live ? "Students can join now" : "Start a mode when ready"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Weekly completion</p>
            <Progress value={room.completion} className="h-2" />
            <p className="text-xs text-muted-foreground">{room.completion}% of assigned practice finished</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/live-quiz?tab=modes">
                <Gamepad2 className="size-4" />
                Open live modes
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/classrooms">
                <Users className="size-4" />
                Class roster
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function CreatorBoard({ credits }: { credits: number }) {
  return (
    <section className="grid gap-3 sm:grid-cols-3" id="interactive-creator-dashboard">
      <StatTile label="Credits" value={`${credits}`} hint="available" />
      <StatTile label="Published packs" value="12" hint="marketplace" />
      <StatTile label="This week uses" value="184" hint="students practiced" />
      <Card className="sm:col-span-3 border-border/80 shadow-xs">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm">Keep packs aligned to syllabus topics students miss most.</p>
          <Button asChild size="sm">
            <Link href="/marketplace">Open marketplace</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon ? <Flame className="size-3.5 text-amber-500" /> : <Trophy className="size-3.5 opacity-40" />}
      </div>
      <div className="mt-1 text-2xl font-black tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function ToggleChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2 py-1 font-medium ${on ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}
