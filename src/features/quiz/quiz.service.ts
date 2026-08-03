/**
 * Quiz feature — business logic layer (service).
 *
 * The service is the public API of the quiz feature. API routes and
 * Server Components call these functions; they never touch the repository
 * or Prisma directly.
 *
 * Responsibilities:
 *   - Call the repository to fetch raw DB models.
 *   - Enforce business rules (e.g. "quiz must be published").
 *   - Map DB models to DTOs (Data Transfer Objects).
 *   - Throw HttpError on business-rule violations.
 *
 * The service is framework-agnostic — it doesn't know about Next.js,
 * HTTP, or request/response objects. This makes it testable in isolation.
 */

import { badRequest, forbidden, notFound, unauthorized } from '@/lib/errors'
import { avatarInitials, safeJsonParse } from '@/lib/utils'
import { logger } from '@/lib/logger'
import type { AuthContext } from '@/features/rbac'
import { can, PersonalPermission } from '@/features/rbac'
import type {
  QuizCreatorDto,
  QuizDetailDto,
  QuizQuestionDto,
  QuestionMedia,
} from './quiz.types'
import type {
  CreateQuizBody,
  AddQuestionBody,
  UpdateQuestionBody,
  PublishToDiscoverBody,
} from './quiz.schema'
import {
  findPublishedQuizById,
  findQuizById,
  createQuizWithQuestions,
  addQuestionToQuiz,
  updateQuestion,
  markQuizPublished,
} from './quiz.repository'

const log = logger.child({ module: 'quiz-service' })

// ----------------------------------------------------------------------------
// Mapper: Prisma model → DTO
// ----------------------------------------------------------------------------

function mapCreator(
  teacher: {
    id: string
    name: string | null
    username: string | null
    creatorProfile: { displayName: string | null; verificationStatus: string } | null
  },
): QuizCreatorDto {
  const displayName = teacher.creatorProfile?.displayName || teacher.name || '?'
  return {
    id: teacher.id,
    name: displayName,
    username: teacher.username,
    verificationStatus: teacher.creatorProfile?.verificationStatus || 'unverified',
    avatarInitials: avatarInitials(displayName),
  }
}

/**
 * Convert the Prisma `mediaUrl` column (string | null) into the
 * `QuestionMedia` DTO shape. When the column is null/empty the question
 * is text-only — exactly like before the image MVP.
 */
function mapMedia(mediaUrl: string | null | undefined): QuestionMedia | null {
  if (!mediaUrl || mediaUrl.trim().length === 0) return null
  return { imageUrl: mediaUrl, alt: null }
}

function mapQuestion(
  q: {
    id: string
    question: string
    options: string
    orderNum: number
    correctIndex: number
    explanation: string | null
    mediaUrl?: string | null
  },
): QuizQuestionDto {
  return {
    id: q.id,
    question: q.question,
    options: safeJsonParse<string[]>(q.options) ?? [],
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    orderNum: q.orderNum,
    media: mapMedia(q.mediaUrl ?? null),
  }
}

// ----------------------------------------------------------------------------
// Public service functions
// ----------------------------------------------------------------------------

/**
 * Fetch a single quiz by ID for public display.
 * Throws 404 if the quiz doesn't exist or isn't published.
 *
 * NOTE: This returns `correctIndex` on each question so the client can
 * grade answers locally. In the full platform, paid quizzes would gate
 * the answer key behind a purchase check (the service would accept an
 * optional `userId` + `hasPurchased` flag and strip `correctIndex` when
 * the user hasn't purchased).
 */
export async function getQuizById(id: string): Promise<QuizDetailDto> {
  log.info('getQuizById', { id })

  const quiz = await findPublishedQuizById(id)
  if (!quiz || !quiz.isPublished) {
    throw notFound('Quiz not found')
  }

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    difficulty: quiz.difficulty,
    language: quiz.language,
    questionCount: quiz.questions.length,
    isAiGenerated: quiz.isAiGenerated,
    creator: mapCreator(quiz.teacher),
    questions: quiz.questions.map(mapQuestion),
  }
}

// ----------------------------------------------------------------------------
// createQuiz — create a quiz with optional per-question images
// ----------------------------------------------------------------------------

/**
 * Create a new quiz with its initial set of questions.
 *
 * Each question may carry an optional single image (`media.imageUrl`).
 * When `media` is absent or null the question is text-only.
 *
 * Authorization: caller must be authenticated and have the
 * `RESOURCE_CREATE` personal permission (a quiz is a Resource of type
 * `quiz`). The `isAiGenerated` flag is set from the request body so
 * AI-origin quizzes can be tagged at creation.
 */
export async function createQuiz(
  ctx: AuthContext,
  input: CreateQuizBody,
): Promise<QuizDetailDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  if (!can(ctx, PersonalPermission.RESOURCE_CREATE)) {
    throw forbidden('No permission to create quizzes')
  }

  const created = await createQuizWithQuestions({
    teacherId: ctx.userId,
    orgId: input.orgId ?? null,
    title: input.title,
    description: input.description ?? null,
    category: input.category,
    difficulty: input.difficulty,
    language: input.language,
    isAiGenerated: input.isAiGenerated,
    aiPromptId: input.aiPromptId ?? null,
    isPublished: false,
    questions: input.questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation ?? null,
      mediaUrl: q.media?.imageUrl ?? null,
      orderNum: i,
    })),
  })

  log.info('quiz.created', {
    quizId: created.id,
    questionCount: created.questions.length,
    isAiGenerated: created.isAiGenerated,
  })

  // Re-fetch with teacher include so the DTO can be assembled identically
  // to `getQuizById`. The freshly-created quiz is not yet published.
  const fresh = await findQuizById(created.id)
  if (!fresh) throw notFound('Quiz disappeared after creation')
  return {
    id: fresh.id,
    title: fresh.title,
    description: fresh.description,
    category: fresh.category,
    difficulty: fresh.difficulty,
    language: fresh.language,
    questionCount: created.questions.length,
    isAiGenerated: fresh.isAiGenerated,
    creator: {
      id: ctx.userId,
      name: ctx.email ?? '?',
      username: null,
      verificationStatus: 'unverified',
      avatarInitials: avatarInitials(ctx.email ?? '?'),
    },
    questions: created.questions.map(mapQuestion),
  }
}

