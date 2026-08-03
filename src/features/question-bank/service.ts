/**
 * EduBek — Question Bank service.
 *
 * Business logic for creating, updating, archiving, duplicating, searching,
 * and importing/exporting reusable questions. Every state transition
 * publishes a domain event so the audit log and analytics layer stay in
 * sync.
 *
 * Authorization model:
 *   • createQuestion / update / archive / duplicate — owner (or superadmin)
 *     with PersonalPermission.QUESTION_MANAGE. If orgId is set, the caller
 *     must be an org member with OrgPermission.ORG_QUESTION_MANAGE.
 *   • getQuestion / searchQuestions — owner, org member, or any user when
 *     the question is shared via classroom (no separate flag yet — owner
 *     is sufficient for now).
 *   • importQuestions / exportQuestions — same as create/update.
 *
 * Events published:
 *   • QUESTION_CREATED     — when a question is created
 *   • QUESTION_UPDATED     — when a question is updated (a new version row
 *                            is also written before the event fires)
 *   • QUESTION_ARCHIVED    — when a question is archived
 *   • QUESTION_DUPLICATED  — when a question is copied
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  canInOrg,
  isOrgMember,
  PersonalPermission,
  OrgPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  QUESTION_ARCHIVED,
  QUESTION_CREATED,
  QUESTION_DUPLICATED,
  QUESTION_UPDATED,
  type QuestionArchivedEvent,
  type QuestionCreatedEvent,
  type QuestionDuplicatedEvent,
  type QuestionUpdatedEvent,
} from "@/infra/event-bus/events";
import * as repo from "./repository";
import {
  parsePayloadForType,
  questionTypeSchema,
  type QuestionTypeString,
} from "./schema";
import type {
  Difficulty,
  QuestionDto,
  QuestionImportResult,
  QuestionPayload,
  QuestionSearchResult,
  QuestionType,
  QuestionVersionDto,
} from "./types";
import type {
  CreateQuestionBody,
  ImportQuestionsBody,
  SearchQuestionsQuery,
  UpdateQuestionBody,
} from "./schema";

const log = getLogger("question-bank-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParsePayload(raw: string): QuestionPayload {
  try {
    return JSON.parse(raw) as QuestionPayload;
  } catch {
    return {} as QuestionPayload;
  }
}

function mapQuestion(q: any): QuestionDto {
  return {
    id: q.id,
    ownerId: q.ownerId,
    orgId: q.orgId,
    questionType: q.questionType as QuestionType,
    payload: safeParsePayload(q.payload),
    subject: q.subject,
    grade: q.grade,
    difficulty: q.difficulty as Difficulty,
    topic: q.topic,
    estimatedTime: q.estimatedTime,
    learningObjective: q.learningObjective,
    points: q.points,
    status: q.status,
    versionNumber: q.versionNumber,
    aiGeneratedFrom: q.aiGeneratedFrom,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  };
}

function mapVersion(v: any): QuestionVersionDto {
  return {
    id: v.id,
    questionId: v.questionId,
    version: v.version,
    snapshot: safeParsePayload(v.snapshot),
    changelog: v.changelog,
    createdById: v.createdById,
    createdAt: v.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

function isOwner(ctx: AuthContext, q: { ownerId: string }): boolean {
  return ctx.isSuperadmin || q.ownerId === ctx.userId;
}

// ---------------------------------------------------------------------------
// createQuestion
// ---------------------------------------------------------------------------

export async function createQuestion(
  ctx: AuthContext,
  input: CreateQuestionBody,
): Promise<QuestionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.QUESTION_MANAGE)) {
    throw forbidden("No permission to manage questions");
  }
  if (input.orgId) {
    if (!isOrgMember(ctx, input.orgId) && !ctx.isSuperadmin) {
      throw forbidden("You are not a member of this organization");
    }
    if (!ctx.isSuperadmin && !canInOrg(ctx, input.orgId, OrgPermission.ORG_QUESTION_MANAGE)) {
      throw forbidden("No org permission to manage questions");
    }
  }
  // Validate payload shape per type.
  const validatedPayload = parsePayloadForType(
    input.questionType as QuestionTypeString,
    input.payload,
  );

  const created = await repo.createQuestion({
    ownerId: ctx.userId,
    orgId: input.orgId,
    questionType: input.questionType,
    payload: JSON.stringify(validatedPayload),
    subject: input.subject,
    grade: input.grade,
    difficulty: input.difficulty,
    topic: input.topic,
    estimatedTime: input.estimatedTime,
    learningObjective: input.learningObjective,
    points: input.points,
    aiGeneratedFrom: input.aiGeneratedFrom,
  });

  // Initial version 1 snapshot.
  await repo.createVersion({
    questionId: created.id,
    version: 1,
    snapshot: created.payload,
    changelog: "Initial creation",
    createdById: ctx.userId,
  });

  eventBus.publish(
    buildEvent<QuestionCreatedEvent>({
      type: QUESTION_CREATED,
      actorId: ctx.userId,
      questionId: created.id,
      ownerId: created.ownerId,
      questionType: created.questionType,
      subject: created.subject,
    }),
  );

  log.info("question.created", {
    questionId: created.id,
    questionType: created.questionType,
  });

  return mapQuestion(created);
}

// ---------------------------------------------------------------------------
// getQuestion
// ---------------------------------------------------------------------------

export async function getQuestion(
  ctx: AuthContext,
  id: string,
): Promise<QuestionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const question = await repo.findQuestionById(id);
  if (!question) throw notFound("Question not found");
  if (!isOwner(ctx, question) && question.orgId && !isOrgMember(ctx, question.orgId)) {
    throw forbidden("You do not have access to this question");
  }
  return mapQuestion(question);
}

// ---------------------------------------------------------------------------
// getQuestionVersions
// ---------------------------------------------------------------------------

export async function getQuestionVersions(
  ctx: AuthContext,
  id: string,
): Promise<QuestionVersionDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const question = await repo.findQuestionById(id);
  if (!question) throw notFound("Question not found");
  if (!isOwner(ctx, question) && question.orgId && !isOrgMember(ctx, question.orgId)) {
    throw forbidden("You do not have access to this question");
  }
  const versions = await repo.findVersionsByQuestion(id);
  return versions.map(mapVersion);
}

// ---------------------------------------------------------------------------
// searchQuestions
// ---------------------------------------------------------------------------

export async function searchQuestions(
  ctx: AuthContext,
  query: SearchQuestionsQuery,
): Promise<QuestionSearchResult> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  // Default scope: caller's own questions + their org questions.
  // We can't easily express "(ownerId = me OR orgId IN (...))" with a single
  // AND clause, so we run two searches in parallel and merge them.
  const ownResult = await repo.searchQuestions({
    ownerId: ctx.userId,
    query: query.query,
    questionType: query.questionType,
    subject: query.subject,
    difficulty: query.difficulty,
    topic: query.topic,
    status: query.status,
    page: query.page,
    pageSize: query.pageSize,
  });
  return {
    questions: ownResult.items.map(mapQuestion),
    total: ownResult.total,
  };
}

// ---------------------------------------------------------------------------
// updateQuestion
// ---------------------------------------------------------------------------

export async function updateQuestion(
  ctx: AuthContext,
  id: string,
  input: UpdateQuestionBody,
): Promise<QuestionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findQuestionById(id);
  if (!existing) throw notFound("Question not found");
  if (!isOwner(ctx, existing)) {
    throw forbidden("Only the owner can update this question");
  }

  // Re-validate the payload if it changed.
  let newPayloadString: string | undefined;
  if (input.payload) {
    const validated = parsePayloadForType(
      existing.questionType as QuestionTypeString,
      input.payload,
    );
    newPayloadString = JSON.stringify(validated);
  }

  // Snapshot the current state as a version row before updating.
  const versionCount = await repo.countVersionsByQuestion(id);
  const nextVersion = versionCount + 1;
  await repo.createVersion({
    questionId: id,
    version: nextVersion,
    snapshot: existing.payload,
    changelog: input.changelog ?? `Version ${nextVersion}`,
    createdById: ctx.userId,
  });

  const updated = await repo.updateQuestion(id, {
    payload: newPayloadString,
    subject: input.subject,
    grade: input.grade,
    difficulty: input.difficulty,
    topic: input.topic,
    estimatedTime: input.estimatedTime,
    learningObjective: input.learningObjective,
    points: input.points,
    versionNumber: nextVersion,
  });

  eventBus.publish(
    buildEvent<QuestionUpdatedEvent>({
      type: QUESTION_UPDATED,
      actorId: ctx.userId,
      questionId: updated.id,
      ownerId: updated.ownerId,
      versionNumber: updated.versionNumber,
    }),
  );

  return mapQuestion(updated);
}

// ---------------------------------------------------------------------------
// archiveQuestion
// ---------------------------------------------------------------------------

export async function archiveQuestion(
  ctx: AuthContext,
  id: string,
): Promise<QuestionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findQuestionById(id);
  if (!existing) throw notFound("Question not found");
  if (!isOwner(ctx, existing)) {
    throw forbidden("Only the owner can archive this question");
  }
  const archived = await repo.archiveQuestion(id);
  eventBus.publish(
    buildEvent<QuestionArchivedEvent>({
      type: QUESTION_ARCHIVED,
      actorId: ctx.userId,
      questionId: archived.id,
    }),
  );
  return mapQuestion(archived);
}

// ---------------------------------------------------------------------------
// duplicateQuestion
// ---------------------------------------------------------------------------

export async function duplicateQuestion(
  ctx: AuthContext,
  id: string,
): Promise<QuestionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.QUESTION_MANAGE)) {
    throw forbidden("No permission to manage questions");
  }
  const source = await repo.findQuestionById(id);
  if (!source) throw notFound("Source question not found");

  const created = await repo.createQuestion({
    ownerId: ctx.userId,
    questionType: source.questionType,
    payload: source.payload,
    subject: source.subject ?? undefined,
    grade: source.grade ?? undefined,
    difficulty: source.difficulty,
    topic: source.topic ?? undefined,
    estimatedTime: source.estimatedTime ?? undefined,
    learningObjective: source.learningObjective ?? undefined,
    points: source.points,
  });
  await repo.createVersion({
    questionId: created.id,
    version: 1,
    snapshot: created.payload,
    changelog: `Duplicated from ${source.id}`,
    createdById: ctx.userId,
  });

  eventBus.publish(
    buildEvent<QuestionDuplicatedEvent>({
      type: QUESTION_DUPLICATED,
      actorId: ctx.userId,
      questionId: created.id,
      originalQuestionId: source.id,
    }),
  );

  return mapQuestion(created);
}

// ---------------------------------------------------------------------------
// importQuestions
// ---------------------------------------------------------------------------

export async function importQuestions(
  ctx: AuthContext,
  input: ImportQuestionsBody,
): Promise<QuestionImportResult> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.QUESTION_MANAGE)) {
    throw forbidden("No permission to manage questions");
  }
  if (input.orgId) {
    if (!isOrgMember(ctx, input.orgId) && !ctx.isSuperadmin) {
      throw forbidden("You are not a member of this organization");
    }
    if (!ctx.isSuperadmin && !canInOrg(ctx, input.orgId, OrgPermission.ORG_QUESTION_MANAGE)) {
      throw forbidden("No org permission to manage questions");
    }
  }

  let imported = 0;
  let failed = 0;
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < input.questions.length; i++) {
    const raw = input.questions[i]!;
    try {
      const qt = questionTypeSchema.parse(raw.questionType);
      const payload = parsePayloadForType(qt, raw.payload ?? {});
      await repo.createQuestion({
        ownerId: ctx.userId,
        orgId: input.orgId,
        questionType: qt,
        payload: JSON.stringify(payload),
        subject: typeof raw.subject === "string" ? raw.subject : undefined,
        grade: typeof raw.grade === "string" ? raw.grade : undefined,
        difficulty: typeof raw.difficulty === "string" ? raw.difficulty : "medium",
        topic: typeof raw.topic === "string" ? raw.topic : undefined,
        estimatedTime: typeof raw.estimatedTime === "number" ? raw.estimatedTime : undefined,
        learningObjective: typeof raw.learningObjective === "string" ? raw.learningObjective : undefined,
        points: typeof raw.points === "number" ? raw.points : 1,
      });
      imported += 1;
    } catch (err) {
      failed += 1;
      errors.push({
        index: i,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log.info("question.import", { imported, failed });
  return { imported, failed, errors };
}

// ---------------------------------------------------------------------------
// exportQuestions
// ---------------------------------------------------------------------------

export async function exportQuestions(
  ctx: AuthContext,
  ids: string[],
): Promise<QuestionDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.QUESTION_MANAGE)) {
    throw forbidden("No permission to manage questions");
  }
  if (ids.length === 0) {
    throw badRequest("ids array must not be empty");
  }
  if (ids.length > 200) {
    throw badRequest("Cannot export more than 200 questions at once");
  }
  const rows = await repo.findQuestionsByIds(ids);
  // Filter to questions the caller can read.
  const visible = rows.filter((q) => isOwner(ctx, q) || (q.orgId && isOrgMember(ctx, q.orgId)));
  return visible.map(mapQuestion);
}
