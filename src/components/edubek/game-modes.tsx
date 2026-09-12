"use client";

import * as React from "react";
import {
  Castle,
  Coins,
  Play,
  Shield,
  Swords,
  Trophy,
  Users,
  Zap,
  Crown,
  Heart,
  Timer,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeArena, ModeMascot, MODE_CAST } from "@/components/edubek/mode-mascots";
import "@/components/edubek/mode-stage.css";

export type GameModeType = "classic" | "royale" | "heist" | "empire" | "battle";

export type GameModeMeta = {
  id: GameModeType;
  title: string;
  tagline: string;
  badge: string;
  features: string[];
  howTo: string;
  icon: LucideIcon;
};

export const GAME_MODE_META: GameModeMeta[] = [
  {
    id: "classic",
    title: "Classic Quiz",
    tagline: "Be fast. 500 points plus a speed bonus. Highest score wins.",
    badge: "Speed",
    features: ["+500 if correct", "Up to +500 for speed", "Live leaderboard"],
    howTo: "Answer before the timer ends. Faster correct answers earn more.",
    icon: Trophy,
  },
  {
    id: "heist",
    title: "Treasure Heist",
    tagline: "Correct answers pay gold. Save it, invest it, or raid the pot.",
    badge: "Risk",
    features: ["+100 gold if correct", "Save / Invest / Raid", "Most gold wins"],
    howTo: "Bank safe gold, or gamble it. A miss pays nothing.",
    icon: Zap,
  },
  {
    id: "empire",
    title: "Empire Builder",
    tagline: "Turn right answers into wood, stone, gold, and food. Build up.",
    badge: "Build",
    features: ["Hut → Empire", "Spend resources to upgrade", "Highest Empire Power wins"],
    howTo: "Collect resources, then upgrade your settlement between questions.",
    icon: Castle,
  },
  {
    id: "royale",
    title: "Quiz Royale",
    tagline: "Three hearts. A miss costs one. Last player standing wins.",
    badge: "Survive",
    features: ["3 hearts", "5-streak earns a shield", "Outlast the lobby"],
    howTo: "Stay alive. A 5-streak gives a shield that blocks one miss.",
    icon: Swords,
  },
  {
    id: "battle",
    title: "Battle Royale",
    tagline: "Head-to-head 5-question duels. Win the bracket to be champion.",
    badge: "Duel",
    features: ["1v1 over 5 questions", "Better score advances", "Up to 64-player bracket"],
    howTo: "Five questions. Beat the rival’s score on the same prompts.",
    icon: Crown,
  },
];

export const MODE_SKIN: Record<
  GameModeType,
  {
    card: string;
    selected: string;
    iconWrap: string;
    glow: string;
    play: string;
    shell: string;
    hud: string;
    optionOn: string;
    chip: string;
    accent: string;
  }
