"use client";

import * as React from "react";
import type { GameModeType } from "@/components/edubek/game-modes";
import "@/components/edubek/mode-stage.css";

export type MascotMood = "idle" | "cheer" | "worry" | "win";

export const MODE_CAST: Record<
  GameModeType,
  { name: string; title: string; idle: string; cheer: string; worry: string; win: string }
> = {
  classic: {
    name: "Luma",
    title: "the speed owl",
    idle: "Ready when you are.",
    cheer: "Fast and bright!",
    worry: "Breathe — next one.",
    win: "That was lightning.",
  },
  heist: {
    name: "Pip",
    title: "the coin fox",
    idle: "Gold likes brave answers.",
    cheer: "Treasure secured!",
    worry: "Empty pouch this time.",
    win: "Vault is glowing.",
  },
  empire: {
    name: "Moss",
    title: "the builder turtle",
    idle: "Stone by stone.",
    cheer: "New bricks for the keep.",
    worry: "No supplies this turn.",
    win: "The citadel stands.",
  },
  royale: {
    name: "Nim",
    title: "the shield cat",
    idle: "Three lives. Stay sharp.",
    cheer: "Safe! Keep the streak.",
    worry: "Careful — hearts matter.",
    win: "Last one standing.",
  },
  battle: {
    name: "Vee",
    title: "the spark twin",
    idle: "Same questions. Better answers.",
    cheer: "You took that round.",
    worry: "Rival scored. Catch up.",
    win: "Bracket is yours.",
  },
};

function SvgWrap({
  mood,
  children,
  size,
}: {
  mood: MascotMood;
  children: React.ReactNode;
  size: number;
}) {
  const cls = mood === "cheer" || mood === "win" ? "mode-cheer" : mood === "worry" ? "mode-worry" : "mode-bob";
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={cls} aria-hidden>
      {children}
    </svg>
  );
}

function ClassicOwl() {
  return (
    <>
      <circle cx="40" cy="42" r="24" fill="#38bdf8" />
      <circle cx="31" cy="38" r="9" fill="#fff" />
      <circle cx="49" cy="38" r="9" fill="#fff" />
      <circle cx="32" cy="39" r="4" fill="#0f172a" />
      <circle cx="50" cy="39" r="4" fill="#0f172a" />
      <path d="M36 50 Q40 55 44 50" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M28 22 L32 12 L36 22" fill="#f5b942" />
      <path d="M44 22 L48 12 L52 22" fill="#f5b942" />
      <circle cx="40" cy="16" r="5" fill="#f5b942" />
    </>
  );
}

function HeistFox() {
  return (
    <>
      <ellipse cx="40" cy="48" rx="22" ry="18" fill="#f59e0b" />
      <path d="M22 36 L18 18 L34 32 Z" fill="#f59e0b" />
      <path d="M58 36 L62 18 L46 32 Z" fill="#f59e0b" />
      <path d="M22 36 L22 26 L30 32 Z" fill="#fde68a" />
      <path d="M58 36 L58 26 L50 32 Z" fill="#fde68a" />
      <circle cx="33" cy="46" r="3" fill="#0f172a" />
      <circle cx="47" cy="46" r="3" fill="#0f172a" />
      <ellipse cx="40" cy="54" rx="5" ry="3" fill="#7c2d12" />
      <circle cx="58" cy="58" r="8" fill="#facc15" />
      <text x="58" y="62" textAnchor="middle" fontSize="9" fontWeight="700" fill="#422006">
        G
      </text>
    </>
  );
}

function EmpireTurtle() {
  return (
    <>
      <ellipse cx="40" cy="50" rx="24" ry="16" fill="#059669" />
      <ellipse cx="40" cy="48" rx="16" ry="12" fill="#34d399" />
      <rect x="34" y="28" width="12" height="10" rx="2" fill="#f5b942" />
      <rect x="36" y="22" width="8" height="8" rx="1" fill="#fde68a" />
      <circle cx="18" cy="52" r="6" fill="#065f46" />
      <circle cx="62" cy="52" r="6" fill="#065f46" />
      <circle cx="40" cy="62" r="5" fill="#065f46" />
      <circle cx="22" cy="44" r="2" fill="#ecfdf5" />
    </>
  );
}

function RoyaleCat() {
  return (
    <>
      <ellipse cx="40" cy="48" rx="20" ry="18" fill="#f43f5e" />
      <path d="M24 34 L22 16 L34 32 Z" fill="#fb7185" />
      <path d="M56 34 L58 16 L46 32 Z" fill="#fb7185" />
      <circle cx="33" cy="46" r="3.2" fill="#0f172a" />
      <circle cx="47" cy="46" r="3.2" fill="#0f172a" />
      <path d="M36 54 Q40 57 44 54" stroke="#0f172a" strokeWidth="2" fill="none" />
      <path d="M52 40 Q68 28 64 54 Q58 50 52 46 Z" fill="#f5b942" opacity="0.95" />
    </>
  );
}

function BattleSpark() {
  return (
    <>
      <circle cx="30" cy="44" r="14" fill="#a78bfa" />
      <circle cx="52" cy="40" r="12" fill="#f0abfc" />
      <circle cx="27" cy="42" r="2.5" fill="#1e1b4b" />
      <circle cx="50" cy="38" r="2.5" fill="#1e1b4b" />
      <path d="M24 18 L30 30 L18 28 Z" fill="#f5b942" />
      <path d="M60 16 L64 28 L52 24 Z" fill="#f5b942" />
    </>
  );
}

const BODIES: Record<GameModeType, () => React.ReactNode> = {
  classic: ClassicOwl,
  heist: HeistFox,
  empire: EmpireTurtle,
  royale: RoyaleCat,
  battle: BattleSpark,
};

export function ModeMascot({
  mode,
  mood = "idle",
  size = 88,
  showLine = true,
  line,
}: {
  mode: GameModeType;
  mood?: MascotMood;
  size?: number;
  showLine?: boolean;
  line?: string;
}) {
  const cast = MODE_CAST[mode];
  const Body = BODIES[mode];
  const text = line ?? cast[mood];
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="shrink-0 drop-shadow-sm">
        <SvgWrap mood={mood} size={size}>
          <Body />
        </SvgWrap>
      </div>
      {showLine ? (
        <div className="min-w-0">
          <p className="text-sm font-black leading-tight">
            {cast.name}
            <span className="ml-1 text-[11px] font-medium opacity-70">{cast.title}</span>
          </p>
          <p className="text-xs opacity-80 truncate">{text}</p>
        </div>
      ) : null}
    </div>
  );
}

export function ModeArena({
  mode,
  children,
  className = "",
}: {
  mode: GameModeType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mode-arena mode-arena-${mode} ${className}`}>
      <div className="mode-arena-fx" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="mode-sparkle"
            style={{
              left: `${8 + i * 12}%`,
              top: `${(i % 4) * 22}%`,
              animationDelay: `${i * 0.28}s`,
            }}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
