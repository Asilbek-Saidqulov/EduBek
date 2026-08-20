/**
 * EduBek — Hand-drawn mascot illustrations.
 *
 * Style: hand-drawn children's book + Scandinavian + Studio Ghibli warmth.
 * Soft, warm, subtle — never cartoonish, never childish.
 * Appear ONLY in empty states, onboarding, success messages, loading cards,
 * and AI assistant sections. Never replace navigation or buttons.
 *
 * Colors: warm white, cream, paper, soft blue, forest green, muted orange,
 * graphite. Very little saturation.
 */
import * as React from "react";

interface MascotProps {
  className?: string;
  size?: number;
}

// Shared color palette — warm, muted, hand-drawn feel
const COLORS = {
  paper: "#FAF7F2",
  cream: "#F5EFE6",
  blue: "#6B9BD2",
  blueSoft: "#A8C5E6",
  green: "#5B8A6E",
  greenSoft: "#8BB89E",
  orange: "#D4956B",
  orangeSoft: "#E8B894",
  graphite: "#4A4A4A",
  graphiteSoft: "#8A8A8A",
  line: "#3A3A3A",
};

// ---------------------------------------------------------------------------
// Smiling Notebook — appears in empty states + onboarding
// ---------------------------------------------------------------------------

export function NotebookMascot({ className, size = 64 }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} role="img" aria-label="Smiling notebook">
      {/* Soft shadow */}
      <ellipse cx="40" cy="72" rx="24" ry="3" fill={COLORS.graphiteSoft} opacity="0.15" />
      {/* Cover — warm cream with subtle gradient */}
      <path d="M16 14 L56 12 L58 14 L58 68 L56 70 L16 68 Z" fill={COLORS.cream} stroke={COLORS.line} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Spiral binding — hand-drawn loops */}
      <path d="M16 16 Q12 18 16 20 Q12 22 16 24 Q12 26 16 28 Q12 30 16 32 Q12 34 16 36 Q12 38 16 40 Q12 42 16 44 Q12 46 16 48 Q12 50 16 52 Q12 54 16 56 Q12 58 16 60 Q12 62 16 64" fill="none" stroke={COLORS.line} strokeWidth="1.2" strokeLinecap="round" />
      {/* Page lines — subtle */}
      <line x1="24" y1="24" x2="50" y2="23" stroke={COLORS.blueSoft} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="24" y1="30" x2="50" y2="29" stroke={COLORS.blueSoft} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* Eyes — simple dots, blink animation */}
      <g className="mascot-blink">
        <circle cx="32" cy="42" r="2" fill={COLORS.line} />
        <circle cx="44" cy="42" r="2" fill={COLORS.line} />
      </g>
      {/* Smile — gentle curve */}
      <path d="M34 48 Q38 52 42 48" fill="none" stroke={COLORS.line} strokeWidth="1.5" strokeLinecap="round" />
      {/* Cheek blush — soft orange */}
      <circle cx="30" cy="47" r="2.5" fill={COLORS.orangeSoft} opacity="0.5" />
      <circle cx="46" cy="47" r="2.5" fill={COLORS.orangeSoft} opacity="0.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tiny Owl — wisdom, appears in AI assistant + recommended sections
// ---------------------------------------------------------------------------

export function OwlMascot({ className, size = 64 }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} role="img" aria-label="Tiny owl">
      {/* Shadow */}
      <ellipse cx="40" cy="72" rx="20" ry="3" fill={COLORS.graphiteSoft} opacity="0.15" />
      {/* Body — rounded, forest green */}
      <ellipse cx="40" cy="44" rx="22" ry="24" fill={COLORS.green} opacity="0.85" stroke={COLORS.line} strokeWidth="1.5" />
      {/* Belly — lighter */}
      <ellipse cx="40" cy="50" rx="14" ry="16" fill={COLORS.greenSoft} opacity="0.6" />
      {/* Eye discs — big and round */}
      <circle cx="32" cy="36" r="8" fill={COLORS.cream} stroke={COLORS.line} strokeWidth="1.2" />
      <circle cx="48" cy="36" r="8" fill={COLORS.cream} stroke={COLORS.line} strokeWidth="1.2" />
      {/* Eyes — blink */}
      <g className="mascot-blink">
        <circle cx="33" cy="37" r="3.5" fill={COLORS.line} />
        <circle cx="47" cy="37" r="3.5" fill={COLORS.line} />
        <circle cx="34" cy="36" r="1" fill={COLORS.paper} />
        <circle cx="48" cy="36" r="1" fill={COLORS.paper} />
      </g>
      {/* Beak — small triangle */}
      <path d="M38 42 L40 46 L42 42 Z" fill={COLORS.orange} stroke={COLORS.line} strokeWidth="1" strokeLinejoin="round" />
      {/* Ear tufts — hand-drawn spikes */}
      <path d="M26 24 L28 18 L30 24" fill={COLORS.green} stroke={COLORS.line} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M50 24 L52 18 L54 24" fill={COLORS.green} stroke={COLORS.line} strokeWidth="1.2" strokeLinejoin="round" />
      {/* Wings — soft */}
      <path d="M20 40 Q18 48 22 56" fill="none" stroke={COLORS.line} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M60 40 Q62 48 58 56" fill="none" stroke={COLORS.line} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Pencil — waves, appears in success + create states
