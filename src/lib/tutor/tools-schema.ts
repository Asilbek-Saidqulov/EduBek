import { z } from "zod";
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";

// 1. Zod Schemas for Runtime Validation & Intent Guardrails
export const SetTitleInputSchema = z.object({
  title: z.string().min(1).max(150).describe("The clear, educational title of the lesson document."),
  subject: z.string().optional().describe("Subject area, e.g., 'Physics', 'Mathematics', 'Computer Science'."),
  topic: z.string().optional().describe("Specific curriculum topic, e.g., 'Kinematics', 'Quadratic Equations'."),
});

export const AddSectionInputSchema = z.object({
  id: z.string().optional().describe("Unique section identifier. If omitted, will be auto-generated."),
  type: z
    .enum(["concept", "explanation", "derivation", "example", "diagram", "checkpoint", "summary"])
    .describe("Pedagogical category of this section."),
  title: z.string().min(1).max(150).describe("Clear heading for the section."),
  content: z
    .string()
    .describe("Formatted content in standard Markdown with LaTeX mathematics ($inline$ or $$block$$)."),
  highlighted: z.boolean().optional().describe("Set to true if this is currently the active focus of discussion."),
});

export const UpdateSectionInputSchema = z.object({
  id: z.string().describe("The ID of the existing section to modify or append to."),
  title: z.string().optional().describe("Updated heading if changing."),
  content: z.string().optional().describe("Updated Markdown and LaTeX content."),
  type: z
    .enum(["concept", "explanation", "derivation", "example", "diagram", "checkpoint", "summary"])
    .optional(),
  highlighted: z.boolean().optional().describe("Whether this section should be visually highlighted."),
});

export const DeleteSectionInputSchema = z.object({
  id: z.string().describe("ID of the section to delete from the blackboard."),
});

export const HighlightSectionInputSchema = z.object({
  id: z.string().describe("ID of the section to highlight or unhighlight."),
  highlighted: z.boolean().describe("true to highlight as active step, false to unhighlight."),
});

export const InsertDiagramInputSchema = z.object({
  sectionId: z.string().optional().describe("Optional custom section ID."),
  title: z.string().min(1).max(150).describe("Descriptive title for the diagram or chart."),
  diagramType: z
    .enum(["coordinate_graph", "flowchart", "geometry", "circuit", "hierarchy", "custom_svg"])
    .describe("Category of educational diagram."),
  svg: z
    .string()
    .min(10)
    .describe("Clean, valid SVG code representing the visual diagram. Must include viewBox and responsive width/height."),
  caption: z.string().optional().describe("Optional caption explaining key visual details."),
});

export const AddCheckpointInputSchema = z.object({
  checkpointId: z.string().optional().describe("Optional unique checkpoint ID."),
  title: z.string().optional().describe("Optional title for this concept check."),
  question: z.string().min(5).describe("Clear multiple choice question testing the concept just covered."),
  options: z.array(z.string()).min(2).max(5).describe("Array of 2-4 possible answer choices."),
  correctIndex: z.number().int().min(0).max(4).describe("0-based index of the correct answer option."),
  explanation: z
    .string()
    .min(5)
    .describe("Pedagogical explanation of why the correct option is right and others are incorrect."),
});

export const AnswerCheckpointInputSchema = z.object({
  checkpointId: z.string().describe("The ID of the checkpoint being answered."),
  answeredIndex: z.number().int().min(0).max(4).describe("The 0-based index of the chosen option."),
});

export const GetContextInputSchema = z.object({
  topic: z.string().optional().describe("Specific topic or concept to look up in student performance history."),
  includeQuizMistakes: z
    .boolean()
    .optional()
    .describe("Whether to retrieve recent quiz questions that the student answered incorrectly."),
  includeProfile: z
    .boolean()
    .optional()
    .describe("Whether to retrieve the student's learning profile, preferred difficulty, and grade level."),
  includeResources: z
    .boolean()
    .optional()
    .describe("Whether to find relevant library notes or syllabus materials for this topic."),
});

export const SaveLessonInputSchema = z.object({
  title: z.string().optional().describe("Title for the saved lesson note. If omitted, uses current document title."),
  visibility: z.enum(["private", "org", "public"]).optional().describe("Visibility of saved resource."),
});

export type SetTitleInput = z.infer<typeof SetTitleInputSchema>;
export type AddSectionInput = z.infer<typeof AddSectionInputSchema>;
export type UpdateSectionInput = z.infer<typeof UpdateSectionInputSchema>;
export type DeleteSectionInput = z.infer<typeof DeleteSectionInputSchema>;
export type HighlightSectionInput = z.infer<typeof HighlightSectionInputSchema>;
export type InsertDiagramInput = z.infer<typeof InsertDiagramInputSchema>;
export type AddCheckpointInput = z.infer<typeof AddCheckpointInputSchema>;
export type AnswerCheckpointInput = z.infer<typeof AnswerCheckpointInputSchema>;
export type GetContextInput = z.infer<typeof GetContextInputSchema>;
export type SaveLessonInput = z.infer<typeof SaveLessonInputSchema>;

