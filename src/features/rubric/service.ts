/**
 * EduBek — Rubric service.
 *
 * Business logic for creating, updating, duplicating, and archiving reusable
 * grading rubrics. Each rubric carries N criteria, each with M performance
 * levels. Rubrics attach to assessments (one-to-many) to drive the manual
 * grading UI.
 *
 * Authorization model:
 *   • create / update / archive / duplicate — owner (or superadmin) with
 *     PersonalPermission.RUBRIC_MANAGE. If orgId is set, the caller must be
 *     an org member with OrgPermission.ORG_QUESTION_MANAGE (rubrics live in
 *     the same "question bank" permission family as questions).
 *   • getRubric / listMyRubrics — owner or org member.
 *
 * Events published:
 *   • RUBRIC_CREATED    — when a rubric is created
 *   • RUBRIC_UPDATED    — when a rubric is updated
 *   • RUBRIC_DUPLICATED — when a rubric is copied
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
  RUBRIC_CREATED,
  RUBRIC_DUPLICATED,
  RUBRIC_UPDATED,
  type RubricCreatedEvent,
  type RubricDuplicatedEvent,
  type RubricUpdatedEvent,
} from "@/infra/event-bus/events";
import * as repo from "./repository";
import type { RubricCriterionDto, RubricDto, RubricLevel } from "./types";
import type {
  AssignRubricBody,
  CreateRubricBody,
  UpdateRubricBody,
} from "./schema";

const log = getLogger("rubric-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParseLevels(raw: string): RubricLevel[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RubricLevel[];
  } catch {
    return [];
  }
}

function mapCriterion(c: any): RubricCriterionDto {
  return {
    id: c.id,
    rubricId: c.rubricId,
    name: c.name,
    description: c.description,
    maxPoints: c.maxPoints,
    levels: safeParseLevels(c.levels),
    order: c.order,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function mapRubric(r: any): RubricDto {
  return {
    id: r.id,
    ownerId: r.ownerId,
    orgId: r.orgId,
    name: r.name,
    description: r.description,
    maxPoints: r.maxPoints,
    status: r.status,
    criteria: (r.criteria ?? []).map(mapCriterion),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

function isOwner(ctx: AuthContext, r: { ownerId: string }): boolean {
  return ctx.isSuperadmin || r.ownerId === ctx.userId;
}

// ---------------------------------------------------------------------------
// createRubric
// ---------------------------------------------------------------------------

export async function createRubric(
  ctx: AuthContext,
  input: CreateRubricBody,
): Promise<RubricDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.RUBRIC_MANAGE)) {
    throw forbidden("No permission to manage rubrics");
  }
  if (input.orgId) {
    if (!isOrgMember(ctx, input.orgId) && !ctx.isSuperadmin) {
      throw forbidden("You are not a member of this organization");
    }
    if (!ctx.isSuperadmin && !canInOrg(ctx, input.orgId, OrgPermission.ORG_QUESTION_MANAGE)) {
      throw forbidden("No org permission to manage rubrics");
    }
  }

  // Validate that criterion points sum to <= maxPoints.
  const totalCriterionPoints = input.criteria.reduce(
    (sum, c) => sum + c.maxPoints,
    0,
  );
  if (totalCriterionPoints > input.maxPoints) {
    throw badRequest(
      `Criteria total points (${totalCriterionPoints}) exceed rubric maxPoints (${input.maxPoints})`,
    );
  }

  const created = await repo.createRubric({
    ownerId: ctx.userId,
    orgId: input.orgId,
    name: input.name,
    description: input.description,
    maxPoints: input.maxPoints,
  });

  // Persist criteria in a single replace call.
  await repo.replaceCriteria(
    created.id,
    input.criteria.map((c, i) => ({
      rubricId: created.id,
      name: c.name,
      description: c.description ?? undefined,
      maxPoints: c.maxPoints,
      levels: JSON.stringify(c.levels),
      order: c.order ?? i,
    })),
  );

  const withCriteria = await repo.findRubricById(created.id);

  eventBus.publish(
    buildEvent<RubricCreatedEvent>({
      type: RUBRIC_CREATED,
      actorId: ctx.userId,
      rubricId: created.id,
      ownerId: created.ownerId,
      name: created.name,
    }),
  );

  log.info("rubric.created", { rubricId: created.id });

  return mapRubric(withCriteria);
}

// ---------------------------------------------------------------------------
// getRubric
// ---------------------------------------------------------------------------

export async function getRubric(
  ctx: AuthContext,
  id: string,
): Promise<RubricDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const rubric = await repo.findRubricById(id);
  if (!rubric) throw notFound("Rubric not found");
  if (!isOwner(ctx, rubric) && !(rubric.orgId && isOrgMember(ctx, rubric.orgId))) {
    throw forbidden("You do not have access to this rubric");
  }
  return mapRubric(rubric);
}

// ---------------------------------------------------------------------------
// listMyRubrics
// ---------------------------------------------------------------------------

export async function listMyRubrics(ctx: AuthContext): Promise<RubricDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const rubrics = await repo.findRubricsByOwner(ctx.userId);
  return rubrics.map(mapRubric);
}

// ---------------------------------------------------------------------------
// updateRubric
// ---------------------------------------------------------------------------

export async function updateRubric(
  ctx: AuthContext,
  id: string,
  input: UpdateRubricBody,
): Promise<RubricDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findRubricById(id);
  if (!existing) throw notFound("Rubric not found");
  if (!isOwner(ctx, existing)) {
    throw forbidden("Only the owner can update this rubric");
  }

  const maxPoints = input.maxPoints ?? existing.maxPoints;
  if (input.criteria) {
    const totalCriterionPoints = input.criteria.reduce(
      (sum, c) => sum + c.maxPoints,
      0,
    );
    if (totalCriterionPoints > maxPoints) {
      throw badRequest(
        `Criteria total points (${totalCriterionPoints}) exceed rubric maxPoints (${maxPoints})`,
      );
    }
  }

  await repo.updateRubric(id, {
    name: input.name,
    description: input.description,
    maxPoints: input.maxPoints,
  });

  if (input.criteria) {
    await repo.replaceCriteria(
      id,
      input.criteria.map((c, i) => ({
        rubricId: id,
        name: c.name,
        description: c.description ?? undefined,
        maxPoints: c.maxPoints,
        levels: JSON.stringify(c.levels),
        order: c.order ?? i,
      })),
    );
  }

  const updated = await repo.findRubricById(id);

  eventBus.publish(
    buildEvent<RubricUpdatedEvent>({
      type: RUBRIC_UPDATED,
      actorId: ctx.userId,
      rubricId: id,
    }),
  );

  return mapRubric(updated);
}

// ---------------------------------------------------------------------------
// archiveRubric
// ---------------------------------------------------------------------------

export async function archiveRubric(
  ctx: AuthContext,
  id: string,
): Promise<{ rubricId: string; status: string }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findRubricById(id);
  if (!existing) throw notFound("Rubric not found");
  if (!isOwner(ctx, existing)) {
    throw forbidden("Only the owner can archive this rubric");
  }
  await repo.archiveRubric(id);
  return { rubricId: id, status: "archived" };
}

// ---------------------------------------------------------------------------
// duplicateRubric
// ---------------------------------------------------------------------------

export async function duplicateRubric(
  ctx: AuthContext,
  id: string,
): Promise<RubricDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.RUBRIC_MANAGE)) {
    throw forbidden("No permission to manage rubrics");
  }
  const source = await repo.findRubricById(id);
  if (!source) throw notFound("Source rubric not found");

  const created = await repo.createRubric({
    ownerId: ctx.userId,
    name: `${source.name} (Copy)`,
    description: source.description ?? undefined,
    maxPoints: source.maxPoints,
  });

  // Copy criteria verbatim.
  if (source.criteria.length > 0) {
    await repo.replaceCriteria(
      created.id,
      source.criteria.map((c, i) => ({
        rubricId: created.id,
        name: c.name,
        description: c.description ?? undefined,
        maxPoints: c.maxPoints,
        levels: c.levels,
        order: c.order ?? i,
      })),
    );
  }

  const withCriteria = await repo.findRubricById(created.id);

  eventBus.publish(
    buildEvent<RubricDuplicatedEvent>({
      type: RUBRIC_DUPLICATED,
      actorId: ctx.userId,
      rubricId: created.id,
      originalRubricId: source.id,
    }),
  );

  return mapRubric(withCriteria);
}

// ---------------------------------------------------------------------------
// assignRubricToAssessment
// ---------------------------------------------------------------------------

/**
 * Attach a rubric to an assessment. The caller must own both the rubric and
 * the assessment (or be a superadmin). Returns the assessment id on success.
 *
 * We import the assessment repository lazily to avoid a circular import:
 * the assessment service doesn't import rubric at module-load time, but
 * this function imports the assessment repository.
 */
export async function assignRubricToAssessment(
  ctx: AuthContext,
  rubricId: string,
  input: AssignRubricBody,
): Promise<{ rubricId: string; assessmentId: string }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const rubric = await repo.findRubricById(rubricId);
  if (!rubric) throw notFound("Rubric not found");
  if (!isOwner(ctx, rubric)) {
    throw forbidden("Only the rubric owner can assign it");
  }

  // Verify the caller owns the assessment too.
  const { db } = await import("@/lib/db");
  const assessment = await db.assessment.findUnique({
    where: { id: input.assessmentId },
    select: { id: true, ownerId: true },
  });
  if (!assessment) throw notFound("Assessment not found");
  if (!ctx.isSuperadmin && assessment.ownerId !== ctx.userId) {
    throw forbidden("Only the assessment owner can assign a rubric to it");
  }

  await db.assessment.update({
    where: { id: assessment.id },
    data: { rubricId: rubric.id },
  });

  log.info("rubric.assigned", { rubricId: rubric.id, assessmentId: assessment.id });
  return { rubricId: rubric.id, assessmentId: assessment.id };
}
