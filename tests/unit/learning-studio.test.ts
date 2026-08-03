/** EduBek — Phase 5C.2 Learning Studio tests. */
import { describe, it, expect } from "vitest";
import {
  createExperience, getExperience, listExperiences, publishExperience,
  startSession, updateSessionProgress, completeSession, listSessions,
  generateSimulation, listSimulations,
  generateVirtualLab, listVirtualLabs,
  createProgrammingWorkspace, listProgrammingWorkspaces, gradeProgrammingSubmission,
  createTutorAvatar, listTutorAvatars,
  generateLearningWorld, listLearningWorlds,
  createScenario, listScenarios,
  generateContentArtifact, listContentArtifacts,
  composeExperience, listCompositions, publishComposition,
} from "@/features/learning-studio";

const TEST_USER = `test-5c2-${Date.now()}`;

// ---------------------------------------------------------------------------
// Learning Experience CRUD
// ---------------------------------------------------------------------------

describe("Learning Experience CRUD", () => {
  it("creates + retrieves + lists + publishes an experience", async () => {
    const exp = await createExperience({
      type: "simulation", title: `Test Sim ${Date.now()}`,
      subject: "physics", authorId: TEST_USER, authorName: "Test User",
      tags: ["physics", "simulation"], difficulty: "medium",
    });
    expect(exp.id).toBeTruthy();
    expect(exp.status).toBe("draft");

    const retrieved = await getExperience(exp.id);
    expect(retrieved).toBeTruthy();

    const list = await listExperiences({ authorId: TEST_USER, status: "draft" });
    expect(list.length).toBeGreaterThan(0);

    const published = await publishExperience(exp.id);
    expect(published.status).toBe("published");
  });
});

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

describe("Session Management", () => {
  it("starts + updates + completes a session", async () => {
    const exp = await createExperience({
      type: "programming", title: `Session Test ${Date.now()}`,
      authorId: TEST_USER, authorName: "Test User",
    });
    await publishExperience(exp.id);

    const session = await startSession({ experienceId: exp.id, userId: TEST_USER });
    expect(session.status).toBe("in_progress");
    expect(session.progress).toBe(0);

    const updated = await updateSessionProgress(session.id, 50, { step: 1 });
    expect(updated.progress).toBe(50);

    const updated2 = await updateSessionProgress(session.id, 75, { step: 2 }, { type: "answer", data: { question: 1 } });
    expect(updated2.interactions.length).toBeGreaterThan(0);

    const completed = await completeSession(session.id, 85);
    expect(completed.status).toBe("completed");
    expect(completed.progress).toBe(100);
    expect(completed.score).toBe(85);
  });
});

// ---------------------------------------------------------------------------
// Interactive Simulation Engine
// ---------------------------------------------------------------------------

