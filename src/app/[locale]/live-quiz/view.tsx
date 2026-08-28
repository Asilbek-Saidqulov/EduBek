/**
 * EduBek Assessment & Live Quiz Hub
 *
 * Real Phase 2 Assessment Engine Integration:
 * - Direct Live PIN & Game Mode Selectors
 * - Fetching Real Live Database Assessments (/api/assessments)
 * - Assessment Creator & AI Studio (/api/ai-assessment/assessment, /api/ai-assessment/questions)
 * - Teacher Gradebook & Server-Side Manual Grading (/api/attempts/[id]/grade)
 * - Question Bank Explorer & Question Import (/api/question-bank)
 * - Server-Authoritative Attempts with Anti-Cheat & Persistent Graded Results
 */
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Gamepad2,
  Plus,
  Radio,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  HelpCircle,
  Brain,
  Users,
  Play,
  RotateCcw,
  Swords,
  Castle,
  Zap,
  Shield,
  Coins,
  Crown,
  BookOpen,
  PlusCircle,
  Trash2,
  Loader2,
  Send,
  FileQuestion,
  Search,
  Filter,
  Check,
  Award,
  Layers,
  Copy,
  Archive,
  Eye,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GuestQuizPlayer, GameModeType } from "@/components/edubek/guest-quiz-player";

