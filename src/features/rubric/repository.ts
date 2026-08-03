/**
 * EduBek — Rubric repository.
 */
import { db } from "@/lib/db";

export interface CreateRubricInput {
  ownerId: string;
  orgId?: string;
  name: string;
  description?: string;
  maxPoints: number;
}

export interface CreateCriterionInput {
  rubricId: string;
  name: string;
  description?: string;
  maxPoints: number;
  levels: string; // JSON
  order: number;
}

export async function createRubric(input: CreateRubricInput) {
  return db.rubric.create({
    data: {
      ownerId: input.ownerId,
      orgId: input.orgId ?? null,
      name: input.name,
      description: input.description ?? null,
      maxPoints: input.maxPoints,
      status: "active",
    },
  });
}

export async function findRubricById(id: string) {
  return db.rubric.findUnique({
    where: { id },
    include: { criteria: { orderBy: { order: "asc" } } },
  });
}

export async function findRubricsByOwner(ownerId: string) {
  return db.rubric.findMany({
    where: { ownerId, status: "active" },
    include: { criteria: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateRubric(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    maxPoints?: number;
  },
) {
  return db.rubric.update({ where: { id }, data });
}

export async function archiveRubric(id: string) {
  return db.rubric.update({
    where: { id },
    data: { status: "archived" },
  });
}

// ---------------------------------------------------------------------------
// Criteria — we always replace the full set on update.
// ---------------------------------------------------------------------------

export async function addCriteria(input: CreateCriterionInput) {
  return db.rubricCriterion.create({ data: input });
}

export async function replaceCriteria(
  rubricId: string,
  items: CreateCriterionInput[],
): Promise<void> {
  await db.$transaction([
    db.rubricCriterion.deleteMany({ where: { rubricId } }),
    ...items.map((i) => db.rubricCriterion.create({ data: i })),
  ]);
}
