"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, Award } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CheckpointData } from "@/lib/tutor/blackboard-state";

interface InteractiveCheckpointCardProps {
  checkpoint: CheckpointData;
  onAnswer: (checkpointId: string, selectedIndex: number) => void;
  onContinue?: () => void;
  readOnly?: boolean;
}

export function InteractiveCheckpointCard({
  checkpoint,
  onAnswer,
  onContinue,
  readOnly = false,
}: InteractiveCheckpointCardProps) {
  const t = useTranslations("tutor");
  const [selected, setSelected] = useState<number | null>(
    checkpoint.answeredIndex !== undefined ? checkpoint.answeredIndex : null
  );
  const isAnswered = checkpoint.answeredIndex !== undefined || selected !== null && readOnly;
  const answeredIdx = checkpoint.answeredIndex ?? selected;
  const isCorrect = answeredIdx !== null && answeredIdx === checkpoint.correctIndex;

  const handleSelectOption = (idx: number) => {
    if (isAnswered || readOnly) return;
    setSelected(idx);
    onAnswer(checkpoint.checkpointId, idx);
  };

  return (
    <div
      id={`checkpoint-${checkpoint.checkpointId}`}
      className={`rounded-2xl border transition-all p-5 sm:p-6 shadow-sm my-4 ${
        isAnswered
          ? isCorrect
            ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20"
            : "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20"
          : "border-primary/20 bg-card hover:border-primary/40"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isAnswered
                ? isCorrect
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isAnswered ? (
              isCorrect ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )
            ) : (
              <HelpCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("checkpoint")}
            </span>
            <h4 className="text-sm font-semibold text-foreground">
              {isAnswered
                ? isCorrect
                  ? t("correct")
                  : t("incorrect")
                : t("checkpointPrompt")}
            </h4>
          </div>
        </div>

        {isAnswered && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${
              isCorrect
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            {isCorrect ? t("mastered") : t("needsReview")}
          </span>
        )}
      </div>

      {/* Question text */}
      <p className="text-base font-medium text-foreground mb-4 leading-relaxed">
        {checkpoint.question}
      </p>

      {/* Options List */}
      <div className="space-y-2.5 mb-4">
        {checkpoint.options.map((option, idx) => {
          const isSelected = answeredIdx === idx;
          const isThisCorrect = isAnswered && idx === checkpoint.correctIndex;
          const isThisWrongSelected = isAnswered && isSelected && !isCorrect;

          let optionStyle =
            "border-border/70 hover:border-primary/60 hover:bg-muted/50 bg-background text-foreground";

          if (isAnswered) {
            if (isThisCorrect) {
              optionStyle =
                "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/30";
            } else if (isThisWrongSelected) {
              optionStyle =
                "border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-200 font-medium line-through decoration-rose-500/60";
            } else {
              optionStyle = "border-border/40 opacity-60 bg-muted/20 text-muted-foreground";
            }
          } else if (isSelected) {
            optionStyle = "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30";
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered || readOnly}
              onClick={() => handleSelectOption(idx)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 text-sm sm:text-base ${optionStyle} ${
                !isAnswered && !readOnly ? "cursor-pointer active:scale-[0.99]" : "cursor-default"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 ${
                  isThisCorrect
                    ? "bg-emerald-600 text-white"
                    : isThisWrongSelected
                    ? "bg-rose-600 text-white"
                    : isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{option}</span>
              {isThisCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {isThisWrongSelected && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Explanation Box */}
      {isAnswered && (
        <div className="mt-4 p-4 rounded-xl bg-background/80 border border-border/80 text-sm space-y-2 animate-in fade-in-50 duration-300">
          <div className="flex items-center gap-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            <span>{t("explanation")}</span>
          </div>
          <p className="text-foreground/90 leading-relaxed">{checkpoint.explanation}</p>

          {onContinue && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <span>{t("continue")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
