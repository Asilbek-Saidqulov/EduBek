/**
 * Quiz feature — data access layer (repository).
 *
 * This is the ONLY module that touches Prisma for quiz-related queries.
 * The service layer calls these functions; it never imports `db` directly.
 *
 * Rules:
 *   - Functions return Prisma model types (or null). No DTO mapping here.
 *   - Functions are named after the data operation, not the HTTP verb.
 *   - Functions take plain objects, not Next.js request objects.
 */

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'quiz-repository' })

/**
 * Fetch a single published quiz with its questions and teacher (creator).
 * Returns null if the quiz doesn't exist or isn't published.
 *
 * Includes `correctIndex`, `explanation`, and `mediaUrl` on each question —
 * the service layer decides whether to expose these to the client (paid
 * quizzes would gate them behind a purchase check).
 */
export async function findPublishedQuizById(id: string) {
  log.debug('findPublishedQuizById', { id })
  return db.quiz.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          username: true,
          creatorProfile: {
            select: { displayName: true, verificationStatus: true },
          },
        },
      },
      questions: {
        orderBy: { orderNum: 'asc' },
        select: {
          id: true,
          question: true,
          options: true,
          orderNum: true,
          correctIndex: true,
          explanation: true,
          mediaUrl: true,
        },
      },
    },
  })
}

/**
 * Fetch any quiz (published or not) by ID, including the `isAiGenerated`
 * flag. Used by the service layer for owner/admin operations (create
 * question, publish to discover, …).
 */
export async function findQuizById(id: string) {
  log.debug('findQuizById', { id })
  return db.quiz.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      difficulty: true,
      language: true,
      teacherId: true,
      orgId: true,
      isPublished: true,
      isAiGenerated: true,
      aiPromptId: true,
    },
  })
}

/**
 * Create a quiz with its questions in a single transaction.
 *
 * Each question may carry an optional `mediaUrl` (single image). The
 * caller is responsible for validating the input shape via Zod.
 */
export async function createQuizWithQuestions(input: {
  teacherId: string
  orgId?: string | null
  title: string
  description?: string | null
  category: string
  difficulty: string
  language: string
  isAiGenerated?: boolean
  aiPromptId?: string | null
  isPublished?: boolean
  questions: Array<{
    question: string
    options: string[]
    correctIndex: number
    explanation?: string | null
    mediaUrl?: string | null
    orderNum: number
  }>
}) {
  log.info('createQuizWithQuestions', {
    teacherId: input.teacherId,
    questionCount: input.questions.length,
    isAiGenerated: input.isAiGenerated ?? false,
  })
  return db.quiz.create({
    data: {
      teacherId: input.teacherId,
      orgId: input.orgId ?? null,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      difficulty: input.difficulty,
      language: input.language,
      isAiGenerated: input.isAiGenerated ?? false,
      aiPromptId: input.aiPromptId ?? null,
      isPublished: input.isPublished ?? false,
      questions: {
        create: input.questions.map((q) => ({
          question: q.question,
          options: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? null,
          mediaUrl: q.mediaUrl ?? null,
          orderNum: q.orderNum,
          aiGenerated: input.isAiGenerated ?? false,
        })),
      },
    },
    include: {
      questions: { orderBy: { orderNum: 'asc' } },
    },
  })
}

/**
 * Append a single question to an existing quiz. The `orderNum` is
 * computed as the current max + 1.
 */
export async function addQuestionToQuiz(input: {
  quizId: string
  question: string
  options: string[]
  correctIndex: number
  explanation?: string | null
  mediaUrl?: string | null
  aiGenerated?: boolean
}) {
  const maxOrder = await db.question.aggregate({
    where: { quizId: input.quizId },
    _max: { orderNum: true },
  })
  const orderNum = (maxOrder._max.orderNum ?? -1) + 1
  log.info('addQuestionToQuiz', { quizId: input.quizId, orderNum })
  return db.question.create({
    data: {
      quizId: input.quizId,
      question: input.question,
      options: JSON.stringify(input.options),
      correctIndex: input.correctIndex,
      explanation: input.explanation ?? null,
      mediaUrl: input.mediaUrl ?? null,
      orderNum,
      aiGenerated: input.aiGenerated ?? false,
    },
  })
}

/**
 * Patch a single question. Only the supplied fields are updated.
 */
export async function updateQuestion(input: {
  questionId: string
  question?: string
  options?: string[]
  correctIndex?: number
  explanation?: string | null
  mediaUrl?: string | null
}) {
  const data: Record<string, unknown> = {}
  if (input.question !== undefined) data.question = input.question
  if (input.options !== undefined) data.options = JSON.stringify(input.options)
  if (input.correctIndex !== undefined) data.correctIndex = input.correctIndex
  if (input.explanation !== undefined) data.explanation = input.explanation
  if (input.mediaUrl !== undefined) data.mediaUrl = input.mediaUrl
  log.info('updateQuestion', { questionId: input.questionId, fields: Object.keys(data) })
  return db.question.update({
    where: { id: input.questionId },
    data,
  })
}

/**
 * Mark a quiz as published. Used by the Discover publishing flow.
 */
export async function markQuizPublished(id: string) {
  log.info('markQuizPublished', { id })
  return db.quiz.update({
    where: { id },
    data: { isPublished: true },
  })
}
