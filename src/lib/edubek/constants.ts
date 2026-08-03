/**
 * EduBek — Core constants and types.
 *
 * Phase 4E.2: All display text has been moved to translation catalogs
 * (messages/{en,uz,ru}.json). This file now contains only:
 *   - IDs (for stable references)
 *   - Business logic (colors, icons, gradients — visual, not textual)
 *   - Type exports
 *
 * The constants below map to translation keys in the message catalogs.
 * For example, DESIGN_PRINCIPLES[0].id = 1 maps to:
 *   t("landing.principles.items.1.title")
 *   t("landing.principles.items.1.summary")
 */

// ============================================================================
// Design Principles — IDs only (text is in messages/*.json)
// ============================================================================

export const DESIGN_PRINCIPLES = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
  { id: 7 },
  { id: 8 },
  { id: 9 },
  { id: 10 },
  { id: 11 },
  { id: 12 },
  { id: 13 },
  { id: 14 },
] as const

// ============================================================================
// The 10 Systems — IDs + visual metadata (text is in messages/*.json)
// ============================================================================

export const SYSTEMS = [
  { id: "marketplace", icon: "Store", color: "from-amber-500 to-orange-600" },
  { id: "ai-assistant", icon: "Sparkles", color: "from-violet-500 to-purple-600" },
  { id: "quiz-platform", icon: "Brain", color: "from-blue-500 to-cyan-600" },
  { id: "organization", icon: "Building2", color: "from-emerald-500 to-teal-600" },
  { id: "creator-economy", icon: "Wallet", color: "from-pink-500 to-rose-600" },
  { id: "economy", icon: "Coins", color: "from-yellow-500 to-amber-600" },
  { id: "analytics", icon: "BarChart3", color: "from-indigo-500 to-blue-600" },
  { id: "search", icon: "Search", color: "from-sky-500 to-indigo-600" },
  { id: "user", icon: "Users", color: "from-slate-500 to-gray-600" },
  { id: "library", icon: "Library", color: "from-green-500 to-emerald-600" },
] as const

// ============================================================================
// User Roles — IDs + visual metadata (text is in messages/*.json)
// ============================================================================

export const USER_ROLES = [
  { id: "teacher", icon: "GraduationCap" },
  { id: "student", icon: "BookOpen" },
  { id: "creator", icon: "PenTool" },
  { id: "school", icon: "Building2" },
  { id: "admin", icon: "Shield" },
  { id: "ai", icon: "Sparkles" },
] as const

// ============================================================================
// The Content Lifecycle — step numbers only (text is in messages/*.json)
// ============================================================================

export const CONTENT_LIFECYCLE = [
  { step: 1 },
  { step: 2 },
  { step: 3 },
  { step: 4 },
  { step: 5 },
  { step: 6 },
  { step: 7 },
  { step: 8 },
  { step: 9 },
  { step: 10 },
] as const

// ============================================================================
// The AI Decision Engine — 5-Question Process (text is in messages/*.json)
// ============================================================================

export const AI_DECISION_PROCESS = [
  { step: 1 },
  { step: 2 },
  { step: 3 },
  { step: 4 },
  { step: 5 },
] as const

// ============================================================================
// The Dual-Currency Economy — visual metadata (text is in messages/*.json)
// ============================================================================

export const ECONOMY = {
  realMoney: {
    color: "from-emerald-500 to-green-600",
  },
  eduTokens: {
    color: "from-violet-500 to-purple-600",
  },
} as const

// ============================================================================
// Platform Stats — values only (labels are in messages/*.json)
// ============================================================================

export const PLATFORM_STATS = [
  { key: "educationalSystems", value: "10", suffix: "" },
  { key: "designPrinciples", value: "14", suffix: "" },
  { key: "userRoles", value: "6", suffix: "" },
  { key: "contentLifecycleSteps", value: "10", suffix: "" },
] as const

// ============================================================================
// Type exports
// ============================================================================

export type SystemId = typeof SYSTEMS[number]["id"]
export type UserRole = typeof USER_ROLES[number]["id"]
export type DesignPrinciple = typeof DESIGN_PRINCIPLES[number]
