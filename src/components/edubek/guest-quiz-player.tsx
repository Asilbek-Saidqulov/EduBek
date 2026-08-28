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

export type GameModeType = "classic" | "royale" | "heist" | "empire";

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

  // Gamification Modes State
  const [hp, setHp] = React.useState(100);
  const [shields, setShields] = React.useState(50);
  const [alivePlayers, setAlivePlayers] = React.useState(24);
  const [vaultGold, setVaultGold] = React.useState(0);
  const [streakCombo, setStreakCombo] = React.useState(1);
  const [hiddenOptions, setHiddenOptions] = React.useState<number[]>([]);
  const [powerupUsedFiftyFifty, setPowerupUsedFiftyFifty] = React.useState(false);
  const [empireScore, setEmpireScore] = React.useState(0);
  const [masonryStone, setMasonryStone] = React.useState(100);

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

    // Gamified check (if local answer key is present)
    const hasCorrectIndex = currentQ.correctIndex !== undefined;
    const isCorrect = hasCorrectIndex ? index === currentQ.correctIndex : true;

    if (isCorrect) {
      setScore((s) => s + (currentQ.points || 1));
      if (mode === "heist") {
        setVaultGold((g) => g + 50 * streakCombo);
        setStreakCombo((c) => Math.min(4, c + 1));
      } else if (mode === "empire") {
        setEmpireScore((e) => e + 1);
        setMasonryStone((m) => m + 50);
      }
    } else {
      if (mode === "royale") {
        setShields((s) => Math.max(0, s - 25));
        if (shields <= 0) setHp((h) => Math.max(0, h - 35));
      }
      if (mode === "heist") setStreakCombo(1);
    }
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
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
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
          language: "English",
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
          language: "English",
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
        <CardTitle className="text-xl font-bold">Initializing Assessment Engine...</CardTitle>
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
        <CardTitle className="text-xl font-bold">Grading Attempt Server-Side...</CardTitle>
        <CardDescription className="text-xs">
          Evaluating student responses, applying rubric criteria, and calculating official points.
        </CardDescription>
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
              {hasPassed ? "Assessment Passed!" : "Assessment Completed"}
            </CardTitle>
            <CardDescription className="text-sm">
              Official server-graded outcome for <strong>{quizTitle}</strong> taken by {nickname}.
            </CardDescription>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 p-5 rounded-2xl bg-muted/30 border border-border/70 text-center">
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Score</div>
              <div className="text-2xl sm:text-3xl font-black text-primary mt-1">
                {totalAwardedPoints} / {totalMaxPoints}
              </div>
              <span className="text-[11px] text-muted-foreground">Points Earned</span>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Percentage</div>
              <div
                className={`text-2xl sm:text-3xl font-black mt-1 ${
                  hasPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {calculatedPct}%
              </div>
              <span className="text-[11px] text-muted-foreground">Grade</span>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Outcome</div>
              <div className="mt-1.5">
                <Badge
                  className={`text-xs px-3 py-1 font-bold ${
                    hasPassed
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-rose-600 hover:bg-rose-700 text-white"
                  }`}
                >
                  {hasPassed ? "PASSED" : "NEEDS PRACTICE"}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground block mt-1">
                {serverAttemptResult?.status === "graded" ? "Auto & Manual Graded" : "Recorded in DB"}
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
              <span>Question Breakdown ({activeQuestions.length})</span>
              <span className="text-xs normal-case font-normal text-muted-foreground">
                Verified against database snapshot
              </span>
            </h3>

            {activeQuestions.map((q, idx) => {
              const questionIdentifier = q.questionId || q.id || `q-${idx}`;
              const recorded = responsesMap[questionIdentifier];
              const studentAnswerVal = recorded?.answer ?? "Not answered";

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
                              <CheckCircle2 className="size-3" /> Correct
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center gap-1">
                              <XCircle className="size-3" /> Incorrect
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 text-xs pt-1">
                    <div className="p-3 rounded-lg bg-card border flex flex-col gap-1">
                      <span className="text-muted-foreground text-[11px] font-medium">Your Submitted Response:</span>
                      <span className="font-semibold text-foreground">
                        {Array.isArray(studentAnswerVal) ? studentAnswerVal.join(", ") : String(studentAnswerVal)}
                      </span>
                    </div>

                    {q.correctAnswer && (
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1">
                        <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
                          Expected Answer:
                        </span>
                        <span className="font-semibold text-emerald-900 dark:text-emerald-200">{q.correctAnswer}</span>
                      </div>
                    )}

                    {serverResp?.feedback && (
                      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200">
                        <strong>Teacher Feedback:</strong> {serverResp.feedback}
                      </div>
                    )}
                  </div>

                  {/* AI Explanation Accordion / Button */}
                  <div className="pt-2">
                    {aiState ? (
                      <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-violet-700 dark:text-violet-300">
                          <Brain className="size-3.5" />
                          <span>AI Pedagogical Explanation</span>
                        </div>
                        {aiState.loading ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs py-1">
                            <Loader2 className="size-3 animate-spin text-violet-600" />
                            <span>Generating pedagogical breakdown...</span>
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
                        className="text-xs h-8 gap-1.5 border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
                      >
                        <Sparkles className="size-3.5" />
                        <span>Explain with AI Tutor</span>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleRestart} className="gap-2 text-xs">
              <RotateCcw className="size-3.5" />
              <span>Retake Assessment</span>
            </Button>

            {onExit ? (
              <Button onClick={onExit} className="gap-2 text-xs">
                <span>Exit to Dashboard</span>
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button asChild className="gap-2 text-xs">
                <Link href="/live-quiz">
                  <span>Return to Quiz Hub</span>
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
  const isLastQuestion = currentIndex + 1 === activeQuestions.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6" id="active-assessment-container">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-border/80 shadow-xs">
        <div className="flex items-center gap-3">
          {onExit && (
            <Button variant="ghost" size="sm" onClick={onExit} className="h-8 px-2 text-xs">
              <ChevronLeft className="size-4 mr-1" /> Exit
            </Button>
          )}
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight truncate max-w-[240px] sm:max-w-md">
              {quizTitle}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>
                Question {currentIndex + 1} of {activeQuestions.length}
              </span>
              <span>·</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {currentQ.points || 1} Pt
              </Badge>
            </div>
          </div>
        </div>

        {/* Timer & Gamification Status */}
        <div className="flex items-center gap-3">
          {mode === "heist" && (
            <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20 text-xs">
              <Coins className="size-3.5 text-yellow-600" />
              <span className="font-bold text-yellow-600">{vaultGold} G</span>
              <Badge className="bg-yellow-500 text-black text-[10px]">x{streakCombo}</Badge>
            </div>
          )}

          {mode === "royale" && (
            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 text-xs">
              <Shield className="size-3.5 text-amber-600" />
              <span className="font-bold text-amber-600">{shields}%</span>
              <span className="text-muted-foreground">HP: {hp}</span>
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold ${
              timeLeft <= 5 ? "bg-rose-500/10 text-rose-600 animate-pulse" : "bg-muted text-foreground"
            }`}
          >
            <Clock className="size-3.5" />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progressPct} className="h-2 rounded-full" />

      {/* Main Question Card */}
      <Card className="border-border/80 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            {currentQ.topic && (
              <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                {currentQ.topic}
              </Badge>
            )}
            <h2 className="text-xl sm:text-2xl font-bold leading-snug text-foreground">{questionPrompt}</h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFlaggedQuestions((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }))}
            className={`size-8 shrink-0 ${flaggedQuestions[currentIndex] ? "text-amber-500" : "text-muted-foreground"}`}
            title="Flag for review"
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
            className="w-full text-xs font-semibold gap-1.5 border-yellow-500/40 text-yellow-600 hover:bg-yellow-500/10"
          >
            <Zap className="size-3.5" />
            <span>Use 50:50 Answer Eliminator</span>
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
                btnStyle = "border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/30";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-xl border text-left text-sm transition-all flex items-start gap-3 ${btnStyle} focus:outline-none`}
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
              placeholder="Enter exact keyword or phrase..."
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
              placeholder="Type your structured essay response here..."
              className="min-h-[160px] text-sm bg-card leading-relaxed"
            />
          </div>
        )}

        {/* Navigation & Submission Controls */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t">
          <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="gap-2 text-xs">
            <ChevronLeft className="size-4" />
            <span>Previous</span>
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

          <Button onClick={handleNext} className="gap-2 text-xs font-bold">
            <span>{isLastQuestion ? "Submit Assessment" : "Next Question"}</span>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