export function LiveQuizClient() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code")?.trim().toUpperCase() ?? "";
  const assessmentIdFromUrl = searchParams.get("assessmentId")?.trim() ?? "";

  const [joinCode, setJoinCode] = React.useState(codeFromUrl);
  const [activeTab, setActiveTab] = React.useState<
    "modes" | "discover" | "create" | "gradebook" | "questionbank" | "join"
  >("modes");
  const [selectedGameMode, setSelectedGameMode] = React.useState<GameModeType>("classic");

  const [playingQuiz, setPlayingQuiz] = React.useState<any | null>(
    codeFromUrl.length >= 4
      ? { code: codeFromUrl, mode: "classic" }
      : assessmentIdFromUrl
      ? { assessmentId: assessmentIdFromUrl, mode: "classic" }
      : null,
  );

  // Assessments List State
  const [assessments, setAssessments] = React.useState<any[]>([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = React.useState(false);
  const [searchFilter, setSearchFilter] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");

  // Assessment Studio (Create) Form State
  const [newTitle, setNewTitle] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newInstructions, setNewInstructions] = React.useState("");
  const [newAssessmentType, setNewAssessmentType] = React.useState<"quiz" | "exam" | "practice">("quiz");
  const [newSubject, setNewSubject] = React.useState("General");
  const [newPassingScore, setNewPassingScore] = React.useState(70);
  const [newDurationMinutes, setNewDurationMinutes] = React.useState(15);
  const [newMaxAttempts, setNewMaxAttempts] = React.useState(3);

  // Question Builder State
  const [questionsList, setQuestionsList] = React.useState<
    Array<{
      questionType: string;
      prompt: string;
      points: number;
      difficulty: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }>
  >([
    {
      questionType: "multiple_choice",
      prompt: "What is the capital of Uzbekistan?",
      points: 1,
      difficulty: "easy",
      options: ["Samarkand", "Tashkent", "Bukhara", "Khiva"],
      correctAnswer: "Tashkent",
      explanation: "Tashkent has been the capital of Uzbekistan since 1930.",
    },
    {
      questionType: "multiple_choice",
      prompt: "Which organelle produces ATP through cellular respiration?",
      points: 1,
      difficulty: "medium",
      options: ["Ribosome", "Endoplasmic Reticulum", "Mitochondrion", "Golgi Apparatus"],
      correctAnswer: "Mitochondrion",
      explanation: "Mitochondria are known as the powerhouses of eukaryotic cells.",
    },
  ]);

  const [isCreatingAssessment, setIsCreatingAssessment] = React.useState(false);
  const [createFeedback, setCreateFeedback] = React.useState<string | null>(null);

  // AI Generator Modal in Studio
  const [aiTopicPrompt, setAiTopicPrompt] = React.useState("");
  const [aiQuestionCount, setAiQuestionCount] = React.useState(5);
  const [isGeneratingWithAi, setIsGeneratingWithAi] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  // Gradebook State
  const [selectedAssessmentForGrading, setSelectedAssessmentForGrading] = React.useState<string | null>(null);
  const [attemptsList, setAttemptsList] = React.useState<any[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = React.useState(false);
  const [viewingAttempt, setViewingAttempt] = React.useState<any | null>(null);
  const [gradingPoints, setGradingPoints] = React.useState<Record<string, number>>({});
  const [gradingFeedback, setGradingFeedback] = React.useState<Record<string, string>>({});
  const [isSavingGrade, setIsSavingGrade] = React.useState(false);
  const [gradeSuccessMessage, setGradeSuccessMessage] = React.useState<string | null>(null);

  // Question Bank State
  const [bankQuestions, setBankQuestions] = React.useState<any[]>([]);
  const [isLoadingBank, setIsLoadingBank] = React.useState(false);
  const [bankSearch, setBankSearch] = React.useState("");
  const [newBankPrompt, setNewBankPrompt] = React.useState("");
  const [newBankType, setNewBankType] = React.useState("multiple_choice");
  const [newBankSubject, setNewBankSubject] = React.useState("General");
  const [newBankOptions, setNewBankOptions] = React.useState(["Option A", "Option B", "Option C", "Option D"]);
  const [newBankCorrect, setNewBankCorrect] = React.useState("Option A");
  const [isCreatingBankQ, setIsCreatingBankQ] = React.useState(false);

  // Load Assessments from API
  const loadAssessments = React.useCallback(async () => {
    setIsLoadingAssessments(true);
    try {
      const res = await fetch("/api/assessments?pageSize=30");
      if (res.ok) {
        const data = await res.json();
        if (data?.items) {
          setAssessments(data.items);
        }
      }
    } catch (err) {
      console.error("Failed to load assessments:", err);
    } finally {
      setIsLoadingAssessments(false);
    }
  }, []);

  // Load Question Bank from API
  const loadBankQuestions = React.useCallback(async () => {
    setIsLoadingBank(true);
    try {
      const res = await fetch("/api/question-bank?pageSize=30");
      if (res.ok) {
        const data = await res.json();
        if (data?.items) {
          setBankQuestions(data.items);
        }
      }
    } catch (err) {
      console.error("Failed to load question bank:", err);
    } finally {
      setIsLoadingBank(false);
    }
  }, []);

  React.useEffect(() => {
    loadAssessments();
    loadBankQuestions();
  }, [loadAssessments, loadBankQuestions]);

  // Load attempts when an assessment is selected in Gradebook
  React.useEffect(() => {
    if (!selectedAssessmentForGrading) return;
    async function fetchAttempts() {
      setIsLoadingAttempts(true);
      try {
        const res = await fetch(`/api/assessments/${selectedAssessmentForGrading}/attempts`);
        if (res.ok) {
          const data = await res.json();
          setAttemptsList(data.attempts || data.items || []);
        }
      } catch (err) {
        console.error("Failed to load attempts:", err);
      } finally {
        setIsLoadingAttempts(false);
      }
    }
    fetchAttempts();
  }, [selectedAssessmentForGrading]);

  // Handle Starting an Assessment Attempt
  const handleStartAssessment = (item: any) => {
    setPlayingQuiz({
      assessmentId: item.id,
      quizTitle: item.title,
      mode: selectedGameMode,
      durationMinutes: item.durationMinutes,
    });
  };

  // 1-Click Full Assessment Generation via AI
  const handleAiGenerateAssessment = async () => {
    if (!aiTopicPrompt.trim()) return;
    setIsGeneratingWithAi(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai-assessment/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopicPrompt.trim(),
          questionCount: aiQuestionCount,
          assessmentType: newAssessmentType,
          subject: newSubject,
          language: "English",
        }),
      });

      if (!res.ok) throw new Error("Failed to generate assessment outline with AI.");
      const data = await res.json();

      if (data.title) setNewTitle(data.title);
      if (data.description) setNewDescription(data.description);
      if (data.instructions) setNewInstructions(data.instructions);
      if (data.passingScore) setNewPassingScore(data.passingScore);
      if (data.durationMinutes) setNewDurationMinutes(data.durationMinutes);

      if (data.questions && Array.isArray(data.questions)) {
        const mappedQuestions = data.questions.map((q: any) => ({
          questionType: q.questionType || "multiple_choice",
          prompt: q.prompt,
          points: q.points || 1,
          difficulty: q.difficulty || "medium",
          options: q.payload?.options || ["True", "False"],
          correctAnswer: q.payload?.correctAnswer || q.payload?.options?.[0] || "True",
          explanation: q.payload?.explanation || "",
        }));
        setQuestionsList(mappedQuestions);
      }

      setCreateFeedback("AI outline generated and applied to the builder! You can customize before publishing.");
    } catch (err: any) {
      setAiError(err?.message || "Could not generate assessment with AI");
    } finally {
      setIsGeneratingWithAi(false);
    }
  };

  // Add a single AI question to current list
  const handleAddAiQuestions = async () => {
    setIsGeneratingWithAi(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai-assessment/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: newTitle || newSubject || "General Knowledge",
          count: 2,
          difficulty: "medium",
          questionType: "multiple_choice",
          language: "English",
        }),
      });
      if (!res.ok) throw new Error("Could not generate questions");
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions)) {
        const newItems = data.questions.map((q: any) => ({
          questionType: q.questionType || "multiple_choice",
          prompt: q.prompt,
          points: q.points || 1,
          difficulty: q.difficulty || "medium",
          options: q.payload?.options || ["A", "B", "C", "D"],
          correctAnswer: q.payload?.correctAnswer || q.payload?.options?.[0] || "A",
          explanation: q.payload?.explanation || "",
        }));
        setQuestionsList((prev) => [...prev, ...newItems]);
      }
    } catch (err: any) {
      setAiError(err?.message || "Could not add AI questions");
    } finally {
      setIsGeneratingWithAi(false);
    }
  };

  // Save and Publish Assessment
  const handleCreateAndPublishAssessment = async (andPublish = true) => {
    if (!newTitle.trim()) {
      setCreateFeedback("Please enter an assessment title.");
      return;
    }
    if (questionsList.length === 0) {
      setCreateFeedback("Please add at least one question.");
      return;
    }

    setIsCreatingAssessment(true);
    setCreateFeedback(null);

    try {
      // 1. Create Assessment Draft
      const createRes = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          instructions: newInstructions.trim() || undefined,
          assessmentType: newAssessmentType,
          subject: newSubject,
          passingScore: newPassingScore,
          durationMinutes: newDurationMinutes,
          maxAttempts: newMaxAttempts,
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => null);
        throw new Error(errData?.error?.message || "Failed to create assessment");
      }

      const created = await createRes.json();

      // 2. Add Questions
      const questionsRes = await fetch(`/api/assessments/${created.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: questionsList.map((q, idx) => ({
            questionType: q.questionType,
            prompt: q.prompt,
            points: q.points,
            difficulty: q.difficulty,
            orderIndex: idx,
            payload: {
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            },
          })),
        }),
      });

      if (!questionsRes.ok) {
        throw new Error("Assessment draft created, but questions failed to attach.");
      }

      // 3. Publish if requested
      if (andPublish) {
        const pubRes = await fetch(`/api/assessments/${created.id}/publish`, {
          method: "POST",
        });
        if (pubRes.ok) {
          setCreateFeedback(`Successfully created and published "${newTitle}"!`);
        } else {
          setCreateFeedback(`Assessment saved as draft.`);
        }
      } else {
        setCreateFeedback(`Assessment saved as draft.`);
      }

      // Reset and refresh
      setNewTitle("");
      setNewDescription("");
      setNewInstructions("");
      loadAssessments();
      setActiveTab("discover");
    } catch (err: any) {
      setCreateFeedback(`Error: ${err?.message || "Could not complete assessment creation"}`);
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  // Duplicate Assessment
  const handleDuplicateAssessment = async (id: string) => {
    try {
      const res = await fetch(`/api/assessments/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        loadAssessments();
      }
    } catch (e) {
      console.error("Failed to duplicate assessment:", e);
    }
  };

  // Archive Assessment
  const handleArchiveAssessment = async (id: string) => {
    try {
      const res = await fetch(`/api/assessments/${id}/archive`, { method: "POST" });
      if (res.ok) {
        loadAssessments();
      }
    } catch (e) {
      console.error("Failed to archive assessment:", e);
    }
  };

  // Submit Manual Grade for a response
  const handleSaveManualGrade = async (attemptId: string, questionId: string) => {
    setIsSavingGrade(true);
    setGradeSuccessMessage(null);
    try {
      const pts = gradingPoints[questionId] ?? 1;
      const fbk = gradingFeedback[questionId] || "";

      const res = await fetch(`/api/attempts/${attemptId}/grade?questionId=${questionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pointsAwarded: pts,
          feedback: fbk,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGradeSuccessMessage(`Grade saved! Attempt score updated to ${data.attempt?.score ?? ""}%`);
        // Refresh attempt view
        const attRes = await fetch(`/api/attempts/${attemptId}`);
        if (attRes.ok) {
          const freshAttempt = await attRes.json();
          setViewingAttempt(freshAttempt);
        }
      }
    } catch (err) {
      console.error("Failed to save grade:", err);
    } finally {
      setIsSavingGrade(false);
    }
  };

  // Create Question Bank Item
  const handleCreateBankQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankPrompt.trim()) return;
    setIsCreatingBankQ(true);

    try {
      const res = await fetch("/api/question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newBankPrompt.trim(),
          questionType: newBankType,
          subject: newBankSubject,
          difficulty: "medium",
          points: 1,
          payload: {
            prompt: newBankPrompt.trim(),
            options: newBankOptions,
            correctAnswer: newBankCorrect,
          },
        }),
      });

      if (res.ok) {
        setNewBankPrompt("");
        loadBankQuestions();
      }
    } catch (e) {
      console.error("Failed to create bank question:", e);
    } finally {
      setIsCreatingBankQ(false);
    }
  };

  // Import question from bank into creator
  const handleImportBankQuestion = (bq: any) => {
    const parsed = bq.parsedPayload || {};
    setQuestionsList((prev) => [
      ...prev,
      {
        questionType: bq.questionType || "multiple_choice",
        prompt: parsed.prompt || bq.prompt || "Question",
        points: bq.points || 1,
        difficulty: bq.difficulty || "medium",
        options: parsed.options || ["A", "B", "C", "D"],
        correctAnswer: parsed.correctAnswer || "A",
        explanation: parsed.explanation || "",
      },
    ]);
    setActiveTab("create");
  };

  // Game Modes List Configuration
  const gameModesList: Array<{
    id: GameModeType;
    title: string;
    description: string;
    icon: any;
    badge: string;
    features: string[];
    colorClass: string;
    borderClass: string;
  }> = [
    {
      id: "classic",
      title: "Classic Arena",
      description: "Standard competitive quiz format with speed multipliers, accuracy metrics, and instant explanations.",
      icon: Trophy,
      badge: "Standard",
      features: ["Base 500 pts + speed multiplier", "Detailed mistake review", "Syllabus alignment"],
      colorClass: "bg-primary/10 text-primary",
      borderClass: "hover:border-primary/50",
    },
    {
      id: "royale",
      title: "Quiz Royale (Survival Battle)",
      description: "Elimination battle royale where incorrect answers deplete your 100 HP shield. Outlast the lobby!",
      icon: Swords,
      badge: "Survival",
      features: ["100 HP & Shield mechanics", "Streak shield regen", "#1 Victory Royale podium"],
      colorClass: "bg-amber-500/10 text-amber-500",
      borderClass: "hover:border-amber-500/50",
    },
    {
      id: "heist",
      title: "Treasure Heist",
      description: "Crack the secret knowledge vault! Chain correct streaks for up to 4x Gold multipliers and 50:50 powerups.",
      icon: Zap,
      badge: "Fast-Paced",
      features: ["Up to 4x Vault Gold combos", "50:50 Answer Eliminator", "Time Freeze power-up"],
      colorClass: "bg-yellow-500/10 text-yellow-500",
      borderClass: "hover:border-yellow-500/50",
    },
    {
      id: "empire",
      title: "Empire Builder",
      description: "Construct ancient wonder monuments by demonstrating subject mastery. Upgrade from Forum to Golden Citadel.",
      icon: Castle,
      badge: "Progression",
      features: ["4 Civilization wonder stages", "Masonry resource collection", "Subject mastery levels"],
      colorClass: "bg-emerald-500/10 text-emerald-500",
      borderClass: "hover:border-emerald-500/50",
    },
  ];

  // If currently taking an assessment/quiz
  if (playingQuiz) {
    return (
      <GuestQuizPlayer
        joinCode={playingQuiz.code || "ARENA"}
        quizId={playingQuiz.assessmentId || playingQuiz.quizId}
        assessmentId={playingQuiz.assessmentId}
        attemptId={playingQuiz.attemptId}
        quizTitle={playingQuiz.quizTitle || playingQuiz.title || "Assessment Arena"}
        mode={playingQuiz.mode || selectedGameMode}
        questions={playingQuiz.questions}
        durationMinutes={playingQuiz.durationMinutes}
        onExit={() => setPlayingQuiz(null)}
        onAttemptCompleted={() => {
          loadAssessments();
        }}
      />
    );
  }

  // Filtered assessments list
  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch =
      !searchFilter ||
      a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesType = typeFilter === "all" || a.assessmentType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8" id="live-quiz-hub">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Gamepad2 className="size-3.5" />
              Phase 2 Assessment Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Assessment & Live Arena
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Take verified curriculum exams, practice in multiplayer gamified arenas, or create AI-generated assessments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setActiveTab("create")}
            className="gap-2 bg-primary text-primary-foreground shadow-xs text-xs font-bold h-10"
          >
            <Plus className="size-4" />
            <span>Create Assessment</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("modes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === "modes" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Gamepad2 className="size-4" />
          <span>Game Arenas</span>
        </button>

        <button
          onClick={() => setActiveTab("discover")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === "discover" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <BookOpen className="size-4" />
          <span>Assessments ({assessments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === "create" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Sparkles className="size-4 text-violet-400" />
          <span>Studio & AI Generator</span>
        </button>

        <button
          onClick={() => setActiveTab("gradebook")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === "gradebook" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Award className="size-4" />
          <span>Teacher Gradebook</span>
        </button>

        <button
          onClick={() => setActiveTab("questionbank")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === "questionbank" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Layers className="size-4" />
          <span>Question Bank</span>
        </button>

        <button
          onClick={() => setActiveTab("join")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === "join" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Radio className="size-4" />
          <span>Join with PIN</span>
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 1. GAME MODES TAB */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === "modes" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gameModesList.map((modeItem) => {
              const Icon = modeItem.icon;
              const isSelected = selectedGameMode === modeItem.id;
              return (
                <Card
                  key={modeItem.id}
                  onClick={() => setSelectedGameMode(modeItem.id)}
                  className={`cursor-pointer transition-all border-border/80 p-5 flex flex-col justify-between ${
                    isSelected ? "border-primary ring-2 ring-primary/30 bg-primary/5 shadow-md" : "hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${modeItem.colorClass}`}>
                        <Icon className="size-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {modeItem.badge}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground">{modeItem.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {modeItem.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-4 space-y-2">
                    {modeItem.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}

                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGameMode(modeItem.id);
                        setPlayingQuiz({ mode: modeItem.id, title: modeItem.title });
                      }}
                      className="w-full mt-3 text-xs font-bold gap-1.5"
                    >
                      <Play className="size-3.5 fill-current" />
                      <span>Play Arena</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 2. DISCOVER / BROWSE ASSESSMENTS TAB */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === "discover" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search assessments, subjects..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 h-10 text-xs bg-card"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="quiz">Quizzes</option>
                <option value="exam">Exams</option>
                <option value="practice">Practice Drills</option>
              </select>

              <Button variant="outline" size="sm" onClick={loadAssessments} className="h-10 text-xs gap-1.5">
                <RotateCcw className="size-3.5" /> Refresh
              </Button>
            </div>
          </div>

          {/* Assessments Grid */}
          {isLoadingAssessments ? (
            <div className="p-12 text-center text-muted-foreground space-y-3">
              <Loader2 className="size-8 animate-spin mx-auto text-primary" />
              <p className="text-xs">Loading database assessments...</p>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <Card className="p-12 text-center space-y-3 border-dashed">
              <BookOpen className="size-8 text-muted-foreground mx-auto" />
              <CardTitle className="text-base font-bold">No Assessments Found</CardTitle>
              <CardDescription className="text-xs">
                Create a new assessment with our AI studio or adjust your search filter.
              </CardDescription>
              <Button onClick={() => setActiveTab("create")} size="sm" className="text-xs gap-1.5">
                <Plus className="size-3.5" /> Create Assessment
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssessments.map((a) => (
                <Card key={a.id} className="border-border/80 p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                        {a.assessmentType || "quiz"}
                      </Badge>
                      <Badge
                        className={`text-[10px] font-bold ${
                          a.status === "published"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {a.status}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-foreground leading-snug">{a.title}</h3>
                    {a.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {a.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" /> {a.durationMinutes || 15} mins
                      </span>
                      <span>Pass: {a.passingScore ?? 70}%</span>
                      <span>Attempts: {a._count?.attempts ?? 0}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleStartAssessment(a)}
                        className="flex-1 text-xs font-bold gap-1.5 h-9"
                      >
                        <Play className="size-3.5 fill-current" /> Take Assessment
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDuplicateAssessment(a.id)}
                        className="size-9 shrink-0"
                        title="Duplicate Assessment"
                      >
                        <Copy className="size-3.5" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleArchiveAssessment(a.id)}
                        className="size-9 shrink-0 text-muted-foreground hover:text-rose-500"
                        title="Archive Assessment"
                      >
                        <Archive className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. ASSESSMENT STUDIO & AI GENERATOR TAB */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === "create" && (
        <div className="space-y-6">
          {/* AI Generator Trigger Banner */}
          <Card className="border-violet-500/30 bg-violet-500/5 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-600 text-white shadow-xs">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">1-Click AI Assessment Generator</h3>
                  <p className="text-xs text-muted-foreground">
                    Enter any topic or syllabus material to auto-generate a full assessment structure with rubric.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <Input
                value={aiTopicPrompt}
                onChange={(e) => setAiTopicPrompt(e.target.value)}
                placeholder="e.g. Newton's 3 Laws of Motion, Python Functions, Cell Mitosis..."
                className="sm:col-span-2 text-xs bg-card h-10"
              />
              <select
                value={aiQuestionCount}
                onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                className="h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={8}>8 Questions</option>
                <option value={10}>10 Questions</option>
              </select>

              <Button
                onClick={handleAiGenerateAssessment}
                disabled={isGeneratingWithAi || !aiTopicPrompt.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold gap-2 h-10"
              >
                {isGeneratingWithAi ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Generate Outline</span>
                  </>
                )}
              </Button>
            </div>

            {aiError && (
              <div className="p-3 rounded-lg bg-rose-500/10 text-rose-600 text-xs border border-rose-500/20">
                {aiError}
              </div>
            )}
          </Card>

          {/* Assessment Creator Form */}
          <Card className="border-border/80 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b pb-4">
              <h2 className="text-lg font-bold text-foreground">Assessment Parameters & Rules</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure duration, passing thresholds, question types, and security controls.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">Assessment Title *</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Physics Midterm Examination — Classical Mechanics"
                  className="text-xs bg-card h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Assessment Type</Label>
                <select
                  value={newAssessmentType}
                  onChange={(e) => setNewAssessmentType(e.target.value as any)}
                  className="w-full h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none"
                >
                  <option value="quiz">Interactive Quiz</option>
                  <option value="exam">Proctored Exam</option>
                  <option value="practice">Self-Paced Practice Drill</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Subject</Label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Mathematics, Science, Literature"
                  className="text-xs bg-card h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Duration (Minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  max={240}
                  value={newDurationMinutes}
                  onChange={(e) => setNewDurationMinutes(Number(e.target.value))}
                  className="text-xs bg-card h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Passing Score (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newPassingScore}
                  onChange={(e) => setNewPassingScore(Number(e.target.value))}
                  className="text-xs bg-card h-10"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">Instructions for Students</Label>
                <Textarea
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="Read each prompt thoroughly. Calculators are allowed for Section 2..."
                  className="text-xs bg-card min-h-[80px]"
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Questions ({questionsList.length})</h3>
                  <p className="text-xs text-muted-foreground">Manage question items, answer options, and points.</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAiQuestions}
                    disabled={isGeneratingWithAi}
                    className="text-xs gap-1.5 border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Add AI Questions</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setQuestionsList((prev) => [
                        ...prev,
                        {
                          questionType: "multiple_choice",
                          prompt: "New question prompt",
                          points: 1,
                          difficulty: "medium",
                          options: ["Option 1", "Option 2", "Option 3", "Option 4"],
                          correctAnswer: "Option 1",
                          explanation: "",
                        },
                      ])
                    }
                    className="text-xs gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Question</span>
                  </Button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {questionsList.map((q, idx) => (
                  <Card key={idx} className="border-border/80 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Q{idx + 1}
                        </Badge>
                        <select
                          value={q.questionType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuestionsList((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, questionType: val } : item)),
                            );
                          }}
                          className="h-7 rounded border border-border/80 bg-card px-2 text-[11px] text-foreground focus:outline-none"
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="multiple_select">Multiple Select</option>
                          <option value="true_false">True / False</option>
                          <option value="short_answer">Short Answer</option>
                          <option value="essay">Essay</option>
                        </select>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuestionsList((prev) => prev.filter((_, i) => i !== idx))}
                        className="size-7 text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <Input
                      value={q.prompt}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuestionsList((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, prompt: val } : item)),
                        );
                      }}
                      placeholder="Enter question prompt..."
                      className="text-xs bg-card h-9"
                    />

                    {q.questionType === "multiple_choice" && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${idx}`}
                              checked={q.correctAnswer === opt}
                              onChange={() => {
                                setQuestionsList((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, correctAnswer: opt } : item)),
                                );
                              }}
                              className="size-3.5 accent-primary"
                            />
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newOpts = [...q.options];
                                newOpts[oIdx] = val;
                                setQuestionsList((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          options: newOpts,
                                          correctAnswer: item.correctAnswer === opt ? val : item.correctAnswer,
                                        }
                                      : item,
                                  ),
                                );
                              }}
                              className="text-xs bg-card h-8"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {createFeedback && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-foreground">
                {createFeedback}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleCreateAndPublishAssessment(false)}
                disabled={isCreatingAssessment}
                className="text-xs"
              >
                Save as Draft
              </Button>

              <Button
                onClick={() => handleCreateAndPublishAssessment(true)}
                disabled={isCreatingAssessment}
                className="text-xs font-bold gap-2 bg-primary text-primary-foreground"
              >
                {isCreatingAssessment ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Publishing Assessment...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    <span>Publish Assessment</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. TEACHER GRADEBOOK & ATTEMPTS REVIEW TAB */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === "gradebook" && (
        <div className="space-y-6">
          <Card className="border-border/80 p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Teacher Gradebook & Manual Grading</h3>
                <p className="text-xs text-muted-foreground">
                  Select an assessment to review student attempts, responses, and evaluate essays/open-ended questions.
                </p>
              </div>

              <select
                value={selectedAssessmentForGrading || ""}
                onChange={(e) => setSelectedAssessmentForGrading(e.target.value || null)}
                className="h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none min-w-[220px]"
              >
                <option value="">-- Choose Assessment --</option>
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.assessmentType})
                  </option>
                ))}
              </select>
            </div>

            {selectedAssessmentForGrading && (
              <div className="space-y-4 pt-4 border-t">
                {isLoadingAttempts ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                    <p className="text-xs mt-2">Loading attempts list...</p>
                  </div>
                ) : attemptsList.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    No student attempts recorded yet for this assessment.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border/80">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
                        <tr>
                          <th className="p-3">Student</th>
                          <th className="p-3">Score</th>
                          <th className="p-3">Points</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {attemptsList.map((att) => (
                          <tr key={att.id} className="hover:bg-muted/20">
                            <td className="p-3 font-semibold">{att.user?.name || att.user?.email || "Student"}</td>
                            <td className="p-3 font-bold text-primary">{att.score ?? "--"}%</td>
                            <td className="p-3">
                              {att.pointsAwarded ?? 0} / {att.pointsMax ?? 0}
                            </td>
                            <td className="p-3">
                              <Badge variant={att.passed ? "default" : "secondary"} className="text-[10px]">
                                {att.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : "In Progress"}
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const r = await fetch(`/api/attempts/${att.id}`);
                                    if (r.ok) {
                                      const fullAtt = await r.json();
                                      setViewingAttempt(fullAtt);
                                    }
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="text-xs h-7 gap-1"
                              >
                                <Eye className="size-3" />
                                <span>Grade / Review</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Card>

            {/* Modal / Drawer for Manual Grading of Selected Attempt */}
            {viewingAttempt && (
              <Card className="border-primary/40 bg-card p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Grading Attempt #{viewingAttempt.attemptNumber || 1}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Student: {viewingAttempt.user?.name || viewingAttempt.user?.email} · Current Score:{" "}
                      <strong>{viewingAttempt.score}%</strong>
                    </p>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => setViewingAttempt(null)} className="text-xs">
                    Close Review
                  </Button>
                </div>

                {gradeSuccessMessage && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
                    {gradeSuccessMessage}
                  </div>
                )}

                <div className="space-y-4">
                  {viewingAttempt.responses?.map((resp: any, idx: number) => {
                    const qId = resp.questionId;
                    return (
                      <Card key={idx} className="border-border/80 bg-muted/20 p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <Badge variant="outline" className="text-[10px]">
                            Response #{idx + 1}
                          </Badge>
                          <span className="text-xs font-bold text-foreground">
                            Awarded: {resp.pointsAwarded ?? 0} pts
                          </span>
                        </div>

                        <div className="p-3 rounded-lg bg-card border text-xs">
                          <span className="text-muted-foreground text-[11px] block">Student Answer:</span>
                          <span className="font-semibold">{resp.response || "No response"}</span>
                        </div>

                        {/* Grading Form Controls */}
                        <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t">
                          <div>
                            <Label className="text-[11px] font-bold">Points Awarded</Label>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              value={gradingPoints[qId] ?? resp.pointsAwarded ?? 1}
                              onChange={(e) =>
                                setGradingPoints((prev) => ({ ...prev, [qId]: Number(e.target.value) }))
                              }
                              className="text-xs bg-card h-8 mt-1"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <Label className="text-[11px] font-bold">Teacher Feedback</Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                value={gradingFeedback[qId] ?? resp.feedback ?? ""}
                                onChange={(e) =>
                                  setGradingFeedback((prev) => ({ ...prev, [qId]: e.target.value }))
                                }
                                placeholder="Constructive remarks for student..."
                                className="text-xs bg-card h-8"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveManualGrade(viewingAttempt.id, qId)}
                                disabled={isSavingGrade}
                                className="text-xs h-8 shrink-0"
                              >
                                Save Grade
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. QUESTION BANK MANAGER TAB */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === "questionbank" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Create Bank Question */}
            <Card className="border-border/80 p-6 space-y-4 shadow-xs lg:col-span-1">
              <div className="border-b pb-3">
                <h3 className="text-base font-bold text-foreground">Add to Question Bank</h3>
                <p className="text-xs text-muted-foreground">
                  Save reusable questions for quizzes, exams, and homework.
                </p>
              </div>

              <form onSubmit={handleCreateBankQuestion} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Question Prompt *</Label>
                  <Textarea
                    value={newBankPrompt}
                    onChange={(e) => setNewBankPrompt(e.target.value)}
                    placeholder="Enter question text..."
                    className="text-xs bg-card min-h-[70px]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Subject</Label>
                  <Input
                    value={newBankSubject}
                    onChange={(e) => setNewBankSubject(e.target.value)}
                    placeholder="e.g. Biology"
                    className="text-xs bg-card h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Question Type</Label>
                  <select
                    value={newBankType}
                    onChange={(e) => setNewBankType(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border/80 bg-card px-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>

                <Button type="submit" disabled={isCreatingBankQ || !newBankPrompt.trim()} className="w-full text-xs font-bold h-9">
                  {isCreatingBankQ ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Plus className="size-3.5 mr-1" />}
                  <span>Save to Bank</span>
                </Button>
              </form>
            </Card>

            {/* List Bank Questions */}
            <Card className="border-border/80 p-6 space-y-4 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">Question Repository ({bankQuestions.length})</h3>
                  <p className="text-xs text-muted-foreground">Import items directly into the active assessment.</p>
                </div>

                <Button variant="outline" size="sm" onClick={loadBankQuestions} className="text-xs h-8 gap-1">
                  <RotateCcw className="size-3" /> Refresh
                </Button>
              </div>

              {isLoadingBank ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                </div>
              ) : bankQuestions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  Your question bank is empty. Add reusable questions using the form on the left.
                </div>
              ) : (
                <div className="space-y-3">
                  {bankQuestions.map((bq) => (
                    <div key={bq.id} className="p-4 rounded-xl border border-border/70 bg-muted/20 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                            {bq.questionType}
                          </Badge>
                          {bq.subject && (
                            <Badge variant="outline" className="text-[10px]">
                              {bq.subject}
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-foreground pt-1">
                          {bq.parsedPayload?.prompt || bq.prompt || "Question"}
                        </h4>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImportBankQuestion(bq)}
                        className="text-xs h-8 shrink-0 gap-1"
                      >
                        <Plus className="size-3" />
                        <span>Use in Studio</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 6. JOIN WITH PIN TAB */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === "join" && (
        <div className="mx-auto max-w-md space-y-6">
          <Card className="border-border/80 p-6 sm:p-8 text-center space-y-5 shadow-lg">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
              <Radio className="size-7" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Join Live Arena</CardTitle>
              <CardDescription className="text-xs">
                Enter a 6-digit game PIN code to connect to an active live session.
              </CardDescription>
            </div>

            <div className="space-y-3">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. 748291"
                className="text-center font-mono text-xl tracking-widest h-14 uppercase"
                maxLength={8}
              />

              <Button
                onClick={() => {
                  if (joinCode.trim().length >= 4) {
                    setPlayingQuiz({ code: joinCode.trim(), mode: selectedGameMode });
                  }
                }}
                disabled={joinCode.trim().length < 4}
                className="w-full h-11 text-sm font-bold gap-2"
              >
                <span>Enter Arena</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