// ----------------------------------------------------------------------------
// addQuestion — append a single question (with optional image) to a quiz
// ----------------------------------------------------------------------------

export async function addQuestion(
  ctx: AuthContext,
  quizId: string,
  input: AddQuestionBody,
): Promise<QuizQuestionDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  if (!can(ctx, PersonalPermission.RESOURCE_CREATE)) {
    throw forbidden('No permission to manage quizzes')
  }
  const quiz = await findQuizById(quizId)
  if (!quiz) throw notFound('Quiz not found')
  if (quiz.teacherId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden('Cannot add questions to a quiz you do not own')
  }

  const created = await addQuestionToQuiz({
    quizId,
    question: input.question,
    options: input.options,
    correctIndex: input.correctIndex,
    explanation: input.explanation ?? null,
    mediaUrl: input.media?.imageUrl ?? null,
    aiGenerated: quiz.isAiGenerated,
  })

  log.info('quiz.question.added', { quizId, questionId: created.id })

  return mapQuestion({
    id: created.id,
    question: created.question,
    options: created.options,
    orderNum: created.orderNum,
    correctIndex: created.correctIndex,
    explanation: created.explanation,
    mediaUrl: created.mediaUrl,
  })
}

// ----------------------------------------------------------------------------
// updateQuestion — patch a single question (including its optional image)
// ----------------------------------------------------------------------------

export async function patchQuestion(
  ctx: AuthContext,
  quizId: string,
  questionId: string,
  input: UpdateQuestionBody,
): Promise<QuizQuestionDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  if (!can(ctx, PersonalPermission.RESOURCE_CREATE)) {
    throw forbidden('No permission to manage quizzes')
  }
  const quiz = await findQuizById(quizId)
  if (!quiz) throw notFound('Quiz not found')
  if (quiz.teacherId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden('Cannot edit a quiz you do not own')
  }

  const updated = await updateQuestion({
    questionId,
    question: input.question,
    options: input.options,
    correctIndex: input.correctIndex,
    explanation: input.explanation ?? undefined,
    mediaUrl: input.media === null ? null : input.media?.imageUrl ?? undefined,
  })

  log.info('quiz.question.updated', { quizId, questionId })

  return mapQuestion({
    id: updated.id,
    question: updated.question,
    options: updated.options,
    orderNum: updated.orderNum,
    correctIndex: updated.correctIndex,
    explanation: updated.explanation,
    mediaUrl: updated.mediaUrl,
  })
}

// ----------------------------------------------------------------------------
// publishToDiscover — publish a quiz as FREE Discover content.
//
// MVP scope (Phase MVP-Discover-Policy):
//   - AI-generated quizzes MAY be published to Discover for free.
//   - The caller decides whether to publish (simple toggle, no moderation,
//     no approval workflow, no ranking changes).
//   - The quiz is marked `isPublished = true` and indexed in the Discovery
//     search index with `isAiGenerated` set accordingly and `price = 0`
//     (free — nobody can sell it).
//   - The Marketplace policy (separate) blocks AI-generated content from
//     being listed for sale, so this free Discover publication is the only
//     public surface for AI quizzes.
// ----------------------------------------------------------------------------

export async function publishQuizToDiscover(
  ctx: AuthContext,
  quizId: string,
  input: PublishToDiscoverBody,
): Promise<{ quizId: string; published: boolean; isAiGenerated: boolean; price: number }> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const quiz = await findQuizById(quizId)
  if (!quiz) throw notFound('Quiz not found')
  if (quiz.teacherId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden('Cannot publish a quiz you do not own')
  }
  if (input.isAiGenerated && !quiz.isAiGenerated) {
    throw badRequest('Quiz is not marked as AI-generated; cannot publish as AI content')
  }

  await markQuizPublished(quizId)

  // Lazy import to avoid a circular dependency at module load time.
  const { indexEntity } = await import('@/features/discovery/service')
  await indexEntity({
    entityType: 'quiz',
    entityId: quizId,
    title: quiz.title,
    description: quiz.description ?? undefined,
    language: quiz.language,
    subject: quiz.category,
    difficulty: quiz.difficulty,
    resourceType: 'quiz',
    ownerId: quiz.teacherId,
    orgId: quiz.orgId ?? undefined,
    price: 0, // Discover content is always free — nobody can sell it.
    isAiGenerated: input.isAiGenerated || quiz.isAiGenerated,
  })

  log.info('quiz.publishedToDiscover', {
    quizId,
    isAiGenerated: input.isAiGenerated || quiz.isAiGenerated,
  })

  return {
    quizId,
    published: true,
    isAiGenerated: input.isAiGenerated || quiz.isAiGenerated,
    price: 0,
  }
}
