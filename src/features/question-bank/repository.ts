/**
 * EduBek — Question Bank repository.
 *
 * The ONLY layer in this feature that imports `db`. Services compose these
 * primitives; routes never touch the data layer directly.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export interface CreateQuestionInput {
  ownerId: string;
  orgId?: string;
  questionType: string;
  payload: string; // JSON-serialized
  subject?: string;
  grade?: string;
  difficulty: string;
  topic?: string;
  estimatedTime?: number;
  learningObjective?: string;
  points: number;
  aiGeneratedFrom?: string;
}

export async function createQuestion(input: CreateQuestionInput) {
  return db.bankQuestion.create({
    data: {
      ownerId: input.ownerId,
      orgId: input.orgId ?? null,
      questionType: input.questionType,
      payload: input.payload,
      subject: input.subject ?? null,
      grade: input.grade ?? null,
      difficulty: input.difficulty,
      topic: input.topic ?? null,
      estimatedTime: input.estimatedTime ?? null,
      learningObjective: input.learningObjective ?? null,
      points: input.points,
      aiGeneratedFrom: input.aiGeneratedFrom ?? null,
      status: "active",
      versionNumber: 1,
    },
  });
}

export async function findQuestionById(id: string) {
  return db.bankQuestion.findUnique({ where: { id } });
}

export async function findQuestionWithVersions(id: string) {
  return db.bankQuestion.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { version: "desc" } },
    },
  });
}

export interface SearchQuestionsInput {
  ownerId?: string;
  orgId?: string;
  query?: string;
  questionType?: string;
  subject?: string;
  difficulty?: string;
  topic?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export async function searchQuestions(input: SearchQuestionsInput) {
  const where: Record<string, unknown> = {};
  if (input.ownerId) where.ownerId = input.ownerId;
  if (input.orgId) where.orgId = input.orgId;
  if (input.questionType) where.questionType = input.questionType;
  if (input.subject) where.subject = input.subject;
  if (input.difficulty) where.difficulty = input.difficulty;
  if (input.topic) where.topic = input.topic;
  if (input.status) where.status = input.status;
  if (input.query) {
    where.OR = [
      { topic: { contains: input.query } },
      { learningObjective: { contains: input.query } },
      { payload: { contains: input.query } },
    ];
  }
  const [items, total] = await Promise.all([
    db.bankQuestion.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    db.bankQuestion.count({ where }),
  ]);
  return { items, total };
}

export async function findQuestionsByIds(ids: string[]) {
  return db.bankQuestion.findMany({
    where: { id: { in: ids } },
  });
}

export async function updateQuestion(
  id: string,
  data: {
    payload?: string;
    subject?: string | null;
    grade?: string | null;
    difficulty?: string;
    topic?: string | null;
    estimatedTime?: number | null;
    learningObjective?: string | null;
    points?: number;
    versionNumber?: number;
  },
) {
  return db.bankQuestion.update({ where: { id }, data });
}

export async function archiveQuestion(id: string) {
  return db.bankQuestion.update({
    where: { id },
    data: { status: "archived" },
  });
}

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

export interface CreateVersionInput {
  questionId: string;
  version: number;
  snapshot: string;
  changelog?: string;
  createdById?: string;
}

export async function createVersion(input: CreateVersionInput) {
  return db.bankQuestionVersion.create({
    data: {
      questionId: input.questionId,
      version: input.version,
      snapshot: input.snapshot,
      changelog: input.changelog ?? null,
      createdById: input.createdById ?? null,
    },
  });
}

export async function findVersionsByQuestion(questionId: string) {
  return db.bankQuestionVersion.findMany({
    where: { questionId },
    orderBy: { version: "desc" },
  });
}

export async function countVersionsByQuestion(questionId: string): Promise<number> {
  return db.bankQuestionVersion.count({ where: { questionId } });
}

// ---------------------------------------------------------------------------
// Bulk import helpers
// ---------------------------------------------------------------------------

export async function bulkCreate(
  items: CreateQuestionInput[],
): Promise<number> {
  // SQLite does not support createMany returning — use a transaction of
  // create calls instead. Failures bubble up to the service, which records
  // per-item errors in the import result.
  if (items.length === 0) return 0;
  await db.$transaction(items.map((i) => db.bankQuestion.create({ data: {
    ownerId: i.ownerId,
    orgId: i.orgId ?? null,
    questionType: i.questionType,
    payload: i.payload,
    subject: i.subject ?? null,
    grade: i.grade ?? null,
    difficulty: i.difficulty,
    topic: i.topic ?? null,
    estimatedTime: i.estimatedTime ?? null,
    learningObjective: i.learningObjective ?? null,
    points: i.points,
    aiGeneratedFrom: i.aiGeneratedFrom ?? null,
    status: "active",
    versionNumber: 1,
  } })));
  return items.length;
}
