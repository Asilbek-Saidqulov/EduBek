/**
 * EduBek — Static marketplace ratings.
 *
 * The Phase 1 database seed ships quizzes without reviews/purchases yet.
 * These values power the social proof (★ rating + N purchases) shown on
 * the marketplace cards on the landing page. Any quiz title not present
 * in the map falls back to a sensible default.
 */

export const QUIZ_RATINGS: Record<string, { rating: number; purchases: number }> = {
  "Algebra Fundamentals: Linear Equations": { rating: 4.8, purchases: 1247 },
  "Photosynthesis: Energy from Sunlight": { rating: 4.9, purchases: 856 },
  "English Grammar: Tenses Mastery": { rating: 4.7, purchases: 2103 },
  "Newton's Laws of Motion": { rating: 4.9, purchases: 634 },
  "World History: Ancient Civilizations": { rating: 4.6, purchases: 489 },
  "Python Programming Basics": { rating: 4.8, purchases: 3421 },
  "Geography: Capitals of the World": { rating: 4.5, purchases: 1876 },
  "Cell Biology: Structure and Function": { rating: 4.9, purchases: 412 },
}

export const DEFAULT_QUIZ_RATING: { rating: number; purchases: number } = {
  rating: 4.5,
  purchases: 0,
}

export function getQuizRating(title: string): { rating: number; purchases: number } {
  return QUIZ_RATINGS[title] ?? DEFAULT_QUIZ_RATING
}
