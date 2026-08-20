import * as React from "react";
import { Sparkles, Brain, Bot, Lightbulb, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MascotProps {
  mood?: "happy" | "thinking" | "excited" | "waving" | "celebrating" | "neutral" | string;
  size?: number | string;
  className?: string;
}

export function Mascot({ mood = "happy", size = 64, className }: MascotProps) {
  const pixelSize = typeof size === "number" ? `${size}px` : size;

  const moodColors: Record<string, string> = {
    happy: "from-amber-400 to-orange-500 text-amber-900",
    excited: "from-emerald-400 to-teal-500 text-emerald-950",
    thinking: "from-sky-400 to-indigo-500 text-indigo-950",
    celebrating: "from-fuchsia-400 to-pink-500 text-fuchsia-950",
    waving: "from-blue-400 to-cyan-500 text-blue-950",
    neutral: "from-slate-300 to-slate-400 text-slate-800",
  };

  const gradient = moodColors[mood] || moodColors.happy;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform hover:scale-105 select-none",
        gradient,
        className
      )}
      style={{ width: pixelSize, height: pixelSize }}
      aria-label={`EduBek Mascot (${mood})`}
    >
      <div className="flex flex-col items-center justify-center text-center">
        {mood === "thinking" ? (
          <Brain className="h-1/2 w-1/2 stroke-[2.2]" />
        ) : mood === "excited" ? (
          <Rocket className="h-1/2 w-1/2 stroke-[2.2]" />
        ) : mood === "celebrating" ? (
          <Sparkles className="h-1/2 w-1/2 stroke-[2.2]" />
        ) : mood === "waving" ? (
          <Bot className="h-1/2 w-1/2 stroke-[2.2]" />
        ) : (
          <Lightbulb className="h-1/2 w-1/2 stroke-[2.2]" />
        )}
      </div>
      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background/90 text-[10px] shadow-sm">
        ✨
      </div>
    </div>
  );
}
