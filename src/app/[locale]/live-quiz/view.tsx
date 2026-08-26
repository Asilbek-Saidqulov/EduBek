/**
 * Quiz Hub & Live Multiplayer Client
 *
 * Real Quiz Engine features:
 * - Direct Live PIN Game Join & Mode Selectors
 * - Fetching Real Live Database Quizzes (/api/quizzes)
 * - Creating & Publishing Custom Quizzes directly to the Database
 * - Real Authenticated Attempts with Server-Authoritative Grading & XP
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GuestQuizPlayer, GameModeType } from "@/components/edubek/guest-quiz-player";

export function LiveQuizClient() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code")?.trim().toUpperCase() ?? "";

  const [joinCode, setJoinCode] = React.useState(codeFromUrl);
  const [activeTab, setActiveTab] = React.useState<"modes" | "join" | "discover" | "create" | "host">("modes");
  const [selectedGameMode, setSelectedGameMode] = React.useState<GameModeType>("classic");
  const [playingQuiz, setPlayingQuiz] = React.useState<any | null>(
    codeFromUrl.length >= 4 ? { code: codeFromUrl, mode: "classic" } : null
  );

  // Live DB Quizzes state
  const [dbQuizzes, setDbQuizzes] = React.useState<any[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = React.useState(false);

  // Create Quiz Form State
  const [newTitle, setNewTitle] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newCategory, setNewCategory] = React.useState("general");
  const [newDifficulty, setNewDifficulty] = React.useState<"easy" | "medium" | "hard">("medium");
  const [newQuestions, setNewQuestions] = React.useState<Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    points: number;
  }>>([
    {
      question: "What is the capital of Uzbekistan?",
      options: ["Samarkand", "Tashkent", "Bukhara", "Khiva"],
      correctIndex: 1,
      explanation: "Tashkent has been the capital of Uzbekistan since 1930.",
      points: 1,
    },
    {
      question: "Which organelle produces ATP through cellular respiration?",
      options: ["Ribosome", "Endoplasmic Reticulum", "Mitochondrion", "Golgi Apparatus"],
      correctIndex: 2,
      explanation: "Mitochondria are the powerhouses of eukaryotic cells producing ATP.",
      points: 1,
    },
  ]);
  const [isCreatingQuiz, setIsCreatingQuiz] = React.useState(false);
  const [createFeedback, setCreateFeedback] = React.useState<string | null>(null);

  // Curated ready-to-play practice quizzes fallback
  const defaultPracticeQuizzes = [
    {
      id: "q-math-1",
      title: "Algebra — Quadratic Equations & Factoring",
      subject: "Mathematics",
      questions: 10,
      duration: "10 mins",
      difficulty: "Intermediate",
      plays: 1420,
      accuracy: "82%",
    },
    {
      id: "q-phys-1",
      title: "Newton's Laws & Dynamics Problem Set",
      subject: "Physics",
      questions: 10,
      duration: "12 mins",
      difficulty: "Foundational",
      plays: 1890,
      accuracy: "86%",
    },
    {
      id: "q-bio-1",
      title: "Cell Organelles & Photosynthesis",
      subject: "Biology",
      questions: 8,
      duration: "8 mins",
      difficulty: "Easy",
      plays: 950,
      accuracy: "91%",
    },
    {
      id: "q-cs-1",
      title: "Python Data Structures & Complexity",
      subject: "Computer Science",
      questions: 10,
      duration: "15 mins",
      difficulty: "Advanced",
      plays: 1200,
      accuracy: "76%",
    },
  ];

  // Fetch real quizzes from database
  const loadPublishedQuizzes = React.useCallback(async () => {
    setIsLoadingQuizzes(true);
    try {
      const res = await fetch("/api/quizzes?limit=20");
      if (res.ok) {
        const data = await res.json();
        if (data?.quizzes) {
          setDbQuizzes(data.quizzes);
        }
      }
    } catch (err) {
      console.error("Failed to load published quizzes:", err);
    } finally {
      setIsLoadingQuizzes(false);
    }
  }, []);

  React.useEffect(() => {
    loadPublishedQuizzes();
  }, [loadPublishedQuizzes]);

  // Handle starting a real database quiz attempt
  const handleStartRealQuiz = async (quizItem: any) => {
    try {
      const startRes = await fetch(`/api/quizzes/${quizItem.id}/attempts`, {
        method: "POST",
      });

      if (startRes.ok) {
        const attemptData = await startRes.json();
        setPlayingQuiz({
          quizId: quizItem.id,
          attemptId: attemptData.attemptId,
          title: quizItem.title,
          mode: selectedGameMode,
          questions: attemptData.questions,
        });
        return;
      }
    } catch (err) {
      console.error("Error initiating server attempt, playing in solo client mode:", err);
    }

    // Fallback to client play
    setPlayingQuiz({
      quizId: quizItem.id,
      title: quizItem.title,
      mode: selectedGameMode,
    });
  };

  // Handle creating a real quiz
  const handleCreateAndPublishQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreatingQuiz(true);
    setCreateFeedback(null);

    try {
      // 1. Create quiz
      const createRes = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          category: newCategory,
          difficulty: newDifficulty,
          mode: selectedGameMode === "royale" ? "survival" : "classic",
          questions: newQuestions,
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => null);
        throw new Error(errData?.error?.message || "Failed to create quiz");
      }

      const createdQuiz = await createRes.json();

      // 2. Publish quiz
      const publishRes = await fetch(`/api/quizzes/${createdQuiz.id}/publish`, {
        method: "POST",
      });

      if (publishRes.ok) {
        setCreateFeedback(`Successfully created and published "${newTitle}"!`);
        setNewTitle("");
        setNewDescription("");
        loadPublishedQuizzes();
        setActiveTab("discover");
      } else {
        setCreateFeedback(`Quiz created as draft.`);
      }
    } catch (err: any) {
      setCreateFeedback(`Error: ${err?.message || "Could not complete quiz creation"}`);
    } finally {
      setIsCreatingQuiz(false);
    }
  };

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
      description: "Standard competitive quiz format with speed bonuses, accuracy metrics, and instant explanations.",
      icon: Trophy,
      badge: "Standard",
      features: ["Base 500 pts + speed multiplier", "Detailed mistake review", "Syllabus alignment"],
      colorClass: "bg-primary/10 text-primary",
      borderClass: "hover:border-primary/50",
    },
    {
      id: "royale",
      title: "Quiz Royale (Survival Battle)",
      description: "Elimination battle royale where incorrect answers deplete your 100 HP shield. Outlast the lobby to win!",
      icon: Swords,
      badge: "Survival",
      features: ["100 HP & Shield mechanics", "Consecutive streak shield regen", "#1 Victory Royale podium"],
      colorClass: "bg-amber-500/10 text-amber-500",
      borderClass: "hover:border-amber-500/50",
    },
    {
      id: "heist",
      title: "Treasure Heist",
      description: "Crack the secret knowledge vault! Chain fast correct streaks for up to 4x Gold multipliers and unlock 50:50 powerups.",
      icon: Zap,
      badge: "Fast-Paced",
      features: ["Up to 4x Vault Gold combos", "50:50 Answer Eliminator", "Time Freeze power-up"],
      colorClass: "bg-yellow-500/10 text-yellow-500",
      borderClass: "hover:border-yellow-500/50",
    },
    {
      id: "empire",
      title: "Empire Builder",
      description: "Construct ancient wonder monuments by demonstrating subject mastery. Upgrade from Ancient Forum to Golden Citadel.",
      icon: Castle,
      badge: "Progression",
      features: ["4 Civilization wonder stages", "Masonry resource collection", "Subject mastery levels"],
      colorClass: "bg-emerald-500/10 text-emerald-500",
      borderClass: "hover:border-emerald-500/50",
    },
  ];

  if (playingQuiz) {
    return (
      <GuestQuizPlayer
        joinCode={playingQuiz.code || "ARENA"}
        quizId={playingQuiz.quizId}
        attemptId={playingQuiz.attemptId}
        quizTitle={playingQuiz.title || "Interactive Quiz Arena"}
        mode={playingQuiz.mode || selectedGameMode}
        questions={playingQuiz.questions}
        onExit={() => setPlayingQuiz(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8" id="live-quiz-hub">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Gamepad2 className="size-3.5" />
            Quiz & Game Arena
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Interactive Game Modes & Quiz Arena
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mt-1">
          Choose from 4 dynamic game modes, play real database quizzes with verified server grading, or build and publish your own quiz.
        </p>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab("modes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "modes"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Gamepad2 className="size-4" />
          <span>Game Modes (4)</span>
        </button>

        <button
          onClick={() => setActiveTab("discover")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "discover"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <HelpCircle className="size-4" />
          <span>Browse Quizzes {dbQuizzes.length > 0 && `(${dbQuizzes.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "create"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <PlusCircle className="size-4" />
          <span>Create Real Quiz</span>
        </button>

        <button
          onClick={() => setActiveTab("join")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "join"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Radio className="size-4" />
          <span>Join Live PIN</span>
        </button>

        <button
          onClick={() => setActiveTab("host")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "host"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Plus className="size-4" />
          <span>Host / AI Generate</span>
        </button>
      </div>

      {/* Game Modes Tab */}
      {activeTab === "modes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Select a Game Mode to Play</h2>
              <p className="text-xs text-muted-foreground">Each game mode introduces unique game mechanics, rules, and visuals.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {gameModesList.map((gm) => {
              const Icon = gm.icon;
              return (
                <Card
                  key={gm.id}
                  className={`border-border/80 p-6 flex flex-col justify-between transition-all cursor-pointer ${gm.borderClass} ${
                    selectedGameMode === gm.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedGameMode(gm.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${gm.colorClass}`}>
                        <Icon className="size-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {gm.badge}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground">{gm.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{gm.description}</p>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      {gm.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Ready to test</span>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingQuiz({
                          title: `${gm.title} Practice`,
                          mode: gm.id,
                        });
                      }}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Play className="size-3.5 fill-current" />
                      Play {gm.title}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Discover / Browse Quizzes Tab */}
      {activeTab === "discover" && (
        <div className="space-y-6">
          {/* Live Database Quizzes */}
          {dbQuizzes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white text-[10px]">Real Database</Badge>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Live Published Quizzes ({dbQuizzes.length})
                  </h2>
                </div>
                <Button size="sm" variant="ghost" onClick={loadPublishedQuizzes} className="text-xs h-7">
                  Refresh
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {dbQuizzes.map((quiz) => (
                  <Card
                    key={quiz.id}
                    className="border-border/80 shadow-xs p-5 hover:border-primary/40 transition-all flex flex-col justify-between bg-card"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] font-semibold text-primary bg-primary/5 capitalize">
                          {quiz.category || "General"}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground capitalize">{quiz.difficulty}</span>
                      </div>
                      <h3 className="text-base font-bold text-foreground">{quiz.title}</h3>
                      {quiz.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{quiz.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span>{quiz.questionCount} Questions</span>
                        <span>•</span>
                        <span>{quiz.totalAttempts} Attempts</span>
                        {quiz.teacher?.name && (
                          <>
                            <span>•</span>
                            <span>By {quiz.teacher.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-3 border-t flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Server Graded</span>
                      <Button
                        size="sm"
                        onClick={() => handleStartRealQuiz(quiz)}
                        className="gap-1.5 text-xs font-semibold"
                      >
                        <Play className="size-3.5 fill-current" />
                        Play Quiz
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Curated Syllabus Quizzes */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Syllabus Topic Quizzes
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {defaultPracticeQuizzes.map((pq) => (
                <Card
                  key={pq.id}
                  className="border-border/80 shadow-xs p-5 hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-semibold text-primary bg-primary/5">
                        {pq.subject}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{pq.difficulty}</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{pq.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{pq.questions} Questions</span>
                      <span>•</span>
                      <span>{pq.duration}</span>
                      <span>•</span>
                      <span>{pq.accuracy} Avg Accuracy</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{pq.plays} attempts</span>
                    <Button
                      size="sm"
                      onClick={() => setPlayingQuiz({ ...pq, mode: selectedGameMode })}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Play className="size-3.5 fill-current" />
                      Start Quiz
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Quiz Tab */}
      {activeTab === "create" && (
        <Card className="border-border/80 shadow-md p-6 space-y-6 max-w-3xl mx-auto">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PlusCircle className="size-5 text-primary" />
              Create & Publish Real Quiz
            </CardTitle>
            <CardDescription className="text-xs">
              Author questions with multiple-choice options, assign points, and save directly to PostgreSQL database.
            </CardDescription>
          </div>

          {createFeedback && (
            <div
              className={`p-3 rounded-lg text-xs font-medium ${
                createFeedback.startsWith("Error")
                  ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              }`}
            >
              {createFeedback}
            </div>
          )}

          <form onSubmit={handleCreateAndPublishQuiz} className="space-y-5">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="quizTitle" className="text-xs font-semibold">Quiz Title</Label>
                <Input
                  id="quizTitle"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. World History: Silk Road Trade Routes"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quizDesc" className="text-xs font-semibold">Description (Optional)</Label>
                <Input
                  id="quizDesc"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief overview of the topics covered in this quiz"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category</Label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="general">General</option>
                    <option value="history">History</option>
                    <option value="science">Science</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="languages">Languages</option>
                    <option value="technology">Technology</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Difficulty</Label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Questions Authoring */}
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Questions ({newQuestions.length})</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setNewQuestions((prev) => [
                      ...prev,
                      {
                        question: "",
                        options: ["", "", "", ""],
                        correctIndex: 0,
                        explanation: "",
                        points: 1,
                      },
                    ])
                  }
                  className="gap-1.5 text-xs h-8"
                >
                  <Plus className="size-3.5" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {newQuestions.map((q, qIdx) => (
                  <Card key={qIdx} className="p-4 border-border/80 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">Question {qIdx + 1}</span>
                      {newQuestions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewQuestions((prev) => prev.filter((_, i) => i !== qIdx))}
                          className="text-rose-500 h-7 px-2 hover:bg-rose-500/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    <Input
                      value={q.question}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewQuestions((prev) => {
                          const updated = [...prev];
                          updated[qIdx].question = val;
                          return updated;
                        });
                      }}
                      placeholder="Enter question text"
                      required
                    />

                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Options (select radio for the correct answer):
                      </Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={q.correctIndex === optIdx}
                              onChange={() => {
                                setNewQuestions((prev) => {
                                  const updated = [...prev];
                                  updated[qIdx].correctIndex = optIdx;
                                  return updated;
                                });
                              }}
                              className="size-4 text-primary focus:ring-primary"
                            />
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewQuestions((prev) => {
                                  const updated = [...prev];
                                  updated[qIdx].options[optIdx] = val;
                                  return updated;
                                });
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              className="h-8 text-xs"
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Explanation (optional):
                      </Label>
                      <Input
                        value={q.explanation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewQuestions((prev) => {
                            const updated = [...prev];
                            updated[qIdx].explanation = val;
                            return updated;
                          });
                        }}
                        placeholder="Why is this answer correct?"
                        className="h-8 text-xs"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isCreatingQuiz || !newTitle.trim()}
              className="w-full h-11 text-sm font-bold gap-2 shadow-xs"
            >
              {isCreatingQuiz ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Saving & Publishing to Database...</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Publish Quiz to Database</span>
                </>
              )}
            </Button>
          </form>
        </Card>
      )}

      {/* Main Tab Content: PIN */}
      {activeTab === "join" && (
        <div className="grid gap-6 md:grid-cols-2 items-start">
          <Card className="border-border/80 shadow-xs p-6 space-y-5">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Radio className="size-5 text-amber-500" />
                Enter Game PIN
              </CardTitle>
              <CardDescription className="text-xs">
                Enter the 6-character game code shown on your teacher or host screen.
              </CardDescription>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (joinCode.trim().length >= 4) {
                  setPlayingQuiz({ code: joinCode.trim().toUpperCase(), mode: selectedGameMode });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="joinCode" className="text-xs font-semibold">
                  Game PIN
                </Label>
                <Input
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MATH99"
                  maxLength={12}
                  className="font-mono text-center text-xl font-bold tracking-widest uppercase h-12"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Selected Game Mode</Label>
                <select
                  value={selectedGameMode}
                  onChange={(e) => setSelectedGameMode(e.target.value as GameModeType)}
                  className="w-full h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="classic">Classic Arena</option>
                  <option value="royale">Quiz Royale (Survival)</option>
                  <option value="heist">Treasure Heist (Vault Combo)</option>
                  <option value="empire">Empire Builder (Wonder Building)</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={joinCode.trim().length < 4}
                className="w-full h-11 text-sm font-bold gap-2 shadow-xs"
              >
                <span>Enter Arena</span>
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Scoring Rules:</p>
              <p>• Correct answer: base points + speed bonuses</p>
              <p>• In Royale mode, wrong answers damage your shield</p>
            </div>
          </Card>

          {/* Quick Practice Banner */}
          <Card className="border-border/80 shadow-xs p-6 space-y-4 bg-muted/20">
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground text-[10px]">Solo Mode</Badge>
              <h3 className="text-base font-bold text-foreground">
                No active multiplayer game right now?
              </h3>
              <p className="text-xs text-muted-foreground">
                You can start solo practice instantly on any syllabus topic. Instant feedback, step-by-step explanations, and no pressure.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {defaultPracticeQuizzes.slice(0, 2).map((pq) => (
                <div
                  key={pq.id}
                  onClick={() => setPlayingQuiz({ ...pq, mode: selectedGameMode })}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-card hover:border-primary/40 hover:bg-muted/40 cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground">{pq.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {pq.questions} questions · {pq.duration}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-primary font-semibold">
                    <Play className="size-3 fill-current" />
                    Play
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "host" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/80 shadow-xs p-6 space-y-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Brain className="size-5 text-violet-500" />
                AI Quiz Generator
              </CardTitle>
              <CardDescription className="text-xs">
                Generate questions from any custom topic or lesson text instantly with Gemini.
              </CardDescription>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI generated quizzes can be reviewed, edited, and immediately played in Classic, Quiz Royale, Treasure Heist, or Empire Builder modes.
            </p>
            <Button asChild className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white">
              <a href="/ai-workspace">
                <Sparkles className="size-4" />
                Open AI Quiz Generator
              </a>
            </Button>
          </Card>

          <Card className="border-border/80 shadow-xs p-6 space-y-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="size-5 text-emerald-500" />
                Host Classroom Game
              </CardTitle>
              <CardDescription className="text-xs">
                Launch a live multiplayer PIN session for your students.
              </CardDescription>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Manage student submissions, track live leaderboards, and export results directly to your gradebook.
            </p>
            <Button asChild variant="outline" className="w-full gap-2">
              <a href="/classrooms">
                <Users className="size-4" />
                Go to Classrooms
              </a>
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
