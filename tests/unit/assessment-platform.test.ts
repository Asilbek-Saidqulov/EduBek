/** EduBek — Phase 5A.2 Assessment Platform tests. */
import { describe, it, expect } from "vitest";
import {
  buildAssessment, getBlueprint, listBlueprints,
  aiGrade,
  runIntegrityCheck, listIntegrityChecks,
  startSecureExam, pauseSecureExam, resumeSecureExam, submitSecureExam, autosaveSecureExam,
  createCompetency, getCompetency, listCompetencies, recordCompetencyEvidence, getUserCompetencies,
  issueCredential, getCredential, verifyCredential, listCredentials, revokeCredential,
  rebuildTranscript, getTranscript,
  analyzeAssessmentQuality, getAssessmentQuality,
} from "@/features/assessment-platform";

const TEST_ID = `test-5a2-${Date.now()}`;
const TEST_USER = `test-user-5a2-${Date.now()}`;

// Ensure test user exists
async function ensureUser(id: string) {
  const { db } = await import("@/lib/db");
  await db.user.upsert({
    where: { id },
    create: { id, email: `${id}@test.edubek.local`, username: id, passwordHash: "test", name: "Test User" },
    update: {},
  });
}

// ---------------------------------------------------------------------------
// Assessment Builder AI
// ---------------------------------------------------------------------------

