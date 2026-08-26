"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Sparkles,
  Edit3,
  Volume2,
  AlertCircle,
  Clock,
  Radio,
} from "lucide-react";
import { useTranslations } from "next-intl";

export type TutorStatus =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "WRITING"
  | "SPEAKING"
  | "ERROR";

interface TutorVoiceOrbProps {
  status: TutorStatus;
  statusMessage?: string;
  onMicToggle?: () => void;
  isMicActive?: boolean;
}

export function TutorVoiceOrb({
  status,
  statusMessage,
  onMicToggle,
  isMicActive = false,
}: TutorVoiceOrbProps) {
  const t = useTranslations("tutor");

  const statusConfig = {
    IDLE: {
      label: t("idle"),
      icon: Clock,
      color: "from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-700",
      glow: "shadow-slate-500/20",
      ringColor: "border-slate-400/30",
    },
    LISTENING: {
      label: t("listening"),
      icon: Mic,
      color: "from-emerald-400 to-teal-600",
      glow: "shadow-emerald-500/30",
      ringColor: "border-emerald-500/40",
    },
    THINKING: {
      label: t("thinking"),
      icon: Sparkles,
      color: "from-violet-500 to-indigo-600",
      glow: "shadow-violet-500/30",
      ringColor: "border-violet-500/40",
    },
    WRITING: {
      label: t("writing"),
      icon: Edit3,
      color: "from-sky-400 to-blue-600",
      glow: "shadow-sky-500/30",
      ringColor: "border-sky-500/40",
    },
    SPEAKING: {
      label: t("speaking"),
      icon: Volume2,
      color: "from-primary to-violet-600",
      glow: "shadow-primary/30",
      ringColor: "border-primary/40",
    },
    ERROR: {
      label: t("error"),
      icon: AlertCircle,
      color: "from-rose-500 to-red-700",
      glow: "shadow-rose-500/30",
      ringColor: "border-rose-500/40",
    },
  };

  const currentConfig = statusConfig[status] || statusConfig.IDLE;
  const StatusIcon = currentConfig.icon;

  return (
    <div className="flex flex-col items-center justify-center p-5 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-sm text-center relative overflow-hidden">
      {/* Orb Center Visualizer */}
      <div className="relative w-28 h-28 flex items-center justify-center my-2">
        {/* Outer Animated Breathing Rings */}
        <motion.div
          animate={
            status === "LISTENING" || status === "SPEAKING"
              ? { scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }
              : status === "THINKING" || status === "WRITING"
              ? { rotate: 360, scale: [1, 1.08, 1] }
              : { scale: [1, 1.05, 1], opacity: 0.25 }
          }
          transition={{
            duration: status === "LISTENING" || status === "SPEAKING" ? 2 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute inset-0 rounded-full border-2 border-dashed ${currentConfig.ringColor}`}
        />

        {/* Middle Pulse Ring */}
        <motion.div
          animate={
            status === "SPEAKING" || status === "WRITING"
              ? { scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }
              : { scale: 1, opacity: 0.3 }
          }
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute w-20 h-20 rounded-full border ${currentConfig.ringColor} bg-card/30`}
        />

        {/* Central Core Orb */}
        <motion.div
          animate={
            status === "THINKING"
              ? { scale: [1, 1.08, 1] }
              : status === "WRITING"
              ? { scale: [1, 1.05, 1], y: [0, -2, 0] }
              : { scale: 1 }
          }
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className={`w-14 h-14 rounded-full bg-gradient-to-tr ${currentConfig.color} shadow-lg ${currentConfig.glow} flex items-center justify-center text-white z-10`}
        >
          <StatusIcon className="w-6 h-6 animate-in fade-in zoom-in-75 duration-300" />
        </motion.div>
      </div>

      {/* Status Label */}
      <div className="space-y-1 mt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/80 text-xs font-semibold text-foreground">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "LISTENING"
                ? "bg-emerald-500 animate-pulse"
                : status === "THINKING"
                ? "bg-violet-500 animate-pulse"
                : status === "WRITING"
                ? "bg-sky-500 animate-pulse"
                : status === "SPEAKING"
                ? "bg-primary animate-pulse"
                : status === "ERROR"
                ? "bg-rose-500"
                : "bg-muted-foreground/50"
            }`}
          />
          <span>{currentConfig.label}</span>
        </div>

        <p className="text-xs text-muted-foreground max-w-[200px] truncate">
          {statusMessage || t("companionSub")}
        </p>
      </div>

      {/* Voice / Mic Indicator or Trigger */}
      {onMicToggle && (
        <div className="mt-3 pt-3 border-t border-border/60 w-full flex items-center justify-center">
          <button
            type="button"
            onClick={onMicToggle}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              isMicActive
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-border/80 bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {isMicActive ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>{t("micActive")}</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>{t("micDisabled")}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
