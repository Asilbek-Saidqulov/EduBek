"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Sparkles, CornerDownLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export interface TranscriptMessage {
  id: string;
  role: "user" | "tutor" | "system";
  text: string;
  timestamp?: string;
}

interface TutorTranscriptProps {
  messages: TranscriptMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onQuickAction?: (actionPrompt: string) => void;
}

export function TutorTranscript({
  messages,
  onSendMessage,
  isLoading,
  onQuickAction,
}: TutorTranscriptProps) {
  const t = useTranslations("tutor");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const quickActions = [
    { label: t("quickStepExample"), prompt: t("quickStepExamplePrompt") },
    { label: t("quickAddQuiz"), prompt: t("quickAddQuizPrompt") },
    { label: t("quickAddDiagram"), prompt: t("quickAddDiagramPrompt") },
  ];

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/70 bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("transcriptHeader")}
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {messages.length} {t("dialogueTurns")}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6 text-muted-foreground space-y-2">
            <Bot className="w-8 h-8 opacity-40 text-primary" />
            <p className="text-xs max-w-[200px] leading-relaxed">
              {t("transcriptEmpty")}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? "bg-primary text-primary-foreground rounded-tr-xs"
                      : "bg-muted/70 text-foreground border border-border/60 rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-xs text-muted-foreground py-1">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Suggestion Chips */}
      {onQuickAction && (
        <div className="px-3 py-2 border-t border-border/40 bg-muted/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => onQuickAction(action.prompt)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-border/70 bg-card hover:border-primary/50 hover:bg-muted text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
            >
              + {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Field Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-border/70 bg-card flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          disabled={isLoading}
          className="flex-1 min-w-0 bg-muted/50 text-foreground text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label={t("send")}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
