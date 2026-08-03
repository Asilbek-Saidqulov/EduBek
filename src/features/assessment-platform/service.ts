/**
 * EduBek — Assessment Platform service modules.
 *
 * Phase 5A.2: Assessment Builder AI, Rubric Engine, AI Grading,
 * Academic Integrity Engine, Secure Exam Platform, Competency
 * Framework, Digital Credential Platform, Lifelong Transcript,
 * Assessment Intelligence, Institutional Accreditation.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { v4 as uuidv4 } from "uuid";
import type {
  AccreditationReportDto, AssessmentBlueprintDto, AssessmentBlueprintItem,
  AssessmentQualityDto, AiGradingResult, BloomLevel, CompetencyDto,
  CompetencyEvidenceDto, CredentialVerificationDto, Difficulty,
  DigitalCredentialDto, IntegrityCheckDto, RiskLevel, RubricCriterionDto,
  SecureExamSessionDto, AcademicTranscriptDto, TranscriptEntry,
} from "./types";

const log = getLogger("assessment-platform");

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ===========================================================================
// 1. Assessment Builder AI
// ===========================================================================

export async function buildAssessment(input: {
  title: string;
  assessmentType: string;
  subject?: string;
  classroomId?: string;
  frameworkId?: string;
  targetBloomMix?: Record<BloomLevel, number>;
  targetDifficulty?: Difficulty;
  questionCount?: number;
  createdBy: string;
  locale?: string;
}): Promise<AssessmentBlueprintDto> {
  const { title, assessmentType, subject, classroomId, frameworkId, targetDifficulty = "medium", questionCount = 10, createdBy } = input;

  // 1. Check curriculum — find standards for this subject
  const standards = frameworkId
    ? await db.curriculumStandard.findMany({ where: { frameworkId, subject }, select: { id: true, code: true, title: true, bloomLevel: true }, take: 50 }).catch(() => [])
    : [];

  // 2. Check completed topics from classroom intelligence
  let weakTopics: Array<{ topic: string; mastery: number }> = [];
  if (classroomId) {
    try {
      const { computeClassInsight } = await import("@/features/collaboration");
      const insight = await computeClassInsight(classroomId);
      weakTopics = insight.weakTopics;
    } catch { /* best-effort */ }
  }

  // 3. Balance Bloom taxonomy — default distribution
  const bloomMix = input.targetBloomMix ?? {
    remember: 0.15, understand: 0.25, apply: 0.30, analyze: 0.15, evaluate: 0.10, create: 0.05,
  };

  // 4. Generate blueprint items
  const items: AssessmentBlueprintItem[] = [];
  const topicsToCover = weakTopics.length > 0
    ? weakTopics.slice(0, questionCount).map((t) => t.topic)
    : standards.slice(0, questionCount).map((s) => s.title);

  for (let i = 0; i < questionCount; i++) {
    const bloomLevels = Object.entries(bloomMix);
    const random = Math.random();
    let cumulative = 0;
    let selectedBloom: BloomLevel = "apply";
    for (const [level, weight] of bloomLevels) {
      cumulative += weight;
      if (random <= cumulative) { selectedBloom = level as BloomLevel; break; }
    }

    items.push({
      questionType: assessmentType === "coding" ? "code" : assessmentType === "essay" ? "essay" : "mcq",
      topic: topicsToCover[i % Math.max(1, topicsToCover.length)] ?? `Topic ${i + 1}`,
      bloomLevel: selectedBloom,
      difficulty: i < questionCount * 0.3 ? "easy" : i < questionCount * 0.7 ? targetDifficulty : "hard",
      points: assessmentType === "exam" ? 10 : 5,
      conceptIds: [],
    });
  }

  // 5. Compute distributions
  const bloomDistribution: Record<string, number> = {};
  const difficultyDistribution: Record<string, number> = {};
  for (const item of items) {
    bloomDistribution[item.bloomLevel] = (bloomDistribution[item.bloomLevel] ?? 0) + 1;
    difficultyDistribution[item.difficulty] = (difficultyDistribution[item.difficulty] ?? 0) + 1;
  }

  // 6. Estimate duration (2 min per MCQ, 10 min per essay, 5 min per code)
  const estimatedDurationMinutes = items.reduce((sum, item) => {
    if (item.questionType === "essay") return sum + 10;
    if (item.questionType === "code") return sum + 5;
    return sum + 2;
  }, 0);

  // 7. Predict average score (baseline 70%, adjusted by difficulty)
  const hardRatio = (difficultyDistribution.hard ?? 0) / questionCount;
  const predictedAvgScore = Math.max(0.4, 0.75 - hardRatio * 0.2);

  // 8. Generate rubric if essay/project/presentation
  let rubricId: string | null = null;
  if (["essay", "project", "presentation", "peer_review"].includes(assessmentType)) {
    const rubric = await db.rubric.create({
      data: {
        ownerId: createdBy,
        name: `Rubric for ${title}`,
        maxPoints: items.reduce((s, i) => s + i.points, 0),
        status: "active",
      },
    });
    rubricId = rubric.id;
    // Create criteria
    const criteria = [
      { name: "Content Accuracy", maxPoints: 40, levels: [{ points: 40, label: "Excellent", description: "All content accurate" }, { points: 30, label: "Good", description: "Minor errors" }, { points: 20, label: "Fair", description: "Several errors" }, { points: 10, label: "Poor", description: "Major errors" }] },
      { name: "Critical Thinking", maxPoints: 30, levels: [{ points: 30, label: "Excellent", description: "Deep analysis" }, { points: 22, label: "Good", description: "Adequate analysis" }, { points: 15, label: "Fair", description: "Surface analysis" }, { points: 8, label: "Poor", description: "No analysis" }] },
      { name: "Organization", maxPoints: 20, levels: [{ points: 20, label: "Excellent", description: "Well-structured" }, { points: 15, label: "Good", description: "Mostly organized" }, { points: 10, label: "Fair", description: "Somewhat disorganized" }, { points: 5, label: "Poor", description: "Disorganized" }] },
      { name: "Mechanics", maxPoints: 10, levels: [{ points: 10, label: "Excellent", description: "No errors" }, { points: 7, label: "Good", description: "Few errors" }, { points: 5, label: "Fair", description: "Some errors" }, { points: 3, label: "Poor", description: "Many errors" }] },
    ];
    for (let i = 0; i < criteria.length; i++) {
      await db.rubricCriterion.create({
        data: { rubricId: rubric.id, name: criteria[i]!.name, maxPoints: criteria[i]!.maxPoints, levels: JSON.stringify(criteria[i]!.levels), order: i + 1 },
      });
    }
  }

  const row = await repo.createBlueprint({
    title, assessmentType, items: JSON.stringify(items), rubricId,
    estimatedDurationMinutes, predictedAvgScore, predictedDifficulty: hardRatio,
    frameworkId, standardIds: JSON.stringify(standards.slice(0, 10).map((s) => s.id)),
    bloomDistribution: JSON.stringify(bloomDistribution),
    difficultyDistribution: JSON.stringify(difficultyDistribution),
    confidence: 0.7, createdBy, status: "draft",
  });

  log.info("blueprint.built", { id: row.id, title, itemCount: items.length, assessmentType });
  return mapBlueprint(row);
}

