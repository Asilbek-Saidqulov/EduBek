"use client";

import React, { useMemo, useState } from "react";
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
  ChevronDown,
  Copy,
  Check,
  List,
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

function SafeSvgDiagram({ svg, caption }: { svg: string; caption?: string }) {
  const sanitizedSvg = useMemo(() => {
    if (!svg) return "";
    return svg
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "");
  }, [svg]);

  return (
    <div className="my-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6 overflow-hidden">
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
    badgeClass: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    rail: "from-emerald-400 to-emerald-600",
  },
  explanation: {
    icon: Sparkles,
    labelKey: "sectionExplanation",
    badgeClass: "bg-sky-500/20 text-sky-200 border-sky-400/30",
    rail: "from-sky-400 to-sky-600",
  },
  derivation: {
    icon: BrainCircuit,
    labelKey: "sectionDerivation",
    badgeClass: "bg-violet-500/20 text-violet-200 border-violet-400/30",
    rail: "from-violet-400 to-violet-600",
  },
  example: {
    icon: FileCode,
    labelKey: "sectionExample",
    badgeClass: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    rail: "from-amber-400 to-amber-600",
  },
  diagram: {
    icon: Layers,
    labelKey: "sectionDiagram",
    badgeClass: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
    rail: "from-indigo-400 to-indigo-600",
  },
  checkpoint: {
    icon: CheckCircle2,
    labelKey: "sectionCheckpoint",
    badgeClass: "bg-teal-500/20 text-teal-200 border-teal-400/30",
    rail: "from-teal-400 to-teal-600",
  },
  summary: {
    icon: Bookmark,
    labelKey: "sectionSummary",
    badgeClass: "bg-rose-500/20 text-rose-200 border-rose-400/30",
    rail: "from-rose-400 to-rose-600",
  },
} as const;

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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const copySection = async (section: BlackboardSection) => {
    const text = `${section.title}\n\n${section.content || ""}`.trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(section.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const starterSuggestions = [
    { title: t("starter1Title"), desc: t("starter1Desc"), prompt: t("starter1Prompt") },
    { title: t("starter2Title"), desc: t("starter2Desc"), prompt: t("starter2Prompt") },
    { title: t("starter3Title"), desc: t("starter3Desc"), prompt: t("starter3Prompt") },
  ];

  return (
    <div className="flex flex-col h-full rounded-2xl border border-emerald-900/40 shadow-xl overflow-hidden bg-[#13261c] text-emerald-50">
      <header className="px-5 py-3.5 border-b border-white/10 bg-black/25 backdrop-blur flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-400/15 text-emerald-200 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold truncate">
                {document.title || t("untitledLesson")}
              </h2>
              {document.subject && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10">
                  {document.subject}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100/60 truncate">
              {document.topic ? `${t("topic")}: ${document.topic}` : t("blackboardSubtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => dispatch({ type: "UNDO" })}
            title={t("undo")}
            className="p-2 rounded-lg border border-white/10 text-emerald-100/70 hover:bg-white/10 disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={() => dispatch({ type: "REDO" })}
            title={t("redo")}
            className="p-2 rounded-lg border border-white/10 text-emerald-100/70 hover:bg-white/10 disabled:opacity-40"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={document.sections.length === 0}
            title={t("clear")}
            className="p-2 rounded-lg border border-white/10 text-emerald-100/70 hover:text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onSaveToLibrary && (
            <button
              type="button"
              onClick={onSaveToLibrary}
              disabled={isSaving || document.sections.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 text-emerald-950 text-xs font-semibold hover:bg-emerald-400 disabled:opacity-50 ml-1"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaving ? t("saving") : t("save")}</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.08),_transparent_42%),linear-gradient(to_bottom,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[length:100%_100%,100%_28px]">
        {document.sections.length === 0 ? (
          <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center space-y-8">
            <div className="space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-400/15 text-emerald-200 flex items-center justify-center">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                {t("emptyTitle")}
              </h3>
              <p className="text-sm text-emerald-100/70 max-w-lg mx-auto leading-relaxed">
                {t("emptyDescription")}
              </p>
            </div>
            {onQuickPrompt && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100/50">
                  {t("quickStartTopics")}
                </span>
                <div className="grid gap-3 sm:grid-cols-3 text-left">
                  {starterSuggestions.map((starter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onQuickPrompt(starter.prompt)}
                      className="p-4 rounded-xl border border-white/10 bg-black/20 hover:border-emerald-400/40 hover:bg-black/35 transition-all text-left group"
                    >
                      <h4 className="text-sm font-semibold mb-1 group-hover:text-emerald-200">
                        {starter.title}
                      </h4>
                      <p className="text-xs text-emerald-100/55 line-clamp-2">{starter.desc}</p>
                      <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-emerald-300">
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
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <List className="w-3.5 h-3.5 shrink-0 text-emerald-200/70" />
              {document.sections.map((section) => {
                const cfg = sectionConfig[section.type] || sectionConfig.explanation;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() =>
                      window.document
                        .getElementById(`section-${section.id}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border border-white/10 bg-black/20 hover:bg-black/40"
                  >
                    {t(cfg.labelKey as any)}
                  </button>
                );
              })}
            </div>

            {document.sections.map((section: BlackboardSection) => {
              const cfg = sectionConfig[section.type] || sectionConfig.explanation;
              const Icon = cfg.icon;
              const isClosed = !!collapsed[section.id];

              return (
                <article
                  key={section.id}
                  id={`section-${section.id}`}
                  className={`relative rounded-2xl border bg-black/25 p-5 sm:p-6 transition-all duration-300 ${
                    section.highlighted
                      ? "border-emerald-400/50 ring-2 ring-emerald-400/30"
                      : "border-white/10"
                  }`}
                >
                  <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b ${cfg.rail}`} />

                  <div className="flex items-start justify-between gap-2 mb-3 pl-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.badgeClass}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t(cfg.labelKey as any) || section.type}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold truncate">{section.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => copySection(section)}
                        className="p-1.5 rounded-md text-emerald-100/60 hover:bg-white/10"
                        title="Copy"
                      >
                        {copiedId === section.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsed((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
                        }
                        className="p-1.5 rounded-md text-emerald-100/60 hover:bg-white/10"
                      >
                        {isClosed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {!isClosed && (
                    <div className="pl-2 space-y-4">
                      {section.content && (
                        <div className="prose prose-invert max-w-none text-emerald-50/90 leading-relaxed text-sm sm:text-base">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {section.content}
                          </ReactMarkdown>
                        </div>
                      )}

                      {section.diagramData && (
                        <SafeSvgDiagram
                          svg={section.diagramData.svg}
                          caption={section.diagramData.caption}
                        />
                      )}

                      {section.checkpointData && (
                        <InteractiveCheckpointCard
                          checkpoint={section.checkpointData}
                          onAnswer={handleAnswerCheckpoint}
                        />
                      )}

                      {onQuickPrompt && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              onQuickPrompt(`${t("quickStepExamplePrompt")} (${section.title})`)
                            }
                            className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 hover:bg-white/10"
                          >
                            {t("quickStepExample")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onQuickPrompt(`${t("quickAddDiagramPrompt")} (${section.title})`)
                            }
                            className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 hover:bg-white/10"
                          >
                            {t("quickAddDiagram")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onQuickPrompt(`${t("quickAddQuizPrompt")} (${section.title})`)
                            }
                            className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 hover:bg-white/10"
                          >
                            {t("quickAddQuiz")}
                          </button>
                        </div>
                      )}
                    </div>
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
