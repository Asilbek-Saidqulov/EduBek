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
  Coins,
  Castle,
  Zap,
  Sparkles,
  Swords,
  Crown,
  Loader2,
  Brain,
  HelpCircle,
  Send,
  FileQuestion,
  AlertTriangle,
  Flag,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations, useLocale } from "next-intl";
import { MODE_SKIN, ModeStatusChips, type GameModeType } from "@/components/edubek/game-modes";
import {
  classicScore,
  heistEarnOnCorrect,
  resolveHeistInvest,
  resolveHeistRaid,
  resourcesForCorrectAnswer,
  canUpgradeEmpire,
  applyEmpireUpgrade,
  empirePower,
  applyRoyaleMistake,
  royaleShieldEarned,
  simulateBattleOpponent,
  emptyResources,
  EMPIRE_TIERS,
  ROYALE_START_HEARTS,
  BATTLE_DUEL_QUESTIONS,
  type Resources,
} from "@/features/multiplayer/mode-rules";

export type { GameModeType };

export interface GuestQuizQuestion {
  id?: string;
  questionId?: string;
  question?: string;
  prompt?: string;
  questionType?: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  explanation?: string;
  topic?: string;
  points?: number;
  payload?: {
    prompt?: string;
    options?: string[];
    correctAnswer?: string;
    answerKey?: any;
    explanation?: string;
    acceptableAnswers?: string[];
  };
}

export interface GuestQuizPlayerProps {
  pin?: string;
  joinCode?: string;
  quizId?: string;
  assessmentId?: string;
  attemptId?: string;
  quizTitle?: string;
  nickname?: string;
  mode?: GameModeType;
  questions?: GuestQuizQuestion[];
  durationMinutes?: number;
  onExit?: () => void;
  onAttemptCompleted?: (attempt: any) => void;
}

