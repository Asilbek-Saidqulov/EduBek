/**
 * Marketplace feature — domain types.
 *
 * DTOs returned by the marketplace service. Framework-agnostic.
 */

import type { QuizCreatorDto } from '@/features/quiz/quiz.types'

export interface MarketplaceQuizDto {
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
  creator: QuizCreatorDto
}

export interface MarketplaceListResult {
  quizzes: MarketplaceQuizDto[]
  total: number
}
