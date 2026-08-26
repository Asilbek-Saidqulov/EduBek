"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  RotateCcw,
  Clock,
  Shield,
  Heart,
  Coins,
  Castle,
  Zap,
  Sparkles,
  BrainCircuit,
  Swords,
  Flame,
  Bomb,
  Layers,
  Crown,
  Eye,
  Crosshair,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export type GameModeType = "classic" | "royale" | "heist" | "empire";

export interface GuestQuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
  topic?: string;
  points?: number;
}

export interface GuestQuizPlayerProps {
  pin?: string;
  joinCode?: string;
  quizId?: string;
  attemptId?: string;
  quizTitle?: string;
  nickname?: string;
  mode?: GameModeType;
  questions?: GuestQuizQuestion[];
  onExit?: () => void;
}

const DEFAULT_QUESTIONS: GuestQuizQuestion[] = [
  {
    id: "q-cs-1",
    question: "Which data structure uses the First-In, First-Out (FIFO) principle?",
    options: ["Stack", "Queue", "Binary Tree", "Hash Map"],
    correctIndex: 1,
    explanation: "A Queue processes elements in First-In, First-Out (FIFO) order, whereas a Stack is LIFO.",
    topic: "Computer Science",
    points: 1,
  },
  {
    id: "q-bio-1",
    question: "What is the primary function of chlorophyll in plant cells?",
    options: ["Cell division", "Water storage", "Light absorption for photosynthesis", "Nutrient transport"],
    correctIndex: 2,
    explanation: "Chlorophyll pigments absorb sunlight (primarily blue and red wavelengths) to power photosynthesis.",
    topic: "Biology",
    points: 1,
  },
  {
    id: "q-math-1",
    question: "If a quadratic equation has discriminant D = 0, what does this indicate about its roots?",
    options: ["Two distinct real roots", "Exactly one repeated real root", "Two complex conjugate roots", "No solution"],
    correctIndex: 1,
    explanation: "When the discriminant b² - 4ac = 0, the parabola touches the x-axis at exactly one point (one repeated real root).",
    topic: "Mathematics",
    points: 1,
  },
  {
    id: "q-phys-1",
    question: "According to Newton's Second Law, if net force on an object is doubled while mass remains constant, its acceleration will:",
    options: ["Remain unchanged", "Be halved", "Be doubled", "Quadruple"],
    correctIndex: 2,
    explanation: "F = ma. Since acceleration a = F/m, doubling F with constant m directly doubles the acceleration a.",
    topic: "Physics",
    points: 1,
  },
];

const EMPIRE_STAGES = [
  { level: 1, name: "Ancient Forum", wonder: "Foundation Stones", minQuestions: 1 },
  { level: 2, name: "Grand Academy", wonder: "Philosopher's Library", minQuestions: 2 },
  { level: 3, name: "Starlit Observatory", wonder: "Astrolabe Tower", minQuestions: 3 },
  { level: 4, name: "Golden Citadel", wonder: "Imperial Wonder", minQuestions: 4 },
];

