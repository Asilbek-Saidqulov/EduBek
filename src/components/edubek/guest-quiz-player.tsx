"use client";

import * as React from "react";
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
  Swords,
  Flame,
  Bomb,
  Layers,
  Crown,
  Eye,
  Crosshair,
  Brain,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export type GameModeType = "classic" | "royale" | "heist" | "empire";

export interface GuestQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  topic?: string;
}

export interface GuestQuizPlayerProps {
  pin?: string;
  joinCode?: string;
  quizTitle?: string;
  nickname?: string;
  mode?: GameModeType;
  questions?: GuestQuizQuestion[];
  onExit?: () => void;
}

const DEFAULT_QUESTIONS: GuestQuizQuestion[] = [
  {
    question: "Which data structure uses the First-In, First-Out (FIFO) principle?",
    options: ["Stack", "Queue", "Binary Tree", "Hash Map"],
    correctIndex: 1,
    explanation: "A Queue processes elements in First-In, First-Out (FIFO) order, whereas a Stack is LIFO.",
    topic: "Computer Science",
  },
  {
    question: "What is the primary function of chlorophyll in plant cells?",
    options: ["Cell division", "Water storage", "Light absorption for photosynthesis", "Nutrient transport"],
    correctIndex: 2,
    explanation: "Chlorophyll pigments absorb sunlight (primarily blue and red wavelengths) to power photosynthesis.",
    topic: "Biology",
  },
  {
    question: "If a quadratic equation has discriminant D = 0, what does this indicate about its roots?",
    options: ["Two distinct real roots", "Exactly one repeated real root", "Two complex conjugate roots", "No solution"],
    correctIndex: 1,
    explanation: "When the discriminant b² - 4ac = 0, the parabola touches the x-axis at exactly one point (one repeated real root).",
    topic: "Mathematics",
  },
  {
    question: "According to Newton's Second Law, if net force on an object is doubled while mass remains constant, its acceleration will:",
    options: ["Remain unchanged", "Be halved", "Be doubled", "Quadruple"],
    correctIndex: 2,
    explanation: "F = ma. Since acceleration a = F/m, doubling F with constant m directly doubles the acceleration a.",
    topic: "Physics",
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
  const [mistakes, setMistakes] = React.useState<Array<{ q: string; selected: string; correct: string; exp?: string; options?: string[]; topic?: string }>>([]);
  const [aiExplanations, setAiExplanations] = React.useState<Record<number, { text?: string; loading?: boolean; error?: string }>>({});

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

  const currentQ = activeQuestions[currentIndex] || DEFAULT_QUESTIONS[0];

  // Royale / Heist / Empire calculation on selection
  const handleSelect = React.useCallback(
    (idx: number) => {
      if (isAnswered) return;
      setSelectedOption(idx);
      setIsAnswered(true);

      const isCorrect = idx === currentQ.correctIndex;

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
        // Mistake handling
        setMistakes((prev) => [
          ...prev,
          {
            q: currentQ.question,
            selected: idx >= 0 ? currentQ.options[idx] : "Time Expired",
            correct: currentQ.options[currentQ.correctIndex],
            exp: currentQ.explanation,
            options: currentQ.options,
            topic: currentQ.topic || quizTitle,
          },
        ]);

        // Royale mode damage
        if (mode === "royale") {
          if (shields > 0) {
            setShields((prev) => Math.max(0, prev - 50));
          } else {
            setHp((prev) => {
              const nextHp = Math.max(0, prev - 50);
              if (nextHp <= 0) {
                // Game Over Trigger
                setIsFinished(true);
              }
              return nextHp;
            });
          }
          setAlivePlayers((prev) => Math.max(1, prev - 2));
        }

        // Heist combo break
        if (mode === "heist") {
          setStreakCombo(1);
        }
      }
    },
    [isAnswered, currentQ, timeLeft, mode, streakCombo, shields, quizTitle]
  );

  const handleExplainMistake = async (index: number) => {
    const mistake = mistakes[index];
    if (!mistake || aiExplanations[index]?.loading) return;

    setAiExplanations((prev) => ({
      ...prev,
      [index]: { loading: true, error: undefined },
    }));

    try {
      const res = await fetch("/api/ai-workspace/explain-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: mistake.q,
          options: mistake.options || [mistake.selected, mistake.correct],
          selectedOption: mistake.selected,
          correctOption: mistake.correct,
          topic: mistake.topic,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to generate AI explanation");
      }

      setAiExplanations((prev) => ({
        ...prev,
        [index]: { loading: false, text: data.explanation },
      }));
    } catch (err: any) {
      setAiExplanations((prev) => ({
        ...prev,
        [index]: { loading: false, error: err?.message || "Could not load AI explanation" },
      }));
    }
  };

  const handleNext = React.useCallback(() => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(mode === "heist" ? 15 : 20);
      setHiddenOptions([]);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, activeQuestions.length, mode]);

  const handleRestart = React.useCallback(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsFinished(false);
    setScore(0);
    setTimeLeft(mode === "heist" ? 15 : 20);
    setMistakes([]);
    setAiExplanations({});
    setHp(100);
    setShields(50);
    setAlivePlayers(24);
    setVaultGold(0);
    setStreakCombo(1);
    setEmpireScore(0);
    setMasonryStone(100);
    setHiddenOptions([]);
    setPowerupUsedFiftyFifty(false);
  }, [mode]);


  // Heist 50:50 Powerup
  const useFiftyFifty = () => {
    if (powerupUsedFiftyFifty || isAnswered) return;
    const incorrectIndices = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== currentQ.correctIndex);
    const toHide = incorrectIndices.slice(0, 2);
    setHiddenOptions(toHide);
    setPowerupUsedFiftyFifty(true);
  };

  // Timer countdown
  React.useEffect(() => {
    if (isAnswered || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSelect(-1);
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

  // Finished Screen
  if (isFinished) {
    const totalQuestions = activeQuestions.length;
    const correctCount = totalQuestions - mistakes.length;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
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
              : `Outstanding gameplay, ${nickname}! Here are your results.`}
          </CardDescription>
        </div>

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
            <div className="text-2xl font-extrabold text-primary mt-0.5">{score}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Accuracy</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{accuracy}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mastery</div>
            <div className="text-2xl font-extrabold text-foreground mt-0.5">
              {correctCount} / {totalQuestions}
            </div>
          </div>
        </div>

        {/* Mistakes Review */}
        {mistakes.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Review Questions to Improve ({mistakes.length})
            </h4>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {mistakes.map((m, i) => {
                const aiState = aiExplanations[i];
                return (
                  <div key={i} className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2.5 text-xs">
                    <p className="font-semibold text-foreground">{m.q}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-rose-600 dark:text-rose-400 font-medium">Your answer: {m.selected}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Correct: {m.correct}</span>
                    </div>

                    {m.exp && !aiState?.text && (
                      <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg leading-relaxed">
                        {m.exp}
                      </p>
                    )}

                    {/* AI Breakdown Section */}
                    {aiState?.text ? (
                      <div className="p-3 rounded-lg border border-violet-500/30 bg-violet-500/5 text-xs space-y-1.5 animate-in fade-in-50">
                        <div className="flex items-center gap-1.5 font-bold text-violet-600 dark:text-violet-400 text-[11px]">
                          <Brain className="size-3.5" />
                          <span>AI Tutor Deep Breakdown</span>
                        </div>
                        <p className="text-foreground/90 whitespace-pre-line leading-relaxed text-[11px]">
                          {aiState.text}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <span className="text-[10px] text-muted-foreground">Need a deeper explanation?</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={aiState?.loading}
                          onClick={() => handleExplainMistake(i)}
                          className="h-7 text-[11px] px-2.5 gap-1.5 text-violet-600 hover:text-violet-700 hover:bg-violet-500/10 font-semibold"
                        >
                          {aiState?.loading ? (
                            <>
                              <Loader2 className="size-3 animate-spin" />
                              <span>Thinking...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="size-3" />
                              <span>Ask AI Tutor Why</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {aiState?.error && (
                      <p className="text-[10px] text-rose-500">{aiState.error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (

          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>Flawless score! You answered every question correctly on the first attempt.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleRestart} className="w-full sm:w-auto gap-2">
            <RotateCcw className="size-4" />
            Play Again
          </Button>

          {onExit && (
            <Button onClick={onExit} className="w-full sm:w-auto gap-2">
              <span>Return to Hub</span>
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const optionLetters = ["A", "B", "C", "D"];

  return (
    <Card className="mx-auto max-w-2xl border-border/80 shadow-xl overflow-hidden" id="active-quiz-player">
      {/* Header bar with Game Mode Visual HUD */}
      <CardHeader className="border-b bg-muted/20 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs uppercase">
              {mode} MODE
            </Badge>
            <span className="text-xs text-muted-foreground font-medium truncate max-w-[180px]">
              {quizTitle}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-500">
              <Clock className="size-3.5" />
              <span>{timeLeft}s</span>
            </div>
            <Badge variant="secondary" className="font-mono font-bold text-xs">
              {score} pts
            </Badge>
          </div>
        </div>

        {/* Game Mode Specific HUD */}
        {mode === "royale" && (
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs">
            <div className="flex items-center gap-1.5">
              <Heart className="size-4 text-rose-500 fill-rose-500" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-semibold">
                  <span>HP</span>
                  <span>{hp}%</span>
                </div>
                <Progress value={hp} className="h-1.5 bg-rose-950/20" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Shield className="size-4 text-blue-500 fill-blue-500" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-semibold">
                  <span>Shield</span>
                  <span>{shields}%</span>
                </div>
                <Progress value={shields} className="h-1.5 bg-blue-950/20" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 font-semibold text-[11px] text-amber-600 dark:text-amber-400">
              <Crosshair className="size-3.5" />
              <span>{alivePlayers} Alive</span>
            </div>
          </div>
        )}

        {mode === "heist" && (
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-xs">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-yellow-500" />
              <span className="font-bold text-foreground">Vault: {vaultGold} Gold</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500 text-white font-mono text-[10px]">
                {streakCombo}x Multiplier
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={useFiftyFifty}
                disabled={powerupUsedFiftyFifty || isAnswered}
                className="h-6 text-[10px] px-2 gap-1 border-yellow-500/30"
              >
                <Zap className="size-3 text-yellow-500" />
                <span>50:50</span>
              </Button>
            </div>
          </div>
        )}

        {mode === "empire" && (
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs">
            <div className="flex items-center gap-2">
              <Castle className="size-4 text-emerald-500" />
              <span className="font-bold text-foreground">
                Level {Math.min(4, empireScore + 1)}: {EMPIRE_STAGES[Math.min(3, empireScore)].name}
              </span>
            </div>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {masonryStone} Masonry Stones
            </span>
          </div>
        )}

        {/* Question Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Question {currentIndex + 1} of {activeQuestions.length}
            </span>
            {currentQ.topic && <span className="font-medium text-primary">{currentQ.topic}</span>}
          </div>
          <Progress
            value={((currentIndex + 1) / activeQuestions.length) * 100}
            className="h-1.5"
          />
        </div>
      </CardHeader>

      {/* Main Question Body */}
      <CardContent className="p-6 space-y-6">
        <h2 className="text-lg font-bold text-foreground leading-snug">
          {currentQ.question}
        </h2>

        {/* Options List */}
        <div className="grid gap-3">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;
            const isHidden = hiddenOptions.includes(idx);

            if (isHidden) {
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-dashed border-border/40 opacity-30 text-xs text-muted-foreground flex items-center gap-2"
                >
                  <span className="font-mono text-xs">{optionLetters[idx]}.</span>
                  <span>[Eliminated by 50:50]</span>
                </div>
              );
            }

            let cardStyle = "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30";
            if (isAnswered) {
              if (isCorrect) {
                cardStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-semibold";
              } else if (isSelected) {
                cardStyle = "border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-200";
              } else {
                cardStyle = "opacity-40 border-border/40";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${cardStyle}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-7 items-center justify-center rounded-lg border bg-muted/60 font-mono text-xs font-bold text-muted-foreground shrink-0">
                    {optionLetters[idx]}
                  </span>
                  <span className="text-sm text-foreground">{option}</span>
                </div>

                {isAnswered && isCorrect && <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="size-5 text-rose-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next step */}
        {isAnswered && (
          <div className="space-y-4 pt-2 animate-in fade-in-50">
            {currentQ.explanation && (
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1">
                <span className="font-bold text-foreground">Explanation: </span>
                <span>{currentQ.explanation}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Press Enter or click next</span>
              <Button onClick={handleNext} className="gap-2 shadow-xs">
                <span>{currentIndex + 1 < activeQuestions.length ? "Next Question" : "Complete Round"}</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
