/**
 * EduBek — Simulation Engine.
 *
 * Phase 4F.6: Dry-run execution — predicts the impact of a policy
 * change WITHOUT modifying any data.
 *
 * Example scenarios:
 *   • "make_subject_mandatory" — What if Algebra becomes mandatory?
 *   • "add_curriculum_framework" — What if we adopt Cambridge curriculum?
 *   • "reduce_class_size" — What if class sizes drop to 20?
 *
 * For each scenario, the engine estimates:
 *   • Curriculum changes (number of standards affected)
 *   • Affected teachers / students / classrooms / resources / frameworks
 *   • New resources needed
 *   • Estimated AI credits required
 *   • Estimated workload hours
 *   • Predicted mastery change
 *   • Predicted dropout change
 *
 * Output is persisted to SimulationResult for audit + comparison.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { storeMemory } from "./memory";
import type {
  SimulationAffected,
  SimulationCosts,
  SimulationInput,
  SimulationPredictions,
  SimulationResultDto,
} from "./types";

const log = getLogger("simulation-engine");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function simulate(input: SimulationInput): Promise<SimulationResultDto> {
  const start = Date.now();
  log.info("simulation.started", { scenario: input.scenario, params: input.params });

  let predictions: SimulationPredictions;
  let affected: SimulationAffected;
  let estimatedCosts: SimulationCosts;
  let summary: string;

  switch (input.scenario) {
    case "make_subject_mandatory":
      ({ predictions, affected, estimatedCosts, summary } = await simulateMakeSubjectMandatory(input));
      break;
    case "add_curriculum_framework":
      ({ predictions, affected, estimatedCosts, summary } = await simulateAddCurriculumFramework(input));
      break;
    case "reduce_class_size":
      ({ predictions, affected, estimatedCosts, summary } = await simulateReduceClassSize(input));
      break;
    case "introduce_ai_tutoring":
      ({ predictions, affected, estimatedCosts, summary } = await simulateIntroduceAiTutoring(input));
      break;
    default:
      // Generic fallback simulation
      ({ predictions, affected, estimatedCosts, summary } = await simulateGeneric(input));
  }

  const confidence = computeSimulationConfidence(affected, predictions);

  // Persist the simulation result
  const row = await repo.createSimulationResult({
    scenario: input.scenario,
    input: JSON.stringify(input.params),
    predictions: JSON.stringify(predictions),
    affected: JSON.stringify(affected),
    estimatedCosts: JSON.stringify(estimatedCosts),
    summary,
    confidence,
  });

  // Store memory
  await storeMemory({
    scopeType: "system",
    scopeId: "simulation-engine",
    type: "action",
    summary: `Simulation: ${input.scenario} (confidence ${confidence.toFixed(2)})`,
    payload: { scenario: input.scenario, predictions, affected, estimatedCosts },
    importance: 0.6,
  });

  const executionMs = Date.now() - start;
  log.info("simulation.completed", { scenario: input.scenario, executionMs, confidence });

  return {
    id: row.id,
    scenario: input.scenario,
    input: input.params,
    predictions,
    affected,
    estimatedCosts,
    summary,
    confidence,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getSimulation(id: string): Promise<SimulationResultDto | null> {
  const row = await repo.findSimulationResult(id);
  return row ? mapSimulation(row) : null;
}

export async function listSimulations(input: { scenario?: string; limit?: number }): Promise<SimulationResultDto[]> {
  const rows = await repo.findSimulationResults(input);
  return rows.map(mapSimulation);
}

// ---------------------------------------------------------------------------
// Scenario simulators
// ---------------------------------------------------------------------------

async function simulateMakeSubjectMandatory(input: SimulationInput): Promise<{
  predictions: SimulationPredictions;
  affected: SimulationAffected;
  estimatedCosts: SimulationCosts;
  summary: string;
}> {
  const subject = (input.params.subject as string) ?? "algebra";
  const grade = (input.params.grade as string) ?? "8";

  // Find all classrooms + students + teachers that would be affected
  const resources = await db.resource.findMany({
    where: { subject, status: "ready" },
    select: { id: true, ownerId: true },
  }).catch(() => []);
  const classrooms = await db.classroom.findMany({
    where: { status: "active" },
    select: { id: true, teacherId: true, students: { where: { status: "active" }, select: { studentId: true } } },
  }).catch(() => []);
  const allStudentIds = new Set<string>();
  const allTeacherIds = new Set<string>();
  for (const c of classrooms) {
    allTeacherIds.add(c.teacherId);
    for (const s of c.students) allStudentIds.add(s.studentId);
  }

  // Find curriculum standards for this subject
  const standards = await db.curriculumStandard.findMany({
    where: { subject, grade },
    select: { id: true },
  }).catch(() => []);

  const predictions: SimulationPredictions = {
    curriculumChanges: standards.length,
    affectedTeachers: allTeacherIds.size,
    affectedStudents: allStudentIds.size,
    newResourcesNeeded: Math.max(0, standards.length - resources.length),
    estimatedAiCredits: Math.max(0, standards.length - resources.length) * 10,
    estimatedWorkloadHours: allTeacherIds.size * 5, // 5 hours per teacher
    predictedMasteryChange: 8, // +8% from mandatory coverage
    predictedDropoutChange: -2, // -2% dropout from better support
  };

  const affected: SimulationAffected = {
    teachers: Array.from(allTeacherIds),
    students: Array.from(allStudentIds),
    classrooms: classrooms.map((c) => c.id),
    resources: resources.map((r) => r.id),
    frameworks: [],
  };

  const estimatedCosts: SimulationCosts = {
    aiCredits: predictions.estimatedAiCredits,
    workloadHours: predictions.estimatedWorkloadHours,
    rolloutMinutes: Math.max(60, predictions.newResourcesNeeded * 15),
  };

  const summary = `Making ${subject} mandatory for grade ${grade} would affect ${allTeacherIds.size} teachers and ${allStudentIds.size} students across ${classrooms.length} classrooms. ${predictions.newResourcesNeeded} new resources would need to be generated (${predictions.estimatedAiCredits} AI credits). Predicted impact: +${predictions.predictedMasteryChange}% mastery, ${predictions.predictedDropoutChange}% dropout change. Total estimated cost: ${estimatedCosts.workloadHours} teacher-hours + ${estimatedCosts.aiCredits} AI credits. Rollout time: ~${estimatedCosts.rolloutMinutes} minutes.`;

  return { predictions, affected, estimatedCosts, summary };
}

async function simulateAddCurriculumFramework(input: SimulationInput): Promise<{
  predictions: SimulationPredictions;
  affected: SimulationAffected;
  estimatedCosts: SimulationCosts;
  summary: string;
}> {
  const frameworkCode = (input.params.framework as string) ?? "cambridge";
  const organizationId = input.params.organizationId as string | undefined;

  const students = organizationId
    ? await db.organizationMembership.count({ where: { orgId: organizationId } }).catch(() => 0)
    : await db.user.count().catch(() => 0);
  const teachers = organizationId
    ? await db.classroom.count({ where: { orgId: organizationId } }).catch(() => 0)
    : await db.classroom.count().catch(() => 0);

  const predictions: SimulationPredictions = {
    curriculumChanges: 100, // avg framework has ~100 standards
    affectedTeachers: teachers,
    affectedStudents: students,
    newResourcesNeeded: 50, // half the standards need new resources
    estimatedAiCredits: 500,
    estimatedWorkloadHours: teachers * 10,
    predictedMasteryChange: 5,
    predictedDropoutChange: 0,
  };

  const affected: SimulationAffected = {
    teachers: [],
    students: [],
    classrooms: [],
    resources: [],
    frameworks: [frameworkCode],
  };

  const estimatedCosts: SimulationCosts = {
    aiCredits: 500,
    workloadHours: teachers * 10,
    rolloutMinutes: 480, // 8 hours
  };

  const summary = `Adopting ${frameworkCode} curriculum framework would require mapping ${predictions.curriculumChanges} standards to existing resources, generating ${predictions.newResourcesNeeded} new resources, and affecting ${teachers} teachers + ${students} students. Estimated cost: ${estimatedCosts.workloadHours} hours + ${estimatedCosts.aiCredits} AI credits.`;

  return { predictions, affected, estimatedCosts, summary };
}

async function simulateReduceClassSize(input: SimulationInput): Promise<{
  predictions: SimulationPredictions;
  affected: SimulationAffected;
  estimatedCosts: SimulationCosts;
  summary: string;
}> {
  const targetSize = (input.params.targetSize as number) ?? 20;
  const classrooms = await db.classroom.findMany({
    where: { status: "active" },
    select: { id: true, teacherId: true, students: { where: { status: "active" }, select: { studentId: true } } },
  }).catch(() => []);

  const oversized = classrooms.filter((c) => c.students.length > targetSize);
  const affectedStudents = oversized.reduce((s, c) => s + c.students.length, 0);

  const predictions: SimulationPredictions = {
    curriculumChanges: 0,
    affectedTeachers: oversized.length,
    affectedStudents,
    newResourcesNeeded: 0,
    estimatedAiCredits: 0,
    estimatedWorkloadHours: oversized.length * 2,
    predictedMasteryChange: 12, // smaller classes improve mastery
    predictedDropoutChange: -5,
  };

  const affected: SimulationAffected = {
    teachers: oversized.map((c) => c.teacherId),
    students: oversized.flatMap((c) => c.students.map((s) => s.studentId)),
    classrooms: oversized.map((c) => c.id),
    resources: [],
    frameworks: [],
  };

  const estimatedCosts: SimulationCosts = {
    aiCredits: 0,
    workloadHours: oversized.length * 2,
    rolloutMinutes: oversized.length * 30,
  };

  const summary = `Reducing class size to ${targetSize} would affect ${oversized.length} oversized classrooms containing ${affectedStudents} students. Predicted impact: +${predictions.predictedMasteryChange}% mastery, ${predictions.predictedDropoutChange}% dropout change. Workload: ${estimatedCosts.workloadHours} hours for reassignment.`;

  return { predictions, affected, estimatedCosts, summary };
}

async function simulateIntroduceAiTutoring(input: SimulationInput): Promise<{
  predictions: SimulationPredictions;
  affected: SimulationAffected;
  estimatedCosts: SimulationCosts;
  summary: string;
}> {
  const organizationId = input.params.organizationId as string | undefined;
  const studentCount = organizationId
    ? await db.organizationMembership.count({ where: { orgId: organizationId } }).catch(() => 0)
    : await db.user.count().catch(() => 0);

  const predictions: SimulationPredictions = {
    curriculumChanges: 0,
    affectedTeachers: 0,
    affectedStudents: studentCount,
    newResourcesNeeded: 0,
    estimatedAiCredits: studentCount * 50, // 50 credits per student per month
    estimatedWorkloadHours: 0,
    predictedMasteryChange: 15,
    predictedDropoutChange: -8,
  };

  const affected: SimulationAffected = {
    teachers: [],
    students: [],
    classrooms: [],
    resources: [],
    frameworks: [],
  };

  const estimatedCosts: SimulationCosts = {
    aiCredits: predictions.estimatedAiCredits,
    workloadHours: 0,
    rolloutMinutes: 60,
  };

  const summary = `Introducing AI tutoring for ${studentCount} students would cost ${predictions.estimatedAiCredits} AI credits per month. Predicted impact: +${predictions.predictedMasteryChange}% mastery, ${predictions.predictedDropoutChange}% dropout change. Rollout time: ~1 hour (no teacher workload).`;

  return { predictions, affected, estimatedCosts, summary };
}

async function simulateGeneric(input: SimulationInput): Promise<{
  predictions: SimulationPredictions;
  affected: SimulationAffected;
  estimatedCosts: SimulationCosts;
  summary: string;
}> {
  const predictions: SimulationPredictions = {
    curriculumChanges: 0,
    affectedTeachers: 0,
    affectedStudents: 0,
    newResourcesNeeded: 0,
    estimatedAiCredits: 0,
    estimatedWorkloadHours: 0,
    predictedMasteryChange: 0,
    predictedDropoutChange: 0,
  };
  const affected: SimulationAffected = { teachers: [], students: [], classrooms: [], resources: [], frameworks: [] };
  const estimatedCosts: SimulationCosts = { aiCredits: 0, workloadHours: 0, rolloutMinutes: 0 };
  const summary = `Simulation for scenario "${input.scenario}" produced no specific predictions. Add a dedicated simulator for this scenario.`;
  return { predictions, affected, estimatedCosts, summary };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeSimulationConfidence(affected: SimulationAffected, predictions: SimulationPredictions): number {
  // Confidence is higher when we have more data to back the prediction
  const dataPoints =
    affected.teachers.length +
    affected.students.length +
    affected.classrooms.length +
    affected.resources.length;
  if (dataPoints === 0) return 0.3;
  if (dataPoints < 10) return 0.5;
  if (dataPoints < 100) return 0.7;
  return 0.85;
}

function mapSimulation(row: any): SimulationResultDto {
  return {
    id: row.id,
    scenario: row.scenario,
    input: safeParseRecord(row.input),
    predictions: safeParseRecord(row.predictions),
    affected: safeParseRecord(row.affected),
    estimatedCosts: safeParseRecord(row.estimatedCosts),
    summary: row.summary ?? "",
    confidence: row.confidence,
    createdAt: row.createdAt.toISOString(),
  };
}

function safeParseRecord(raw: string | null): any {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