describe("Interactive Simulation Engine", () => {
  it("generates a physics simulation", async () => {
    const sim = await generateSimulation({
      domain: "physics", name: "Projectile Motion",
      parameters: [
        { name: "initialVelocity", type: "number", defaultValue: 20, min: 0, max: 100, unit: "m/s" },
        { name: "angle", type: "number", defaultValue: 45, min: 0, max: 90, unit: "degrees" },
      ],
      equations: [
        { name: "range", expression: "v^2 * sin(2*theta) / g", description: "Projectile range" },
        { name: "maxHeight", expression: "v^2 * sin(theta)^2 / (2*g)", description: "Maximum height" },
      ],
      assessment: [
        { question: "What is the optimal angle for maximum range?", expectedAnswer: 45, tolerance: 1 },
      ],
    });
    expect(sim.id).toBeTruthy();
    expect(sim.domain).toBe("physics");
    expect(sim.parameters.length).toBe(2);
    expect(sim.equations.length).toBe(2);

    const list = await listSimulations({ domain: "physics" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// AI Virtual Laboratory
// ---------------------------------------------------------------------------

describe("AI Virtual Laboratory", () => {
  it("generates a chemistry lab", async () => {
    const lab = await generateVirtualLab({
      domain: "chemistry", name: "Acid-Base Titration",
      apparatus: [
        { name: "Burette", quantity: 1, type: "glassware" },
        { name: "Erlenmeyer Flask", quantity: 1, type: "glassware" },
      ],
      materials: [
        { name: "HCl", formula: "HCl", amount: "25", unit: "mL", hazardLevel: "high" },
        { name: "NaOH", formula: "NaOH", amount: "0.1M", unit: "mol/L", hazardLevel: "medium" },
      ],
      procedure: [
        { step: 1, instruction: "Fill burette with NaOH solution" },
        { step: 2, instruction: "Add HCl to flask with indicator" },
        { step: 3, instruction: "Titrate until color change" },
      ],
      measurements: [
        { name: "Volume of NaOH", unit: "mL", expectedValue: 25, tolerance: 2 },
      ],
      expectedOutcomes: [
        { observation: "Solution turns pink", explanation: "Phenolphthalein indicator changes color at endpoint" },
      ],
    });
    expect(lab.id).toBeTruthy();
    expect(lab.domain).toBe("chemistry");
    expect(lab.apparatus.length).toBe(2);
    expect(lab.materials.length).toBe(2);
    expect(lab.safety.length).toBeGreaterThan(0);

    const list = await listVirtualLabs({ domain: "chemistry" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Programming Workspace
// ---------------------------------------------------------------------------

describe("Programming Workspace", () => {
  it("creates a Python workspace + grades a submission", async () => {
    const ws = await createProgrammingWorkspace({
      language: "python", title: `FizzBuzz ${Date.now()}`,
      starterCode: "def fizzbuzz(n):\n    pass",
      testCases: [
        { input: "3", expectedOutput: "Fizz", hidden: false },
        { input: "5", expectedOutput: "Buzz", hidden: false },
        { input: "15", expectedOutput: "FizzBuzz", hidden: true },
      ],
      hints: [{ hint: "Use modulo operator", cost: 1 }],
      aiDebugging: true,
    });
    expect(ws.id).toBeTruthy();
    expect(ws.language).toBe("python");
    expect(ws.testCases.length).toBe(3);

    // Grade a submission
    const result = await gradeProgrammingSubmission({
      workspaceId: ws.id, code: "def fizzbuzz(n):\n    if n % 15 == 0: return 'FizzBuzz'\n    elif n % 3 == 0: return 'Fizz'\n    elif n % 5 == 0: return 'Buzz'",
    });
    expect(result.total).toBe(3);
    expect(result.passed + result.failed).toBe(3);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);

    const list = await listProgrammingWorkspaces({ language: "python" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// AI Tutor Avatar
// ---------------------------------------------------------------------------

describe("AI Tutor Avatar", () => {
  it("creates a teacher-mode tutor avatar", async () => {
    const tutor = await createTutorAvatar({
      mode: "teacher", name: `Professor ${Date.now()}`,
      subject: "mathematics",
      personality: { tone: "encouraging", style: "socratic", pace: "adaptive" },
      conversationSettings: { maxTurns: 20, language: "en", voiceEnabled: true, difficultyAdaptive: true },
    });
    expect(tutor.id).toBeTruthy();
    expect(tutor.mode).toBe("teacher");
    expect(tutor.personality).toHaveProperty("tone", "encouraging");

    const list = await listTutorAvatars({ mode: "teacher" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Learning World Builder
// ---------------------------------------------------------------------------

describe("Learning World Builder", () => {
  it("generates a Roman Empire learning world", async () => {
    const world = await generateLearningWorld({
      name: `Roman Empire ${Date.now()}`, theme: "roman_empire",
      description: "Explore the rise and fall of the Roman Empire",
      entities: [
        { type: "city", name: "Rome", description: "Capital of the empire", properties: { population: 1000000, founded: -753 }, connections: ["Pompeii", "Alexandria"] },
        { type: "event", name: "Fall of Rome", description: "476 AD", properties: { year: 476 }, connections: [] },
      ],
      paths: [
        { name: "Rise of Republic", description: "From kingdom to republic", steps: ["Founding", "Republic", "Punic Wars"] },
        { name: "Imperial Era", description: "From Augustus to fall", steps: ["Augustus", "Pax Romana", "Crisis", "Fall"] },
      ],
      assignments: [
        { title: "Map the Empire", description: "Draw the borders at peak", type: "project", points: 50 },
      ],
      objectives: ["Understand Roman political systems", "Trace the timeline of major events"],
    });
    expect(world.id).toBeTruthy();
    expect(world.theme).toBe("roman_empire");
    expect(world.entities.length).toBe(2);
    expect(world.paths.length).toBe(2);
    expect(world.assignments.length).toBe(1);

    const list = await listLearningWorlds({ theme: "roman_empire" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Scenario Engine
// ---------------------------------------------------------------------------

describe("Scenario Engine", () => {
  it("creates a medical scenario", async () => {
    const scenario = await createScenario({
      type: "medical", title: `Emergency Room ${Date.now()}`,
      description: "Triage patient with chest pain",
      setup: { background: "45-year-old male, chest pain", roles: ["doctor", "nurse"], constraints: ["10 minutes to decide"] },
      decisionPoints: [
        { id: "dp1", prompt: "What is your first action?", options: ["ECG", "Aspirin", "Call cardiology"], consequences: ["ECG shows STEMI", "Pain reduces slightly", "Delay in treatment"], correctOption: 0 },
      ],
      outcomes: [
        { condition: "ECG performed first", result: "STEMI detected, patient saved", feedback: "Correct — ECG is the priority for chest pain" },
      ],
    });
    expect(scenario.id).toBeTruthy();
    expect(scenario.type).toBe("medical");
    expect(scenario.decisionPoints.length).toBe(1);

    const list = await listScenarios({ type: "medical" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Content Artifact Generator
// ---------------------------------------------------------------------------

describe("Content Artifact Generator", () => {
  it("generates a timeline artifact", async () => {
    const artifact = await generateContentArtifact({
      type: "timeline", title: `World War II Timeline ${Date.now()}`,
      subject: "history", topic: "wwii",
      content: { events: [{ year: 1939, event: "Invasion of Poland" }, { year: 1945, event: "End of war" }] },
      visualStyle: { template: "horizontal", colors: { primary: "#333", accent: "#e74c3c" } },
      aiGenerated: true, outputFormat: "json",
    });
    expect(artifact.id).toBeTruthy();
    expect(artifact.type).toBe("timeline");
    expect(artifact.aiGenerated).toBe(true);

    const list = await listContentArtifacts({ type: "timeline" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Experience Composer
// ---------------------------------------------------------------------------

describe("Experience Composer", () => {
  it("composes + publishes a multi-component experience", async () => {
    // Create individual experiences
    const sim = await createExperience({ type: "simulation", title: "Sim Component", authorId: TEST_USER, authorName: "Test" });
    const quiz = await createExperience({ type: "interactive_assessment", title: "Quiz Component", authorId: TEST_USER, authorName: "Test" });
    await publishExperience(sim.id);
    await publishExperience(quiz.id);

    const composition = await composeExperience({
      title: `Composed Experience ${Date.now()}`,
      description: "A simulation + quiz experience",
      components: [
        { type: "simulation", experienceId: sim.id, order: 1, config: { duration: 15 } },
        { type: "interactive_assessment", experienceId: quiz.id, order: 2, config: { duration: 10 } },
      ],
      authorId: TEST_USER, authorName: "Test User",
      tags: ["physics", "assessment"],
    });
    expect(composition.id).toBeTruthy();
    expect(composition.components.length).toBe(2);
    expect(composition.components[0]!.order).toBe(1);
    expect(composition.components[1]!.order).toBe(2);
    expect(composition.status).toBe("draft");

    const published = await publishComposition(composition.id);
    expect(published.status).toBe("published");

    const list = await listCompositions({ authorId: TEST_USER });
    expect(list.length).toBeGreaterThan(0);
  });
});
