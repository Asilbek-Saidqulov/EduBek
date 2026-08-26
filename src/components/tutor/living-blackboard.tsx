"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  BookOpen,
  Sparkles,
  RotateCcw,
  RotateCw,
  Trash2,
  Bookmark,
  CheckCircle2,
  BrainCircuit,
  Compass,
  FileCode,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  BlackboardDocument,
  BlackboardSection,
  BlackboardAction,
} from "@/lib/tutor/blackboard-state";
import { InteractiveCheckpointCard } from "./interactive-checkpoint-card";

interface LivingBlackboardProps {
  document: BlackboardDocument;
  canUndo: boolean;
  canRedo: boolean;
  dispatch: React.Dispatch<BlackboardAction>;
  onQuickPrompt?: (prompt: string) => void;
  onSaveToLibrary?: () => void;
  isSaving?: boolean;
}

// Safe SVG Renderer with basic sanitization
function SafeSvgDiagram({ svg, caption }: { svg: string; caption?: string }) {
  const sanitizedSvg = useMemo(() => {
    if (!svg) return "";
    // Basic SVG cleanup: ensure it doesn't contain script or foreignObject tags
    return svg
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "");
  }, [svg]);

  return (
    <div className="my-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm overflow-hidden">
      <div
        className="w-full flex items-center justify-center min-h-[160px] max-h-[420px] overflow-auto [&>svg]:max-w-full [&>svg]:h-auto text-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
      />
      {caption && (
        <p className="mt-3 text-center text-xs sm:text-sm font-medium text-muted-foreground italic">
          {caption}
        </p>
      )}
    </div>
  );
}

const sectionConfig = {
  concept: {
    icon: BookOpen,
    labelKey: "sectionConcept",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    borderClass: "border-l-emerald-500",
  },
  explanation: {
    icon: Sparkles,
    labelKey: "sectionExplanation",
    badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    borderClass: "border-l-sky-500",
  },
  derivation: {
    icon: BrainCircuit,
    labelKey: "sectionDerivation",
    badgeClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
    borderClass: "border-l-violet-500",
  },
  example: {
    icon: FileCode,
    labelKey: "sectionExample",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    borderClass: "border-l-amber-500",
  },
  diagram: {
    icon: Layers,
    labelKey: "sectionDiagram",
    badgeClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    borderClass: "border-l-indigo-500",
  },
  checkpoint: {
    icon: CheckCircle2,
    labelKey: "sectionCheckpoint",
    badgeClass: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
    borderClass: "border-l-teal-500",
  },
  summary: {
    icon: Bookmark,
    labelKey: "sectionSummary",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    borderClass: "border-l-rose-500",
  },
};

export function LivingBlackboard({
  document,
  canUndo,
  canRedo,
  dispatch,
  onQuickPrompt,
  onSaveToLibrary,
  isSaving = false,
}: LivingBlackboardProps) {
  const t = useTranslations("tutor");

  const handleAnswerCheckpoint = (checkpointId: string, answeredIndex: number) => {
    dispatch({
      type: "ANSWER_CHECKPOINT",
      payload: { checkpointId, answeredIndex },
    });
  };

  const handleClear = () => {
    if (document.sections.length === 0) return;
    dispatch({ type: "CLEAR_DOCUMENT" });
  };

  const starterSuggestions = [
    {
      title: t("starter1Title"),
      desc: t("starter1Desc"),
      prompt: t("starter1Prompt"),
    },
    {
      title: t("starter2Title"),
      desc: t("starter2Desc"),
      prompt: t("starter2Prompt"),
    },
    {
      title: t("starter3Title"),
      desc: t("starter3Desc"),
      prompt: t("starter3Prompt"),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl border border-border/80 shadow-sm overflow-hidden">
      {/* Top Header / Document Toolbar */}
      <header className="px-5 py-3.5 border-b border-border/70 bg-card/60 backdrop-blur flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                {document.title || t("untitledLesson")}
              </h2>
              {document.subject && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                  {document.subject}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {document.topic
                ? `${t("topic")}: ${document.topic}`
                : t("blackboardSubtitle")}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => dispatch({ type: "UNDO" })}
            title={t("undo")}
            className="p-2 rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={() => dispatch({ type: "REDO" })}
            title={t("redo")}
            className="p-2 rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={document.sections.length === 0}
            title={t("clear")}
            className="p-2 rounded-lg border border-border/70 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {onSaveToLibrary && (
            <button
              type="button"
              onClick={onSaveToLibrary}
              disabled={isSaving || document.sections.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors ml-1"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaving ? t("saving") : t("save")}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Living Document Scroll Canvas */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {document.sections.length === 0 ? (
          /* Empty Educational State */
          <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center space-y-8">
            <div className="space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t("emptyTitle")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                {t("emptyDescription")}
              </p>
            </div>

            {/* Quick Starters */}
            {onQuickPrompt && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("quickStartTopics")}
                </span>
                <div className="grid gap-3 sm:grid-cols-3 text-left">
                  {starterSuggestions.map((starter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onQuickPrompt(starter.prompt)}
                      className="p-4 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:bg-muted/40 transition-all text-left group flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                          {starter.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {starter.desc}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary">
                        <span>{t("startLesson")}</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Structured Sections List */
          <div className="max-w-4xl mx-auto space-y-6">
            {document.sections.map((section: BlackboardSection) => {
              const cfg = sectionConfig[section.type] || sectionConfig.explanation;
              const Icon = cfg.icon;

              return (
                <article
                  key={section.id}
                  id={`section-${section.id}`}
                  className={`rounded-2xl border bg-card p-5 sm:p-7 transition-all duration-300 shadow-sm relative ${
                    section.highlighted
                      ? "ring-2 ring-primary/60 border-primary/50 bg-primary/[0.02]"
                      : "border-border/80 hover:border-border"
                  } ${cfg.borderClass} border-l-4`}
                >
                  {/* Section Top Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.badgeClass}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t(cfg.labelKey as any) || section.type}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-foreground">
                        {section.title}
                      </h3>
                    </div>

                    <span className="text-[11px] font-mono text-muted-foreground/70">
                      #{section.order}
                    </span>
                  </div>

                  {/* Markdown + LaTeX content */}
                  {section.content && (
                    <div className="prose prose-slate dark:prose-invert max-w-none text-foreground/90 leading-relaxed text-sm sm:text-base font-normal">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Embedded Diagram if present */}
                  {section.diagramData && (
                    <SafeSvgDiagram
                      svg={section.diagramData.svg}
                      caption={section.diagramData.caption}
                    />
                  )}

                  {/* Embedded Checkpoint if present */}
                  {section.checkpointData && (
                    <InteractiveCheckpointCard
                      checkpoint={section.checkpointData}
                      onAnswer={handleAnswerCheckpoint}
                    />
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