// ---------------------------------------------------------------------------

export function PencilMascot({ className, size = 64 }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} role="img" aria-label="Waving pencil">
      {/* Shadow */}
      <ellipse cx="40" cy="72" rx="18" ry="3" fill={COLORS.graphiteSoft} opacity="0.15" />
      {/* Pencil — tilted, gentle wave */}
      <g className="mascot-wave" style={{ transformOrigin: "20px 60px" }}>
        {/* Eraser — soft orange */}
        <rect x="16" y="16" width="10" height="8" rx="2" fill={COLORS.orangeSoft} stroke={COLORS.line} strokeWidth="1.2" />
        {/* Metal band */}
        <rect x="16" y="24" width="10" height="3" fill={COLORS.graphiteSoft} stroke={COLORS.line} strokeWidth="1" />
        {/* Body — warm cream */}
        <rect x="16" y="27" width="10" height="30" fill={COLORS.cream} stroke={COLORS.line} strokeWidth="1.2" />
        {/* Stripes */}
        <line x1="16" y1="35" x2="26" y2="35" stroke={COLORS.orange} strokeWidth="1" opacity="0.4" />
        <line x1="16" y1="45" x2="26" y2="45" stroke={COLORS.orange} strokeWidth="1" opacity="0.4" />
        {/* Wood tip */}
        <path d="M16 57 L21 68 L26 57 Z" fill={COLORS.orangeSoft} stroke={COLORS.line} strokeWidth="1.2" strokeLinejoin="round" />
        {/* Graphite tip */}
        <path d="M19 64 L21 68 L23 64 Z" fill={COLORS.line} />
        {/* Face — eyes + smile */}
        <circle cx="19" cy="40" r="1.5" fill={COLORS.line} />
        <circle cx="23" cy="40" r="1.5" fill={COLORS.line} />
        <path d="M19 44 Q21 46 23 44" fill="none" stroke={COLORS.line} strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Globe — discovery, appears in recommended subjects + search
// ---------------------------------------------------------------------------

export function GlobeMascot({ className, size = 64 }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} role="img" aria-label="Globe">
      {/* Shadow */}
      <ellipse cx="40" cy="72" rx="22" ry="3" fill={COLORS.graphiteSoft} opacity="0.15" />
      {/* Globe sphere — soft blue */}
      <circle cx="40" cy="40" r="24" fill={COLORS.blueSoft} opacity="0.5" stroke={COLORS.line} strokeWidth="1.5" />
      {/* Meridian lines */}
      <ellipse cx="40" cy="40" rx="24" ry="10" fill="none" stroke={COLORS.line} strokeWidth="1" opacity="0.4" />
      <ellipse cx="40" cy="40" rx="10" ry="24" fill="none" stroke={COLORS.line} strokeWidth="1" opacity="0.4" />
      <line x1="16" y1="40" x2="64" y2="40" stroke={COLORS.line} strokeWidth="1" opacity="0.4" />
      {/* Continents — hand-drawn blobs */}
      <path d="M30 30 Q35 28 40 30 Q42 34 38 36 Q34 34 30 30" fill={COLORS.green} opacity="0.6" stroke={COLORS.line} strokeWidth="1" strokeLinejoin="round" />
      <path d="M44 38 Q50 36 52 42 Q48 46 44 44" fill={COLORS.green} opacity="0.6" stroke={COLORS.line} strokeWidth="1" strokeLinejoin="round" />
      <path d="M34 48 Q38 50 36 54 Q32 52 34 48" fill={COLORS.green} opacity="0.6" stroke={COLORS.line} strokeWidth="1" strokeLinejoin="round" />
      {/* Stand */}
      <line x1="40" y1="64" x2="40" y2="70" stroke={COLORS.line} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 70 L48 70" stroke={COLORS.line} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Microscope — science, appears in analytics + progress