describe("Assessment Builder AI", () => {
  it("builds a quiz blueprint with balanced Bloom + difficulty", async () => {
    await ensureUser(TEST_USER);
    const bp = await buildAssessment({
      title: `Test Quiz ${Date.now()}`,
      assessmentType: "quiz",
      subject: "mathematics",
      questionCount: 10,
      createdBy: TEST_USER,
    });
    expect(bp.id).toBeTruthy();
    expect(bp.items).toHaveLength(10);
    expect(bp.estimatedDurationMinutes).toBeGreaterThan(0);
    expect(bp.predictedAvgScore).toBeGreaterThan(0);
    expect(bp.confidence).toBeGreaterThan(0);

    // Check Bloom distribution covers multiple levels
    const bloomKeys = Object.keys(bp.bloomDistribution);
    expect(bloomKeys.length).toBeGreaterThan(1);

    // Check difficulty distribution
    const diffKeys = Object.keys(bp.difficultyDistribution);
    expect(diffKeys.length).toBeGreaterThan(0);
  });

  it("builds an essay blueprint with auto-generated rubric", async () => {
    const bp = await buildAssessment({
      title: `Test Essay ${Date.now()}`,
      assessmentType: "essay",
      subject: "literature",
      questionCount: 3,
      createdBy: TEST_USER,
    });
    expect(bp.items).toHaveLength(3);
    expect(bp.rubricId).toBeTruthy();
    expect(bp.estimatedDurationMinutes).toBeGreaterThanOrEqual(30); // 10 min per essay
  });

  it("retrieves + lists blueprints", async () => {
    const bp = await buildAssessment({
      title: `List Test ${Date.now()}`,
      assessmentType: "exam",
      createdBy: TEST_USER,
    });
    const retrieved = await getBlueprint(bp.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved!.id).toBe(bp.id);

    const list = await listBlueprints({ createdBy: TEST_USER });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// AI Grading Engine
// ---------------------------------------------------------------------------

describe("AI Grading Engine", () => {
  it("grades MCQ with exact match", async () => {
    const result = await aiGrade({
      assessmentId: "test-assess", attemptId: "test-attempt",
      studentId: TEST_USER, responseText: "A",
      questionType: "mcq", correctAnswer: "A", maxScore: 10,
    });
    expect(result.score).toBe(10);
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.suggestedTeacherReview).toBe(false);
  });

  it("grades MCQ incorrectly", async () => {
    const result = await aiGrade({
      assessmentId: "test-assess", attemptId: "test-attempt",
      studentId: TEST_USER, responseText: "B",
      questionType: "mcq", correctAnswer: "A", maxScore: 10,
    });
    expect(result.score).toBe(0);
  });

  it("grades short answer with keyword matching", async () => {
    const result = await aiGrade({
      assessmentId: "test-assess", attemptId: "test-attempt",
      studentId: TEST_USER,
      responseText: "The quadratic formula is used to solve equations",
      questionType: "short_answer", correctAnswer: "quadratic formula solve equations",
      maxScore: 10,
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("grades essay with rubric-based heuristic", async () => {
    // Create a rubric first
    const { db } = await import("@/lib/db");
    const rubric = await db.rubric.create({
      data: { ownerId: TEST_USER, name: "Test Rubric", maxPoints: 100, status: "active" },
    });
    await db.rubricCriterion.create({
      data: {
        rubricId: rubric.id, name: "Content", maxPoints: 50,
        levels: JSON.stringify([
          { points: 50, label: "Excellent", description: "All accurate" },
          { points: 35, label: "Good", description: "Minor errors" },
          { points: 20, label: "Fair", description: "Several errors" },
          { points: 10, label: "Poor", description: "Major errors" },
        ]),
        order: 1,
      },
    });

    const result = await aiGrade({
      assessmentId: "test-assess", attemptId: "test-attempt",
      studentId: TEST_USER,
      responseText: "This is a well-structured essay with proper headings and detailed analysis of the topic. " + "word ".repeat(100),
      questionType: "essay", rubricId: rubric.id, maxScore: 100,
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.rubricBreakdown.length).toBeGreaterThan(0);
    expect(result.suggestedTeacherReview).toBe(true); // essay always suggests review
  });
});

// ---------------------------------------------------------------------------
// Academic Integrity Engine
// ---------------------------------------------------------------------------

describe("Academic Integrity Engine", () => {
  it("detects plagiarism with high similarity", async () => {
    const content = "The quick brown fox jumps over the lazy dog. " + "This is a unique sentence. ".repeat(5);
    const previous = content; // identical → high similarity

    const result = await runIntegrityCheck({
      entityType: "assessment_attempt", entityId: `test-${Date.now()}`,
      userId: TEST_USER, checkType: "plagiarism",
      content, previousSubmissions: [previous],
    });
    expect(result.riskScore).toBeGreaterThan(0.5);
    expect(result.riskLevel).toBe("high");
  });

  it("passes plagiarism check with original content", async () => {
    const result = await runIntegrityCheck({
      entityType: "assessment_attempt", entityId: `test-${Date.now()}`,
      userId: TEST_USER, checkType: "plagiarism",
      content: "A completely original piece of writing about photosynthesis and cellular respiration.",
      previousSubmissions: ["A different essay about the French Revolution and its causes."],
    });
    expect(result.riskScore).toBeLessThan(0.5);
    expect(result.riskLevel).toBe("low");
  });

  it("detects duplicate submissions", async () => {
    const content = "Same submission content repeated here for testing purposes.";
    const result = await runIntegrityCheck({
      entityType: "assignment_submission", entityId: `test-${Date.now()}`,
      userId: TEST_USER, checkType: "duplicate_submission",
      content, previousSubmissions: [content],
    });
    expect(result.riskScore).toBeGreaterThan(0.8);
  });

  it("lists integrity checks", async () => {
    const checks = await listIntegrityChecks({ userId: TEST_USER, limit: 10 });
    expect(checks.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Secure Exam Platform
// ---------------------------------------------------------------------------

describe("Secure Exam Platform", () => {
  it("starts, pauses, resumes, and submits an exam", async () => {
    await ensureUser(TEST_USER);
    const assessmentId = `test-exam-${Date.now()}`;
    const session = await startSecureExam({
      assessmentId, userId: TEST_USER, durationMs: 60_000,
      randomizeQuestions: true, questionIds: ["q1", "q2", "q3"],
    });
    expect(session.status).toBe("in_progress");
    expect(session.questionOrder).toHaveLength(3);
    expect(session.auditLog.length).toBeGreaterThan(0);

    // Pause
    const paused = await pauseSecureExam(assessmentId, TEST_USER);
    expect(paused!.status).toBe("paused");

    // Resume
    const resumed = await resumeSecureExam(assessmentId, TEST_USER);
    expect(resumed!.status).toBe("in_progress");

    // Autosave
    await autosaveSecureExam(assessmentId, TEST_USER, { q1: "answer1" });

    // Submit
    const submitted = await submitSecureExam(assessmentId, TEST_USER);
    expect(submitted!.status).toBe("submitted");
    expect(submitted!.submittedAt).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Competency Framework
// ---------------------------------------------------------------------------

describe("Competency Framework", () => {
  it("creates + retrieves + lists competencies", async () => {
    const comp = await createCompetency({
      code: `test-comp-${Date.now()}`,
      name: "Test Competency",
      description: "A test competency",
      subject: "mathematics",
      level: "intermediate",
    });
    expect(comp.id).toBeTruthy();
    expect(comp.code).toContain("test-comp");

    const retrieved = await getCompetency(comp.id);
    expect(retrieved).toBeTruthy();

    const list = await listCompetencies({ subject: "mathematics" });
    expect(list.length).toBeGreaterThan(0);
  });

  it("records + verifies competency evidence", async () => {
    await ensureUser(TEST_USER);
    const comp = await createCompetency({
      code: `test-comp-ev-${Date.now()}`,
      name: "Evidence Test Competency",
      subject: "physics",
    });
    const evidence = await recordCompetencyEvidence({
      competencyId: comp.id, userId: TEST_USER,
      evidenceType: "assessment", masteryLevel: 0.85,
    });
    expect(evidence.status).toBe("pending");

    const { verifyCompetencyEvidence } = await import("@/features/assessment-platform");
    await verifyCompetencyEvidence(evidence.id, TEST_USER, true);

    const userComps = await getUserCompetencies(TEST_USER);
    const found = userComps.find((uc) => uc.competency.id === comp.id);
    expect(found).toBeTruthy();
    expect(found!.certificationReady).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Digital Credential Platform
// ---------------------------------------------------------------------------

describe("Digital Credential Platform", () => {
  it("issues + verifies + revokes a credential", async () => {
    await ensureUser(TEST_USER);
    const cred = await issueCredential({
      type: "certificate",
      title: `Test Certificate ${Date.now()}`,
      description: "A test certificate",
      userId: TEST_USER,
      issuerId: TEST_USER,
      competencyIds: [],
    });
    expect(cred.id).toBeTruthy();
    expect(cred.verificationId).toContain("EDUBEK-");
    expect(cred.status).toBe("active");

    // Verify
    const verification = await verifyCredential(cred.verificationId);
    expect(verification.result).toBe("valid");
    expect(verification.credential).toBeTruthy();

    // Revoke
    const revoked = await revokeCredential(cred.id, "Test revocation");
    expect(revoked.status).toBe("revoked");

    // Verify again — should be revoked
    const verification2 = await verifyCredential(cred.verificationId);
    expect(verification2.result).toBe("revoked");
  });

  it("returns not_found for unknown verification ID", async () => {
    const result = await verifyCredential("UNKNOWN-ID-12345");
    expect(result.result).toBe("not_found");
    expect(result.credential).toBeNull();
  });

  it("lists credentials", async () => {
    const list = await listCredentials({ userId: TEST_USER });
    expect(Array.isArray(list)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Lifelong Academic Transcript
// ---------------------------------------------------------------------------

describe("Lifelong Academic Transcript", () => {
  it("rebuilds + retrieves a transcript", async () => {
    await ensureUser(TEST_USER);
    const transcript = await rebuildTranscript(TEST_USER);
    expect(transcript.userId).toBe(TEST_USER);
    expect(Array.isArray(transcript.entries)).toBe(true);
    expect(Array.isArray(transcript.skills)).toBe(true);
    expect(Array.isArray(transcript.timeline)).toBe(true);
    expect(transcript.aiSummary).toBeTruthy();

    const retrieved = await getTranscript(TEST_USER);
    expect(retrieved).toBeTruthy();
    expect(retrieved!.userId).toBe(TEST_USER);
  });
});

// ---------------------------------------------------------------------------
// Assessment Intelligence
// ---------------------------------------------------------------------------

describe("Assessment Intelligence", () => {
  it("analyzes assessment quality", async () => {
    const result = await analyzeAssessmentQuality(`test-assess-${Date.now()}`);
    expect(result.assessmentId).toBeTruthy();
    expect(result.overallQuality).toBeGreaterThanOrEqual(0);
    expect(result.overallQuality).toBeLessThanOrEqual(1);
    expect(result.bloomCoverage).toBeTruthy();
    expect(result.difficultyDistribution).toBeTruthy();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it("retrieves cached assessment quality", async () => {
    const assessmentId = `test-assess-cache-${Date.now()}`;
    await analyzeAssessmentQuality(assessmentId);
    const cached = await getAssessmentQuality(assessmentId);
    expect(cached).toBeTruthy();
    expect(cached!.assessmentId).toBe(assessmentId);
  });
});