export function GuestQuizPlayer({
  pin,
  joinCode,
  quizId,
  attemptId: initialAttemptId,
  quizTitle = "Interactive Quiz",
  nickname = "Student Player",
  mode = "classic",
  questions = DEFAULT_QUESTIONS,
  onExit,
}: GuestQuizPlayerProps) {
  const displayCode = joinCode || pin || "ARENA";
  const activeQuestions = questions.length > 0 ? questions : DEFAULT_QUESTIONS;

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [score, setScore] = React.useState(0);
  const [isAnswered, setIsAnswered] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(mode === "heist" ? 15 : 20);
  const [mistakes, setMistakes] = React.useState<Array<{ q: string; selected: string; correct: string; exp?: string }>>([]);
  
  // Real Server Attempt state
  const [currentAttemptId, setCurrentAttemptId] = React.useState<string | null>(initialAttemptId || null);
  const [recordedAnswers, setRecordedAnswers] = React.useState<Array<{ questionId: string; selectedIndex: number | null; timeTakenMs?: number }>>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverResult, setServerResult] = React.useState<{
    score: number;
    maxScore: number;
    accuracy: number;
    earnedXp: number;
    newTotalXp: number;
    newLevel: number;
    questionResults: any[];
  } | null>(null);

  // Game Mode States
  // Royale State
  const [hp, setHp] = React.useState(100);
  const [shields, setShields] = React.useState(50);
  const [alivePlayers, setAlivePlayers] = React.useState(24);

  // Heist State
  const [vaultGold, setVaultGold] = React.useState(0);
  const [streakCombo, setStreakCombo] = React.useState(1);
  const [powerupUsedFiftyFifty, setPowerupUsedFiftyFifty] = React.useState(false);
  const [hiddenOptions, setHiddenOptions] = React.useState<number[]>([]);

  // Empire State
  const [empireScore, setEmpireScore] = React.useState(0);
  const [masonryStone, setMasonryStone] = React.useState(100);

  const startTimeRef = React.useRef<number>(Date.now());
  const questionStartTimeRef = React.useRef<number>(Date.now());

  const currentQ = activeQuestions[currentIndex] || DEFAULT_QUESTIONS[0];

  // Auto initialize attempt if quizId is provided without initialAttemptId
  React.useEffect(() => {
    if (quizId && !currentAttemptId) {
      fetch(`/api/quizzes/${quizId}/attempts`, { method: "POST" })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.attemptId) {
            setCurrentAttemptId(data.attemptId);
          }
        })
        .catch(() => {
          // Fallback to client-side practice if offline or unauthenticated
        });
    }
  }, [quizId, currentAttemptId]);

  // Royale / Heist / Empire calculation on selection
  const handleSelect = React.useCallback(
    (idx: number) => {
      if (isAnswered) return;
      setSelectedOption(idx);
      setIsAnswered(true);

      const timeTakenMs = Date.now() - questionStartTimeRef.current;
      const questionId = currentQ.id || `q-${currentIndex}`;

      setRecordedAnswers((prev) => [
        ...prev,
        { questionId, selectedIndex: idx, timeTakenMs },
      ]);

      const hasCorrectIndex = currentQ.correctIndex !== undefined;
      const isCorrect = hasCorrectIndex ? idx === currentQ.correctIndex : true;

      if (isCorrect) {
        // Classic scoring
        const speedBonus = timeLeft > 10 ? 300 : timeLeft > 5 ? 150 : 50;
        const pts = 500 + speedBonus;
        setScore((prev) => prev + pts);

        // Royale mode bonuses
        if (mode === "royale") {
          setShields((prev) => Math.min(100, prev + 25));
          setAlivePlayers((prev) => Math.max(1, prev - 4));
        }

        // Heist mode bonuses
        if (mode === "heist") {
          const bounty = 250 * streakCombo;
          setVaultGold((prev) => prev + bounty);
          setStreakCombo((prev) => Math.min(4, prev + 1));
        }

        // Empire mode bonuses
        if (mode === "empire") {
          setEmpireScore((prev) => prev + 1);
          setMasonryStone((prev) => prev + 250);
        }
      } else {
        // Record mistake for review
        if (hasCorrectIndex) {
          setMistakes((prev) => [
            ...prev,
            {
              q: currentQ.question,
              selected: currentQ.options[idx] || "None",
              correct: currentQ.options[currentQ.correctIndex!] || "Unknown",
              exp: currentQ.explanation,
            },
          ]);
        }

        // Royale mode penalties
        if (mode === "royale") {
          if (shields > 0) {
            setShields((prev) => Math.max(0, prev - 35));
          } else {
            setHp((prev) => Math.max(0, prev - 35));
          }
        }

        // Heist combo reset
        if (mode === "heist") {
          setStreakCombo(1);
        }
      }
    },
    [isAnswered, currentQ, timeLeft, mode, streakCombo, shields, currentIndex]
  );

  // Next question handler & server submission
  const handleNext = React.useCallback(async () => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(mode === "heist" ? 15 : 20);
      setHiddenOptions([]);
      setPowerupUsedFiftyFifty(false);
      questionStartTimeRef.current = Date.now();
    } else {
      // Quiz finished: Submit to server if attemptId exists
      if (currentAttemptId) {
        setIsSubmitting(true);
        try {
          const totalTimeSpentMs = Date.now() - startTimeRef.current;
          const res = await fetch(`/api/quizzes/attempts/${currentAttemptId}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers: recordedAnswers,
              timeSpentMs: totalTimeSpentMs,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setServerResult(data);
          }
        } catch (err) {
          console.error("Failed to submit attempt to server:", err);
        } finally {
          setIsSubmitting(false);
        }
      }
      setIsFinished(true);
    }
  }, [currentIndex, activeQuestions.length, mode, currentAttemptId, recordedAnswers]);

  // Restart Quiz
  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsAnswered(false);
    setIsFinished(false);
    setServerResult(null);
    setRecordedAnswers([]);
    setTimeLeft(mode === "heist" ? 15 : 20);
    setMistakes([]);
    setHp(100);
    setShields(50);
    setAlivePlayers(24);
    setVaultGold(0);
    setStreakCombo(1);
    setHiddenOptions([]);
    setPowerupUsedFiftyFifty(false);
    setEmpireScore(0);
    setMasonryStone(100);
    startTimeRef.current = Date.now();
    questionStartTimeRef.current = Date.now();
  };

  // Powerup: 50/50 Eliminator (Heist Mode)
  const handleUseFiftyFifty = () => {
    if (powerupUsedFiftyFifty || isAnswered) return;
    setPowerupUsedFiftyFifty(true);

    const correctIdx = currentQ.correctIndex ?? 0;
    const incorrectIndices = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== correctIdx);

    // Shuffle and pick 2 incorrect to hide
    const toHide = incorrectIndices.slice(0, 2);
    setHiddenOptions(toHide);
  };

  // Countdown timer per question
  React.useEffect(() => {
    if (isAnswered || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSelect(-1); // Timeout penalty
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex, isAnswered, isFinished, handleSelect]);

  // Keyboard shortcut listener (1-4 / A-D)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered || isFinished) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNext();
        }
        return;
      }
      if (["1", "a", "A"].includes(e.key)) handleSelect(0);
      if (["2", "b", "B"].includes(e.key)) handleSelect(1);
      if (["3", "c", "C"].includes(e.key)) handleSelect(2);
      if (["4", "d", "D"].includes(e.key)) handleSelect(3);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnswered, isFinished, handleSelect, handleNext]);

  // Submitting state loader
  if (isSubmitting) {
    return (
      <Card className="mx-auto max-w-lg border-border/80 p-10 text-center space-y-4 shadow-xl" id="grading-in-progress">
        <Loader2 className="size-10 animate-spin text-primary mx-auto" />
        <CardTitle className="text-xl font-bold">Grading Attempt Server-Side...</CardTitle>
        <CardDescription className="text-xs">
          Verifying answers, computing XP bonuses, and updating your profile progression.
        </CardDescription>
      </Card>
    );
  }

  // Finished Screen
  if (isFinished) {
    const totalQuestions = activeQuestions.length;
    const correctCount = serverResult ? serverResult.score : totalQuestions - mistakes.length;
    const accuracy = serverResult ? serverResult.accuracy : Math.round((correctCount / totalQuestions) * 100);
    const isEliminated = mode === "royale" && hp <= 0;

    const currentEmpireStage =
      EMPIRE_STAGES.slice()
        .reverse()
        .find((s) => empireScore >= s.minQuestions) || EMPIRE_STAGES[0];

    return (
      <Card className="mx-auto max-w-2xl border-border/80 p-8 shadow-xl space-y-6" id="game-finished-card">
        <div className="text-center space-y-2">
          <div
            className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl border mb-2 ${
              isEliminated
                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                : mode === "royale"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : mode === "heist"
                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                : mode === "empire"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-primary/10 text-primary border-primary/20"
            }`}
          >
            {isEliminated ? (
              <XCircle className="h-8 w-8" />
            ) : mode === "royale" ? (
              <Crown className="h-8 w-8" />
            ) : mode === "heist" ? (
              <Coins className="h-8 w-8" />
            ) : mode === "empire" ? (
              <Castle className="h-8 w-8" />
            ) : (
              <Trophy className="h-8 w-8" />
            )}
          </div>

          <CardTitle className="text-2xl font-bold">
            {isEliminated
              ? "Eliminated in Battle Royale"
              : mode === "royale"
              ? "Victory Royale! #1 Survivor"
              : mode === "heist"
              ? "Heist Vault Successfully Cracked!"
              : mode === "empire"
              ? `Civilization Thriving: ${currentEmpireStage.name}`
              : "Quiz Arena Completed!"}
          </CardTitle>

          <CardDescription className="text-sm">
            {isEliminated
              ? `You fought bravely, ${nickname}! Try again to claim #1 Victory.`
              : `Outstanding gameplay, ${nickname}! Here are your verified results.`}
          </CardDescription>
        </div>

        {/* Server XP & Progression Banner if Authenticated */}
        {serverResult && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Verified Server Progression</div>
                <div className="text-xs text-muted-foreground">
                  Profile Level {serverResult.newLevel} · Total XP: {serverResult.newTotalXp.toLocaleString()}
                </div>
              </div>
            </div>
            <Badge className="bg-primary text-primary-foreground font-mono text-sm px-3 py-1">
              +{serverResult.earnedXp} XP
            </Badge>
          </div>
        )}

        {/* Mode-Specific Summary Card */}
        {mode === "royale" && (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="size-5 text-amber-500" />
              <div>
                <div className="text-xs font-bold text-foreground">Survival Placement</div>
                <div className="text-xs text-muted-foreground">{isEliminated ? "Top 10 Contender" : "#1 Victory Champion"}</div>
              </div>
            </div>
            <Badge className="bg-amber-500 text-white font-mono">{alivePlayers === 1 ? "1st Place" : "Top Survivor"}</Badge>
          </div>
        )}

        {mode === "heist" && (
          <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="size-5 text-yellow-500" />
              <div>
                <div className="text-xs font-bold text-foreground">Total Loot Looted</div>
                <div className="text-xs text-muted-foreground">Highest Streak Multiplier: x{streakCombo}</div>
              </div>
            </div>
            <div className="text-xl font-black text-yellow-600 dark:text-yellow-400 font-mono">+{vaultGold} Gold</div>
          </div>
        )}

        {mode === "empire" && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Castle className="size-5 text-emerald-500" />
              <div>
                <div className="text-xs font-bold text-foreground">{currentEmpireStage.name} Built</div>
                <div className="text-xs text-muted-foreground">Wonder: {currentEmpireStage.wonder} ({masonryStone} Masonry)</div>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white text-xs">Level {currentEmpireStage.level}</Badge>
          </div>
        )}

        {/* Score Summary Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border/70 text-center">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Score</div>
            <div className="text-2xl font-extrabold text-primary mt-0.5">
              {serverResult ? `${serverResult.score} / ${serverResult.maxScore}` : score}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Accuracy</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{accuracy}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mastery</div>
            <div className="text-2xl font-extrabold text-foreground mt-0.5">
              {serverResult ? `${serverResult.score} / ${serverResult.maxScore}` : `${correctCount} / ${totalQuestions}`}
            </div>
          </div>
        </div>

        {/* Server Question Breakdown or Local Mistakes Review */}
        {serverResult && serverResult.questionResults ? (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Question Results ({serverResult.questionResults.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {serverResult.questionResults.map((qr: any, i: number) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-lg border ${
                    qr.isCorrect
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-rose-500/30 bg-rose-500/5"
                  } space-y-1.5 text-xs`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {i + 1}. {qr.question}
                    </p>
                    <Badge variant="outline" className={qr.isCorrect ? "text-emerald-600" : "text-rose-600"}>
                      {qr.isCorrect ? `+${qr.pointsEarned} pt` : "0 pt"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    <span className={qr.isCorrect ? "text-emerald-600 font-semibold" : "text-rose-600 font-medium"}>
                      Your Choice: {qr.userSelectedIndex !== null ? qr.options[qr.userSelectedIndex] : "None"}
                    </span>
                    {!qr.isCorrect && (
                      <span className="text-emerald-600 font-semibold">
                        Correct: {qr.options[qr.correctIndex]}
                      </span>
                    )}
                  </div>
                  {qr.explanation && (
                    <p className="text-[11px] text-muted-foreground bg-background/60 p-2 rounded mt-1">
                      {qr.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : mistakes.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Review Questions to Improve ({mistakes.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {mistakes.map((m, i) => (
                <div key={i} className="p-3.5 rounded-lg border border-border/80 bg-card space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">{m.q}</p>
                    <Link
                      href={`/tutor?topic=${encodeURIComponent(quizTitle || "Quiz Review")}&q=${encodeURIComponent(m.q)}&your=${encodeURIComponent(m.selected)}&correct=${encodeURIComponent(m.correct)}&exp=${encodeURIComponent(m.exp || "")}&quizTitle=${encodeURIComponent(quizTitle || "Quiz")}`}
                      className="shrink-0 text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <BrainCircuit className="size-3" />
                      <span>Learn why</span>
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-rose-600 dark:text-rose-400 font-medium">Your answer: {m.selected}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Correct: {m.correct}</span>
                  </div>
                  {m.exp && <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded">{m.exp}</p>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>Flawless score! You answered every question correctly.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleRestart} className="flex-1 sm:flex-initial gap-2">
              <RotateCcw className="size-4" />
              Play Again
            </Button>

            {mistakes.length > 0 && (
              <Button asChild className="flex-1 sm:flex-initial gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link
                  href={`/tutor?topic=${encodeURIComponent(quizTitle || "Quiz Review")}&q=${encodeURIComponent(mistakes[0].q)}&your=${encodeURIComponent(mistakes[0].selected)}&correct=${encodeURIComponent(mistakes[0].correct)}&exp=${encodeURIComponent(mistakes[0].exp || "")}&quizTitle=${encodeURIComponent(quizTitle || "Quiz")}`}
                >
                  <BrainCircuit className="size-4" />
                  <span>Review with AI Tutor</span>
                </Link>
              </Button>
            )}
          </div>

          {onExit && (
            <Button onClick={onExit} variant="ghost" className="w-full sm:w-auto gap-2">
              <span>Back to Hub</span>
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Question Step Player
  const progressPct = Math.round(((currentIndex + 1) / activeQuestions.length) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-6" id="active-quiz-player">
      {/* Top HUD */}
      <div className="flex items-center justify-between border-b pb-4 gap-4 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono font-bold tracking-wider uppercase">
              {displayCode}
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]">{quizTitle}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Question {currentIndex + 1} of {activeQuestions.length}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode-specific HUD indicators */}
          {mode === "royale" && (
            <div className="flex items-center gap-3 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 text-xs">
              <div className="flex items-center gap-1 text-rose-500 font-bold">
                <Heart className="size-3.5 fill-current" />
                <span>{hp} HP</span>
              </div>
              <div className="flex items-center gap-1 text-sky-500 font-bold">
                <Shield className="size-3.5 fill-current" />
                <span>{shields}%</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Crown className="size-3.5" />
                <span>{alivePlayers} alive</span>
              </div>
            </div>
          )}

          {mode === "heist" && (
            <div className="flex items-center gap-3 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20 text-xs">
              <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-bold">
                <Coins className="size-3.5" />
                <span>{vaultGold} G</span>
              </div>
              <Badge className="bg-yellow-500 text-black text-[10px] font-mono">x{streakCombo} Streak</Badge>
            </div>
          )}

          {mode === "empire" && (
            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 text-xs">
              <Castle className="size-3.5 text-emerald-500" />
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{masonryStone} Stone</span>
            </div>
          )}

          {/* Timer Clock */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold ${
              timeLeft <= 5 ? "bg-rose-500/10 text-rose-500 animate-pulse" : "bg-muted text-foreground"
            }`}
          >
            <Clock className="size-3.5" />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progressPct} className="h-1.5" />

      {/* Question Card */}
      <Card className="border-border/80 shadow-md p-6 space-y-6">
        <div className="space-y-2">
          {currentQ.topic && (
            <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider uppercase">
              {currentQ.topic}
            </Badge>
          )}
          <h2 className="text-lg sm:text-xl font-bold leading-snug text-foreground">
            {currentQ.question}
          </h2>
        </div>

        {/* Mode Heist Powerup Button */}
        {mode === "heist" && !powerupUsedFiftyFifty && !isAnswered && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUseFiftyFifty}
            className="w-full text-xs font-semibold gap-1.5 border-yellow-500/40 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
          >
            <Zap className="size-3.5" />
            <span>Use 50:50 Eliminator Power-up</span>
          </Button>
        )}

        {/* Options Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {currentQ.options.map((opt, idx) => {
            const isHidden = hiddenOptions.includes(idx);
            if (isHidden) {
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-dashed border-border/40 opacity-30 text-xs text-muted-foreground text-center"
                >
                  Option eliminated
                </div>
              );
            }

            const isSelected = selectedOption === idx;
            const hasCorrectIdx = currentQ.correctIndex !== undefined;
            const isCorrectOption = hasCorrectIdx && idx === currentQ.correctIndex;
            const isWrongSelection = hasCorrectIdx && isSelected && !isCorrectOption;

            let buttonStyle = "border-border/80 bg-card hover:border-primary/60 hover:bg-muted/40 text-foreground";
            if (isAnswered) {
              if (isCorrectOption) {
                buttonStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold";
              } else if (isWrongSelection) {
                buttonStyle = "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold";
              } else {
                buttonStyle = "border-border/40 opacity-40";
              }
            } else if (isSelected) {
              buttonStyle = "border-primary bg-primary/10 text-primary font-bold";
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelect(idx)}
                className={`p-4 rounded-xl border text-left text-sm transition-all flex items-start gap-3 ${buttonStyle} focus:outline-none focus:ring-2 focus:ring-primary`}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-xs font-mono font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-snug pt-0.5">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation Post-Answer */}
        {isAnswered && (
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">
                {currentQ.correctIndex !== undefined && selectedOption === currentQ.correctIndex
                  ? "✓ Correct Answer!"
                  : "Review Explanation:"}
              </span>
              <span className="text-[11px] text-muted-foreground">Press Enter for next</span>
            </div>
            {currentQ.explanation && (
              <p className="text-muted-foreground leading-relaxed">{currentQ.explanation}</p>
            )}
          </div>
        )}

        {/* Next / Submit Button */}
        {isAnswered && (
          <Button onClick={handleNext} className="w-full h-11 text-sm font-bold gap-2 shadow-xs">
            <span>{currentIndex + 1 === activeQuestions.length ? "Submit & View Results" : "Next Question"}</span>
            <ArrowRight className="size-4" />
          </Button>
        )}
      </Card>
    </div>
  );
}