// ---------------------------------------------------------------------------

export function MicroscopeMascot({ className, size = 64 }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} role="img" aria-label="Microscope">
      {/* Shadow */}
      <ellipse cx="40" cy="72" rx="22" ry="3" fill={COLORS.graphiteSoft} opacity="0.15" />
      {/* Base */}
      <path d="M24 66 L56 66 L52 70 L28 70 Z" fill={COLORS.graphite} stroke={COLORS.line} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Arm */}
      <path d="M48 66 L48 40 Q48 34 42 34 L36 34" fill="none" stroke={COLORS.line} strokeWidth="1.5" strokeLinecap="round" />
      {/* Eyepiece tube */}
      <rect x="32" y="20" width="8" height="16" rx="2" fill={COLORS.blueSoft} opacity="0.6" stroke={COLORS.line} strokeWidth="1.5" />
      {/* Looking eyes — animate */}
      <g className="mascot-look">
        <circle cx="35" cy="26" r="1.5" fill={COLORS.line} />
        <circle cx="37" cy="26" r="1.5" fill={COLORS.line} />
      </g>
      {/* Objective lens */}
      <path d="M32 36 L40 36 L38 42 L34 42 Z" fill={COLORS.cream} stroke={COLORS.line} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Stage */}
      <rect x="28" y="42" width="16" height="4" rx="1" fill={COLORS.graphite} stroke={COLORS.line} strokeWidth="1.2" />
      {/* Specimen slide */}
      <rect x="30" y="40" width="12" height="2" fill={COLORS.orangeSoft} stroke={COLORS.line} strokeWidth="0.8" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// AI Robot — assistant, appears in AI sections + loading
// ---------------------------------------------------------------------------

export function AiRobotMascot({ className, size = 64 }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} role="img" aria-label="AI robot assistant">
      {/* Shadow */}
      <ellipse cx="40" cy="72" rx="20" ry="3" fill={COLORS.graphiteSoft} opacity="0.15" />
      {/* Floating group */}
      <g className="mascot-float">
        {/* Antenna */}
        <line x1="40" y1="12" x2="40" y2="18" stroke={COLORS.line} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="40" cy="11" r="2.5" fill={COLORS.orange} stroke={COLORS.line} strokeWidth="1.2" />
        {/* Head — rounded rectangle */}
        <rect x="24" y="18" width="32" height="26" rx="8" fill={COLORS.paper} stroke={COLORS.line} strokeWidth="1.5" />
        {/* Screen face — soft blue */}
        <rect x="28" y="22" width="24" height="18" rx="4" fill={COLORS.blueSoft} opacity="0.4" />
        {/* Eyes — soft, glowing */}
        <g className="mascot-blink">
          <circle cx="34" cy="31" r="2.5" fill={COLORS.blue} />
          <circle cx="46" cy="31" r="2.5" fill={COLORS.blue} />
        </g>
        {/* Smile — digital line */}
        <path d="M35 37 L40 39 L45 37" fill="none" stroke={COLORS.blue} strokeWidth="1.5" strokeLinecap="round" />
        {/* Body */}
        <rect x="28" y="46" width="24" height="14" rx="4" fill={COLORS.cream} stroke={COLORS.line} strokeWidth="1.5" />
        {/* Chest light — pulses */}
        <circle cx="40" cy="53" r="2.5" fill={COLORS.green} className="mascot-pulse" />
        {/* Arms — small, stubby */}
        <line x1="28" y1="50" x2="24" y2="54" stroke={COLORS.line} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="52" y1="50" x2="56" y2="54" stroke={COLORS.line} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Combined picker
// ---------------------------------------------------------------------------

export type MascotName = "notebook" | "owl" | "pencil" | "globe" | "microscope" | "robot";

export function Mascot({ name, ...props }: { name: MascotName } & MascotProps) {
  switch (name) {
    case "notebook": return <NotebookMascot {...props} />;
    case "owl": return <OwlMascot {...props} />;
    case "pencil": return <PencilMascot {...props} />;
    case "globe": return <GlobeMascot {...props} />;
    case "microscope": return <MicroscopeMascot {...props} />;
    case "robot": return <AiRobotMascot {...props} />;
  }
}