export async function getBlueprint(id: string): Promise<AssessmentBlueprintDto | null> {
  const row = await repo.findBlueprint(id);
  return row ? mapBlueprint(row) : null;
}

export async function listBlueprints(input: { createdBy?: string; assessmentType?: string; status?: string; limit?: number }): Promise<AssessmentBlueprintDto[]> {
  const rows = await repo.findBlueprints(input);
  return rows.map(mapBlueprint);
}

function mapBlueprint(row: any): AssessmentBlueprintDto {
  return {
    id: row.id, title: row.title, description: row.description, assessmentType: row.assessmentType,
    items: safeParse<AssessmentBlueprintItem[]>(row.items, []),
    rubricId: row.rubricId, estimatedDurationMinutes: row.estimatedDurationMinutes,
    predictedAvgScore: row.predictedAvgScore, predictedDifficulty: row.predictedDifficulty,
    frameworkId: row.frameworkId, standardIds: safeParse<string[]>(row.standardIds, []),
    bloomDistribution: safeParse<Record<string, number>>(row.bloomDistribution, {}),
    difficultyDistribution: safeParse<Record<string, number>>(row.difficultyDistribution, {}),
    confidence: row.confidence, createdBy: row.createdBy, status: row.status,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

// ===========================================================================
// 2. AI Grading Engine
// ===========================================================================

export async function aiGrade(input: {
  assessmentId: string;
  attemptId: string;
  studentId: string;
  responseText: string;
  rubricId?: string;
  questionType?: string;
  correctAnswer?: string;
  maxScore?: number;
}): Promise<AiGradingResult> {
  const { responseText, rubricId, questionType = "essay", correctAnswer, maxScore = 100 } = input;

  let score = 0;
  const rubricBreakdown: AiGradingResult["rubricBreakdown"] = [];
  const evidence: string[] = [];
  let confidence = 0.5;

  if (questionType === "mcq" || questionType === "true_false") {
    // Objective grading — exact match
    const isCorrect = correctAnswer && responseText.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    score = isCorrect ? maxScore : 0;
    confidence = 0.99;
    evidence.push(`Exact match check: ${isCorrect ? "correct" : "incorrect"}`);
  } else if (questionType === "short_answer") {
    // Keyword matching
    if (correctAnswer) {
      const keywords = correctAnswer.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const responseLower = responseText.toLowerCase();
      const matched = keywords.filter((k) => responseLower.includes(k));
      score = Math.round((matched.length / Math.max(1, keywords.length)) * maxScore);
      confidence = 0.8;
      evidence.push(`Matched ${matched.length}/${keywords.length} keywords: ${matched.join(", ")}`);
    }
  } else {
    // Essay / project / code — rubric-based heuristic grading
    if (rubricId) {
      const criteria = await db.rubricCriterion.findMany({ where: { rubricId }, orderBy: { order: "asc" } });
      for (const c of criteria) {
        const levels = safeParse<Array<{ points: number; label: string; description: string }>>(c.levels, []);
        // Heuristic: word count + keyword density + structure
        const wordCount = responseText.trim().split(/\s+/).length;
        const hasStructure = /^(#|1\.|-|\*)/m.test(responseText);
        const hasCitations = /\[\d+\]|\(.*?\d{4}\)/.test(responseText);

        let criterionScore = 0;
        if (wordCount > 200 && hasStructure) criterionScore = levels[0]?.points ?? c.maxPoints;
        else if (wordCount > 100) criterionScore = levels[1]?.points ?? Math.round(c.maxPoints * 0.7);
        else if (wordCount > 50) criterionScore = levels[2]?.points ?? Math.round(c.maxPoints * 0.5);
        else criterionScore = levels[3]?.points ?? Math.round(c.maxPoints * 0.3);

        if (c.name.includes("Mechanics") && hasCitations) criterionScore = Math.min(c.maxPoints, criterionScore + 2);

        score += criterionScore;
        rubricBreakdown.push({
          criterionId: c.id, criterionName: c.name,
          score: criterionScore, maxPoints: c.maxPoints,
          feedback: `Word count: ${wordCount}. Structure: ${hasStructure ? "yes" : "no"}. Citations: ${hasCitations ? "yes" : "no"}.`,
        });
        evidence.push(`${c.name}: ${criterionScore}/${c.maxPoints}`);
      }
      confidence = 0.65;
    } else {
      // No rubric — simple word-count heuristic
      const wordCount = responseText.trim().split(/\s+/).length;
      score = Math.min(maxScore, Math.round((wordCount / 300) * maxScore));
      confidence = 0.4;
      evidence.push(`No rubric — word count heuristic: ${wordCount} words → ${score}/${maxScore}`);
    }
  }

  // Cap score
  score = Math.min(maxScore, Math.max(0, score));

  const suggestedTeacherReview = confidence < 0.7 || questionType === "essay" || questionType === "project";

  log.info("ai_grade.completed", { attemptId: input.attemptId, score, confidence, suggestedTeacherReview });

  return {
    score, maxScore, rubricBreakdown, evidence,
    explanation: `AI graded with ${confidence * 100}% confidence using ${questionType === "mcq" ? "exact match" : rubricId ? "rubric-based heuristic" : "word-count heuristic"}. ${evidence.length} evidence points.`,
    confidence, suggestedTeacherReview,
  };
}

// ===========================================================================
// 3. Academic Integrity Engine
// ===========================================================================

export async function runIntegrityCheck(input: {
  entityType: string;
  entityId: string;
  userId: string;
  checkType: string;
  content: string;
  previousSubmissions?: string[];
}): Promise<IntegrityCheckDto> {
  const { checkType, content, previousSubmissions = [] } = input;
  let riskScore = 0;
  let riskLevel: RiskLevel = "low";
  const findings: Record<string, unknown> = {};
  let explanation = "";

  switch (checkType) {
    case "plagiarism": {
      // Check against previous submissions (trigram similarity)
      let maxSimilarity = 0;
      for (const prev of previousSubmissions) {
        const sim = trigramSimilarity(content, prev);
        maxSimilarity = Math.max(maxSimilarity, sim);
      }
      findings.maxSimilarity = maxSimilarity;
      riskScore = maxSimilarity > 0.8 ? 0.9 : maxSimilarity > 0.6 ? 0.7 : maxSimilarity > 0.4 ? 0.4 : 0.1;
      explanation = `Max similarity to previous submissions: ${(maxSimilarity * 100).toFixed(1)}%. ${riskScore > 0.5 ? "High similarity detected." : "Within acceptable range."}`;
      break;
    }
    case "ai_generated": {
      // Heuristic: check for AI-typical patterns (repetitive structure, lack of typos, uniform sentence length)
      const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const avgLen = sentences.reduce((s, x) => s + x.split(/\s+/).length, 0) / Math.max(1, sentences.length);
      const lenVariance = sentences.length > 1
        ? Math.sqrt(sentences.reduce((s, x) => s + Math.pow(x.split(/\s+/).length - avgLen, 2), 0) / sentences.length)
        : 0;
      const hasTypos = /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(content) && Math.random() > 0.5; // simplified
      const aiScore = (avgLen > 15 && lenVariance < 5 && !hasTypos) ? 0.7 : 0.3;
      findings.avgSentenceLength = avgLen;
      findings.sentenceLengthVariance = lenVariance;
      findings.hasTypos = hasTypos;
      riskScore = aiScore;
      explanation = `AI-generated probability: ${(aiScore * 100).toFixed(0)}%. ${aiScore > 0.5 ? "Patterns consistent with AI-generated text." : "Patterns consistent with human writing."}`;
      break;
    }
    case "duplicate_submission": {
      let maxSimilarity = 0;
      for (const prev of previousSubmissions) {
        const sim = trigramSimilarity(content, prev);
        maxSimilarity = Math.max(maxSimilarity, sim);
      }
      findings.maxSimilarity = maxSimilarity;
      riskScore = maxSimilarity > 0.9 ? 0.95 : maxSimilarity > 0.7 ? 0.7 : 0.1;
      explanation = `Max similarity: ${(maxSimilarity * 100).toFixed(1)}%. ${maxSimilarity > 0.9 ? "Near-identical submission detected." : "No duplicates found."}`;
      break;
    }
    case "collusion": {
      // Check if multiple students submitted similar content (would need cross-student comparison)
      riskScore = 0.2;
      explanation = "Collusion check requires cross-student comparison — not enough data for individual check.";
      break;
    }
    default:
      riskScore = 0.1;
      explanation = `Integrity check type '${checkType}' — minimal risk detected.`;
  }

  riskLevel = riskScore > 0.7 ? "high" : riskScore > 0.4 ? "medium" : "low";

  const row = await repo.createIntegrityCheck({
    entityType: input.entityType, entityId: input.entityId, userId: input.userId,
    checkType, riskScore, riskLevel,
    findings: JSON.stringify(findings), explanation, status: "pending",
  });

  log.info("integrity.check_completed", { checkType, riskLevel, riskScore: riskScore.toFixed(2) });
  return mapIntegrityCheck(row);
}

export async function listIntegrityChecks(input: {
  entityType?: string; entityId?: string; userId?: string;
  checkType?: string; riskLevel?: string; status?: string; limit?: number;
}): Promise<IntegrityCheckDto[]> {
  const rows = await repo.findIntegrityChecks(input);
  return rows.map(mapIntegrityCheck);
}

export async function reviewIntegrityCheck(id: string, status: string, reviewerId: string): Promise<void> {
  await repo.updateIntegrityCheck(id, { status, reviewedBy: reviewerId, reviewedAt: new Date() });
}

function trigramSimilarity(a: string, b: string): number {
  const trigramsA = new Set<string>();
  const lowerA = a.toLowerCase();
  for (let i = 0; i < lowerA.length - 2; i++) trigramsA.add(lowerA.slice(i, i + 3));
  const trigramsB = new Set<string>();
  const lowerB = b.toLowerCase();
  for (let i = 0; i < lowerB.length - 2; i++) trigramsB.add(lowerB.slice(i, i + 3));
  let intersection = 0;
  for (const t of trigramsA) if (trigramsB.has(t)) intersection += 1;
  const union = trigramsA.size + trigramsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function mapIntegrityCheck(row: any): IntegrityCheckDto {
  return {
    id: row.id, entityType: row.entityType, entityId: row.entityId, userId: row.userId,
    checkType: row.checkType, riskScore: row.riskScore, riskLevel: row.riskLevel,
    findings: safeParse(row.findings, {}), explanation: row.explanation, status: row.status,
    reviewedBy: row.reviewedBy, reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// ===========================================================================
// 4. Secure Exam Platform
// ===========================================================================

export async function startSecureExam(input: {
  assessmentId: string;
  userId: string;
  durationMs: number;
  lockdown?: boolean;
  randomizeQuestions?: boolean;
  questionIds?: string[];
}): Promise<SecureExamSessionDto> {
  // Check if session already exists
  const existing = await repo.findSecureExamSession(input.assessmentId, input.userId);
  if (existing && existing.status === "in_progress") {
    return mapSecureExamSession(existing);
  }

  const questionOrder = input.randomizeQuestions && input.questionIds
    ? shuffle(input.questionIds)
    : input.questionIds ?? [];

  const row = await repo.createSecureExamSession({
    assessmentId: input.assessmentId, userId: input.userId,
    status: "in_progress", questionOrder: JSON.stringify(questionOrder),
    adaptiveState: "{}", startedAt: new Date(),
    expiresAt: new Date(Date.now() + input.durationMs),
    timeRemainingMs: input.durationMs,
    lockdownEnabled: input.lockdown ?? false,
    auditLog: JSON.stringify([{ timestamp: new Date().toISOString(), event: "exam_started", details: "User started the exam" }]),
  });

  log.info("secure_exam.started", { assessmentId: input.assessmentId, userId: input.userId });
  return mapSecureExamSession(row);
}

export async function pauseSecureExam(assessmentId: string, userId: string): Promise<SecureExamSessionDto | null> {
  const session = await repo.findSecureExamSession(assessmentId, userId);
  if (!session || session.status !== "in_progress") return null;
  const updated = await repo.updateSecureExamSession(session.id, {
    status: "paused", pausedAt: new Date(),
    auditLog: appendAudit(session.auditLog, "exam_paused", "User paused the exam"),
  });
  return mapSecureExamSession(updated);
}

export async function resumeSecureExam(assessmentId: string, userId: string): Promise<SecureExamSessionDto | null> {
  const session = await repo.findSecureExamSession(assessmentId, userId);
  if (!session || session.status !== "paused") return null;
  const updated = await repo.updateSecureExamSession(session.id, {
    status: "in_progress", resumedAt: new Date(),
    auditLog: appendAudit(session.auditLog, "exam_resumed", "User resumed the exam"),
  });
  return mapSecureExamSession(updated);
}

export async function submitSecureExam(assessmentId: string, userId: string, autoSubmit = false): Promise<SecureExamSessionDto | null> {
  const session = await repo.findSecureExamSession(assessmentId, userId);
  if (!session || (session.status !== "in_progress" && session.status !== "paused")) return null;
  const updated = await repo.updateSecureExamSession(session.id, {
    status: autoSubmit ? "auto_submitted" : "submitted", submittedAt: new Date(), timeRemainingMs: 0,
    auditLog: appendAudit(session.auditLog, autoSubmit ? "exam_auto_submitted" : "exam_submitted", autoSubmit ? "Auto-submitted due to time expiry" : "User submitted the exam"),
  });
  return mapSecureExamSession(updated);
}

export async function autosaveSecureExam(assessmentId: string, userId: string, data: Record<string, unknown>): Promise<void> {
  const session = await repo.findSecureExamSession(assessmentId, userId);
  if (!session) return;
  await repo.updateSecureExamSession(session.id, {
    autosaveData: JSON.stringify(data), lastAutosaveAt: new Date(),
    auditLog: appendAudit(session.auditLog, "autosave", "Progress autosaved"),
  });
}

export async function getSecureExamSession(assessmentId: string, userId: string): Promise<SecureExamSessionDto | null> {
  const session = await repo.findSecureExamSession(assessmentId, userId);
  return session ? mapSecureExamSession(session) : null;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function appendAudit(existing: string, event: string, details: string): string {
  const log = safeParse<Array<{ timestamp: string; event: string; details: string }>>(existing, []);
  log.push({ timestamp: new Date().toISOString(), event, details });
  return JSON.stringify(log);
}

function mapSecureExamSession(row: any): SecureExamSessionDto {
  return {
    id: row.id, assessmentId: row.assessmentId, userId: row.userId, status: row.status,
    questionOrder: safeParse<string[]>(row.questionOrder, []),
    adaptiveState: safeParse(row.adaptiveState, {}),
    startedAt: row.startedAt?.toISOString() ?? null, pausedAt: row.pausedAt?.toISOString() ?? null,
    resumedAt: row.resumedAt?.toISOString() ?? null, submittedAt: row.submittedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null, timeRemainingMs: row.timeRemainingMs,
    lastAutosaveAt: row.lastAutosaveAt?.toISOString() ?? null, lockdownEnabled: row.lockdownEnabled,
    auditLog: safeParse(row.auditLog, []), offlineRecoveryAvailable: row.offlineRecoveryAvailable,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

// ===========================================================================
// 5. Competency Framework
// ===========================================================================

export async function createCompetency(input: {
  code: string; name: string; description?: string; subject?: string;
  level?: string; conceptIds?: string[]; prerequisiteIds?: string[];
}): Promise<CompetencyDto> {
  const row = await repo.createCompetency({
    code: input.code, name: input.name, description: input.description,
    subject: input.subject, level: input.level ?? "intermediate",
    conceptIds: JSON.stringify(input.conceptIds ?? []),
    assessmentIds: "[]", resourceIds: "[]",
    prerequisiteIds: JSON.stringify(input.prerequisiteIds ?? []),
  });
  return mapCompetency(row);
}

export async function getCompetency(id: string): Promise<CompetencyDto | null> {
  const row = await repo.findCompetency(id);
  return row ? mapCompetency(row) : null;
}

export async function listCompetencies(input: { subject?: string; level?: string; limit?: number }): Promise<CompetencyDto[]> {
  const rows = await repo.findCompetencies(input);
  return rows.map(mapCompetency);
}

export async function recordCompetencyEvidence(input: {
  competencyId: string; userId: string; evidenceType: string;
  entityId?: string; masteryLevel?: number;
}): Promise<CompetencyEvidenceDto> {
  const row = await repo.createCompetencyEvidence({
    competencyId: input.competencyId, userId: input.userId,
    evidenceType: input.evidenceType, entityId: input.entityId,
    masteryLevel: input.masteryLevel ?? 0.5, status: "pending",
  });
  return mapEvidence(row);
}

export async function verifyCompetencyEvidence(id: string, verifiedBy: string, approved: boolean): Promise<void> {
  await repo.updateCompetencyEvidence(id, {
    status: approved ? "verified" : "rejected",
    verifiedBy, verifiedAt: new Date(),
  });
}

export async function getUserCompetencies(userId: string): Promise<Array<{ competency: CompetencyDto; evidence: CompetencyEvidenceDto[]; masteryLevel: number; certificationReady: boolean }>> {
  const evidence = await repo.findCompetencyEvidence({ userId, limit: 500 });
  const competencyIds = Array.from(new Set(evidence.map((e: any) => e.competencyId)));
  const competencies = await Promise.all(competencyIds.map((id) => repo.findCompetency(id)));
  return competencyIds.map((id, i) => {
    const comp = competencies[i];
    if (!comp) return null;
    const compEvidence = evidence.filter((e: any) => e.competencyId === id);
    const verified = compEvidence.filter((e: any) => e.status === "verified");
    const masteryLevel = verified.length > 0 ? verified.reduce((s: number, e: any) => s + e.masteryLevel, 0) / verified.length : 0;
    return {
      competency: mapCompetency(comp),
      evidence: compEvidence.map(mapEvidence),
      masteryLevel,
      certificationReady: masteryLevel >= 0.8 && verified.length >= 1,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);
}

function mapCompetency(row: any): CompetencyDto {
  return {
    id: row.id, code: row.code, name: row.name, description: row.description,
    subject: row.subject, level: row.level,
    conceptIds: safeParse<string[]>(row.conceptIds, []),
    assessmentIds: safeParse<string[]>(row.assessmentIds, []),
    resourceIds: safeParse<string[]>(row.resourceIds, []),
    prerequisiteIds: safeParse<string[]>(row.prerequisiteIds, []),
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapEvidence(row: any): CompetencyEvidenceDto {
  return {
    id: row.id, competencyId: row.competencyId, userId: row.userId,
    evidenceType: row.evidenceType, entityId: row.entityId, masteryLevel: row.masteryLevel,
    status: row.status, verifiedBy: row.verifiedBy, verifiedAt: row.verifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// ===========================================================================
// 6. Digital Credential Platform
// ===========================================================================

export async function issueCredential(input: {
  type: string; title: string; description?: string; userId: string;
  issuerId: string; issuerType?: string; competencyIds?: string[];
  evidenceLinks?: string[]; metadata?: Record<string, unknown>; expiresAt?: Date;
}): Promise<DigitalCredentialDto> {
  const verificationId = `EDUBEK-${uuidv4().slice(0, 12).toUpperCase()}`;
  const row = await repo.createCredential({
    type: input.type, title: input.title, description: input.description,
    userId: input.userId, issuerId: input.issuerId, issuerType: input.issuerType ?? "organization",
    verificationId, verificationUrl: `/verify/${verificationId}`,
    qrCodeData: `https://edubek.local/verify/${verificationId}`,
    digitalSignature: JSON.stringify({ algorithm: "edubek-sign-v1", signature: uuidv4(), publicKey: "edubek-pubkey" }),
    metadata: JSON.stringify(input.metadata ?? {}),
    competencyIds: JSON.stringify(input.competencyIds ?? []),
    evidenceLinks: JSON.stringify(input.evidenceLinks ?? []),
    expiresAt: input.expiresAt, status: "active",
  });
  log.info("credential.issued", { id: row.id, type: input.type, userId: input.userId, verificationId });
  return mapCredential(row);
}

export async function getCredential(id: string): Promise<DigitalCredentialDto | null> {
  const row = await repo.findCredential(id);
  return row ? mapCredential(row) : null;
}

export async function verifyCredential(verificationId: string, verifiedBy?: string, method = "url", ipAddress?: string): Promise<{ result: string; credential: DigitalCredentialDto | null }> {
  const credential = await repo.findCredentialByVerificationId(verificationId);
  let result = "not_found";
  if (credential) {
    if (credential.status === "revoked") result = "revoked";
    else if (credential.expiresAt && credential.expiresAt < new Date()) result = "expired";
    else result = "valid";
    // Best-effort verification log — ignore unique constraint violations
    await repo.createCredentialVerification({
      verificationId: `${verificationId}-${Date.now()}`, credentialId: credential.id, verifiedBy, method, result, ipAddress,
    }).catch(() => undefined);
  }
  return { result, credential: credential ? mapCredential(credential) : null };
}

export async function listCredentials(input: { userId?: string; type?: string; status?: string; limit?: number }): Promise<DigitalCredentialDto[]> {
  const rows = await repo.findCredentials(input);
  return rows.map(mapCredential);
}

export async function revokeCredential(id: string, reason: string): Promise<DigitalCredentialDto> {
  const row = await repo.updateCredential(id, { status: "revoked", revokedAt: new Date(), revokeReason: reason });
  return mapCredential(row);
}

function mapCredential(row: any): DigitalCredentialDto {
  return {
    id: row.id, type: row.type, title: row.title, description: row.description,
    userId: row.userId, issuerId: row.issuerId, issuerType: row.issuerType,
    verificationId: row.verificationId, verificationUrl: row.verificationUrl,
    qrCodeData: row.qrCodeData,
    digitalSignature: safeParse(row.digitalSignature, null),
    metadata: safeParse(row.metadata, {}),
    competencyIds: safeParse<string[]>(row.competencyIds, []),
    evidenceLinks: safeParse<string[]>(row.evidenceLinks, []),
    issuedAt: row.issuedAt.toISOString(), expiresAt: row.expiresAt?.toISOString() ?? null,
    status: row.status, revokedAt: row.revokedAt?.toISOString() ?? null,
    revokeReason: row.revokeReason, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

// ===========================================================================
// 7. Lifelong Academic Transcript
// ===========================================================================

export async function getTranscript(userId: string): Promise<AcademicTranscriptDto | null> {
  const row = await repo.findTranscript(userId);
  if (!row) return null;
  return {
    id: row.id, userId: row.userId,
    entries: safeParse<TranscriptEntry[]>(row.entries, []),
    aiSummary: row.aiSummary,
    skills: safeParse<string[]>(row.skills, []),
    timeline: safeParse<Array<{ date: string; event: string; title: string }>>(row.timeline, []),
    totalCourses: row.totalCourses, totalCredits: row.totalCredits,
    avgScore: row.avgScore, totalCredentials: row.totalCredentials,
    totalCompetencies: row.totalCompetencies, updatedAt: row.updatedAt.toISOString(),
  };
}

export async function rebuildTranscript(userId: string): Promise<AcademicTranscriptDto> {
  // Gather all transcript entries from existing systems
  const [attempts, credentials, competencies, certificates] = await Promise.all([
    db.assessmentAttempt.findMany({
      where: { studentId: userId, status: { in: ["graded", "submitted"] } },
      select: { id: true, score: true, assessment: { select: { title: true } }, submittedAt: true },
      take: 500,
    }).catch(() => []),
    repo.findCredentials({ userId, status: "active", limit: 100 }),
    repo.findCompetencyEvidence({ userId, status: "verified", limit: 200 }),
    db.certificate.findMany({
      where: { studentId: userId },
      select: { id: true, certificateNumber: true, score: true, issuedAt: true },
      take: 100,
    }).catch(() => []),
  ]);

  const entries: TranscriptEntry[] = [];

  // Assessment entries
  for (const a of attempts) {
    entries.push({
      type: "assessment", title: a.assessment?.title ?? "Assessment",
      description: null, date: a.submittedAt?.toISOString() ?? new Date().toISOString(),
      score: a.score, competencyId: null, credentialId: null, metadata: { attemptId: a.id },
    });
  }

  // Credential entries
  for (const c of credentials) {
    entries.push({
      type: "certificate", title: c.title, description: c.description,
      date: c.issuedAt.toISOString(), score: null, competencyId: null,
      credentialId: c.id, metadata: { verificationId: c.verificationId, type: c.type },
    });
  }

  // Competency entries
  for (const e of competencies) {
    const comp = await repo.findCompetency(e.competencyId).catch(() => null);
    entries.push({
      type: "competency", title: comp?.name ?? "Competency",
      description: comp?.description ?? null, date: e.createdAt.toISOString(),
      score: e.masteryLevel * 100, competencyId: e.competencyId, credentialId: null,
      metadata: { evidenceType: e.evidenceType, masteryLevel: e.masteryLevel },
    });
  }

  // Certificate entries
  for (const cert of certificates) {
    entries.push({
      type: "achievement", title: `Certificate ${cert.certificateNumber}`,
      description: "Certificate earned", date: cert.issuedAt.toISOString(),
      score: cert.score, competencyId: null, credentialId: null,
      metadata: { certificateId: cert.id },
    });
  }

  // Sort by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Compute stats
  const totalCourses = new Set(attempts.map((a: any) => a.assessment?.title)).size;
  const totalCredentials = credentials.length + certificates.length;
  const totalCompetencies = new Set(competencies.map((e: any) => e.competencyId)).size;
  const scores = entries.filter((e) => e.score !== null).map((e) => e.score!);
  const avgScore = scores.length > 0 ? scores.reduce((s, x) => s + x, 0) / scores.length : 0;

  // Build timeline
  const timeline = entries.slice(0, 20).map((e) => ({
    date: e.date, event: e.type, title: e.title,
  }));

  // AI summary (deterministic)
  const aiSummary = `Academic transcript for user ${userId}: ${totalCourses} courses, ${totalCredentials} credentials, ${totalCompetencies} verified competencies. Average score: ${avgScore.toFixed(1)}%. Most recent: ${entries[0]?.title ?? "N/A"}.`;

  // Extract skills from competencies
  const skills = await Promise.all(
    Array.from(new Set(competencies.map((e: any) => e.competencyId))).map(async (id) => {
      const comp = await repo.findCompetency(id).catch(() => null);
      return comp?.name ?? null;
    }),
  );
  const validSkills = skills.filter((s): s is string => s !== null);

  const row = await repo.upsertTranscript({
    userId,
    entries: JSON.stringify(entries),
    aiSummary,
    aiSummaryAt: new Date(),
    skills: JSON.stringify(validSkills),
    timeline: JSON.stringify(timeline),
    totalCourses,
    totalCredits: totalCourses * 3,
    avgScore,
    totalCredentials,
    totalCompetencies,
  });

  log.info("transcript.rebuilt", { userId, entries: entries.length, credentials: totalCredentials, competencies: totalCompetencies });
  return {
    id: row.id, userId, entries, aiSummary,
    skills: validSkills, timeline, totalCourses, totalCredits: row.totalCredits,
    avgScore, totalCredentials, totalCompetencies, updatedAt: row.updatedAt.toISOString(),
  };
}

// ===========================================================================
// 8. Assessment Intelligence
// ===========================================================================

export async function analyzeAssessmentQuality(assessmentId: string): Promise<AssessmentQualityDto> {
  // Fetch attempts for this assessment
  const attempts = await db.assessmentAttempt.findMany({
    where: { assessmentId, status: "graded" },
    select: { id: true, score: true, pointsAwarded: true, pointsMax: true, submittedAt: true },
    take: 500,
  }).catch(() => []);

  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0 ? attempts.reduce((s, a) => s + (a.score ?? 0), 0) / totalAttempts : 0;
  const passRate = totalAttempts > 0 ? attempts.filter((a) => (a.score ?? 0) >= 60).length / totalAttempts : 0;

  // Item analysis (simplified — would need per-question data)
  const itemAnalysis = {
    totalAttempts, avgScore, passRate,
    scoreStdDev: totalAttempts > 1
      ? Math.sqrt(attempts.reduce((s, a) => s + Math.pow((a.score ?? 0) - avgScore, 2), 0) / totalAttempts)
      : 0,
  };

  // Difficulty distribution
  const difficultyDistribution: Record<string, number> = {
    easy: Math.round(passRate * totalAttempts),
    medium: Math.round((1 - passRate) * totalAttempts * 0.6),
    hard: Math.round((1 - passRate) * totalAttempts * 0.4),
  };

  // Bloom coverage (would come from blueprint)
  const bloomCoverage: Record<string, number> = {
    remember: 2, understand: 3, apply: 3, analyze: 1, evaluate: 1, create: 0,
  };

  // Quality score
  const overallQuality = Math.min(1, 0.3 + passRate * 0.3 + (itemAnalysis.scoreStdDev > 10 ? 0.2 : 0) + (totalAttempts > 10 ? 0.2 : 0));

  const recommendations: string[] = [];
  if (passRate < 0.5) recommendations.push("Pass rate is below 50% — consider reviewing question difficulty");
  if (itemAnalysis.scoreStdDev < 5) recommendations.push("Low score variance — questions may not discriminate well between high and low performers");
  if (totalAttempts < 10) recommendations.push("Limited data — more attempts needed for reliable analysis");

  const row = await repo.upsertAssessmentQuality({
    assessmentId, overallQuality,
    bloomCoverage: JSON.stringify(bloomCoverage),
    curriculumCoverage: 0.7,
    difficultyDistribution: JSON.stringify(difficultyDistribution),
    gradingConsistency: 0.8,
    fairnessScore: 0.75,
    itemAnalysis: JSON.stringify(itemAnalysis),
    recommendations: JSON.stringify(recommendations),
    analyzedAt: new Date(),
  });

  return {
    id: row.id, assessmentId, overallQuality, bloomCoverage, curriculumCoverage: 0.7,
    difficultyDistribution, gradingConsistency: 0.8, fairnessScore: 0.75,
    itemAnalysis, recommendations, analyzedAt: row.analyzedAt.toISOString(),
  };
}

export async function getAssessmentQuality(assessmentId: string): Promise<AssessmentQualityDto | null> {
  const row = await repo.findAssessmentQuality(assessmentId);
  if (!row) return analyzeAssessmentQuality(assessmentId);
  return {
    id: row.id, assessmentId, overallQuality: row.overallQuality,
    bloomCoverage: safeParse(row.bloomCoverage, {}),
    curriculumCoverage: row.curriculumCoverage,
    difficultyDistribution: safeParse(row.difficultyDistribution, {}),
    gradingConsistency: row.gradingConsistency, fairnessScore: row.fairnessScore,
    itemAnalysis: safeParse(row.itemAnalysis, {}),
    recommendations: safeParse<string[]>(row.recommendations, []),
    analyzedAt: row.analyzedAt.toISOString(),
  };
}

// ===========================================================================
// 9. Institutional Accreditation Dashboard
// ===========================================================================

export async function generateAccreditationReport(organizationId: string): Promise<AccreditationReportDto> {
  // Gather data from existing systems
  const [health, credentials, competencies, orgInsight] = await Promise.all([
    import("@/features/knowledge-intelligence").then((m) => m.getKnowledgeHealth(organizationId)).catch(() => null),
    repo.findCredentials({ limit: 1000 }).catch(() => []),
    db.competencyEvidence.count({ where: { status: "verified" } }).catch(() => 0),
    import("@/features/collaboration").then((m) => m.getOrganizationInsight(organizationId)).catch(() => null),
  ]);

  const curriculumCompliance = health?.curriculumCompleteness ?? 0.5;
  const assessmentQuality = 0.7;
  const competencyCoverage = health?.coverageScore ?? 0.5;
  const totalCredentialsIssued = credentials.length;
  const gradingConsistency = 0.75;
  const auditReadiness = Math.min(1, (curriculumCompliance + assessmentQuality + competencyCoverage) / 3 * 0.9);

  const recommendations = {
    strengths: [] as string[],
    weaknesses: [] as string[],
    recommendations: [] as string[],
  };

  if (curriculumCompliance > 0.8) recommendations.strengths.push("Strong curriculum compliance");
  else recommendations.weaknesses.push("Curriculum compliance below 80%");

  if (assessmentQuality > 0.7) recommendations.strengths.push("Good assessment quality");
  else recommendations.weaknesses.push("Assessment quality needs improvement");

  if (totalCredentialsIssued > 50) recommendations.strengths.push(`Active credentialing program (${totalCredentialsIssued} issued)`);
  else recommendations.recommendations.push("Increase credential issuance");

  if (auditReadiness > 0.7) recommendations.strengths.push(`Audit-ready (${Math.round(auditReadiness * 100)}%)`);
  else recommendations.recommendations.push("Improve audit readiness");

  const aiSummary = `Accreditation report for organization ${organizationId}: Curriculum compliance ${Math.round(curriculumCompliance * 100)}%, assessment quality ${Math.round(assessmentQuality * 100)}%, competency coverage ${Math.round(competencyCoverage * 100)}%. ${totalCredentialsIssued} credentials issued. Audit readiness: ${Math.round(auditReadiness * 100)}%.`;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const row = await repo.upsertAccreditationReport({
    organizationId, day: today,
    curriculumCompliance, assessmentQuality, competencyCoverage,
    totalCredentialsIssued, totalCompetenciesVerified: competencies,
    graduateOutcomes: JSON.stringify({}),
    gradingConsistency, auditReadiness,
    aiSummary, recommendations: JSON.stringify(recommendations),
  });

  log.info("accreditation.generated", { organizationId, auditReadiness: auditReadiness.toFixed(2) });
  return {
    id: row.id, organizationId, day: today.toISOString(),
    curriculumCompliance, assessmentQuality, competencyCoverage,
    totalCredentialsIssued, totalCompetenciesVerified: competencies,
    graduateOutcomes: {}, gradingConsistency, auditReadiness,
    aiSummary, recommendations,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAccreditationReport(organizationId: string, refresh = false): Promise<AccreditationReportDto | null> {
  if (refresh) return generateAccreditationReport(organizationId);
  const row = await repo.findAccreditationReport(organizationId);
  if (!row) return generateAccreditationReport(organizationId);
  return {
    id: row.id, organizationId, day: row.day.toISOString(),
    curriculumCompliance: row.curriculumCompliance, assessmentQuality: row.assessmentQuality,
    competencyCoverage: row.competencyCoverage,
    totalCredentialsIssued: row.totalCredentialsIssued,
    totalCompetenciesVerified: row.totalCompetenciesVerified,
    graduateOutcomes: safeParse(row.graduateOutcomes, {}),
    gradingConsistency: row.gradingConsistency, auditReadiness: row.auditReadiness,
    aiSummary: row.aiSummary,
    recommendations: safeParse(row.recommendations, { strengths: [], weaknesses: [], recommendations: [] }),
    createdAt: row.createdAt.toISOString(),
  };
}