> = {
  classic: {
    card: "bg-gradient-to-br from-sky-50 via-card to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/20 border-sky-200/70",
    selected: "ring-2 ring-sky-400 border-sky-400 shadow-md",
    iconWrap: "bg-sky-500 text-white",
    glow: "from-sky-400/20",
    play: "bg-sky-600 hover:bg-sky-700 text-white",
    shell: "rounded-3xl bg-gradient-to-b from-sky-100/80 via-background to-background dark:from-sky-950/50 p-3 sm:p-4",
    hud: "border-sky-200/80 bg-white/80 dark:bg-slate-900/80",
    optionOn: "border-sky-500 bg-sky-500/10 text-sky-800 dark:text-sky-200 ring-2 ring-sky-400/30",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
    accent: "text-sky-600",
  },
  royale: {
    card: "bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white border-amber-500/30",
    selected: "ring-2 ring-amber-400 border-amber-400 shadow-lg shadow-amber-900/40",
    iconWrap: "bg-amber-400 text-slate-900",
    glow: "from-amber-400/20",
    play: "bg-amber-400 hover:bg-amber-300 text-slate-900",
    shell: "rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-background text-foreground p-3 sm:p-4",
    hud: "border-amber-500/30 bg-slate-900/90 text-amber-50",
    optionOn: "border-amber-400 bg-amber-400/15 text-amber-100 ring-2 ring-amber-400/30",
    chip: "bg-amber-400/15 text-amber-200 border-amber-400/30",
    accent: "text-amber-400",
  },
  heist: {
    card: "bg-gradient-to-br from-zinc-950 via-yellow-950 to-zinc-900 text-amber-50 border-yellow-500/40",
    selected: "ring-2 ring-yellow-400 border-yellow-400 shadow-lg shadow-yellow-900/30",
    iconWrap: "bg-yellow-400 text-zinc-900",
    glow: "from-yellow-400/25",
    play: "bg-yellow-400 hover:bg-yellow-300 text-zinc-900",
    shell: "rounded-3xl bg-[radial-gradient(ellipse_at_top,_rgba(250,204,21,0.18),_transparent_55%),linear-gradient(to_bottom,#18181b,#0a0a0a)] p-3 sm:p-4",
    hud: "border-yellow-500/40 bg-zinc-950/90 text-yellow-50",
    optionOn: "border-yellow-400 bg-yellow-400/15 text-yellow-100 ring-2 ring-yellow-400/40",
    chip: "bg-yellow-400/15 text-yellow-200 border-yellow-400/30",
    accent: "text-yellow-400",
  },
  empire: {
    card: "bg-gradient-to-br from-emerald-50 via-amber-50 to-stone-100 dark:from-emerald-950/40 dark:to-stone-900 border-emerald-300/70",
    selected: "ring-2 ring-emerald-500 border-emerald-500 shadow-md",
    iconWrap: "bg-emerald-600 text-white",
    glow: "from-emerald-400/20",
    play: "bg-emerald-700 hover:bg-emerald-800 text-white",
    shell: "rounded-3xl bg-gradient-to-b from-emerald-100/90 via-amber-50/40 to-background dark:from-emerald-950/40 p-3 sm:p-4",
    hud: "border-emerald-300/70 bg-amber-50/80 dark:bg-emerald-950/70",
    optionOn: "border-emerald-600 bg-emerald-600/10 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/30",
    chip: "bg-emerald-600/10 text-emerald-800 dark:text-emerald-200 border-emerald-600/20",
    accent: "text-emerald-700 dark:text-emerald-300",
  },
  battle: {
    card: "bg-gradient-to-br from-violet-950 via-fuchsia-950 to-slate-900 text-white border-violet-400/40",
    selected: "ring-2 ring-violet-400 border-violet-400 shadow-lg shadow-violet-900/40",
    iconWrap: "bg-violet-400 text-slate-900",
    glow: "from-violet-400/25",
    play: "bg-violet-500 hover:bg-violet-400 text-white",
    shell: "rounded-3xl bg-gradient-to-b from-violet-950 via-slate-950 to-background p-3 sm:p-4",
    hud: "border-violet-500/30 bg-violet-950/90 text-violet-50",
    optionOn: "border-violet-400 bg-violet-400/15 text-violet-100 ring-2 ring-violet-400/30",
    chip: "bg-violet-400/15 text-violet-200 border-violet-400/30",
    accent: "text-violet-300",
  },
};

