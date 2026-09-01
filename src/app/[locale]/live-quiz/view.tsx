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
import { MultiplayerLivePlayer } from "@/components/edubek/multiplayer-live-player";
import { GameModePicker } from "@/components/edubek/game-modes";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTranslations } from "next-intl";

type QuizTab = "modes" | "discover" | "create" | "gradebook" | "questionbank" | "join";

function isStaffRole(roles: string[] | undefined) {
  return (roles ?? []).some((r) => /teacher|admin|creator/i.test(String(r)));
}

export function LiveQuizClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("quizHub");
  const { user, isLoading: userLoading } = useCurrentUser();
  const isTeacher = isStaffRole(user?.platformRoles) || isStaffRole(user?.roles);
  const codeFromUrl = searchParams.get("code")?.trim().toUpperCase() ?? "";
  const assessmentIdFromUrl = searchParams.get("assessmentId")?.trim() ?? "";

  const [joinCode, setJoinCode] = React.useState(codeFromUrl);
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = React.useState<QuizTab>(() => {
    const allowed: QuizTab[] = ["create", "join", "discover", "gradebook", "modes", "questionbank"];
    if (tabFromUrl && allowed.includes(tabFromUrl as QuizTab)) return tabFromUrl as QuizTab;
    return "join";
  });

  React.useEffect(() => {
    if (userLoading) return;
    if (isTeacher) return;
    if (activeTab === "gradebook" || activeTab === "questionbank" || activeTab === "create") {
      setActiveTab("join");
    }
  }, [userLoading, isTeacher, activeTab]);
  const [selectedGameMode, setSelectedGameMode] = React.useState<GameModeType>("classic");

  const [playingQuiz, setPlayingQuiz] = React.useState<any | null>(
    codeFromUrl.length >= 4
      ? { code: codeFromUrl, mode: "classic" }
      : assessmentIdFromUrl
      ? { assessmentId: assessmentIdFromUrl, mode: "classic" }
      : null,
  );

  const [multiplayerRoom, setMultiplayerRoom] = React.useState<{
    code: string;
    isHost: boolean;
    displayName: string;
  } | null>(null);

  const [isCreatingMultiplayer, setIsCreatingMultiplayer] = React.useState(false);
  const [multiplayerError, setMultiplayerError] = React.useState<string | null>(null);

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
  >([]);

  const [isCreatingAssessment, setIsCreatingAssessment] = React.useState(false);
  const [createFeedback, setCreateFeedback] = React.useState<string | null>(null);

  // AI Generator Modal in Studio
  const [aiTopicPrompt, setAiTopicPrompt] = React.useState("");
  const [aiQuestionCount, setAiQuestionCount] = React.useState(5);
  const [aiLanguage, setAiLanguage] = React.useState<"uz" | "en" | "ru">("uz");
  const [aiDifficulty, setAiDifficulty] = React.useState<"easy" | "medium" | "hard">("medium");
  const [aiQuestionType, setAiQuestionType] = React.useState<"multiple_choice" | "true_false">("multiple_choice");
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

  // Multiplayer: Create Room
  const handleCreateMultiplayerRoom = async (mode: GameModeType, title: string) => {
    setIsCreatingMultiplayer(true);
    setMultiplayerError(null);
    try {
      const res = await fetch("/api/live/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || `${mode.charAt(0).toUpperCase() + mode.slice(1)} Arena`,
          gameMode: mode,
          maxPlayers: 50,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || "Failed to create multiplayer room");
      }

      const data = await res.json();
      setMultiplayerRoom({
        code: data.session?.code || data.code,
        isHost: true,
        displayName: "Host",
      });
    } catch (err: any) {
      setMultiplayerError(err?.message || "Could not create multiplayer room");
    } finally {
      setIsCreatingMultiplayer(false);
    }
  };

  // Multiplayer: Join Room
  const handleJoinMultiplayerRoom = async (code: string) => {
    setIsCreatingMultiplayer(true);
    setMultiplayerError(null);
    try {
      const res = await fetch("/api/live/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          displayName: `Player_${Math.floor(1000 + Math.random() * 9000)}`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || "Failed to join multiplayer room");
      }

      const data = await res.json();
      setMultiplayerRoom({
        code: code.trim().toUpperCase(),
        isHost: false,
        displayName: data.player?.displayName || "Player",
      });
    } catch (err: any) {
      setMultiplayerError(err?.message || "Could not join multiplayer room");
    } finally {
      setIsCreatingMultiplayer(false);
    }
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
          subject: newSubject || aiTopicPrompt.trim(),
          language: aiLanguage,
          difficulty: aiDifficulty,
          questionType: aiQuestionType,
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
          explanation: "",
        }));
        setQuestionsList(mappedQuestions);
      }

      if (!newTitle) setNewTitle(aiTopicPrompt.trim());
      setCreateFeedback("Quiz questions added. Explanations are created later only if a student misses a question.");
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
          topic: aiTopicPrompt.trim() || newTitle || newSubject || "General Knowledge",
          count: Math.min(3, aiQuestionCount),
          difficulty: aiDifficulty,
          questionType: aiQuestionType,
          language: aiLanguage,
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
          explanation: "",
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



  // If currently in a multiplayer room
  if (multiplayerRoom) {
    return (
      <MultiplayerLivePlayer
        initialCode={multiplayerRoom.code}
        initialDisplayName={multiplayerRoom.displayName}
        isHost={multiplayerRoom.isHost}
        onExit={() => setMultiplayerRoom(null)}
      />
    );
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Gamepad2 className="size-3.5" />
              {isTeacher ? t("badgeTeacher") : t("badgePractice")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {isTeacher ? t("teacherTitle") : t("studentTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {isTeacher
              ? t("teacherSubtitle")
              : t("studentSubtitle")}
          </p>
        </div>

        {isTeacher && (
          <Button onClick={() => setActiveTab("create")} className="gap-2 h-10">
            <Plus className="size-4" />
            {t("createQuiz")}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
        {(isTeacher
          ? [
              { id: "discover" as const, label: t("tabQuizzes", { count: assessments.length }), icon: BookOpen },
              { id: "create" as const, label: t("tabCreate"), icon: Sparkles },
              { id: "gradebook" as const, label: t("tabGradebook"), icon: Award },
              { id: "questionbank" as const, label: t("tabBank"), icon: Layers },
              { id: "join" as const, label: t("tabTestCode"), icon: Radio },
              { id: "modes" as const, label: t("tabLiveModes"), icon: Gamepad2 },
            ]
          : [
              { id: "join" as const, label: t("tabJoin"), icon: Radio },
              { id: "discover" as const, label: t("tabPlay"), icon: BookOpen },
              { id: "modes" as const, label: t("tabLive"), icon: Gamepad2 },
            ]
        ).map((tab) => {
          const Icon = tab.icon;
          const on = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                on ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 1. GAME MODES TAB */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === "modes" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pick a mode. The questions stay the same — the board and rules change.
          </p>
          <GameModePicker
            selected={selectedGameMode}
            onSelect={setSelectedGameMode}
            onSolo={(id, title) => {
              setSelectedGameMode(id);
              setPlayingQuiz({ mode: id, title });
            }}
            onMultiplayer={(id, title) => handleCreateMultiplayerRoom(id, title)}
            multiplayerBusy={isCreatingMultiplayer}
            soloLabel={t("solo")}
            multiplayerLabel={t("multiplayer")}
          />
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
              <p className="text-xs">{t("loadingQuizzes")}</p>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <Card className="p-12 text-center space-y-3 border-dashed">
              <BookOpen className="size-8 text-muted-foreground mx-auto" />
              <CardTitle className="text-base font-bold">{t("noQuizzes")}</CardTitle>
              <CardDescription className="text-xs">
                {isTeacher ? t("emptyTeacher") : t("emptyStudent")}
              </CardDescription>
              {isTeacher && (
                <Button onClick={() => setActiveTab("create")} size="sm" className="text-xs gap-1.5">
                  <Plus className="size-3.5" /> {t("createQuiz")}
                </Button>
              )}
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
                        <Play className="size-3.5 fill-current" /> {t("play")}
                      </Button>

                      {isTeacher && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDuplicateAssessment(a.id)}
                            className="size-9 shrink-0"
                            title="Duplicate"
                          >
                            <Copy className="size-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleArchiveAssessment(a.id)}
                            className="size-9 shrink-0 text-muted-foreground hover:text-rose-500"
                            title="Archive"
                          >
                            <Archive className="size-3.5" />
                          </Button>
                        </>
                      )}
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
                  <h3 className="text-base font-bold text-foreground">{t("createWithAi")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("createWithAiHint")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <Input
                value={aiTopicPrompt}
                onChange={(e) => setAiTopicPrompt(e.target.value)}
                placeholder={t("topicPlaceholder")}
                className="sm:col-span-2 lg:col-span-2 text-xs bg-card h-10"
              />
              <select
                value={aiQuestionCount}
                onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                className="h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none"
              >
                {[3, 5, 8, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {t("nQuestions", { count: n })}
                  </option>
                ))}
              </select>
              <select
                value={aiLanguage}
                onChange={(e) => setAiLanguage(e.target.value as "uz" | "en" | "ru")}
                className="h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none"
              >
                <option value="uz">{t("langUz")}</option>
                <option value="en">{t("langEn")}</option>
                <option value="ru">{t("langRu")}</option>
              </select>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none"
              >
                <option value="easy">{t("easy")}</option>
                <option value="medium">{t("medium")}</option>
                <option value="hard">{t("hard")}</option>
              </select>
              <select
                value={aiQuestionType}
                onChange={(e) => setAiQuestionType(e.target.value as "multiple_choice" | "true_false")}
                className="h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none"
              >
                <option value="multiple_choice">{t("multipleChoice")}</option>
                <option value="true_false">{t("trueFalse")}</option>
              </select>
              <Button
                onClick={handleAiGenerateAssessment}
                disabled={isGeneratingWithAi || !aiTopicPrompt.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-2 h-10 lg:col-span-6"
              >
                {isGeneratingWithAi ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{t("creating")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>{t("createQuestions")}</span>
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
              <CardTitle className="text-xl font-bold">{t("joinTitle")}</CardTitle>
              <CardDescription className="text-xs">
                {t("joinHint")}
              </CardDescription>
            </div>

            <div className="space-y-3">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder={t("pinPlaceholder")}
                className="text-center font-mono text-xl tracking-widest h-14 uppercase"
                maxLength={8}
              />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    if (joinCode.trim().length >= 4) {
                      setPlayingQuiz({ code: joinCode.trim(), mode: selectedGameMode });
                    }
                  }}
                  disabled={joinCode.trim().length < 4}
                  className="h-11 text-sm font-bold gap-2"
                >
                  <span>{t("solo")}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleJoinMultiplayerRoom(joinCode)}
                  disabled={joinCode.trim().length < 4 || isCreatingMultiplayer}
                  className="h-11 text-sm font-bold gap-2"
                >
                  {isCreatingMultiplayer ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Users className="size-4" />
                  )}
                  <span>{t("multiplayer")}</span>
                </Button>
              </div>
            </div>

            {multiplayerError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                {multiplayerError}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
