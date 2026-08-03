/**
 * EduBek — Phase 5A.1 Digital Twins tests.
 */
import { describe, it, expect } from "vitest";
import {
  createCalendar,
  listCalendars,
  addCalendarEvent,
  listCalendarEvents,
  isWorkingDay,
  storeAcademicMemory,
  recallAcademicMemory,
  runScenario,
  listScenarios,
  generateOperations,
  getOperations,
  triggerWorkflow,
  listWorkflows,
  listWorkflowTriggers,
} from "@/features/digital-twins";

const TEST_ID = `test-5a1-${Date.now()}`;

// ---------------------------------------------------------------------------
// Calendar Engine
// ---------------------------------------------------------------------------

describe("Calendar Engine", () => {
  it("creates + lists + retrieves a calendar", async () => {
    const cal = await createCalendar({
      year: "2025-2026",
      term: "Fall 2025",
      startDate: "2025-09-01T00:00:00Z",
      endDate: "2025-12-31T00:00:00Z",
      schedule: { holidays: [{ date: "2025-11-27", name: "Thanksgiving" }] },
    });
    expect(cal.id).toBeTruthy();
    expect(cal.year).toBe("2025-2026");

    const list = await listCalendars({ year: "2025-2026" });
    expect(list.length).toBeGreaterThan(0);

    const { getCalendar } = await import("@/features/digital-twins");
    const retrieved = await getCalendar(cal.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved!.schedule.holidays).toHaveLength(1);
  });

  it("adds + lists calendar events", async () => {
    const cal = await createCalendar({
      year: `test-${Date.now()}`,
      startDate: "2025-09-01T00:00:00Z",
      endDate: "2025-12-31T00:00:00Z",
    });
    const event = await addCalendarEvent({
      calendarId: cal.id,
      type: "exam",
      title: "Midterm Exam",
      startDate: "2025-10-15T00:00:00Z",
      endDate: "2025-10-15T03:00:00Z",
    });
    expect(event.id).toBeTruthy();
    expect(event.type).toBe("exam");

    const events = await listCalendarEvents({ calendarId: cal.id });
    expect(events.length).toBeGreaterThan(0);
  });

  it("isWorkingDay returns false for weekends + holidays", () => {
    const sunday = new Date("2025-07-06T00:00:00Z"); // Sunday
    const saturday = new Date("2025-07-05T00:00:00Z"); // Saturday
    const wednesday = new Date("2025-07-09T00:00:00Z"); // Wednesday
    const holidays = [{ date: "2025-07-09T00:00:00Z", name: "Test Holiday" }];

    expect(isWorkingDay(sunday, [])).toBe(false);
    expect(isWorkingDay(saturday, [])).toBe(false);
    expect(isWorkingDay(wednesday, [])).toBe(true);
    expect(isWorkingDay(wednesday, holidays)).toBe(false); // holiday
  });
});

// ---------------------------------------------------------------------------
// Academic Memory
// ---------------------------------------------------------------------------

describe("Academic Memory", () => {
  it("stores + recalls academic memory", async () => {
    const memory = await storeAcademicMemory({
      scopeType: "student",
      scopeId: TEST_ID,
      academicYear: "2024-2025",
      type: "achievement",
      summary: "Completed Algebra 1 with A grade",
      payload: { grade: "A", subject: "algebra" },
      importance: 0.9,
    });
    expect(memory.id).toBeTruthy();
    expect(memory.academicYear).toBe("2024-2025");

    const recalled = await recallAcademicMemory({
      scopeType: "student",
      scopeId: TEST_ID,
    });
    expect(recalled.length).toBeGreaterThan(0);
    expect(recalled[0]!.summary).toContain("Algebra 1");
  });
});

// ---------------------------------------------------------------------------
// Scenario Planning
// ---------------------------------------------------------------------------

describe("Scenario Planning", () => {
  it("runs make_subject_mandatory scenario", async () => {
    const scenario = await runScenario({
      type: "make_subject_mandatory",
      title: "Make Algebra mandatory in Grade 7",
      parameters: { subject: "algebra", grade: "7" },
      createdBy: TEST_ID,
    });
    expect(scenario.id).toBeTruthy();
    expect(scenario.type).toBe("make_subject_mandatory");
    expect(scenario.confidence).toBeGreaterThan(0);
    expect(scenario.summary).toContain("algebra");
    expect(scenario.predictions).toHaveProperty("affectedTeachers");
  });

  it("runs change_class_size scenario", async () => {
    const scenario = await runScenario({
      type: "change_class_size",
      title: "Increase class size to 40",
      parameters: { targetSize: 40 },
      createdBy: TEST_ID,
    });
    expect(scenario.type).toBe("change_class_size");
    expect(scenario.predictions).toHaveProperty("affectedClassrooms");
  });

  it("runs remove_quizzes scenario", async () => {
    const scenario = await runScenario({
      type: "remove_quizzes",
      title: "Remove weekly quizzes",
      parameters: {},
      createdBy: TEST_ID,
    });
    expect(scenario.type).toBe("remove_quizzes");
    expect(scenario.predictions).toHaveProperty("predictedMasteryChange");
    expect(scenario.summary).toContain("discouraged");
  });

  it("runs ai_credit_forecast scenario", async () => {
    const scenario = await runScenario({
      type: "ai_credit_forecast",
      title: "AI credit forecast for next semester",
      parameters: {},
      createdBy: TEST_ID,
    });
    expect(scenario.type).toBe("ai_credit_forecast");
    expect(scenario.predictions).toHaveProperty("projectedCredits");
  });

  it("lists scenarios", async () => {
    const scenarios = await listScenarios({ createdBy: TEST_ID, limit: 10 });
    expect(scenarios.length).toBeGreaterThanOrEqual(4); // we just created 4
  });
});

// ---------------------------------------------------------------------------
// Academic Workflows
// ---------------------------------------------------------------------------

describe("Academic Workflows", () => {
  it("lists all workflow triggers", () => {
    const triggers = listWorkflowTriggers();
    expect(triggers).toHaveLength(5);
    expect(triggers).toContain("quiz_finished");
    expect(triggers).toContain("student_at_risk");
    expect(triggers).toContain("curriculum_gap");
    expect(triggers).toContain("semester_start");
    expect(triggers).toContain("exam_period_start");
  });

  it("triggers a post_quiz_cascade workflow", async () => {
    const workflow = await triggerWorkflow({
      trigger: "quiz_finished",
      scopeType: "user",
      scopeId: TEST_ID,
      params: { userId: TEST_ID },
    });
    expect(workflow.id).toBeTruthy();
    expect(workflow.trigger).toBe("quiz_finished");
    expect(workflow.steps.length).toBeGreaterThan(0);
    expect(["completed", "failed"]).toContain(workflow.status);
  }, 15_000);

  it("lists workflows", async () => {
    const workflows = await listWorkflows({ limit: 10 });
    expect(workflows.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Operations Center
// ---------------------------------------------------------------------------

describe("Operations Center", () => {
  it("generates + retrieves operations", async () => {
    const dashboard = await generateOperations({});
    expect(dashboard.operations).toBeDefined();
    expect(dashboard.summary).toBeDefined();
    expect(typeof dashboard.summary.totalOpen).toBe("number");
    expect(dashboard.generatedAt).toBeTruthy();

    // Retrieve operations
    const ops = await getOperations({ limit: 50 });
    expect(ops.length).toBeGreaterThan(0);
  }, 15_000);
});
