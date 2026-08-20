/**
 * EduBek — Core constants and types.
 *
 * Phase 4E.2: All display text has been moved to translation catalogs
 * (messages/{en,uz,ru}.json). This file now contains only:
 *   - IDs (for stable references)
 *   - Business logic (colors, icons, gradients — visual, not textual)
 *   - Mascot assignments (which illustrated character appears where)
 *   - Type exports
 */

// ============================================================================
// Design Principles — IDs + mascot assignments
// ============================================================================

export const DESIGN_PRINCIPLES = [
  { id: 1, mascot: "notebook" as const },
  { id: 2, mascot: "pencil" as const },
  { id: 3, mascot: "book" as const },
  { id: 4, mascot: "microscope" as const },
  { id: 5, mascot: "robot" as const },
  { id: 6, mascot: "notebook" as const },
  { id: 7, mascot: "pencil" as const },
  { id: 8, mascot: "book" as const },
  { id: 9, mascot: "microscope" as const },
  { id: 10, mascot: "robot" as const },
  { id: 11, mascot: "notebook" as const },
  { id: 12, mascot: "pencil" as const },
  { id: 13, mascot: "book" as const },
  { id: 14, mascot: "microscope" as const },
]

// ============================================================================
// The 10 Systems — IDs + visual metadata + mascot
// ============================================================================

export const SYSTEMS = [
  { id: "marketplace", icon: "Store", color: "from-amber-500 to-orange-600", mascot: "book" as const },
  { id: "ai-assistant", icon: "Sparkles", color: "from-violet-500 to-purple-600", mascot: "robot" as const },
  { id: "quiz-platform", icon: "Brain", color: "from-blue-500 to-cyan-600", mascot: "pencil" as const },
  { id: "organization", icon: "Building2", color: "from-emerald-500 to-teal-600", mascot: "notebook" as const },
  { id: "creator-economy", icon: "Wallet", color: "from-pink-500 to-rose-600", mascot: "pencil" as const },
  { id: "economy", icon: "Coins", color: "from-yellow-500 to-amber-600", mascot: "book" as const },
  { id: "analytics", icon: "BarChart3", color: "from-indigo-500 to-blue-600", mascot: "microscope" as const },
  { id: "search", icon: "Search", color: "from-sky-500 to-indigo-600", mascot: "microscope" as const },
  { id: "user", icon: "Users", color: "from-slate-500 to-gray-600", mascot: "notebook" as const },
  { id: "library", icon: "Library", color: "from-green-500 to-emerald-600", mascot: "book" as const },
] as const

// ============================================================================
// User Roles — IDs + visual metadata + mascot + actions
// ============================================================================

export const USER_ROLES = [
  { id: "teacher", icon: "GraduationCap", color: "from-emerald-500 to-teal-600", mascot: "notebook" as const, actions: ["Create Quizzes", "Grade Students", "Manage Classroom"] },
  { id: "student", icon: "BookOpen", color: "from-sky-500 to-cyan-600", mascot: "book" as const, actions: ["Take Quizzes", "Track Progress", "Earn EduTokens"] },
  { id: "creator", icon: "PenTool", color: "from-pink-500 to-rose-600", mascot: "pencil" as const, actions: ["Publish Content", "Earn Revenue", "Build Audience"] },
  { id: "school", icon: "Building2", color: "from-amber-500 to-orange-600", mascot: "notebook" as const, actions: ["Manage Members", "Set Policies", "View Analytics"] },
  { id: "admin", icon: "Shield", color: "from-slate-500 to-gray-600", mascot: "microscope" as const, actions: ["Moderate Platform", "Manage Users", "Configure System"] },
  { id: "ai", icon: "Sparkles", color: "from-violet-500 to-purple-600", mascot: "robot" as const, actions: ["Generate Quizzes", "Personalize Learning", "Analyze Performance"] },
] as const

// ============================================================================
// The Content Lifecycle — step numbers + mascot
// ============================================================================

export const CONTENT_LIFECYCLE = [
  { step: 1, mascot: "pencil" as const },
  { step: 2, mascot: "notebook" as const },
  { step: 3, mascot: "book" as const },
  { step: 4, mascot: "microscope" as const },
  { step: 5, mascot: "robot" as const },
  { step: 6, mascot: "pencil" as const },
  { step: 7, mascot: "notebook" as const },
  { step: 8, mascot: "book" as const },
  { step: 9, mascot: "microscope" as const },
  { step: 10, mascot: "robot" as const },
] as const

// ============================================================================
// The AI Decision Engine — 5-Question Process
// ============================================================================

export const AI_DECISION_PROCESS = [
  { step: 1, mascot: "microscope" as const },
  { step: 2, mascot: "notebook" as const },
  { step: 3, mascot: "robot" as const },
  { step: 4, mascot: "pencil" as const },
  { step: 5, mascot: "book" as const },
] as const

// ============================================================================
// The Dual-Currency Economy
// ============================================================================

export const ECONOMY = {
  realMoney: {
    color: "from-emerald-500 to-green-600",
    name: "Real Money",
    usedFor: "Marketplace purchases, subscriptions, creator payouts",
    represents: "Fiat currency (UZS, USD) deposited via Click",
  },
  eduTokens: {
    color: "from-violet-500 to-purple-600",
    name: "EduTokens",
    usedFor: "AI generation, premium content unlocks, tips",
    represents: "Platform-internal reward currency earned through quizzes",
    examples: ["AI Quiz Generation", "Premium Content", "Creator Tips", "Live Quiz Rewards", "Achievement Unlocks"],
  },
} as const

// ============================================================================
// Platform Stats
// ============================================================================

export const PLATFORM_STATS = [
  { key: "educationalSystems", value: "10", suffix: "" },
  { key: "designPrinciples", value: "14", suffix: "" },
  { key: "userRoles", value: "6", suffix: "" },
  { key: "contentLifecycleSteps", value: "10", suffix: "" },
] as const

// ============================================================================
// Cycle Stages — the EduBek learning loop
// ============================================================================

export const CYCLE_STAGES = [
  { step: 1, icon: "Search", mascot: "microscope" as const },
  { step: 2, icon: "Brain", mascot: "robot" as const },
  { step: 3, icon: "BookOpen", mascot: "book" as const },
  { step: 4, icon: "CheckCircle2", mascot: "notebook" as const },
  { step: 5, icon: "TrendingUp", mascot: "pencil" as const },
] as const

// ============================================================================
// Vision Pillars
// ============================================================================

export const VISION_PILLARS = [
  { id: "access", icon: "Globe", mascot: "book" as const },
  { id: "quality", icon: "Award", mascot: "microscope" as const },
  { id: "community", icon: "Users", mascot: "notebook" as const },
  { id: "future", icon: "Rocket", mascot: "robot" as const },
] as const

// ============================================================================
// Type exports
// ============================================================================

export type SystemId = typeof SYSTEMS[number]["id"]
export type UserRole = typeof USER_ROLES[number]["id"]
export type DesignPrinciple = typeof DESIGN_PRINCIPLES[number]
export type MascotName = "notebook" | "pencil" | "book" | "microscope" | "robot"