// 2. Gemini Function Declarations for Tool Calling
export const tutorToolDeclarations: FunctionDeclaration[] = [
  {
    name: "set_title",
    description: "Sets or updates the primary title and curriculum metadata of the student's lesson blackboard.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Clear, concise title for this educational lesson.",
        },
        subject: {
          type: Type.STRING,
          description: "Curriculum subject (e.g. Physics, Mathematics, Biology, Computer Science).",
        },
        topic: {
          type: Type.STRING,
          description: "Specific topic name.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "add_section",
    description:
      "Adds a structured section to the living blackboard. Use LaTeX ($...$ or $$...$$) for formulas, theorems, and mathematical derivations.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Optional semantic ID for this section (e.g. 'newton_second_law').",
        },
        type: {
          type: Type.STRING,
          description:
            "Section type: 'concept' (core idea), 'explanation' (in-depth description), 'derivation' (mathematical steps), 'example' (worked problem), 'summary' (takeaways).",
        },
        title: {
          type: Type.STRING,
          description: "Section heading.",
        },
        content: {
          type: Type.STRING,
          description: "Markdown text with LaTeX mathematical expressions.",
        },
        highlighted: {
          type: Type.BOOLEAN,
          description: "Set to true if this section is the current focus of the tutor's spoken explanation.",
        },
      },
      required: ["type", "title", "content"],
    },
  },
  {
    name: "update_section",
    description: "Updates or appends content to an existing section on the student's blackboard.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "ID of the target section to update.",
        },
        title: {
          type: Type.STRING,
          description: "Updated title if applicable.",
        },
        content: {
          type: Type.STRING,
          description: "Updated or appended Markdown and LaTeX content.",
        },
        type: {
          type: Type.STRING,
          description: "Optional updated type.",
        },
        highlighted: {
          type: Type.BOOLEAN,
          description: "Whether to highlight this section.",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_section",
    description: "Deletes an obsolete or scratch section from the student's blackboard by its ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "ID of the section to remove.",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "highlight_section",
    description: "Highlights a specific section on the blackboard to direct student attention while explaining.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "ID of the section to highlight.",
        },
        highlighted: {
          type: Type.BOOLEAN,
          description: "true to highlight, false to return to normal appearance.",
        },
      },
      required: ["id", "highlighted"],
    },
  },
  {
    name: "insert_diagram",
    description:
      "Inserts a crisp, educational SVG diagram (coordinate graphs, geometric shapes, flowcharts, circuits, force vectors) onto the blackboard.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Title of the diagram.",
        },
        diagramType: {
          type: Type.STRING,
          description:
            "Category: 'coordinate_graph', 'geometry', 'flowchart', 'circuit', 'hierarchy', or 'custom_svg'.",
        },
        svg: {
          type: Type.STRING,
          description:
            "Complete, valid SVG string with viewBox (e.g. viewBox='0 0 400 240'). Must use clean semantic strokes and labels.",
        },
        caption: {
          type: Type.STRING,
          description: "Brief educational caption explaining the diagram.",
        },
      },
      required: ["title", "diagramType", "svg"],
    },
  },
  {
    name: "add_checkpoint",
    description:
      "Inserts an interactive multiple-choice checkpoint card into the blackboard to test whether the student understood the concept.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Optional checkpoint title.",
        },
        question: {
          type: Type.STRING,
          description: "The conceptual or problem-solving question.",
        },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of 2-4 answer options.",
        },
        correctIndex: {
          type: Type.INTEGER,
          description: "0-based index of the correct answer option.",
        },
        explanation: {
          type: Type.STRING,
          description: "Detailed explanation of why the correct option is right.",
        },
      },
      required: ["question", "options", "correctIndex", "explanation"],
    },
  },
  {
    name: "get_context",
    description:
      "Fetches relevant context about the student, including their grade level, preferred language, recent quiz mistakes/remediations, or saved library notes.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description: "Topic to query for mistakes or previous notes.",
        },
        includeQuizMistakes: {
          type: Type.BOOLEAN,
          description: "Set to true to retrieve questions the student struggled with on recent quizzes.",
        },
        includeProfile: {
          type: Type.BOOLEAN,
          description: "Set to true to retrieve student preferences and mastery stats.",
        },
        includeResources: {
          type: Type.BOOLEAN,
          description: "Set to true to check for existing related notes in their library.",
        },
      },
    },
  },
  {
    name: "save_lesson",
    description: "Saves the current living blackboard lesson as a persistent note in the student's EduBek library.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Optional title for the saved note.",
        },
        visibility: {
          type: Type.STRING,
          description: "'private', 'org', or 'public'. Defaults to 'private'.",
        },
      },
    },
  },
];

