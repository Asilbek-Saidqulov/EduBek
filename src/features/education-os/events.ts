/**
 * EduBek — Education OS Event Bus extensions.
 *
 * Phase 4F.6: Adds 8 new domain event types to the existing event bus
 * (Phase 4E.0) so the Automation Engine can react to them:
 *
 *   • ResourceCreated          — new resource published
 *   • QuizCompleted            — student finished a quiz
 *   • LessonGenerated          — AI generated a new lesson
 *   • TranslationCreated       — new translation added
 *   • MarketplacePurchase      — user purchased a marketplace resource
 *   • StudySessionCompleted    — student finished a study session
 *   • KnowledgeHealthUpdated   — org knowledge health snapshot refreshed
 *   • OrganizationSnapshotCreated — org analytics snapshot persisted
 *
 * Each event is a typed `DomainEvent` payload. Producers publish them
 * via the existing `eventBus.publish()` API; subscribers register via
 * `eventBus.subscribe(type, handler)` (handled by the Automation Engine).
 */
import type { DomainEvent } from "@/infra/event-bus/events";

// ---------------------------------------------------------------------------
// Event type constants
// ---------------------------------------------------------------------------

export const RESOURCE_CREATED_EVENT = "ResourceCreated";
export const QUIZ_COMPLETED_EVENT = "QuizCompleted";
export const LESSON_GENERATED_EVENT = "LessonGenerated";
export const TRANSLATION_CREATED_EVENT = "TranslationCreated";
export const MARKETPLACE_PURCHASE_EVENT = "MarketplacePurchase";
export const STUDY_SESSION_COMPLETED_EVENT = "StudySessionCompleted";
export const KNOWLEDGE_HEALTH_UPDATED_EVENT = "KnowledgeHealthUpdated";
export const ORGANIZATION_SNAPSHOT_CREATED_EVENT = "OrganizationSnapshotCreated";

// ---------------------------------------------------------------------------
// Event payload interfaces
// ---------------------------------------------------------------------------

export interface ResourceCreatedEvent extends DomainEvent<typeof RESOURCE_CREATED_EVENT> {
  resourceType: string; // 'quiz' | 'worksheet' | 'lesson_plan' | ...
  resourceId: string;
  title: string;
  subject?: string;
  ownerId: string;
  orgId?: string;
  isAiGenerated: boolean;
}

export interface QuizCompletedEvent extends DomainEvent<typeof QUIZ_COMPLETED_EVENT> {
  quizId: string;
  studentId: string;
  classroomId?: string;
  score: number; // 0-1
  passed: boolean;
  durationMs: number;
}

export interface LessonGeneratedEvent extends DomainEvent<typeof LESSON_GENERATED_EVENT> {
  lessonId: string;
  title: string;
  subject?: string;
  classroomId?: string;
  generatedBy: string; // user id
  aiModel: string;
}

export interface TranslationCreatedEvent extends DomainEvent<typeof TRANSLATION_CREATED_EVENT> {
  entityType: string;
  entityId: string;
  sourceLanguage: string;
  targetLanguage: string;
  translatorId?: string;
  isAiTranslated: boolean;
}

export interface MarketplacePurchaseEvent extends DomainEvent<typeof MARKETPLACE_PURCHASE_EVENT> {
  listingId: string;
  buyerId: string;
  creatorId: string;
  pricePaid: number;
  currency: string;
  resourceId: string;
}

export interface StudySessionCompletedEvent extends DomainEvent<typeof STUDY_SESSION_COMPLETED_EVENT> {
  sessionId: string;
  userId: string;
  durationMs: number;
  sessionType: string; // 'study' | 'review' | 'quiz' | 'ai_tutor' | ...
  conceptsCovered: string[];
  masteryGained: number;
}

export interface KnowledgeHealthUpdatedEvent extends DomainEvent<typeof KNOWLEDGE_HEALTH_UPDATED_EVENT> {
  organizationId: string;
  coverageScore: number;
  qualityScore: number;
  curriculumCompleteness: number;
  aiReadiness: number;
}

export interface OrganizationSnapshotCreatedEvent extends DomainEvent<typeof ORGANIZATION_SNAPSHOT_CREATED_EVENT> {
  organizationId: string;
  snapshotType: string; // 'class_insight' | 'org_insight' | 'knowledge_health'
  scopeId: string;
}

// ---------------------------------------------------------------------------
// Union of all Education OS events
// ---------------------------------------------------------------------------

export type EducationOsEvent =
  | ResourceCreatedEvent
  | QuizCompletedEvent
  | LessonGeneratedEvent
  | TranslationCreatedEvent
  | MarketplacePurchaseEvent
  | StudySessionCompletedEvent
  | KnowledgeHealthUpdatedEvent
  | OrganizationSnapshotCreatedEvent;

/**
 * All Education OS event type strings. Used by the Automation Engine
 * to register subscribers for each event type.
 */
export const EDUCATION_OS_EVENT_TYPES: string[] = [
  RESOURCE_CREATED_EVENT,
  QUIZ_COMPLETED_EVENT,
  LESSON_GENERATED_EVENT,
  TRANSLATION_CREATED_EVENT,
  MARKETPLACE_PURCHASE_EVENT,
  STUDY_SESSION_COMPLETED_EVENT,
  KNOWLEDGE_HEALTH_UPDATED_EVENT,
  ORGANIZATION_SNAPSHOT_CREATED_EVENT,
];

// ---------------------------------------------------------------------------
// Helper: check whether a string is a valid Education OS event type
// ---------------------------------------------------------------------------

export function isEducationOsEventType(type: string): boolean {
  return EDUCATION_OS_EVENT_TYPES.includes(type);
}