const DEFAULT_QUESTIONS: GuestQuizQuestion[] = [
  {
    id: "q-cs-1",
    question: "Which data structure uses the First-In, First-Out (FIFO) principle?",
    questionType: "multiple_choice",
    options: ["Stack", "Queue", "Binary Tree", "Hash Map"],
    correctIndex: 1,
    correctAnswer: "Queue",
    explanation: "A Queue processes elements in First-In, First-Out (FIFO) order, whereas a Stack is LIFO.",
    topic: "Computer Science",
    points: 1,
  },
  {
    id: "q-bio-1",
    question: "What is the primary function of chlorophyll in plant cells?",
    questionType: "multiple_choice",
    options: ["Cell division", "Water storage", "Light absorption for photosynthesis", "Nutrient transport"],
    correctIndex: 2,
    correctAnswer: "Light absorption for photosynthesis",
    explanation: "Chlorophyll pigments absorb sunlight (primarily blue and red wavelengths) to power photosynthesis.",
    topic: "Biology",
    points: 1,
  },
  {
    id: "q-math-1",
    question: "If a quadratic equation has discriminant D = 0, what does this indicate about its roots?",
    questionType: "multiple_choice",
    options: ["Two distinct real roots", "Exactly one repeated real root", "Two complex conjugate roots", "No solution"],
    correctIndex: 1,
    correctAnswer: "Exactly one repeated real root",
    explanation: "When the discriminant b² - 4ac = 0, the parabola touches the x-axis at exactly one point (one repeated real root).",
    topic: "Mathematics",
    points: 1,
  },
  {
    id: "q-phys-1",
    question: "According to Newton's Second Law, if net force on an object is doubled while mass remains constant, its acceleration will:",
    questionType: "multiple_choice",
    options: ["Remain unchanged", "Be halved", "Be doubled", "Quadruple"],
    correctIndex: 2,
    correctAnswer: "Be doubled",
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
  assessmentId: propAssessmentId,
  attemptId: initialAttemptId,
  quizTitle = "Interactive Quiz",
  nickname = "Student Player",
  mode = "classic",
  questions: propQuestions,
  durationMinutes,
  onExit,
  onAttemptCompleted,
}: GuestQuizPlayerProps) {
  const t = useTranslations("quizPlayer");
  const locale = useLocale();
  const activeAssessmentId = propAssessmentId || quizId;
  const [activeQuestions, setActiveQuestions] = React.useState<GuestQuizQuestion[]>(
    propQuestions && propQuestions.length > 0 ? propQuestions : DEFAULT_QUESTIONS,
  );

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [selectedMultiOptions, setSelectedMultiOptions] = React.useState<number[]>([]);
  const [textAnswer, setTextAnswer] = React.useState<string>("");
  const [score, setScore] = React.useState(0);
  const [isAnswered, setIsAnswered] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(mode === "heist" ? 15 : 30);
  const [mistakes, setMistakes] = React.useState<Array<{ q: string; selected: string; correct: string; exp?: string }>>([]);

  // Server attempt tracking
  const [currentAttemptId, setCurrentAttemptId] = React.useState<string | null>(initialAttemptId || null);
  const [responsesMap, setResponsesMap] = React.useState<Record<string, { answer: any; timeSpentMs: number }>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverAttemptResult, setServerAttemptResult] = React.useState<any | null>(null);
  const [isLoadingAttempt, setIsLoadingAttempt] = React.useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = React.useState<Record<number, boolean>>({});

  // AI Helpers State
  const [aiExplanations, setAiExplanations] = React.useState<Record<string, { text: string; loading: boolean }>>({});
  const [isGeneratingPractice, setIsGeneratingPractice] = React.useState(false);
  const [practiceMessage, setPracticeMessage] = React.useState<string | null>(null);

  const [hp, setHp] = React.useState(100);
  const [shields, setShields] = React.useState(50);
  const [alivePlayers, setAlivePlayers] = React.useState(24);
  const [vaultGold, setVaultGold] = React.useState(0);
  const [streakCombo, setStreakCombo] = React.useState(0);
  const [hiddenOptions, setHiddenOptions] = React.useState<number[]>([]);
  const [powerupUsedFiftyFifty, setPowerupUsedFiftyFifty] = React.useState(false);
  const [empireScore, setEmpireScore] = React.useState(0);
  const [masonryStone, setMasonryStone] = React.useState(100);
  const [hearts, setHearts] = React.useState(ROYALE_START_HEARTS);
  const [hasShield, setHasShield] = React.useState(false);
  const [eliminated, setEliminated] = React.useState(false);
  const [resources, setResources] = React.useState<Resources>(emptyResources);
  const [empireTier, setEmpireTier] = React.useState(0);
  const [lastAward, setLastAward] = React.useState<string | null>(null);
  const [heistChoiceOpen, setHeistChoiceOpen] = React.useState(false);
  const [pendingGold, setPendingGold] = React.useState(0);
  const [battleYou, setBattleYou] = React.useState(0);
  const [battleThem, setBattleThem] = React.useState(0);

  const startTimeRef = React.useRef<number>(Date.now());
  const questionStartTimeRef = React.useRef<number>(Date.now());

  // 1. Initial Start or Resume Attempt from Server
  React.useEffect(() => {
    let isMounted = true;
    async function initAssessment() {
      if (initialAttemptId) {
        setIsLoadingAttempt(true);
        try {
          const res = await fetch(`/api/attempts/${initialAttemptId}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setServerAttemptResult(data);
              if (data.status === "graded" || data.status === "submitted") {
                setIsFinished(true);
              }
            }
          }
        } catch (e) {
          console.error("Failed to load attempt details:", e);
        } finally {
          if (isMounted) setIsLoadingAttempt(false);
        }
        return;
      }

      if (activeAssessmentId && (!propQuestions || propQuestions.length === 0)) {
        setIsLoadingAttempt(true);
        try {
          const res = await fetch(`/api/assessments/${activeAssessmentId}/start`, {
            method: "POST",
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.assessment?.questions) {
              setCurrentAttemptId(data.attempt.id);
              const mappedQuestions = data.assessment.questions.map((aq: any) => ({
                id: aq.id,
                questionId: aq.questionId,
                questionType: aq.questionType || "multiple_choice",
                prompt: aq.payload?.prompt || aq.prompt || "Question",
                question: aq.payload?.prompt || aq.prompt || "Question",
                options: aq.payload?.options || ["True", "False"],
                topic: data.assessment.title,
                points: aq.points || 1,
                payload: aq.payload,
              }));
              setActiveQuestions(mappedQuestions);
            }
          }
        } catch (err) {
          console.warn("Could not start server assessment attempt, running local mode:", err);
        } finally {
          if (isMounted) setIsLoadingAttempt(false);
        }
      }
    }

    initAssessment();
    return () => {
      isMounted = false;
    };
  }, [activeAssessmentId, initialAttemptId, propQuestions]);

  const currentQ = activeQuestions[currentIndex] || activeQuestions[0] || DEFAULT_QUESTIONS[0];
  const qType = currentQ.questionType || "multiple_choice";
  const questionPrompt = currentQ.prompt || currentQ.question || "Question";
  const questionOptions = currentQ.options || currentQ.payload?.options || [];
  const qId = currentQ.questionId || currentQ.id || `q-${currentIndex}`;

  // Sync inputs when switching question
  React.useEffect(() => {
    setSelectedOption(null);
    setSelectedMultiOptions([]);
    setTextAnswer("");
    setIsAnswered(false);
    setHiddenOptions([]);
    setPowerupUsedFiftyFifty(false);
    questionStartTimeRef.current = Date.now();
  }, [currentIndex]);

  // Handle Option Selection for Multiple Choice
  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    const chosenVal = questionOptions[index] || String(index);
    const timeSpent = Date.now() - questionStartTimeRef.current;

    setResponsesMap((prev) => ({
      ...prev,
      [qId]: { answer: chosenVal, timeSpentMs: timeSpent },
    }));

    setIsAnswered(true);
    applyModeResult(index === currentQ.correctIndex || currentQ.correctIndex === undefined, timeSpent);
  };

  const applyModeResult = (isCorrect: boolean, timeSpent: number) => {
    if (mode === "classic" || mode === "battle") {
      const pts = classicScore(isCorrect, timeSpent);
      setScore((s) => s + pts.totalPoints);
      setLastAward(isCorrect ? `+${pts.totalPoints} (${pts.basePoints} + ${pts.speedBonus} speed)` : "+0");
      if (mode === "battle") {
        const duel = simulateBattleOpponent(isCorrect, timeSpent);
        setBattleYou((y) => y + duel.playerPts);
        setBattleThem((th) => th + duel.opponentPts);
        setLastAward(
          isCorrect
            ? `You +${duel.playerPts} · Rival +${duel.opponentPts}`
            : `Miss · Rival +${duel.opponentPts}`,
        );
      }
      return;
    }

    if (mode === "heist") {
      if (isCorrect) {
        setPendingGold(heistEarnOnCorrect());
        setHeistChoiceOpen(true);
        setLastAward("+100 gold — choose what to do with it");
      } else {
        setLastAward("No gold this question");
      }
      return;
    }

    if (mode === "empire") {
      if (isCorrect) {
        const gain = resourcesForCorrectAnswer();
        setResources((r) => ({
          wood: r.wood + gain.wood,
          stone: r.stone + gain.stone,
          gold: r.gold + gain.gold,
          food: r.food + gain.food,
        }));
        setLastAward(`+${gain.wood} wood · +${gain.stone} stone · +${gain.gold} gold · +${gain.food} food`);
      } else {
        setLastAward("No resources this question");
      }
      return;
    }

    if (mode === "royale") {
      if (isCorrect) {
        const nextStreak = streakCombo + 1;
        setStreakCombo(nextStreak);
        if (royaleShieldEarned(nextStreak)) setHasShield(true);
        setLastAward(royaleShieldEarned(nextStreak) ? "Safe — shield earned" : "Safe");
      } else {
        const next = applyRoyaleMistake(hearts, hasShield);
        setHearts(next.hearts);
        setHasShield(next.hasShield);
        setStreakCombo(0);
        setLastAward(hasShield ? "Shield blocked the miss" : `Lost a heart (${next.hearts} left)`);
        if (next.eliminated) {
          setEliminated(true);
          setIsFinished(true);
        }
      }
    }
  };

  const finishHeistChoice = (kind: "save" | "invest" | "raid") => {
    let extra = pendingGold;
    let note = `Saved ${pendingGold}`;
    if (kind === "invest") {
      const r = resolveHeistInvest();
      extra = pendingGold + r.goldDelta;
      note = r.win ? "Invest won +200" : "Invest returned 0 extra";
    }
    if (kind === "raid") {
      const r = resolveHeistRaid();
      extra = pendingGold + r.goldDelta;
      note = r.win ? "Raid took +300 from the pot" : "Raid failed (−100)";
    }
    setVaultGold((g) => Math.max(0, g + extra));
    setScore((s) => Math.max(0, s + extra));
    setPendingGold(0);
    setHeistChoiceOpen(false);
    setLastAward(note);
  };

  const tryEmpireUpgrade = () => {
    const next = applyEmpireUpgrade(empireTier, resources);
    setEmpireTier(next.tierIndex);
    setResources(next.resources);
    setScore(empirePower(next.tierIndex, next.resources));
    setLastAward(next.tierIndex > empireTier ? `Upgraded to ${EMPIRE_TIERS[next.tierIndex]}` : "Need more resources");
  };

  // Handle Multi-Select Checkboxes
  const toggleMultiSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedMultiOptions((prev) => {
      const next = prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index];
      const answers = next.map((idx) => questionOptions[idx] || String(idx));
      const timeSpent = Date.now() - questionStartTimeRef.current;
      setResponsesMap((p) => ({
        ...p,
        [qId]: { answer: answers, timeSpentMs: timeSpent },
      }));
      return next;
    });
  };

  // Handle Text/Essay Input
  const handleTextAnswerChange = (val: string) => {
    setTextAnswer(val);
    const timeSpent = Date.now() - questionStartTimeRef.current;
    setResponsesMap((prev) => ({
      ...prev,
      [qId]: { answer: val, timeSpentMs: timeSpent },
    }));
  };

  // Submit attempt to server
  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    const formattedResponses = activeQuestions.map((q, idx) => {
      const questionIdentifier = q.questionId || q.id || `q-${idx}`;
      const recorded = responsesMap[questionIdentifier];
      return {
        questionId: questionIdentifier,
        answer: recorded ? recorded.answer : null,
        timeSpentMs: recorded ? recorded.timeSpentMs : 0,
      };
    });

    try {
      if (activeAssessmentId && currentAttemptId) {
        const res = await fetch(`/api/assessments/${activeAssessmentId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: currentAttemptId,
            responses: formattedResponses,
          }),
        });

        if (res.ok) {
          const gradedAttempt = await res.json();
          setServerAttemptResult(gradedAttempt);
          if (onAttemptCompleted) onAttemptCompleted(gradedAttempt);
        }
      } else if (currentAttemptId) {
        // Quizzes submit endpoint fallback
        const res = await fetch(`/api/quizzes/attempts/${currentAttemptId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: formattedResponses.map((r, i) => ({
              questionId: r.questionId,
              selectedIndex: typeof r.answer === "number" ? r.answer : 0,
              timeTakenMs: r.timeSpentMs,
            })),
          }),
        });
        if (res.ok) {
          const gradedQuiz = await res.json();
          setServerAttemptResult(gradedQuiz);
        }
      }
    } catch (e) {
      console.error("Submission failed:", e);
    } finally {
      setIsSubmitting(false);
      setIsFinished(true);
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (heistChoiceOpen) return;
    const limit = mode === "battle" ? Math.min(BATTLE_DUEL_QUESTIONS, activeQuestions.length) : activeQuestions.length;
    if (currentIndex + 1 < limit) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (mode === "heist") setScore(vaultGold);
      if (mode === "empire") setScore(empirePower(empireTier, resources));
      handleSubmitAssessment();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Power-up: 50/50 Eliminator (Heist)
  const handleUseFiftyFifty = () => {
    if (powerupUsedFiftyFifty || isAnswered) return;
    setPowerupUsedFiftyFifty(true);
    const correctIdx = currentQ.correctIndex ?? 0;
    const incorrectIndices = questionOptions.map((_, i) => i).filter((i) => i !== correctIdx);
    const toHide = incorrectIndices.slice(0, 2);
    setHiddenOptions(toHide);
  };

  // Request AI Explanation for a question
  const handleRequestAiExplanation = async (questionItem: any, studentAns: any, correctAns: any) => {
    const key = questionItem.questionId || questionItem.id || questionItem.prompt;
    setAiExplanations((prev) => ({
      ...prev,
      [key]: { text: "", loading: true },
    }));

    try {
      const res = await fetch("/api/ai-assessment/explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionPrompt: questionItem.prompt || questionItem.question || "Question",
          questionType: questionItem.questionType || "multiple_choice",
          correctAnswer: String(correctAns || "Correct standard response"),
          studentAnswer: String(studentAns || "No answer recorded"),
          language: locale,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiExplanations((prev) => ({
          ...prev,
          [key]: { text: data.explanation || "Explanation ready.", loading: false },
        }));
      } else {
        throw new Error("Could not retrieve AI explanation");
      }
    } catch (err: any) {
      setAiExplanations((prev) => ({
        ...prev,
        [key]: { text: "Unable to generate AI explanation at this moment.", loading: false },
      }));
    }
  };

  // Request AI Targeted Practice Drill
  const handleGenerateTargetedPractice = async () => {
    setIsGeneratingPractice(true);
    setPracticeMessage(null);
    try {
      const res = await fetch("/api/ai-assessment/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quizTitle || "Assessment Practice",
          questionCount: 5,
          language: locale,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          const mapped = data.questions.map((q: any, i: number) => ({
            id: `practice-${i}`,
            questionType: q.questionType || "multiple_choice",
            prompt: q.prompt,
            question: q.prompt,
            options: q.payload?.options || ["A", "B", "C", "D"],
            correctAnswer: q.payload?.correctAnswer,
            explanation: q.payload?.explanation,
            points: q.points || 1,
            payload: q.payload,
          }));
          setActiveQuestions(mapped);
          setCurrentIndex(0);
          setIsFinished(false);
          setServerAttemptResult(null);
          setResponsesMap({});
          setMistakes([]);
          setScore(0);
          setPracticeMessage("Targeted AI practice drill generated and loaded!");
        }
      }
    } catch (err) {
      setPracticeMessage("Failed to generate practice drill. Please try again.");
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  // Restart Handler
  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setSelectedMultiOptions([]);
    setTextAnswer("");
    setIsAnswered(false);
    setIsFinished(false);
    setServerAttemptResult(null);
    setResponsesMap({});
    setMistakes([]);
    setScore(0);
    setHp(100);
    setShields(50);
    setVaultGold(0);
    setStreakCombo(1);
    setEmpireScore(0);
    setMasonryStone(100);
    startTimeRef.current = Date.now();
    questionStartTimeRef.current = Date.now();
  };

  // Timer per question / exam
  React.useEffect(() => {
    if (isFinished || isSubmitting) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex, isFinished, isSubmitting]);

  // Loading Screen
  if (isLoadingAttempt) {
    return (
      <Card className="mx-auto max-w-lg border-border/80 p-10 text-center space-y-4 shadow-xl">
        <Loader2 className="size-10 animate-spin text-primary mx-auto" />
        <CardTitle className="text-xl font-bold">{t("loadingInit")}</CardTitle>
        <CardDescription className="text-xs">
          Loading authorized questions, security rules, and setting up your attempt session.
        </CardDescription>
      </Card>
    );
  }

  // Submitting Loader
  if (isSubmitting) {
    return (
      <Card className="mx-auto max-w-lg border-border/80 p-10 text-center space-y-4 shadow-xl" id="grading-in-progress">
        <Loader2 className="size-10 animate-spin text-primary mx-auto" />
        <CardTitle className="text-xl font-bold">{t("grading")}</CardTitle>
        <CardDescription className="text-xs">{t("gradingHint")}</CardDescription>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // RESULTS SCREEN (Server Authoritative & Persistent)
  // ---------------------------------------------------------------------------
  if (isFinished) {
    const totalMaxPoints = serverAttemptResult?.pointsMax ?? activeQuestions.reduce((s, q) => s + (q.points || 1), 0);
    const totalAwardedPoints = serverAttemptResult?.pointsAwarded ?? score;
    const calculatedPct =
      serverAttemptResult?.score ??
      (totalMaxPoints > 0 ? Math.round((totalAwardedPoints / totalMaxPoints) * 100) : 100);
    const hasPassed = serverAttemptResult?.passed ?? calculatedPct >= 60;

    return (
      <div className="mx-auto max-w-3xl space-y-6" id="assessment-results-view">
        <Card className="border-border/80 p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div
              className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl border mb-2 ${
                hasPassed ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
              }`}
            >
              {hasPassed ? <Trophy className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
            </div>

            <CardTitle className="text-2xl sm:text-3xl font-bold">
              {hasPassed ? t("passedTitle") : t("completedTitle")}
            </CardTitle>
            <CardDescription className="text-sm">
              {t("officialResult", { title: quizTitle || t("defaultTitle") })}
            </CardDescription>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 p-5 rounded-2xl bg-muted/30 border border-border/70 text-center">
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t("score")}</div>
              <div className="text-2xl sm:text-3xl font-black text-primary mt-1">
                {totalAwardedPoints} / {totalMaxPoints}
              </div>
              <span className="text-[11px] text-muted-foreground">{t("pointsEarned")}</span>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t("percentage")}</div>
              <div
                className={`text-2xl sm:text-3xl font-black mt-1 ${
                  hasPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {calculatedPct}%
              </div>
              <span className="text-[11px] text-muted-foreground">{t("grade")}</span>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t("outcome")}</div>
              <div className="mt-1.5">
                <Badge
                  className={`text-xs px-3 py-1 font-bold ${
                    hasPassed
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-rose-600 hover:bg-rose-700 text-white"
                  }`}
                >
                  {hasPassed ? t("passed") : t("needsPractice")}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground block mt-1">
                {t("recorded")}
              </span>
            </div>
          </div>

          {/* AI Practice Recommendation Action Banner */}
          <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-violet-600 text-white shrink-0">
                <Brain className="size-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Personalized AI Revision</div>
                <p className="text-xs text-muted-foreground">
                  Generate a targeted revision drill focusing specifically on weak areas.
                </p>
              </div>
            </div>

            <Button
              onClick={handleGenerateTargetedPractice}
              disabled={isGeneratingPractice}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shrink-0 gap-2"
            >
              {isGeneratingPractice ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Generating AI Practice...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Launch Targeted Drill</span>
                </>
              )}
            </Button>
          </div>

          {practiceMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{practiceMessage}</span>
            </div>
          )}

          {/* Detailed Question Review List */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t("questionBreakdown", { count: activeQuestions.length })}</span>
              <span className="text-xs normal-case font-normal text-muted-foreground">
                Verified against database snapshot
              </span>
            </h3>

            {activeQuestions.map((q, idx) => {
              const questionIdentifier = q.questionId || q.id || `q-${idx}`;
              const recorded = responsesMap[questionIdentifier];
              const studentAnswerVal = recorded?.answer ?? t("notAnswered");

              // Check if server response exists
              const serverResp = serverAttemptResult?.responses?.find(
                (r: any) => r.questionId === questionIdentifier || r.questionId === q.questionId,
              );
              const isCorrect = serverResp?.isCorrect ?? (q.correctIndex !== undefined ? studentAnswerVal === q.options?.[q.correctIndex] : null);
              const pointsEarned = serverResp?.pointsAwarded ?? (isCorrect ? q.points || 1 : 0);
              const aiKey = questionIdentifier;
              const aiState = aiExplanations[aiKey];

              return (
                <Card key={idx} className="border-border/80 bg-muted/20 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          Q{idx + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                          {q.questionType || "multiple_choice"}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground pt-1">{q.prompt || q.question}</h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-foreground">
                        {pointsEarned} / {q.points || 1} pts
                      </span>
                      {isCorrect !== null && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold justify-end mt-0.5">
                          {isCorrect ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="size-3" /> {t("correct")}
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center gap-1">
                              <XCircle className="size-3" /> {t("incorrect")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 text-xs pt-1">
                    <div className="p-3 rounded-lg bg-card border flex flex-col gap-1">
                      <span className="text-muted-foreground text-[11px] font-medium">{t("yourAnswer")}</span>
                      <span className="font-semibold text-foreground">
                        {Array.isArray(studentAnswerVal) ? studentAnswerVal.join(", ") : String(studentAnswerVal)}
                      </span>
                    </div>

                    {q.correctAnswer && (
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1">
                        <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
                          {t("expectedAnswer")}
                        </span>
                        <span className="font-semibold text-emerald-900 dark:text-emerald-200">{q.correctAnswer}</span>
                      </div>
                    )}

                    {serverResp?.feedback && (
                      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200">
                        <strong>{t("teacherFeedback")}:</strong> {serverResp.feedback}
                      </div>
                    )}
                  </div>

                  {isCorrect === false && (
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {aiState ? (
                        <div className="w-full p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Brain className="size-3.5" />
                            <span>{t("whyWrong")}</span>
                          </div>
                          {aiState.loading ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-xs py-1">
                              <Loader2 className="size-3 animate-spin" />
                              <span>{t("explaining")}</span>
                            </div>
                          ) : (
                            <p className="text-foreground/90 leading-relaxed">{aiState.text}</p>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestAiExplanation(q, studentAnswerVal, q.correctAnswer)}
                          className="text-xs h-8 gap-1.5"
                        >
                          <Sparkles className="size-3.5" />
                          <span>{t("explain")}</span>
                        </Button>
                      )}
                      <Button asChild variant="secondary" size="sm" className="text-xs h-8 gap-1.5">
                        <Link
                          href={`/tutor?q=${encodeURIComponent(String(q.prompt || q.question || ""))}&your=${encodeURIComponent(String(studentAnswerVal ?? ""))}&correct=${encodeURIComponent(String(q.correctAnswer ?? ""))}`}
                        >
                          <Brain className="size-3.5" />
                          {t("fixWithTutor")}
                        </Link>
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleRestart} className="gap-2 text-xs">
              <RotateCcw className="size-3.5" />
              <span>{t("retake")}</span>
            </Button>

            {onExit ? (
              <Button onClick={onExit} className="gap-2 text-xs">
                <span>{t("returnHub")}</span>
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button asChild className="gap-2 text-xs">
                <Link href="/live-quiz">
                  <span>{t("returnHub")}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ACTIVE ASSESSMENT PLAYER VIEW
  // ---------------------------------------------------------------------------
  const progressPct = ((currentIndex + 1) / activeQuestions.length) * 100;
  const questionLimit = mode === "battle" ? Math.min(BATTLE_DUEL_QUESTIONS, activeQuestions.length) : activeQuestions.length;
  const isLastQuestion = currentIndex + 1 === questionLimit;

  const skin = MODE_SKIN[mode] ?? MODE_SKIN.classic;
  const empireStage = EMPIRE_STAGES[Math.min(EMPIRE_STAGES.length - 1, Math.max(0, empireScore - 1))] ?? EMPIRE_STAGES[0];

  return (
    <div className={`mode-rise mx-auto max-w-3xl space-y-4 ${skin.shell}`} id="active-assessment-container">
      <div className={`flex items-center justify-between gap-4 backdrop-blur-md p-4 rounded-2xl border shadow-xs ${skin.hud}`}>
        <div className="flex items-center gap-3 min-w-0">
          {onExit && (
            <Button variant="ghost" size="sm" onClick={onExit} className="h-8 px-2 text-xs">
              <ChevronLeft className="size-4 mr-1" /> Exit
            </Button>
          )}
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{mode}</p>
            <h1 className="text-base font-bold leading-tight truncate max-w-[240px] sm:max-w-md">
              {quizTitle}
            </h1>
            <div className="flex items-center gap-2 text-xs opacity-80 mt-0.5">
              <span>
                {t("qLabel", { n: currentIndex + 1 })} / {activeQuestions.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ModeStatusChips
            mode={mode}
            vaultGold={vaultGold}
            hearts={hearts}
            hasShield={hasShield}
            classicPoints={score}
            battleYou={battleYou}
            battleThem={battleThem}
            empireTier={EMPIRE_TIERS[empireTier]}
          />
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold ${
              timeLeft <= 5
                ? "mode-urgent bg-rose-500 text-white"
                : mode === "heist"
                  ? "bg-yellow-400 text-zinc-900"
                  : "bg-black/10 dark:bg-white/10"
            }`}
          >
            <Clock className="size-3.5" />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {lastAward && (
        <div className="mode-rise rounded-xl border bg-card/80 px-4 py-2 text-xs font-medium">{lastAward}</div>
      )}

      {mode === "empire" && (
        <div className="mode-rise rounded-xl border border-emerald-300/50 bg-emerald-50/70 dark:bg-emerald-950/40 px-4 py-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{EMPIRE_TIERS[empireTier]}</span>
            <span>Power {empirePower(empireTier, resources)}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <span>Wood {resources.wood}</span>
            <span>Stone {resources.stone}</span>
            <span>Gold {resources.gold}</span>
            <span>Food {resources.food}</span>
          </div>
          <Button size="sm" className="w-full h-8 text-xs" disabled={!canUpgradeEmpire(empireTier, resources)} onClick={tryEmpireUpgrade}>
            Upgrade to {EMPIRE_TIERS[Math.min(EMPIRE_TIERS.length - 1, empireTier + 1)]}
          </Button>
        </div>
      )}

      {heistChoiceOpen && (
        <div className="mode-rise rounded-xl border border-yellow-500/40 bg-zinc-950/80 text-yellow-50 p-4 space-y-3">
          <p className="text-sm font-semibold">You earned {pendingGold} gold. What now?</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button size="sm" variant="secondary" onClick={() => finishHeistChoice("save")}>Save</Button>
            <Button size="sm" variant="secondary" onClick={() => finishHeistChoice("invest")}>Invest (50% +200)</Button>
            <Button size="sm" variant="secondary" onClick={() => finishHeistChoice("raid")}>Raid pot (+300 / −100)</Button>
          </div>
        </div>
      )}

      <Progress value={progressPct} className={`h-2 rounded-full ${mode === "heist" ? "bg-yellow-900/40" : ""}`} />

      {/* Main Question Card */}
      <Card className={`shadow-md p-6 sm:p-8 space-y-6 ${mode === "heist" || mode === "royale" || mode === "battle" ? "bg-black/30 border-white/10 text-inherit" : "border-border/80"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            {currentQ.topic && (
              <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                {currentQ.topic}
              </Badge>
            )}
            <h2 className={`text-xl sm:text-2xl font-bold leading-snug ${mode === "heist" || mode === "royale" || mode === "battle" ? "text-white" : "text-foreground"}`}>{questionPrompt}</h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFlaggedQuestions((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }))}
            className={`size-8 shrink-0 ${flaggedQuestions[currentIndex] ? "text-amber-500" : "text-muted-foreground"}`}
            title={t("flag")}
          >
            <Flag className="size-4" />
          </Button>
        </div>

        {/* Mode Heist Powerup */}
        {mode === "heist" && !powerupUsedFiftyFifty && !isAnswered && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUseFiftyFifty}
            className="w-full text-xs font-semibold gap-1.5 border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/10 mode-shimmer"
          >
            <Zap className="size-3.5" />
            <span>{t("fiftyFifty")}</span>
          </Button>
        )}

        {/* QUESTION INPUT ACCORDING TO QUESTION TYPE */}
        {/* 1. Multiple Choice / True-False */}
        {(qType === "multiple_choice" || qType === "true_false") && (
          <div className="grid gap-3 sm:grid-cols-2">
            {questionOptions.map((opt, idx) => {
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
              let btnStyle = "border-border/80 bg-card hover:border-primary/60 hover:bg-muted/30 text-foreground";
              if (isSelected) {
                btnStyle = `${skin.optionOn} font-bold`;
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className={`mode-opt p-4 rounded-xl border text-left text-sm transition-transform duration-200 hover:scale-[1.02] flex items-start gap-3 ${btnStyle} focus:outline-none ${isSelected ? "mode-combo" : ""}`}
                  style={{ animationDelay: `${idx * 70}ms` }}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-xs font-mono font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-snug pt-0.5">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Multiple Select (Checkboxes) */}
        {qType === "multiple_select" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Select all applicable options:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {questionOptions.map((opt, idx) => {
                const isSelected = selectedMultiOptions.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleMultiSelectOption(idx)}
                    className={`p-4 rounded-xl border text-left text-sm transition-all flex items-start gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/30"
                        : "border-border/80 bg-card hover:border-primary/60 text-foreground"
                    }`}
                  >
                    <div
                      className={`size-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/40"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="size-3.5" />}
                    </div>
                    <span className="leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Short Answer / Fill in the Blank */}
        {(qType === "short_answer" || qType === "fill_blank") && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground">Type your answer below:</label>
            <Input
              value={textAnswer}
              onChange={(e) => handleTextAnswerChange(e.target.value)}
              placeholder={t("typeKeyword")}
              className="h-12 text-sm bg-card"
            />
          </div>
        )}

        {/* 4. Essay */}
        {qType === "essay" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <label className="font-semibold">Write your detailed response:</label>
              <span>{textAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <Textarea
              value={textAnswer}
              onChange={(e) => handleTextAnswerChange(e.target.value)}
              placeholder={t("typeEssay")}
              className="min-h-[160px] text-sm bg-card leading-relaxed"
            />
          </div>
        )}

        {/* Navigation & Submission Controls */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t">
          <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="gap-2 text-xs">
            <ChevronLeft className="size-4" />
            <span>{t("previous")}</span>
          </Button>

          <div className="flex items-center gap-2">
            {activeQuestions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`size-7 rounded-lg text-xs font-bold transition-all ${
                  currentIndex === i
                    ? "bg-primary text-primary-foreground"
                    : responsesMap[activeQuestions[i]?.questionId || activeQuestions[i]?.id || `q-${i}`]
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                } ${flaggedQuestions[i] ? "ring-2 ring-amber-500" : ""}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button onClick={handleNext} disabled={heistChoiceOpen} className="gap-2 text-xs font-bold">
            <span>{isLastQuestion ? t("submitQuiz") : t("nextQuestion")}</span>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
