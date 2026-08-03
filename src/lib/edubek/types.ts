/**
 * EduBek — Shared TypeScript types for the landing page product surface.
 *
 * These mirror the shapes returned by the public API routes:
 *   GET  /api/marketplace/quizzes
 *   GET  /api/quiz/[id]
 *   POST /api/quiz/generate
 */

export type Difficulty = "easy" | "medium" | "hard"

export interface MarketplaceCreator {
  id: string
  name: string
  username: string
  verificationStatus: string
  avatarInitials: string
}

export interface MarketplaceQuiz {
  id: string
  title: string
  description: string | null
  category: string
  difficulty: string
  language: string
  questionCount: number
  isFeatured: boolean
  publishedAt: string | null
  priceEduTokens: number
  priceFiat: number
  tier: string
  creator: MarketplaceCreator
}

export interface MarketplaceResponse {
  quizzes: MarketplaceQuiz[]
  total: number
}

/** A single quiz question — works for both AI-generated and DB-backed quizzes. */
export interface QuizQuestion {
  /** Stable id (DB-backed quizzes have one; AI-generated quizzes use the array index). */
  id?: string
  question: string
  options: string[]
  correctIndex: number
  explanation?: string | null
  orderNum?: number
}

export interface QuizDetail {
  id: string
  title: string
  description: string | null
  category: string
  difficulty: string
  questionCount: number
  creator: MarketplaceCreator
  questions: QuizQuestion[]
}

export interface AiQuizMetadata {
  topic: string
  difficulty: string
  count: number
  model: string
  generatedAt: string
}

export interface AiQuizResponse {
  title: string
  description: string
  questions: Array<{
    question: string
    options: string[]
    correctIndex: number
    explanation: string
  }>
  metadata: AiQuizMetadata
}

export interface ApiError {
  error: string
}

export const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: "all", label: "All" },
  { id: "mathematics", label: "Mathematics" },
  { id: "science", label: "Science" },
  { id: "language", label: "Language" },
  { id: "history", label: "History" },
  { id: "technology", label: "Technology" },
  { id: "geography", label: "Geography" },
]
