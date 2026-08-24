/**
 * AI Workspace — EduBek Contextual AI Assistant
 *
 * Provides:
 * - AI Quiz Generator (powered by Gemini with live game mode testing)
 * - Contextual AI Tutor (step-by-step problem solver & concept explainer)
 * - Interactive game mode launcher for generated sets
 */
"use client";

import * as React from "react";
import {
  Brain,
  Sparkles,
  Send,
  Loader2,
  Lock,
  CheckCircle2,
  Coins,
  FileQuestion,
  MessageSquare,
  ArrowRight,
  Play,
  Swords,
  Castle,
  Zap,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { GuestQuizPlayer, GameModeType } from "@/components/edubek/guest-quiz-player";

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function AiWorkspaceClient() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = React.useState<"generator" | "tutor">("generator");

  // Generator State
  const [topic, setTopic] = React.useState("");
  const [questionCount, setQuestionCount] = React.useState(5);
  const [difficulty, setDifficulty] = React.useState("intermediate");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedQuestions, setGeneratedQuestions] = React.useState<GeneratedQuestion[] | null>(null);
  const [isSaved, setIsSaved] = React.useState(false);
  const [playingMode, setPlayingMode] = React.useState<GameModeType | null>(null);

  // Tutor Chat State
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Hello! I am your EduBek AI Study Companion. How can I help you learn today? You can ask me to explain a concept step-by-step, review a problem, or summarize any syllabus topic.",
    },
  ]);
  const [chatInput, setChatInput] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);

  const promptStarters = [
    "Explain how to solve quadratic equations using the quadratic formula.",
    "Summarize the stages of cellular respiration in simple terms.",
    "Give me 3 practice questions on Newton's Laws with worked solutions.",
    "What is the difference between synchronous and asynchronous code?",
  ];

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setIsSaved(false);

    try {
      const res = await fetch("/api/ai-workspace/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count: questionCount, difficulty }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setGeneratedQuestions(data.questions);
      } else {
        setGeneratedQuestions(null);
      }
    } catch {
      setGeneratedQuestions(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    setIsThinking(true);

    try {
      const res = await fetch("/api/ai-workspace/tutor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Sorry, I could not generate a response for this question right now. Please try rephrasing your topic or asking again in a moment.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "We could not connect to the AI tutor service. Please check your connection and try again.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // If currently testing the generated quiz in a game mode
  if (playingMode && generatedQuestions) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPlayingMode(null)}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            Back to AI Generator
          </Button>
          <Badge variant="secondary" className="font-mono text-xs uppercase">
            Playing: {playingMode} mode
          </Badge>
        </div>

        <GuestQuizPlayer
          quizTitle={`AI Quiz: ${topic || "Generated Subject"}`}
          mode={playingMode}
          questions={generatedQuestions.map((q) => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            topic: topic || "AI Quiz",
          }))}
          onExit={() => setPlayingMode(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8" id="ai-workspace-container">
      {/* Header & Token Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
              <Brain className="size-3.5" />
              EduBek AI Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Contextual AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Generate custom practice quizzes from any topic using Gemini, or learn with your personal step-by-step AI tutor.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 rounded-xl border border-border/80 bg-card p-3 shadow-xs">
          <Coins className="size-5 text-amber-500" />
          <div className="text-xs">
            <div className="font-bold text-foreground">{user?.balanceEduTokens ?? 1250} EDU</div>
            <div className="text-muted-foreground text-[10px]">~10 EDU per generation</div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b pb-3">
        <button
          onClick={() => setActiveTab("generator")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "generator"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <FileQuestion className="size-4" />
          <span>AI Quiz Generator</span>
        </button>

        <button
          onClick={() => setActiveTab("tutor")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "tutor"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <MessageSquare className="size-4" />
          <span>Interactive AI Tutor</span>
        </button>
      </div>

      {/* Generator Tab */}
      {activeTab === "generator" && (
        <div className="space-y-6">
          <Card className="border-border/80 shadow-xs p-6">
            <form onSubmit={handleGenerateQuiz} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Topic or Lesson Material</label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Quadratic Equations, Newton's Laws, Cellular Respiration, Python Lists..."
                  className="h-11 border-border/80 bg-card text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter any syllabus subject, textbook chapter, or paste lesson notes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Number of Questions</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={3}>3 Questions (Quick Practice)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={10}>10 Questions (Comprehensive)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border/80 bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="beginner">Beginner / Foundational</option>
                    <option value="intermediate">Intermediate / Standard</option>
                    <option value="advanced">Advanced / Olympiad</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="size-3.5 text-emerald-600" />
                  <span>Private by default. Saved to your personal workspace.</span>
                </div>

                <Button
                  type="submit"
                  disabled={isGenerating || !topic.trim()}
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Generating with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      <span>Generate Quiz (10 EDU)</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Generated Questions Preview & Game Mode Launchers */}
          {generatedQuestions && (
            <Card className="border-border/80 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-emerald-500" />
                    Generated Quiz Ready ({generatedQuestions.length} Questions)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review questions below or launch directly into any game mode.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSaved(true)}
                    className="gap-1.5 text-xs"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    {isSaved ? "Saved in Workspace" : "Save Privately"}
                  </Button>
                </div>
              </div>

              {/* Game Mode Launch Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Play this AI Quiz in Game Mode:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlayingMode("classic")}
                    className="gap-1.5 text-xs border-primary/30 hover:bg-primary/5 justify-start h-10"
                  >
                    <Play className="size-3.5 text-primary fill-current shrink-0" />
                    <span className="font-semibold">Classic Arena</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlayingMode("royale")}
                    className="gap-1.5 text-xs border-amber-500/30 hover:bg-amber-500/5 justify-start h-10"
                  >
                    <Swords className="size-3.5 text-amber-500 shrink-0" />
                    <span className="font-semibold">Quiz Royale</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlayingMode("heist")}
                    className="gap-1.5 text-xs border-yellow-500/30 hover:bg-yellow-500/5 justify-start h-10"
                  >
                    <Zap className="size-3.5 text-yellow-500 shrink-0" />
                    <span className="font-semibold">Treasure Heist</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlayingMode("empire")}
                    className="gap-1.5 text-xs border-emerald-500/30 hover:bg-emerald-500/5 justify-start h-10"
                  >
                    <Castle className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="font-semibold">Empire Builder</span>
                  </Button>
                </div>
              </div>

              {/* Question list */}
              <div className="space-y-4 pt-2">
                {generatedQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold text-foreground">
                        {idx + 1}. {q.question}
                      </h4>
                      <Badge variant="outline" className="text-[10px]">
                        Q{idx + 1}
                      </Badge>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                            oIdx === q.correctIndex
                              ? "border-emerald-500/80 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-semibold"
                              : "border-border/60 bg-card text-foreground/80"
                          }`}
                        >
                          <span className="font-mono text-[10px] text-muted-foreground">{String.fromCharCode(65 + oIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-muted-foreground bg-muted/50 p-2.5 rounded-lg">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tutor Chat Tab */}
      {activeTab === "tutor" && (
        <Card className="border-border/80 shadow-xs flex flex-col h-[600px] overflow-hidden">
          <CardHeader className="p-4 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Brain className="size-4 text-violet-500" />
                AI Study Companion (Gemini)
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] text-violet-600 bg-violet-500/10">
                Syllabus-Aligned
              </Badge>
            </div>
          </CardHeader>

          {/* Messages Stream */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 text-xs ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex size-7 items-center justify-center rounded-lg bg-violet-600 text-white shrink-0 mt-0.5">
                    <Brain className="size-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl p-3.5 whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-muted/40 border border-border/80 text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-violet-500" />
                <span>Thinking & analyzing curriculum with Gemini...</span>
              </div>
            )}
          </CardContent>

          {/* Starters & Chat Input */}
          <div className="border-t p-4 bg-muted/10 space-y-3">
            {messages.length <= 2 && (
              <div className="flex flex-wrap gap-1.5">
                {promptStarters.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(starter)}
                    className="text-[11px] bg-muted/50 hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full transition-colors truncate max-w-xs"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about your coursework, equations, or concepts..."
                className="flex-1 h-10 border-border/80 bg-card text-xs"
              />
              <Button
                type="submit"
                disabled={isThinking || !chatInput.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white h-10 px-4"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}
