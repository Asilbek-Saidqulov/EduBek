"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Pencil,
  Volume2,
  Square,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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

const SKIP_SVG_TAGS = new Set(["defs", "title", "desc", "style", "metadata", "clippath", "mask", "lineargradient", "radialgradient"]);

function sanitizeSvg(svg: string) {
  return svg
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

function SafeSvgDiagram({ svg, caption }: { svg: string; caption?: string }) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const prepared = useMemo(() => {
    const sanitized = sanitizeSvg(svg || "");
    if (!sanitized) return { html: "", steps: 1 };
    if (typeof window === "undefined") return { html: sanitized, steps: 1 };
    try {
      const doc = new DOMParser().parseFromString(sanitized, "image/svg+xml");
      const root = doc.querySelector("svg");
      if (!root) return { html: sanitized, steps: 1 };
      const kids = Array.from(root.children).filter(
        (el) => !SKIP_SVG_TAGS.has(el.tagName.toLowerCase()),
      );
      kids.forEach((el, index) => {
        if (!el.getAttribute("data-step")) {
          el.setAttribute("data-step", String(index + 1));
        }
      });
      const steps = Math.max(
        1,
        ...kids.map((el) => Number(el.getAttribute("data-step")) || 1),
      );
      return { html: root.outerHTML, steps };
    } catch {
      return { html: sanitized, steps: 1 };
    }
  }, [svg]);

  useEffect(() => {
    setStep(1);
    setShowAll(false);
  }, [prepared.html]);

  useEffect(() => {
    const nodes = frameRef.current?.querySelectorAll<HTMLElement>("[data-step]");
    nodes?.forEach((node) => {
      const nodeStep = Number(node.getAttribute("data-step")) || 1;
      const visible = showAll || nodeStep <= step;
      node.style.opacity = visible ? "1" : "0.12";
      node.style.transition = "opacity 280ms ease";
    });
  }, [prepared.html, step, showAll]);

  const last = prepared.steps;

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
      <div
        ref={frameRef}
        className="flex max-h-[420px] min-h-[160px] w-full items-center justify-center overflow-auto text-foreground [&>svg]:h-auto [&>svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: prepared.html }}
      />
      {caption && (
        <p className="mt-3 text-center text-xs font-medium italic text-muted-foreground sm:text-sm">
          {caption}
        </p>
      )}
      {last > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-emerald-100/60">
            Step {showAll ? last : step} of {last}
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={showAll || step <= 1}
              onClick={() => setStep((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              disabled={showAll || step >= last}
              onClick={() => setStep((value) => Math.min(last, value + 1))}
              className="rounded-lg border border-white/15 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-medium disabled:opacity-40"
            >
              Next step
            </button>
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px]"
            >
              {showAll ? "Play steps" : "Show all"}
            </button>
          </div>
        </div>
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

function BoardWorkPad({
  sectionTitle,
  sectionContent,
  onSubmit,
}: {
  sectionTitle: string;
  sectionContent: string;
  onSubmit: (prompt: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [work, setWork] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    const text = work.trim();
    if (!text) return;
    onSubmit(
      [
        "The student wrote on the blackboard. Check their work.",
        `Board section: ${sectionTitle}`,
        sectionContent ? `Section gist: ${sectionContent.slice(0, 400)}` : "",
        `Student writing: ${text}`,
        "Do not restart the lesson.",
        "Add one short section that marks the work correct or shows the exact fix.",
        "If they asked to finish an equation, complete only the missing part.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    setSent(true);
  };

  return (
    <div className="rounded-xl border border-dashed border-emerald-400/25 bg-black/20 p-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-200"
      >
        <Pencil className="size-3.5" />
        Write on the board
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <textarea
            value={work}
            onChange={(e) => {
              setWork(e.target.value);
              setSent(false);
            }}
            rows={3}
            placeholder="Finish the step, write a formula, or explain in your words…"
            className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-100/35 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-emerald-100/45">
              {sent ? "Sent to tutor. Wait for the next board section." : "The tutor will mark this, not replace the whole lesson."}
            </p>
            <button
              type="button"
              disabled={!work.trim()}
              onClick={submit}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-emerald-950 disabled:opacity-40"
            >
              Check my work
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const locale = useLocale();
  const otherLocale = locale === "uz" ? "English" : locale === "en" ? "Russian" : "Uzbek";
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakSection = (section: BlackboardSection) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speakingId === section.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    const text = `${section.title}. ${section.content || ""}`
      .replace(/[#*_`]/g, " ")
      .replace(/\$\$[\s\S]*?\$\$/g, " formula ")
      .replace(/\$[^$]+\$/g, " formula ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 800);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(section.id);
    window.speechSynthesis.speak(utterance);
  };
  const [revealedCount, setRevealedCount] = useState(0);

  const sectionKey = document.sections.map((section) => section.id).join(",");
  useEffect(() => {
    const total = document.sections.length;
    if (total === 0) {
      setRevealedCount(0);
      return;
    }
    if (revealedCount >= total) return;
    const timer = window.setTimeout(() => {
      setRevealedCount((count) => Math.min(count + 1, total));
    }, revealedCount === 0 ? 80 : 480);
    return () => window.clearTimeout(timer);
  }, [sectionKey, revealedCount, document.sections.length]);

  useEffect(() => {
    if (revealedCount <= 0) return;
    const section = document.sections[revealedCount - 1];
    if (!section) return;
    window.document
      .getElementById(`section-${section.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealedCount, document.sections]);

  const visibleSections = document.sections.slice(0, revealedCount);
  const isWriting = revealedCount < document.sections.length;

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
              {isWriting
                ? "Writing the next board section…"
                : document.topic
                  ? `${t("topic")}: ${document.topic}`
                  : t("blackboardSubtitle")}
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
          <div className="mx-auto flex max-w-6xl gap-4">
            <aside className="hidden w-52 shrink-0 lg:block">
              <div className="sticky top-0 space-y-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-100/50">
                  Lesson map
                </p>
                <ol className="space-y-1">
                  {document.sections.map((section, index) => {
                    const cfg = sectionConfig[section.type] || sectionConfig.explanation;
                    const ready = index < revealedCount;
                    const checkpoint = section.checkpointData;
                    const answered = checkpoint?.answeredIndex !== undefined;
                    const correct =
                      answered && checkpoint.answeredIndex === checkpoint.correctIndex;
                    return (
                      <li key={section.id}>
                        <button
                          type="button"
                          disabled={!ready}
                          onClick={() =>
                            window.document
                              .getElementById(`section-${section.id}`)
                              ?.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                          className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${
                            ready
                              ? "text-emerald-50 hover:bg-white/10"
                              : "text-emerald-100/30"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                              correct
                                ? "bg-emerald-500 text-emerald-950"
                                : answered
                                  ? "bg-amber-400 text-amber-950"
                                  : ready
                                    ? "bg-white/15"
                                    : "bg-white/5"
                            }`}
                          >
                            {correct ? "✓" : answered ? "!" : index + 1}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{section.title || t(cfg.labelKey as any)}</span>
                            <span className="block text-[10px] text-emerald-100/45">
                              {ready ? t(cfg.labelKey as any) : "Writing…"}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </aside>

            <div className="min-w-0 flex-1 space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
              <List className="w-3.5 h-3.5 shrink-0 text-emerald-200/70" />
              {document.sections.map((section, index) => {
                const cfg = sectionConfig[section.type] || sectionConfig.explanation;
                const ready = index < revealedCount;
                return (
                  <button
                    key={section.id}
                    type="button"
                    disabled={!ready}
                    onClick={() =>
                      window.document
                        .getElementById(`section-${section.id}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                      ready
                        ? "border-white/10 bg-black/20 hover:bg-black/40"
                        : "border-white/5 bg-black/10 text-emerald-100/30"
                    }`}
                  >
                    {ready ? t(cfg.labelKey as any) : "…"}
                  </button>
                );
              })}
            </div>

            {visibleSections.map((section: BlackboardSection, index) => {
              const cfg = sectionConfig[section.type] || sectionConfig.explanation;
              const Icon = cfg.icon;
              const isClosed = !!collapsed[section.id];

              return (
                <article
                  key={section.id}
                  id={`section-${section.id}`}
                  className={`board-section-in relative rounded-2xl border bg-black/25 p-5 sm:p-6 transition-all duration-300 ${
                    section.highlighted
                      ? "border-emerald-400/50 ring-2 ring-emerald-400/30"
                      : "border-white/10"
                  }`}
                  style={{ animationDelay: `${index * 140}ms` }}
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
                        onClick={() => speakSection(section)}
                        className="p-1.5 rounded-md text-emerald-100/60 hover:bg-white/10"
                        title={speakingId === section.id ? "Stop" : "Listen"}
                      >
                        {speakingId === section.id ? (
                          <Square className="w-3.5 h-3.5 text-amber-300" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
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
                        <div className="prose prose-invert max-w-none text-emerald-50/90 leading-relaxed text-sm sm:text-base [&_.katex-display]:rounded-xl [&_.katex-display]:bg-white [&_.katex-display]:px-3 [&_.katex-display]:py-2 [&_.katex-display]:text-zinc-900 [&_.katex]:text-emerald-50">
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
                          onWhyWrong={
                            onQuickPrompt
                              ? (checkpoint, chosenIndex) => {
                                  const chosen = checkpoint.options[chosenIndex] ?? "";
                                  const correct = checkpoint.options[checkpoint.correctIndex] ?? "";
                                  onQuickPrompt(
                                    [
                                      "The student just missed a checkpoint on this blackboard.",
                                      `Question: ${checkpoint.question}`,
                                      `They chose: ${chosen}`,
                                      `Correct answer: ${correct}`,
                                      checkpoint.explanation ? `Short key: ${checkpoint.explanation}` : "",
                                      "Do not restart the lesson and do not repeat earlier sections.",
                                      "Add one short explanation section that only says why their choice is wrong.",
                                      "Then add one new similar checkpoint.",
                                    ]
                                      .filter(Boolean)
                                      .join("\n"),
                                  );
                                }
                              : undefined
                          }
                          onHarder={
                            onQuickPrompt
                              ? (checkpoint) =>
                                  onQuickPrompt(
                                    [
                                      "The student answered this checkpoint correctly:",
                                      checkpoint.question,
                                      "Do not rewrite earlier sections.",
                                      "Add one slightly harder checkpoint on the same idea.",
                                    ].join("\n"),
                                  )
                              : undefined
                          }
                        />
                      )}

                      {onQuickPrompt && (
                        <BoardWorkPad
                          sectionTitle={section.title}
                          sectionContent={section.content}
                          onSubmit={onQuickPrompt}
                        />
                      )}

                      {onQuickPrompt && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              onQuickPrompt(
                                [
                                  `Rewrite ONLY this blackboard section more simply: "${section.title}".`,
                                  `Section id: ${section.id}`,
                                  "Use update_section on this id. Do not restart the lesson or add extra sections.",
                                  "Shorter sentences, easier words, same meaning.",
                                ].join("\n"),
                              )
                            }
                            className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] hover:bg-white/10"
                          >
                            Say it simpler
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onQuickPrompt(
                                [
                                  `Add one new example for this section only: "${section.title}".`,
                                  "Do not rewrite earlier sections.",
                                  "Keep it short and on the same idea.",
                                ].join("\n"),
                              )
                            }
                            className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] hover:bg-white/10"
                          >
                            Another example
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onQuickPrompt(
                                [
                                  `Rewrite ONLY this blackboard section in ${otherLocale}: "${section.title}".`,
                                  `Section id: ${section.id}`,
                                  "Use update_section on this id. Do not restart the lesson.",
                                ].join("\n"),
                              )
                            }
                            className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] hover:bg-white/10"
                          >
                            In {otherLocale}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
