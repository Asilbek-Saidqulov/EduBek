/**
 * EduBek — Classroom Intelligence service.
 *
 * Phase 4F.4: Aggregates classroom-wide analytics for teachers:
 *
 *   • Class mastery (avg mastery across all students)
 *   • Weak topics (topics where many students scored low)
 *   • Strong topics (topics where many students mastered)
 *   • Learning velocity (concepts/day, minutes/day)
 *   • Engagement rate (active students / total students, last 7 days)
 *   • At-risk prediction (low accuracy + low engagement + missed assignments)
 *   • Assignment completion rate
 *   • Total study time
 *
 * Reuses:
 *   • Phase 4F.2 buildKnowledgeGapReport (per-student gap report)
 *   • Phase 4F.3 StudySession + LearningPlanItem (per-student activity)
 *   • Phase 4F.4 Assignment + AssignmentAttempt (completion rates)
 *
 * The output is persisted as a ClassInsight snapshot for fast subsequent
 * dashboard loads.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { AtRiskStudent, ClassInsightDto } from "./types";

const log = getLogger("classroom-intelligence");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function computeClassInsight(classroomId: string): Promise<ClassInsightDto> {
  // Fetch classroom + students
  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
    select: {
      id: true,
      name: true,
      teacherId: true,
      students: { where: { status: "active" }, select: { studentId: true } },
    },
  });
  if (!classroom) throw new Error("Classroom not found");

  const studentIds = classroom.students.map((s) => s.studentId);
  const studentCount = studentIds.length;
  if (studentCount === 0) {
    return emptyInsight(classroomId);
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY);

  // Fetch per-student data in parallel
  const [studySessions, attempts, assignmentAttempts, interestProfiles] = await Promise.all([
    db.studySession.findMany({
      where: { userId: { in: studentIds }, startedAt: { gte: sevenDaysAgo } },
      select: { userId: true, durationMs: true, accuracy: true, startedAt: true },
    }).catch(() => []),
    db.assessmentAttempt.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true, score: true, assessment: { select: { title: true } }, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }).catch(() => []),
    db.assignmentAttempt.findMany({
      where: { studentId: { in: studentIds } },
      select: { id: true, studentId: true, status: true },
    }).catch(() => []),
    // Per-student mastery from UserInterestProfile (Phase 4F.2)
    db.userInterestProfile.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, mastery: true, interests: true },
    }).catch(() => []),
  ]);

  // Aggregate per-student metrics
  const perStudent = new Map<string, {
    studyTimeMs: number;
    sessionCount: number;
    avgAccuracy: number;
    quizCount: number;
    mastery: Record<string, string>;
    assignmentCompleted: number;
    assignmentTotal: number;
    activeInLast7Days: boolean;
  }>();

  for (const studentId of studentIds) {
    perStudent.set(studentId, {
      studyTimeMs: 0,
      sessionCount: 0,
      avgAccuracy: 0,
      quizCount: 0,
      mastery: {},
      assignmentCompleted: 0,
      assignmentTotal: 0,
      activeInLast7Days: false,
    });
  }

  // Aggregate study sessions
  for (const session of studySessions as any[]) {
    const s = perStudent.get(session.userId);
    if (!s) continue;
    s.studyTimeMs += session.durationMs;
    s.sessionCount += 1;
    s.activeInLast7Days = true;
  }

  // Aggregate quiz attempts
  for (const attempt of attempts as any[]) {
    const s = perStudent.get(attempt.studentId);
    if (!s) continue;
    if (attempt.score !== null) {
      s.avgAccuracy = (s.avgAccuracy * s.quizCount + attempt.score / 100) / (s.quizCount + 1);
      s.quizCount += 1;
      // Track mastery per topic (using assessment title as proxy)
      const title = attempt.assessment?.title ?? "unknown";
      if (!s.mastery[title]) {
        if (attempt.score >= 80) s.mastery[title] = "mastered";
        else if (attempt.score >= 50) s.mastery[title] = "learning";
        else s.mastery[title] = "weak";
      }
    }
  }

  // Aggregate assignment attempts
  for (const aa of assignmentAttempts as any[]) {
    const studentId = aa.studentId;
    if (!studentId) continue;
    const s = perStudent.get(studentId);
    if (!s) continue;
    s.assignmentTotal += 1;
    if (aa.status === "submitted" || aa.status === "graded") {
      s.assignmentCompleted += 1;
    }
  }

  // Pull mastery from interest profiles
  for (const profile of interestProfiles as any[]) {
    const s = perStudent.get(profile.userId);
    if (!s) continue;
    try {
      s.mastery = { ...s.mastery, ...JSON.parse(profile.mastery || "{}") };
    } catch {
      // skip
    }
  }

  // Compute class-level aggregates
  let totalMastery = 0;
  let masteryCount = 0;
  let totalStudyTimeMs = 0;
  let activeStudents = 0;
  let totalAssignmentsCompleted = 0;
  let totalAssignments = 0;

  const topicMastery = new Map<string, { total: number; weak: number; mastered: number }>();

  for (const [, s] of perStudent) {
    totalStudyTimeMs += s.studyTimeMs;
    if (s.activeInLast7Days) activeStudents += 1;
    totalAssignmentsCompleted += s.assignmentCompleted;
    totalAssignments += s.assignmentTotal;
    for (const [topic, level] of Object.entries(s.mastery)) {
      const entry = topicMastery.get(topic) ?? { total: 0, weak: 0, mastered: 0 };
      entry.total += 1;
      if (level === "weak") entry.weak += 1;
      if (level === "mastered") entry.mastered += 1;
      topicMastery.set(topic, entry);
      // Map mastery levels to numeric values for averaging
      const num = level === "mastered" ? 0.95 : level === "learning" ? 0.55 : level === "weak" ? 0.25 : 0;
      totalMastery += num;
      masteryCount += 1;
    }
  }

  const avgMastery = masteryCount > 0 ? totalMastery / masteryCount : 0;
  const engagementRate = studentCount > 0 ? activeStudents / studentCount : 0;
  const assignmentCompletionRate = totalAssignments > 0 ? totalAssignmentsCompleted / totalAssignments : 0;

  // Top weak topics — topics where ≥30% of students are weak
  const weakTopics = Array.from(topicMastery.entries())
    .map(([topic, m]) => ({
      topic,
      mastery: m.total > 0 ? 1 - (m.weak / m.total) : 0,
      weakRatio: m.total > 0 ? m.weak / m.total : 0,
      total: m.total,
    }))
    .filter((t) => t.total >= 2 && t.weakRatio >= 0.3)
    .sort((a, b) => b.weakRatio - a.weakRatio)
    .slice(0, 10)
    .map((t) => ({ topic: t.topic, mastery: t.mastery }));

  // Top strong topics — topics where ≥50% of students mastered
  const strongTopics = Array.from(topicMastery.entries())
    .map(([topic, m]) => ({
      topic,
      mastery: m.total > 0 ? m.mastered / m.total : 0,
      total: m.total,
    }))
    .filter((t) => t.total >= 2 && t.mastery >= 0.5)
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 10)
    .map((t) => ({ topic: t.topic, mastery: t.mastery }));

  // At-risk prediction: low accuracy + low engagement + missed assignments
  const atRiskStudents: AtRiskStudent[] = [];
  for (const [studentId, s] of perStudent) {
    let riskScore = 0;
    const reasons: string[] = [];

    // Low accuracy
    if (s.quizCount >= 3 && s.avgAccuracy < 0.5) {
      riskScore += 0.4;
      reasons.push("Low quiz accuracy");
    }
    // Low engagement
    if (!s.activeInLast7Days) {
      riskScore += 0.3;
      reasons.push("No activity in 7 days");
    }
    // Missed assignments
    if (s.assignmentTotal > 0 && s.assignmentCompleted / s.assignmentTotal < 0.5) {
      riskScore += 0.3;
      reasons.push("Missed assignments");
    }

    if (riskScore >= 0.4) {
      atRiskStudents.push({
        userId: studentId,
        riskScore,
        reason: reasons.join("; "),
        reasonKey: "learning.classroom.atRisk",
      });
    }
  }
  atRiskStudents.sort((a, b) => b.riskScore - a.riskScore);

  // Average velocity (concepts/day) — proxy: avg sessions per student per day
  const avgVelocity = studentCount > 0
    ? (studySessions as any[]).length / 7 / studentCount
    : 0;

  // Persist snapshot
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const snapshot = await repo.upsertClassInsight({
    classroomId,
    day: today,
    studentCount,
    avgMastery: round(avgMastery, 4),
    weakTopics: JSON.stringify(weakTopics),
    strongTopics: JSON.stringify(strongTopics),
    avgVelocity: round(avgVelocity, 4),
    engagementRate: round(engagementRate, 4),
    atRiskStudents: JSON.stringify(atRiskStudents),
    totalStudyTimeMs,
    assignmentCompletionRate: round(assignmentCompletionRate, 4),
  });

  log.info("classroom_insight.computed", {
    classroomId,
    studentCount,
    avgMastery: round(avgMastery, 2),
    weakTopics: weakTopics.length,
    atRisk: atRiskStudents.length,
  });

  return {
    classroomId,
    day: snapshot.day.toISOString(),
    studentCount,
    avgMastery: round(avgMastery, 4),
    weakTopics,
    strongTopics,
    avgVelocity: round(avgVelocity, 4),
    engagementRate: round(engagementRate, 4),
    atRiskStudents,
    totalStudyTimeMs,
    assignmentCompletionRate: round(assignmentCompletionRate, 4),
  };
}

export async function getClassInsight(classroomId: string): Promise<ClassInsightDto | null> {
  const row = await repo.findClassInsight(classroomId);
  if (!row) {
    // Recompute on first request
    return computeClassInsight(classroomId).catch(() => null);
  }
  return {
    classroomId: row.classroomId,
    day: row.day.toISOString(),
    studentCount: row.studentCount,
    avgMastery: row.avgMastery,
    weakTopics: safeParseArray(row.weakTopics),
    strongTopics: safeParseArray(row.strongTopics),
    avgVelocity: row.avgVelocity,
    engagementRate: row.engagementRate,
    atRiskStudents: safeParseArray(row.atRiskStudents),
    totalStudyTimeMs: row.totalStudyTimeMs,
    assignmentCompletionRate: row.assignmentCompletionRate,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyInsight(classroomId: string): ClassInsightDto {
  return {
    classroomId,
    day: new Date().toISOString(),
    studentCount: 0,
    avgMastery: 0,
    weakTopics: [],
    strongTopics: [],
    avgVelocity: 0,
    engagementRate: 0,
    atRiskStudents: [],
    totalStudyTimeMs: 0,
    assignmentCompletionRate: 0,
  };
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
