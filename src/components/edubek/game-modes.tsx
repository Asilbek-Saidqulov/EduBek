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
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
export type GameModeType = "classic" | "royale" | "heist" | "empire" | "battle";

export type GameModeMeta = {
  id: GameModeType;
  title: string;
  tagline: string;
  badge: string;
  features: string[];
  icon: LucideIcon;
};

export const GAME_MODE_META: GameModeMeta[] = [
  {
    id: "classic",
    title: "Classic Quiz",
    tagline: "Be fast. 500 points plus a speed bonus. Highest score wins.",
    badge: "Speed",
    features: ["+500 if correct", "Up to +500 for speed", "Live leaderboard"],
    icon: Trophy,
  },
  {
    id: "heist",
    title: "Treasure Heist",
    tagline: "Correct answers pay gold. Save it, invest it, or raid the pot.",
    badge: "Risk",
    features: ["+100 gold if correct", "Save / Invest / Raid", "Most gold wins"],
    icon: Zap,
  },
  {
    id: "empire",
    title: "Empire Builder",
    tagline: "Turn right answers into wood, stone, gold, and food. Build up.",
    badge: "Build",
    features: ["Hut → Empire", "Spend resources to upgrade", "Highest Empire Power wins"],
    icon: Castle,
  },
  {
    id: "royale",
    title: "Quiz Royale",
    tagline: "Three hearts. A miss costs one. Last player standing wins.",
    badge: "Survive",
    features: ["3 hearts", "5-streak earns a shield", "Outlast the lobby"],
    icon: Swords,
  },
  {
    id: "battle",
    title: "Battle Royale",
    tagline: "Head-to-head 5-question duels. Win the bracket to be champion.",
    badge: "Duel",
    features: ["1v1 over 5 questions", "Better score advances", "Up to 64-player bracket"],
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
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {GAME_MODE_META.map((mode) => {
        const skin = MODE_SKIN[mode.id];
        const Icon = mode.icon;
        const on = selected === mode.id;
        const darkText = mode.id === "royale" || mode.id === "heist";
        return (
          <div 
            role="button" 
            tabIndex={0}
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(mode.id);
              }
            }}
            className={`mode-shine relative overflow-hidden rounded-2xl border text-left p-5 min-h-[220px] flex flex-col justify-between transition-all duration-300 ${skin.card} ${on ? `${skin.selected} ${mode.id === "royale" || mode.id === "heist" ? "mode-glow" : ""}` : "hover:-translate-y-1 hover:shadow-lg"}`}
          >
            <div className={`pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br ${skin.glow} to-transparent ${on ? "mode-pulse" : ""}`} />
            <div className="relative space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className={`flex size-11 items-center justify-center rounded-2xl shadow-sm ${skin.iconWrap} ${on ? "mode-float" : ""}`}>
                  <Icon className="size-5" />
                </div>
                <Badge className={`text-[10px] uppercase tracking-wider ${darkText ? "bg-white/10 text-white border-white/20" : ""}`} variant="outline">
                  {mode.badge}
                </Badge>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${darkText ? "text-white" : "text-foreground"}`}>{mode.title}</h3>
                <p className={`text-xs mt-1 leading-relaxed ${darkText ? "text-white/70" : "text-muted-foreground"}`}>
                  {mode.tagline}
                </p>
              </div>
              <ul className="space-y-1">
                {mode.features.map((f) => (
                  <li key={f} className={`text-[11px] ${darkText ? "text-white/65" : "text-muted-foreground"}`}>
                    · {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative flex gap-2 pt-4">
              <Button
                size="sm"
                className={`flex-1 h-9 text-xs font-semibold ${skin.play}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSolo(mode.id, mode.title);
                }}
              >
                <Play className="size-3.5 fill-current" />
                {soloLabel}
              </Button>
              <Button
                size="sm"
                variant={darkText ? "secondary" : "outline"}
                className="flex-1 h-9 text-xs font-semibold"
                disabled={multiplayerBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  onMultiplayer(mode.id, mode.title);
                }}
              >
                <Users className="size-3.5" />
                {multiplayerLabel}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ModeStatusChips({
  mode,
  vaultGold,
  streakCombo,
  shields,
  hp,
  empireScore,
  masonryStone,
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
    const danger = h <= 1;
    return (
      <div className={`flex items-center gap-2 text-sm ${danger ? "mode-glow" : ""}`}>
        <span aria-label={`${h} hearts`}>{h > 0 ? "❤️".repeat(h) : "💔"}</span>
        {hasShield ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-200">
            <Shield className="size-3" /> shield
          </span>
        ) : null}
      </div>
    );
  }
  if (mode === "empire") {
    return (
      <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
        {empireTier || "Hut"}
      </div>
    );
  }
  if (mode === "battle") {
    return (
      <div className="text-[11px] font-semibold text-violet-100">
        You {battleYou ?? 0} – {battleThem ?? 0} Rival
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
