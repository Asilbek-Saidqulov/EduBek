import { describe, it, expect } from "vitest";
import {
  getGeneralModel,
  getTutorModel,
  DEFAULT_GENERAL_MODEL,
  DEFAULT_TUTOR_MODEL,
  cleanModelOutputText,
} from "@/lib/ai";
import {
  formatStudentMemoryForPrompt,
  type StudentMemoryProfile,
} from "@/lib/tutor/student-memory";
import {
  createEmptyBlackboardDocument,
  applySingleToolCall,
} from "@/lib/tutor/blackboard-state";

describe("EduBek AI Model Migration & Tutor Intelligence Tests", () => {
  describe("Model Routing Defaults", () => {
    it("assigns DeepSeek V4 Flash as the default general AI model", () => {
      expect(DEFAULT_GENERAL_MODEL).toBe("deepseek/deepseek-v4-flash-0731");
      expect(getGeneralModel()).toBe("deepseek/deepseek-v4-flash-0731");
    });

    it("assigns Qwen3.5-Flash as the default AI Tutor model", () => {
      expect(DEFAULT_TUTOR_MODEL).toBe("qwen/qwen3.5-flash-02-23");
      expect(getTutorModel()).toBe("qwen/qwen3.5-flash-02-23");
    });
  });

  describe("Reasoning / Thinking Output Sanitizer", () => {
    it("strips <think> tags and internal reasoning thoughts cleanly", () => {
      const raw = "<think>\nThinking about quadratic formula...\nLet's check the discriminant.\n</think>\n\nTo solve the quadratic equation $2x^2 + 5x - 3 = 0$, we use the quadratic formula.";
      const cleaned = cleanModelOutputText(raw);
      expect(cleaned).not.toContain("<think>");
      expect(cleaned).not.toContain("Thinking about quadratic formula");
      expect(cleaned).toBe("To solve the quadratic equation $2x^2 + 5x - 3 = 0$, we use the quadratic formula.");
    });

    it("handles Thinking Process preamble blocks", () => {
      const raw = "Thinking Process:\n1. Analyze student error\n2. Provide hint\n</think>\n\nLet us break this down step by step.";
      const cleaned = cleanModelOutputText(raw);
      expect(cleaned).toBe("Let us break this down step by step.");
    });
  });

  describe("Persistent Student Memory System", () => {
    it("formats student memory profile into a rich, structured pedagogical prompt block", () => {
      const mockProfile: StudentMemoryProfile = {
        userId: "user-123",
        name: "Azizbek",
        locale: "uz",
        gradeLevel: "Grade 9",
        preferredDifficulty: "intermediate",
        strengths: ["Linear Equations", "Kinematics formulas"],
        weaknesses: ["Quadratic formula sign errors", "Vectors addition"],
        misconceptions: ["Confuses velocity with acceleration"],
        masteredTopics: ["Algebraic simplification"],
        weakTopics: ["Trigonometry ratios"],
        learningPreferences: ["Step-by-step Socratic explanations"],
        goals: ["Score 90%+ on National Olympiad"],
        recentQuizMistakes: [
          {
            quizTitle: "Quadratic Equations Diagnostic",
            score: 3,
            maxScore: 5,
          },
        ],
        recentNotesCount: 4,
      };

      const promptBlock = formatStudentMemoryForPrompt(mockProfile, "uz");

      expect(promptBlock).toContain("STUDENT MEMORY");
      expect(promptBlock).toContain("Azizbek");
      expect(promptBlock).toContain("Quadratic formula sign errors");
      expect(promptBlock).toContain("Confuses velocity with acceleration");
      expect(promptBlock).toContain("Linear Equations");
      expect(promptBlock).toContain("Score 90%+ on National Olympiad");
      expect(promptBlock).toContain("Quadratic Equations Diagnostic (3/5 pts)");
      expect(promptBlock).toContain("PEDAGOGICAL INSTRUCTION");
    });
  });

  describe("Living Blackboard Tool Mutation Integration", () => {
    it("applies set_title tool call properly to blackboard document", () => {
      let doc = createEmptyBlackboardDocument();
      doc = applySingleToolCall(doc, "set_title", {
        title: "Newton's Laws of Motion",
        subject: "Physics",
        topic: "Classical Mechanics",
      });

      expect(doc.title).toBe("Newton's Laws of Motion");
      expect(doc.subject).toBe("Physics");
      expect(doc.topic).toBe("Classical Mechanics");
    });

    it("applies add_section and add_checkpoint correctly", () => {
      let doc = createEmptyBlackboardDocument("Newton's Laws", "Physics", "Mechanics");

      doc = applySingleToolCall(doc, "add_section", {
        type: "concept",
        title: "First Law: Inertia",
        content: "An object will remain at rest or in uniform motion in a straight line unless acted upon by an external net force.",
        highlighted: true,
      });

      expect(doc.sections.length).toBe(1);
      expect(doc.sections[0].type).toBe("concept");
      expect(doc.sections[0].title).toBe("First Law: Inertia");
      expect(doc.sections[0].highlighted).toBe(true);

      doc = applySingleToolCall(doc, "add_checkpoint", {
        checkpointId: "cp_1",
        question: "If net force on an object is zero, what is its acceleration?",
        options: ["0 m/s^2", "9.8 m/s^2", "Constant velocity", "Cannot be determined"],
        correctIndex: 0,
        explanation: "By Newton's Second Law $F = ma$, when $F_{net} = 0$, acceleration $a$ must be $0$.",
      });

      expect(doc.sections.length).toBe(2);
      expect(doc.sections[1].type).toBe("checkpoint");
      expect(doc.sections[1].title).toBe("Interactive Concept Check");
    });
  });
});
