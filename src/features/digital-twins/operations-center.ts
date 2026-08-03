/**
 * EduBek — Autonomous Academic Operations Center.
 *
 * Phase 5A.1: A dashboard where AI continuously reports:
 *   • Today's priorities
 *   • Classrooms needing attention
 *   • Students at risk
 *   • Curriculum delays
 *   • Missing assessments
 *   • Overloaded teachers
 *   • Optimization opportunities
 *   • Recommended actions
 *
 * The operations center generates daily AcademicOperation entries
 * by querying all existing systems + twins.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { computeClassInsight } from "@/features/collaboration";
import { computeKnowledgeHealth } from "@/features/knowledge-intelligence";
import { detectBurnout } from "@/features/learning-planner";
import type { AcademicOperationDto, OperationsCenterDto } from "./types";

const log = getLogger("operations-center");

// ---------------------------------------------------------------------------
// Main entry point: generate today's operations
// ---------------------------------------------------------------------------

export async function generateOperations(input: {
  organizationId?: string;
}): Promise<OperationsCenterDto> {
  const start = Date.now();
  const { organizationId } = input;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  log.info("operations.generating", { organizationId, day: today.toISOString() });

  // Clear previous open operations for today (regenerate)
  if (organizationId) {
    await repo.deleteAcademicOperations(organizationId, today).catch(() => undefined);
  }

  const operations: AcademicOperationDto[] = [];

  // 1. Classrooms needing attention — low engagement or mastery
  const classrooms = await db.classroom.findMany({
    where: { status: "active", ...(organizationId ? { orgId: organizationId } : {}) },
    select: { id: true, name: true, teacherId: true },
  }).catch(() => []);

  for (const classroom of classrooms.slice(0, 20)) {
    const insight = await computeClassInsight(classroom.id).catch(() => null);
    if (!insight) continue;

    if (insight.engagementRate < 0.5) {
      operations.push(await createOperation({
        organizationId,
        day: today,
        priority: 2,
        type: "classroom_needs_attention",
        title: `Low engagement in ${classroom.name}`,
        description: `Classroom ${classroom.name} has an engagement rate of ${Math.round(insight.engagementRate * 100)}%. Consider sending a motivational announcement or scheduling a live session.`,
        entityType: "classroom",
        entityId: classroom.id,
        reasoning: {
          reasoning: `Engagement rate ${Math.round(insight.engagementRate * 100)}% is below the 50% threshold.`,
          confidence: 0.85,
          affectedModules: ["collaboration", "learning-planner"],
          suggestedActions: ["Send motivational announcement", "Schedule a live session", "Review recent assignments for difficulty"],
        },
        confidence: 0.85,
      }));
    }

    if (insight.atRiskStudents.length > 0) {
      for (const atRisk of insight.atRiskStudents.slice(0, 3)) {
        operations.push(await createOperation({
          organizationId,
          day: today,
          priority: 1,
          type: "student_at_risk",
          title: `Student at risk in ${classroom.name}`,
          description: `Student ${atRisk.userId} has a risk score of ${Math.round(atRisk.riskScore * 100)}%. Reason: ${atRisk.reason}.`,
          entityType: "user",
          entityId: atRisk.userId,
          reasoning: {
            reasoning: atRisk.reason,
            confidence: atRisk.riskScore,
            affectedModules: ["collaboration", "learning-planner", "knowledge-intelligence"],
            suggestedActions: ["Generate intervention", "Schedule 1-on-1 session", "Notify teacher"],
          },
          confidence: atRisk.riskScore,
        }));
      }
    }

    if (insight.assignmentCompletionRate < 0.5) {
      operations.push(await createOperation({
        organizationId,
        day: today,
        priority: 2,
        type: "missing_assessment",
        title: `Low assignment completion in ${classroom.name}`,
        description: `Only ${Math.round(insight.assignmentCompletionRate * 100)}% of assignments are being completed in ${classroom.name}.`,
        entityType: "classroom",
        entityId: classroom.id,
        reasoning: {
          reasoning: `Assignment completion rate ${Math.round(insight.assignmentCompletionRate * 100)}% is below 50%.`,
          confidence: 0.8,
          affectedModules: ["collaboration", "assessment"],
          suggestedActions: ["Extend deadlines", "Send reminders", "Review assignment difficulty"],
        },
        confidence: 0.8,
      }));
    }
  }

  // 2. Curriculum delays — low coverage
  if (organizationId) {
    const health = await computeKnowledgeHealth(organizationId).catch(() => null);
    if (health && health.coverageScore < 0.5) {
      operations.push(await createOperation({
        organizationId,
        day: today,
        priority: 2,
        type: "curriculum_delay",
        title: "Curriculum coverage below 50%",
        description: `Organization curriculum coverage is ${Math.round(health.coverageScore * 100)}%. Multiple standards have no mapped resources.`,
        entityType: "organization",
        entityId: organizationId,
        reasoning: {
          reasoning: `Coverage score ${Math.round(health.coverageScore * 100)}% indicates significant curriculum gaps.`,
          confidence: 0.9,
          affectedModules: ["knowledge-intelligence"],
          suggestedActions: ["Generate resources for uncovered standards", "Review curriculum alignment", "Notify department heads"],
        },
        confidence: 0.9,
      }));
    }
  }

  // 3. Overloaded teachers — high workload
  const teachers = await db.classroom.findMany({
    where: { status: "active", ...(organizationId ? { orgId: organizationId } : {}) },
    select: { teacherId: true },
    distinct: ["teacherId"],
  }).catch(() => []);

  for (const { teacherId } of teachers.slice(0, 20)) {
    const classroomCount = await db.classroom.count({
      where: { teacherId, status: "active" },
    }).catch(() => 0);
    const pendingSubmissions = await db.assignmentAttempt.count({
      where: { assignment: { classroom: { teacherId } }, status: "submitted" },
    }).catch(() => 0);

    if (classroomCount >= 5 || pendingSubmissions >= 20) {
      operations.push(await createOperation({
        organizationId,
        day: today,
        priority: 3,
        type: "overloaded_teacher",
        title: `Teacher ${teacherId} is overloaded`,
        description: `Teacher has ${classroomCount} classrooms and ${pendingSubmissions} pending submissions to grade.`,
        entityType: "user",
        entityId: teacherId,
        reasoning: {
          reasoning: `${classroomCount} classrooms + ${pendingSubmissions} pending submissions indicate high workload.`,
          confidence: 0.75,
          affectedModules: ["collaboration", "learning-planner"],
          suggestedActions: ["Redistribute classrooms", "Use AI-assisted grading", "Notify administration"],
        },
        confidence: 0.75,
      }));
    }
  }

  // 4. Optimization opportunities
  operations.push(await createOperation({
    organizationId,
    day: today,
    priority: 4,
    type: "optimization_opportunity",
    title: "Run platform optimization",
    description: "The platform intelligence engine has identified optimization opportunities for cache TTL, ranking weights, and recommendation weights.",
    entityType: "system",
    entityId: "platform-intelligence",
    reasoning: {
      reasoning: "Periodic optimization improves platform performance based on observed behavior.",
      confidence: 0.7,
      affectedModules: ["platform-intelligence"],
      suggestedActions: ["Run optimization cycle", "Review auto-applied changes", "Monitor for regressions"],
    },
    confidence: 0.7,
  }));

  // 5. Recommended action — sync all twins
  operations.push(await createOperation({
    organizationId,
    day: today,
    priority: 5,
    type: "recommended_action",
    title: "Sync all digital twins",
    description: "Run a full twin sync to ensure all classroom, student, teacher, and institution twins are up to date.",
    entityType: "system",
    entityId: "digital-twins",
    reasoning: {
      reasoning: "Daily twin sync keeps the digital twin platform accurate for scenario planning + operations.",
      confidence: 0.8,
      affectedModules: ["digital-twins"],
      suggestedActions: ["Sync classroom twins", "Sync student twins", "Sync teacher twins", "Sync institution twin"],
    },
    confidence: 0.8,
  }));

  // Build summary
  const openOps = operations.filter((o) => o.status === "open");
  const summary = {
    totalOpen: openOps.length,
    critical: openOps.filter((o) => o.priority === 1).length,
    highPriority: openOps.filter((o) => o.priority <= 2).length,
    classroomsNeedingAttention: openOps.filter((o) => o.type === "classroom_needs_attention").length,
    studentsAtRisk: openOps.filter((o) => o.type === "student_at_risk").length,
    overloadedTeachers: openOps.filter((o) => o.type === "overloaded_teacher").length,
    curriculumDelays: openOps.filter((o) => o.type === "curriculum_delay").length,
  };

  const executionMs = Date.now() - start;
  log.info("operations.generated", {
    organizationId,
    totalOperations: operations.length,
    executionMs,
  });

  return {
    organizationId: organizationId ?? null,
    day: today.toISOString(),
    operations,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

export async function getOperations(input: {
  organizationId?: string;
  day?: Date;
  status?: string;
  limit?: number;
}): Promise<AcademicOperationDto[]> {
  const rows = await repo.findAcademicOperations({
    organizationId: input.organizationId,
    day: input.day,
    status: input.status,
    limit: input.limit,
  });
  return rows.map(mapOperation);
}

export async function acknowledgeOperation(id: string): Promise<void> {
  await repo.updateAcademicOperation(id, {
    status: "acknowledged",
    acknowledgedAt: new Date(),
  });
}

export async function resolveOperation(id: string): Promise<void> {
  await repo.updateAcademicOperation(id, {
    status: "resolved",
    resolvedAt: new Date(),
  });
}

export async function dismissOperation(id: string): Promise<void> {
  await repo.updateAcademicOperation(id, {
    status: "dismissed",
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createOperation(input: {
  organizationId?: string;
  day: Date;
  priority: number;
  type: string;
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
  reasoning: Record<string, unknown>;
  confidence: number;
}): Promise<AcademicOperationDto> {
  const row = await repo.createAcademicOperation({
    organizationId: input.organizationId,
    day: input.day,
    priority: input.priority,
    type: input.type,
    title: input.title,
    description: input.description,
    entityType: input.entityType,
    entityId: input.entityId,
    reasoning: JSON.stringify(input.reasoning),
    confidence: input.confidence,
  });
  return mapOperation(row);
}

function mapOperation(row: any): AcademicOperationDto {
  return {
    id: row.id,
    organizationId: row.organizationId,
    day: row.day.toISOString(),
    priority: row.priority,
    type: row.type,
    title: row.title,
    description: row.description,
    entityType: row.entityType,
    entityId: row.entityId,
    reasoning: safeParseRecord(row.reasoning),
    confidence: row.confidence,
    status: row.status,
    acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function safeParseRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
