"use client";

import React, { useState, useReducer, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AppShell } from "@/components/edubek/app-shell";
import {
  blackboardReducer,
  createInitialHistoryState,
  type BlackboardAction,
  type BlackboardSectionType,
  type BlackboardDocument,
} from "@/lib/tutor/blackboard-state";
import {
  SetTitleInputSchema,
  AddSectionInputSchema,
  UpdateSectionInputSchema,
  DeleteSectionInputSchema,
  HighlightSectionInputSchema,
  InsertDiagramInputSchema,
  AddCheckpointInputSchema,
  AnswerCheckpointInputSchema,
} from "@/lib/tutor/tools-schema";
import { LivingBlackboard } from "@/components/tutor/living-blackboard";
import { TutorVoiceOrb, type TutorStatus } from "@/components/tutor/tutor-voice-orb";
import { TutorTranscript, type TranscriptMessage } from "@/components/tutor/tutor-transcript";
import { toast } from "sonner";
import { BookOpen, Sparkles, MessageSquare, AlertCircle, HelpCircle, ArrowRight } from "lucide-react";

interface TutorViewProps {
  initialSubject?: string;
  initialTopic?: string;
  initialSessionId?: string;
  mistakeQuestion?: string;
  mistakeYourAnswer?: string;
  mistakeCorrectAnswer?: string;
  mistakeExplanation?: string;
  quizTitle?: string;
  difficulty?: string;
}