export function GameModePicker({
  selected,
  onSelect,
  onSolo,
  onMultiplayer,
  multiplayerBusy,
  soloLabel,
  multiplayerLabel,
}: {
  selected: GameModeType;
  onSelect: (id: GameModeType) => void;
  onSolo: (id: GameModeType, title: string) => void;
  onMultiplayer: (id: GameModeType, title: string) => void;
  multiplayerBusy?: boolean;
  soloLabel: string;
  multiplayerLabel: string;
}) {
  const active = GAME_MODE_META.find((m) => m.id === selected) ?? GAME_MODE_META[0];
  const activeSkin = MODE_SKIN[active.id];
  const darkHero = active.id === "royale" || active.id === "heist" || active.id === "battle";

  return (
    <div className="space-y-5">
      <ModeArena mode={active.id} className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${activeSkin.card}`}>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <ModeMascot mode={active.id} mood="idle" size={96} showLine={false} />
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${darkHero ? "text-white/60" : "text-muted-foreground"}`}>
                Meet {MODE_CAST[active.id].name} · {MODE_CAST[active.id].title}
              </p>
              <h2 className={`text-2xl font-black tracking-tight ${darkHero ? "text-white" : "text-foreground"}`}>
                {active.title}
              </h2>
              <p className={`mt-1 max-w-xl text-sm leading-relaxed ${darkHero ? "text-white/70" : "text-muted-foreground"}`}>
                {active.howTo}
              </p>
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              className={`flex-1 sm:flex-none h-11 px-5 font-semibold ${activeSkin.play}`}
              onClick={() => onSolo(active.id, active.title)}
            >
              <Play className="size-4 fill-current" />
              {soloLabel}
            </Button>
            <Button
              variant={darkHero ? "secondary" : "outline"}
              className="flex-1 sm:flex-none h-11 px-5 font-semibold"
              disabled={multiplayerBusy}
              onClick={() => onMultiplayer(active.id, active.title)}
            >
              <Users className="size-4" />
              {multiplayerLabel}
            </Button>
          </div>
        </div>
      </ModeArena>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {GAME_MODE_META.map((mode) => {
          const skin = MODE_SKIN[mode.id];
          const on = selected === mode.id;
          const darkText = mode.id === "royale" || mode.id === "heist" || mode.id === "battle";
          return (
            <button
              type="button"
              key={mode.id}
              onClick={() => onSelect(mode.id)}
              className={`mode-shine relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 min-h-[168px] flex flex-col ${skin.card} ${
                on ? skin.selected : "hover:-translate-y-0.5 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <ModeMascot mode={mode.id} mood={on ? "cheer" : "idle"} size={44} showLine={false} />
                <Badge
                  className={`text-[9px] uppercase tracking-wider ${darkText ? "bg-white/10 text-white border-white/20" : ""}`}
                  variant="outline"
                >
                  {mode.badge}
                </Badge>
              </div>
              <h3 className={`mt-3 text-sm font-bold ${darkText ? "text-white" : "text-foreground"}`}>{mode.title}</h3>
              <p className={`mt-1 text-[11px] leading-relaxed ${darkText ? "text-white/65" : "text-muted-foreground"}`}>
                {mode.tagline}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ModeStatusChips({
  mode,
  vaultGold,
  streakCombo,
  hearts,
  hasShield,
  classicPoints,
  battleYou,
  battleThem,
  empireTier,
}: {
  mode: GameModeType;
  vaultGold: number;
  streakCombo?: number;
  shields?: number;
  hp?: number;
  empireScore?: number;
  masonryStone?: number;
  hearts?: number;
  hasShield?: boolean;
  classicPoints?: number;
  battleYou?: number;
  battleThem?: number;
  empireTier?: string;
}) {
  if (mode === "heist") {
    return (
      <div className="mode-shimmer flex items-center gap-2 rounded-xl border border-yellow-500/30 px-3 py-1.5 text-xs">
        <Coins className="size-3.5 text-yellow-500" />
        <span className="font-bold text-yellow-200">{vaultGold} gold</span>
      </div>
    );
  }
  if (mode === "royale") {
    const h = hearts ?? 3;
    return (
      <div className={`flex items-center gap-1.5 ${h <= 1 ? "mode-glow" : ""}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Heart
            key={i}
            className={`size-4 ${i < h ? "fill-rose-500 text-rose-500" : "text-white/25"}`}
          />
        ))}
        {hasShield ? (
          <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-200">
            <Shield className="size-3" /> shield
          </span>
        ) : null}
        {(streakCombo ?? 0) > 1 ? (
          <span className="text-[10px] font-bold text-amber-300">{streakCombo}×</span>
        ) : null}
      </div>
    );
  }
  if (mode === "empire") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
        <Castle className="size-3.5" />
        {empireTier || "Hut"}
      </div>
    );
  }
  if (mode === "battle") {
    const you = battleYou ?? 0;
    const them = battleThem ?? 0;
    return (
      <div className="min-w-[132px] space-y-1">
        <div className="flex items-center justify-between text-[10px] font-semibold text-violet-100">
          <span>You {you}</span>
          <span>Rival {them}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-violet-400"
            style={{ width: `${Math.min(100, you + them === 0 ? 50 : (you / (you + them)) * 100)}%` }}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="mode-float inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200">
      <Trophy className="size-3.5" />
      {classicPoints ?? 0} pts
    </div>
  );
}

export function ModeFeedbackBanner({
  mode,
  text,
  isCorrect,
}: {
  mode: GameModeType;
  text: string | null;
  isCorrect?: boolean | null;
}) {
  if (!text) return null;
  const good = isCorrect === true;
  const bad = isCorrect === false;
  return (
    <div
      className={`mode-rise flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold ${
        good
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : bad
            ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
            : MODE_SKIN[mode].hud
      }`}
    >
      {good ? <Sparkles className="size-4 shrink-0" /> : <Timer className="size-4 shrink-0 opacity-70" />}
      <span>{text}</span>
    </div>
  );
}
