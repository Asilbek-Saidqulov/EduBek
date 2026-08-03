/**
 * EduBek — Learning Studio types.
 * Phase 5C.2: Interactive Simulations, Virtual Labs, Math Engine,
 * Programming Workspace, AI Tutor Avatar, Learning World Builder,
 * Scenario Engine, Interactive Assessment, Content Generator,
 * Experience Composer.
 */

export type ExperienceType =
  | "simulation" | "virtual_lab" | "math_visual" | "programming"
  | "tutor_avatar" | "learning_world" | "scenario" | "interactive_assessment"
  | "content_artifact" | "composition";

export interface LearningExperienceDto {
  id: string; type: ExperienceType; title: string; description: string | null;
  subject: string | null; config: Record<string, unknown>;
  aiGenerated: boolean; aiModel: string | null;
  authorId: string; authorName: string; organizationId: string | null;
  status: "draft" | "published" | "archived";
  viewCount: number; completionCount: number;
  ratingAverage: number; ratingCount: number;
  tags: string[]; difficulty: string; estimatedMinutes: number;
  isMarketplace: boolean; priceEduTokens: number;
  createdAt: string; updatedAt: string;
}

export interface ExperienceSessionDto {
  id: string; experienceId: string; userId: string;
  state: Record<string, unknown>; status: "not_started" | "in_progress" | "completed" | "abandoned";
  progress: number; score: number | null; durationMs: number;
  interactions: Array<{ timestamp: string; type: string; data: Record<string, unknown> }>;
  startedAt: string | null; completedAt: string | null;
}

// Simulation
export interface SimulationConfigDto {
  id: string; experienceId: string | null;
  domain: string; name: string;
  parameters: Array<{ name: string; type: string; defaultValue: unknown; min?: number; max?: number; unit?: string; description?: string }>;
  initialState: Record<string, unknown>;
  equations: Array<{ name: string; expression: string; description?: string }>;
  visualization: Record<string, unknown>;
  assessment: Array<{ question: string; expectedAnswer: unknown; tolerance?: number }>;
  safetyNotes: string | null;
}

// Virtual Lab
export interface VirtualLabConfigDto {
  id: string; experienceId: string | null;
  domain: string; name: string;
  apparatus: Array<{ name: string; quantity: number; type: string }>;
  materials: Array<{ name: string; formula?: string; amount: string; unit: string; hazardLevel: string }>;
  safety: Array<{ hazard: string; precaution: string; severity: string }>;
  procedure: Array<{ step: number; instruction: string; expectedObservation?: string }>;
  measurements: Array<{ name: string; unit: string; expectedValue: number; tolerance: number }>;
  expectedOutcomes: Array<{ observation: string; explanation: string }>;
  assessment: Array<{ question: string; type: string; answer: string; points: number }>;
}

// Programming Workspace
export interface ProgrammingWorkspaceDto {
  id: string; experienceId: string | null;
  language: string; title: string; description: string | null;
  starterCode: string; solutionCode: string | null;
  testCases: Array<{ input: string; expectedOutput: string; hidden: boolean }>;
  hints: Array<{ hint: string; cost: number }>;
  aiDebugging: boolean; visualization: boolean;
  gradingConfig: Record<string, unknown>; difficulty: string;
}

// Tutor Avatar
export interface TutorAvatarConfigDto {
  id: string; experienceId: string | null;
  mode: string; name: string; subject: string | null;
  personality: Record<string, unknown>;
  knowledgeBase: Record<string, unknown>;
  conversationSettings: Record<string, unknown>;
  assessmentCriteria: string[];
  voiceConfig: Record<string, unknown>;
}

// Learning World
export interface LearningWorldDto {
  id: string; experienceId: string | null;
  name: string; description: string | null; theme: string;
  entities: Array<{ type: string; name: string; description: string; properties: Record<string, unknown>; connections: string[] }>;
  paths: Array<{ name: string; description: string; steps: string[] }>;
  assignments: Array<{ title: string; description: string; type: string; points: number }>;
  objectives: string[];
  visualConfig: Record<string, unknown>;
}

// Scenario
export interface ScenarioTaskDto {
  id: string; experienceId: string | null;
  type: string; title: string; description: string | null;
  setup: Record<string, unknown>;
  decisionPoints: Array<{ id: string; prompt: string; options: string[]; consequences: string[]; correctOption?: number }>;
  outcomes: Array<{ condition: string; result: string; feedback: string }>;
  rubric: Record<string, unknown>;
  difficulty: string; estimatedMinutes: number;
}

// Content Artifact
export interface ContentArtifactDto {
  id: string; experienceId: string | null;
  type: string; title: string; description: string | null;
  content: Record<string, unknown>;
  subject: string | null; topic: string | null;
  visualStyle: Record<string, unknown>;
  aiGenerated: boolean; outputFormat: string; fileUrl: string | null;
}

// Composition
export interface ExperienceCompositionDto {
  id: string; title: string; description: string | null;
  components: Array<{ type: string; experienceId: string; order: number; config: Record<string, unknown> }>;
  authorId: string; authorName: string; organizationId: string | null;
  status: "draft" | "published" | "archived";
  estimatedMinutes: number; tags: string[];
  viewCount: number; completionCount: number;
}