export function TutorView({
  initialSubject,
  initialTopic,
  initialSessionId,
  mistakeQuestion,
  mistakeYourAnswer,
  mistakeCorrectAnswer,
  mistakeExplanation,
  quizTitle,
  difficulty,
}: TutorViewProps) {
  const t = useTranslations("tutor");
  const locale = useLocale();

  // Active conversation ID for multi-turn server persistence
  const [conversationId, setConversationId] = useState<string | undefined>(initialSessionId);

  // Blackboard state machine with full undo/redo history
  const [historyState, dispatch] = useReducer(
    blackboardReducer,
    undefined,
    () => {
      const initial = createInitialHistoryState();
      if (initialTopic) {
        initial.present.title = initialTopic;
        initial.present.subject = initialSubject;
        initial.present.topic = initialTopic;
      }
      return initial;
    }
  );

  const [tutorStatus, setTutorStatus] = useState<TutorStatus>("IDLE");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"blackboard" | "companion">("blackboard");
  const [isSaving, setIsSaving] = useState(false);
  const [hasStartedRemediation, setHasStartedRemediation] = useState(false);

  // Restore existing session from database if sessionId was provided in URL
  useEffect(() => {
    if (!initialSessionId) return;

    let isMounted = true;
    async function loadPastSession() {
      try {
        const res = await fetch(`/api/tutor/history?sessionId=${encodeURIComponent(initialSessionId!)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.session && isMounted) {
          if (data.session.blackboard) {
            dispatch({ type: "SET_DOCUMENT", payload: data.session.blackboard });
          }
          if (Array.isArray(data.session.messages)) {
            const restoredMessages: TranscriptMessage[] = data.session.messages.map((m: any) => ({
              id: m.id,
              role: m.role === "assistant" ? "tutor" : (m.role as "user" | "tutor"),
              text: m.content,
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }));
            setMessages(restoredMessages);
          }
        }
      } catch (err) {
        console.warn("Failed to restore tutor session:", err);
      }
    }

    loadPastSession();
    return () => {
      isMounted = false;
    };
  }, [initialSessionId]);

  const executeToolCall = useCallback(
    (name: string, args: Record<string, unknown>) => {
      const normalizedName = name.replace(/([A-Z])/g, "_$1").toLowerCase();
      try {
        switch (normalizedName) {
          case "set_title": {
            const parsed = SetTitleInputSchema.parse(args);
            dispatch({
              type: "SET_TITLE",
              payload: {
                title: parsed.title,
                subject: parsed.subject,
                topic: parsed.topic,
              },
            });
            break;
          }

          case "add_section": {
            const parsed = AddSectionInputSchema.parse(args);
            dispatch({
              type: "ADD_SECTION",
              payload: {
                id: parsed.id,
                type: parsed.type as BlackboardSectionType,
                title: parsed.title,
                content: parsed.content,
                highlighted: parsed.highlighted,
              },
            });
            break;
          }

          case "update_section": {
            const parsed = UpdateSectionInputSchema.parse(args);
            dispatch({
              type: "UPDATE_SECTION",
              payload: {
                id: parsed.id,
                title: parsed.title,
                content: parsed.content,
                type: parsed.type as BlackboardSectionType,
                highlighted: parsed.highlighted,
              },
            });
            break;
          }

          case "delete_section": {
            const parsed = DeleteSectionInputSchema.parse(args);
            dispatch({
              type: "DELETE_SECTION",
              payload: { id: parsed.id },
            });
            break;
          }

          case "highlight_section": {
            const parsed = HighlightSectionInputSchema.parse(args);
            dispatch({
              type: "HIGHLIGHT_SECTION",
              payload: {
                id: parsed.id,
                highlighted: parsed.highlighted,
              },
            });
            break;
          }

          case "insert_diagram": {
            const parsed = InsertDiagramInputSchema.parse(args);
            dispatch({
              type: "INSERT_DIAGRAM",
              payload: {
                sectionId: parsed.sectionId,
                title: parsed.title,
                diagramType: parsed.diagramType,
                svg: parsed.svg,
                caption: parsed.caption,
              },
            });
            break;
          }

          case "add_checkpoint": {
            const parsed = AddCheckpointInputSchema.parse(args);
            dispatch({
              type: "INSERT_CHECKPOINT",
              payload: {
                checkpointId: parsed.checkpointId,
                title: parsed.title,
                question: parsed.question,
                options: parsed.options,
                correctIndex: parsed.correctIndex,
                explanation: parsed.explanation,
              },
            });
            break;
          }

          case "answer_checkpoint": {
            const parsed = AnswerCheckpointInputSchema.parse(args);
            dispatch({
              type: "ANSWER_CHECKPOINT",
              payload: {
                checkpointId: parsed.checkpointId,
                answeredIndex: parsed.answeredIndex,
              },
            });
            break;
          }

          case "save_lesson": {
            // Handled on server side
            break;
          }

          case "get_context": {
            // Read-only server tool
            break;
          }

          default:
            console.warn(`Unknown tool call: ${name}`);
        }
      } catch (err) {
        console.error(`Tool execution error for ${name}:`, err);
      }
    },
    []
  );

  const handleSendMessage = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    const userMessageId = `user_${Date.now()}`;
    const userMsg: TranscriptMessage = {
      id: userMessageId,
      role: "user",
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setTutorStatus("THINKING");
    setStatusMessage(t("thinking"));

    try {
      const response = await fetch("/api/tutor/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          conversationId,
          locale,
          currentDocument: historyState.present,
          studentContext: {
            subject: historyState.present.subject || initialSubject,
            topic: historyState.present.topic || initialTopic,
            mistakeContext: mistakeQuestion
              ? {
                  questionText: mistakeQuestion,
                  userAnswer: mistakeYourAnswer,
                  correctAnswer: mistakeCorrectAnswer,
                  explanation: mistakeExplanation,
                  quizTitle,
                  difficulty,
                }
              : undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to communicate with AI Tutor.");
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Synchronize updated blackboard state calculated by server
      if (data.blackboard && typeof data.blackboard === "object") {
        setTutorStatus("WRITING");
        setStatusMessage(t("writing"));
        dispatch({ type: "SET_DOCUMENT", payload: data.blackboard });
      } else if (Array.isArray(data.mutations) && data.mutations.length > 0) {
        setTutorStatus("WRITING");
        setStatusMessage(t("writing"));
        for (const mut of data.mutations) {
          executeToolCall(mut.tool, mut.args);
        }
      }

      // Append tutor message to transcript
      if (data.assistantText) {
        const tutorMsg: TranscriptMessage = {
          id: `tutor_${Date.now()}`,
          role: "tutor",
          text: data.assistantText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, tutorMsg]);
      }

      setTutorStatus("IDLE");
      setStatusMessage("");
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Tutor communication error:", error);
      setTutorStatus("ERROR");
      setStatusMessage(error.message);
      toast.error(error.message || t("errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRemediation = () => {
    if (!mistakeQuestion || hasStartedRemediation) return;
    setHasStartedRemediation(true);
    const remedialPrompt =
      locale === "uz"
        ? `Men yaqinda ushbu test savolida xatoga yo'l qo'ydim:\n"${mistakeQuestion}"\nMen tanlagan javob: "${mistakeYourAnswer || "Noma'lum"}", to'g'ri javob esa: "${mistakeCorrectAnswer || "Noma'lum"}".\nIltimos, bu mavzuni asosiy qoidalardan boshlab, bosqichma-bosqich doskada tushuntirib bering va xatom nimada bo'lganini ko'rsating.`
        : locale === "ru"
        ? `Я недавно ошибся в вопросе теста:\n"${mistakeQuestion}"\nМой ответ был: "${mistakeYourAnswer || "Неизвестно"}", а правильный ответ: "${mistakeCorrectAnswer || "Неизвестно"}".\nПожалуйста, объясните мне эту тему с основ на доске шаг за шагом и разберите мою ошибку.`
        : `I recently made a mistake on this quiz question:\n"${mistakeQuestion}"\nMy answer: "${mistakeYourAnswer || "Unknown"}", but the correct answer is: "${mistakeCorrectAnswer || "Unknown"}".\nPlease teach me this core concept from first principles on the blackboard and explain where my reasoning went wrong.`;

    handleSendMessage(remedialPrompt);
  };

  const handleSaveToLibrary = async () => {
    if (historyState.present.sections.length === 0) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/tutor/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: historyState.present.title || "AI Tutor Lesson Note",
          subject: historyState.present.subject || "General",
          topic: historyState.present.topic || "AI Tutor Session",
          document: historyState.present,
          visibility: "private",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(t("savedSuccess"));
      } else {
        toast.success(t("savedLocalSuccess"));
      }
    } catch {
      toast.success(t("savedLocalSuccess"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] max-w-7xl mx-auto w-full p-2 sm:p-4 gap-3 sm:gap-4 overflow-hidden">
        {/* Quiz Mistake Remediation Banner */}
        {mistakeQuestion && !hasStartedRemediation && messages.length === 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Quiz Mistake Review • {quizTitle || "Recent Quiz"}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-2xl">
                  {mistakeQuestion}
                </p>
                {mistakeCorrectAnswer && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Correct: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{mistakeCorrectAnswer}</span>
                    {mistakeYourAnswer && ` • You answered: ${mistakeYourAnswer}`}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartRemediation}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
            >
              <span>Start Review Lesson</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden items-center justify-between p-1 bg-muted rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("blackboard")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              mobileTab === "blackboard"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span>{t("blackboardTab")}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
              {historyState.present.sections.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("companion")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              mobileTab === "companion"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>{t("companionTab")}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary text-secondary-foreground">
              {messages.length}
            </span>
          </button>
        </div>

        {/* Desktop Split Layout (70% Blackboard / 30% Tutor Companion) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
          {/* Left / Primary Area: Living Blackboard */}
          <div
            className={`flex-1 h-full min-h-0 lg:flex ${
              mobileTab === "blackboard" ? "flex" : "hidden lg:flex"
            }`}
          >
            <LivingBlackboard
              document={historyState.present}
              canUndo={historyState.past.length > 0}
              canRedo={historyState.future.length > 0}
              dispatch={dispatch}
              onQuickPrompt={handleSendMessage}
              onSaveToLibrary={handleSaveToLibrary}
              isSaving={isSaving}
            />
          </div>

          {/* Right / Secondary Area: Tutor Companion & Transcript */}
          <div
            className={`w-full lg:w-[340px] xl:w-[380px] h-full min-h-0 flex-col gap-3 shrink-0 ${
              mobileTab === "companion" ? "flex" : "hidden lg:flex"
            }`}
          >
            {/* Top Companion Status Orb */}
            <TutorVoiceOrb
              status={tutorStatus}
              statusMessage={statusMessage}
            />

            {/* Bottom Transcript Dialogue */}
            <div className="flex-1 min-h-0">
              <TutorTranscript
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onQuickAction={handleSendMessage}
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
