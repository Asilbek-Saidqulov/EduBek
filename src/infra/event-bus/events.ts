/**
 * EduBek — Domain Events.
 *
 * Every meaningful state transition in the platform is announced as a
 * `DomainEvent`. Producers (services) `publish()` events; consumers
 * (audit logger, notification service, analytics aggregator, search index
 * updater, …) `subscribe()` to them.
 *
 * The event bus is *in-process* (see `src/infra/event-bus/index.ts`):
 * events are not persisted and are not delivered across instances. That is
 * intentional for Phase R0 — the goal is to decouple producers from
 * consumers, not to provide reliable cross-process messaging. A later phase
 * can swap the `InMemoryEventBus` for an out-of-process transport (NATS,
 * RabbitMQ, …) without touching producers or consumers.
 *
 * Adding a new event:
 *   1. Add a `*EventType` const below.
 *   2. Add a `*Event` interface that extends `DomainEvent<...>`.
 *   3. Append the const to the `DomainEventType` union.
 *   4. Subscribe to it in the appropriate listener file.
 */

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

export interface DomainEvent<TType extends string = string> {
  /** Event type — used by listeners to filter and by the audit logger for the `action` column. */
  type: TType;
  /** When the event occurred (server clock). Always populated by `buildEvent`. */
  occurredAt: Date;
  /** The user (or system) that triggered the event. May be undefined for system events. */
  actorId?: string;
  /** Request IP when available — populated by the calling service from request headers. */
  ipAddress?: string;
  /** User-Agent when available. */
  userAgent?: string;
}

/** Build a typed event with sensible defaults (occurredAt = now). */
export function buildEvent<T extends DomainEvent>(
  partial: Omit<T, "occurredAt"> & Partial<Pick<T, "occurredAt">>,
): T {
  return {
    ...partial,
    occurredAt: partial.occurredAt ?? new Date(),
  } as T;
}

// ---------------------------------------------------------------------------
// Auth events
// ---------------------------------------------------------------------------

export const USER_REGISTERED = "user.registered" as const;
export const USER_LOGGED_IN = "user.logged_in" as const;
export const USER_LOGGED_OUT = "user.logged_out" as const;

export interface UserRegisteredEvent extends DomainEvent<typeof USER_REGISTERED> {
  userId: string;
  email: string;
  name?: string;
}
export interface UserLoggedInEvent extends DomainEvent<typeof USER_LOGGED_IN> {
  userId: string;
  email: string;
}
export interface UserLoggedOutEvent extends DomainEvent<typeof USER_LOGGED_OUT> {
  userId: string;
}

// ---------------------------------------------------------------------------
// Organization events
// ---------------------------------------------------------------------------

export const ORGANIZATION_CREATED = "organization.created" as const;
export const MEMBER_INVITED = "organization.member_invited" as const;
export const INVITATION_ACCEPTED = "organization.invitation_accepted" as const;

export interface OrganizationCreatedEvent
  extends DomainEvent<typeof ORGANIZATION_CREATED> {
  orgId: string;
  slug: string;
  name: string;
  ownerId: string;
}
export interface MemberInvitedEvent
  extends DomainEvent<typeof MEMBER_INVITED> {
  orgId: string;
  orgSlug: string;
  inviteeEmail: string;
  invitationToken: string;
  invitedBy: string;
  roleName?: string;
}
export interface InvitationAcceptedEvent
  extends DomainEvent<typeof INVITATION_ACCEPTED> {
  orgId: string;
  orgSlug: string;
  userId: string;
  email: string;
  roleName?: string;
}

// ---------------------------------------------------------------------------
// Resource events
// ---------------------------------------------------------------------------

export const RESOURCE_CREATED = "resource.created" as const;
export const RESOURCE_UPDATED = "resource.updated" as const;
export const RESOURCE_ARCHIVED = "resource.archived" as const;
export const RESOURCE_RESTORED = "resource.restored" as const;
export const RESOURCE_DUPLICATED = "resource.duplicated" as const;

export interface ResourceEvent
  extends DomainEvent<
    | typeof RESOURCE_CREATED
    | typeof RESOURCE_UPDATED
    | typeof RESOURCE_ARCHIVED
    | typeof RESOURCE_RESTORED
    | typeof RESOURCE_DUPLICATED
  > {
  resourceId: string;
  resourceType: string;
  ownerId?: string;
  orgId?: string;
}

// ---------------------------------------------------------------------------
// Collection events
// ---------------------------------------------------------------------------

export const COLLECTION_CREATED = "collection.created" as const;
export const COLLECTION_UPDATED = "collection.updated" as const;
export const COLLECTION_DELETED = "collection.deleted" as const;

export interface CollectionEvent
  extends DomainEvent<
    | typeof COLLECTION_CREATED
    | typeof COLLECTION_UPDATED
    | typeof COLLECTION_DELETED
  > {
  collectionId: string;
  libraryId: string;
  ownerId?: string;
}

// ---------------------------------------------------------------------------
// Sharing events
// ---------------------------------------------------------------------------

export const RESOURCE_SHARED = "sharing.resource_shared" as const;
export const RESOURCE_EXPORTED = "sharing.resource_exported" as const;
export const RESOURCE_IMPORTED = "sharing.resource_imported" as const;
export const VERSION_RESTORED = "sharing.version_restored" as const;
export const BULK_OPERATION_COMPLETED = "sharing.bulk_operation_completed" as const;

export interface SharingEvent
  extends DomainEvent<
    | typeof RESOURCE_SHARED
    | typeof RESOURCE_EXPORTED
    | typeof RESOURCE_IMPORTED
    | typeof VERSION_RESTORED
    | typeof BULK_OPERATION_COMPLETED
  > {
  resourceId?: string;
  resourceType?: string;
  targetUserId?: string;
  orgId?: string;
  operation?: string;
  count?: number;
}

// ---------------------------------------------------------------------------
// AI events
// ---------------------------------------------------------------------------

export const AI_GENERATION_STARTED = "ai.generation_started" as const;
export const AI_GENERATION_COMPLETED = "ai.generation_completed" as const;
export const AI_GENERATION_FAILED = "ai.generation_failed" as const;
export const AI_RESOURCE_CREATED = "ai.resource_created" as const;
export const AI_RESOURCE_UPDATED = "ai.resource_updated" as const;
export const AI_RESOURCE_CONVERTED = "ai.resource_converted" as const;
export const PROMPT_TEMPLATE_USED = "ai.prompt_template_used" as const;
export const AI_PROVIDER_SELECTED = "ai.provider_selected" as const;

export interface AiEvent
  extends DomainEvent<
    | typeof AI_GENERATION_STARTED
    | typeof AI_GENERATION_COMPLETED
    | typeof AI_GENERATION_FAILED
    | typeof AI_RESOURCE_CREATED
    | typeof AI_RESOURCE_UPDATED
    | typeof AI_RESOURCE_CONVERTED
    | typeof PROMPT_TEMPLATE_USED
    | typeof AI_PROVIDER_SELECTED
  > {
  userId: string;
  conversationId?: string;
  provider?: string;
  model?: string;
  promptName?: string;
  resourceType?: string;
  resourceId?: string;
  durationMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Marketplace events
// ---------------------------------------------------------------------------

export const LISTING_CREATED = "marketplace.listing_created" as const;
export const LISTING_UPDATED = "marketplace.listing_updated" as const;
export const LISTING_SUBMITTED = "marketplace.listing_submitted" as const;
export const LISTING_APPROVED = "marketplace.listing_approved" as const;
export const LISTING_PUBLISHED = "marketplace.listing_published" as const;
export const LISTING_UNPUBLISHED = "marketplace.listing_unpublished" as const;
export const LISTING_ARCHIVED = "marketplace.listing_archived" as const;
export const LISTING_FAVORITED = "marketplace.listing_favorited" as const;
export const LISTING_UNFAVORITED = "marketplace.listing_unfavorited" as const;
export const LISTING_VIEWED = "marketplace.listing_viewed" as const;

export interface MarketplaceListingEvent
  extends DomainEvent<
    | typeof LISTING_CREATED
    | typeof LISTING_UPDATED
    | typeof LISTING_SUBMITTED
    | typeof LISTING_APPROVED
    | typeof LISTING_PUBLISHED
    | typeof LISTING_UNPUBLISHED
    | typeof LISTING_ARCHIVED
    | typeof LISTING_FAVORITED
    | typeof LISTING_UNFAVORITED
    | typeof LISTING_VIEWED
  > {
  listingId: string;
  sellerId?: string;
  viewerId?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// Commerce events
// ---------------------------------------------------------------------------

export const PURCHASE_STARTED = "commerce.purchase_started" as const;
export const PURCHASE_COMPLETED = "commerce.purchase_completed" as const;
export const PURCHASE_FAILED = "commerce.purchase_failed" as const;
export const PURCHASE_REFUNDED = "commerce.purchase_refunded" as const;
export const WALLET_CREDITED = "commerce.wallet_credited" as const;
export const WALLET_DEBITED = "commerce.wallet_debited" as const;
export const LEDGER_ENTRY_CREATED = "commerce.ledger_entry_created" as const;
export const CREATOR_EARNING_CREATED = "commerce.creator_earning_created" as const;
export const CREATOR_PAYOUT_REQUESTED = "commerce.creator_payout_requested" as const;
export const REVIEW_CREATED = "commerce.review_created" as const;
export const REVIEW_UPDATED = "commerce.review_updated" as const;
export const REVIEW_DELETED = "commerce.review_deleted" as const;
export const WISHLIST_ADDED = "commerce.wishlist_added" as const;
export const WISHLIST_REMOVED = "commerce.wishlist_removed" as const;

export interface CommerceEvent
  extends DomainEvent<
    | typeof PURCHASE_STARTED
    | typeof PURCHASE_COMPLETED
    | typeof PURCHASE_FAILED
    | typeof PURCHASE_REFUNDED
    | typeof WALLET_CREDITED
    | typeof WALLET_DEBITED
    | typeof LEDGER_ENTRY_CREATED
    | typeof CREATOR_EARNING_CREATED
    | typeof CREATOR_PAYOUT_REQUESTED
    | typeof REVIEW_CREATED
    | typeof REVIEW_UPDATED
    | typeof REVIEW_DELETED
    | typeof WISHLIST_ADDED
    | typeof WISHLIST_REMOVED
  > {
  userId?: string;
  sellerId?: string;
  buyerId?: string;
  creatorId?: string;
  listingId?: string;
  purchaseId?: string;
  walletId?: string;
  ledgerEntryId?: string;
  reviewId?: string;
  amount?: number;
  currency?: string;
  eduTokens?: number;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Subscription events
// ---------------------------------------------------------------------------

export const SUBSCRIPTION_STARTED = "subscription.started" as const;
export const SUBSCRIPTION_RENEWED = "subscription.renewed" as const;
export const SUBSCRIPTION_CANCELLED = "subscription.cancelled" as const;
export const SUBSCRIPTION_EXPIRED = "subscription.expired" as const;
export const SUBSCRIPTION_UPGRADED = "subscription.upgraded" as const;
export const SUBSCRIPTION_DOWNGRADED = "subscription.downgraded" as const;

export interface SubscriptionEvent
  extends DomainEvent<
    | typeof SUBSCRIPTION_STARTED
    | typeof SUBSCRIPTION_RENEWED
    | typeof SUBSCRIPTION_CANCELLED
    | typeof SUBSCRIPTION_EXPIRED
    | typeof SUBSCRIPTION_UPGRADED
    | typeof SUBSCRIPTION_DOWNGRADED
  > {
  userId: string;
  subscriptionId: string;
  planId?: string;
  planTier?: string;
}

// ---------------------------------------------------------------------------
// Coupon events
// ---------------------------------------------------------------------------

export const COUPON_CREATED = "coupon.created" as const;
export const COUPON_USED = "coupon.used" as const;
export const COUPON_EXPIRED = "coupon.expired" as const;

export interface CouponEvent
  extends DomainEvent<
    | typeof COUPON_CREATED
    | typeof COUPON_USED
    | typeof COUPON_EXPIRED
  > {
  couponId: string;
  code: string;
  userId?: string;
  orderId?: string;
  discountAmount?: number;
}

// ---------------------------------------------------------------------------
// Payment events
// ---------------------------------------------------------------------------

export const PAYMENT_PROVIDER_SELECTED = "payment.provider_selected" as const;
export const PAYMENT_SUCCEEDED = "payment.succeeded" as const;
export const PAYMENT_FAILED = "payment.failed" as const;

export interface PaymentEvent
  extends DomainEvent<
    | typeof PAYMENT_PROVIDER_SELECTED
    | typeof PAYMENT_SUCCEEDED
    | typeof PAYMENT_FAILED
  > {
  userId?: string;
  transactionId?: string;
  provider?: string;
  amount?: number;
  currency?: string;
  failureReason?: string;
}

// ---------------------------------------------------------------------------
// Creator tier events
// ---------------------------------------------------------------------------

export const CREATOR_TIER_CHANGED = "creator.tier_changed" as const;

export interface CreatorTierChangedEvent
  extends DomainEvent<typeof CREATOR_TIER_CHANGED> {
  creatorId: string;
  fromTierId?: string;
  toTierId: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Analytics / Invoice events
// ---------------------------------------------------------------------------

export const ANALYTICS_UPDATED = "analytics.updated" as const;
export const INVOICE_CREATED = "billing.invoice_created" as const;

export interface AnalyticsUpdatedEvent
  extends DomainEvent<typeof ANALYTICS_UPDATED> {
  entityType: string;
  entityId: string;
  day?: string;
  metrics?: Record<string, number>;
}
export interface InvoiceCreatedEvent
  extends DomainEvent<typeof INVOICE_CREATED> {
  invoiceId: string;
  userId: string;
  transactionId?: string;
  amount: number;
  currency: string;
}

export const COUPON_REDEEMED = "coupon.redeemed" as const;
export interface CouponRedeemedEvent extends DomainEvent<typeof COUPON_REDEEMED> { couponId: string; code: string; userId: string; orderId?: string; discountAmount: number }

export const INVOICE_PAID = "billing.invoice_paid" as const;
export interface InvoicePaidEvent extends DomainEvent<typeof INVOICE_PAID> { invoiceId: string; userId: string; amount: number; paymentProvider: string }

export const FEATURE_LIMIT_REACHED = "subscription.feature_limit_reached" as const;
export interface FeatureLimitReachedEvent extends DomainEvent<typeof FEATURE_LIMIT_REACHED> { userId: string; feature: string; limit: number; current: number }

export const ANALYTICS_AGGREGATED = "analytics.aggregated" as const;
export interface AnalyticsAggregatedEvent extends DomainEvent<typeof ANALYTICS_AGGREGATED> { metric: string; value: number; period: string }

// ---------------------------------------------------------------------------
// Union of all event types
// ---------------------------------------------------------------------------

export type DomainEventType =
  // auth
  | typeof USER_REGISTERED
  | typeof USER_LOGGED_IN
  | typeof USER_LOGGED_OUT
  // org
  | typeof ORGANIZATION_CREATED
  | typeof MEMBER_INVITED
  | typeof INVITATION_ACCEPTED
  // resources
  | typeof RESOURCE_CREATED
  | typeof RESOURCE_UPDATED
  | typeof RESOURCE_ARCHIVED
  | typeof RESOURCE_RESTORED
  | typeof RESOURCE_DUPLICATED
  // collections
  | typeof COLLECTION_CREATED
  | typeof COLLECTION_UPDATED
  | typeof COLLECTION_DELETED
  // sharing
  | typeof RESOURCE_SHARED
  | typeof RESOURCE_EXPORTED
  | typeof RESOURCE_IMPORTED
  | typeof VERSION_RESTORED
  | typeof BULK_OPERATION_COMPLETED
  // ai
  | typeof AI_GENERATION_STARTED
  | typeof AI_GENERATION_COMPLETED
  | typeof AI_GENERATION_FAILED
  | typeof AI_RESOURCE_CREATED
  | typeof AI_RESOURCE_UPDATED
  | typeof AI_RESOURCE_CONVERTED
  | typeof PROMPT_TEMPLATE_USED
  | typeof AI_PROVIDER_SELECTED
  // marketplace
  | typeof LISTING_CREATED
  | typeof LISTING_UPDATED
  | typeof LISTING_SUBMITTED
  | typeof LISTING_APPROVED
  | typeof LISTING_PUBLISHED
  | typeof LISTING_UNPUBLISHED
  | typeof LISTING_ARCHIVED
  | typeof LISTING_FAVORITED
  | typeof LISTING_UNFAVORITED
  | typeof LISTING_VIEWED
  // commerce
  | typeof PURCHASE_STARTED
  | typeof PURCHASE_COMPLETED
  | typeof PURCHASE_FAILED
  | typeof PURCHASE_REFUNDED
  | typeof WALLET_CREDITED
  | typeof WALLET_DEBITED
  | typeof LEDGER_ENTRY_CREATED
  | typeof CREATOR_EARNING_CREATED
  | typeof CREATOR_PAYOUT_REQUESTED
  | typeof REVIEW_CREATED
  | typeof REVIEW_UPDATED
  | typeof REVIEW_DELETED
  | typeof WISHLIST_ADDED
  | typeof WISHLIST_REMOVED
  // subscription
  | typeof SUBSCRIPTION_STARTED
  | typeof SUBSCRIPTION_RENEWED
  | typeof SUBSCRIPTION_CANCELLED
  | typeof SUBSCRIPTION_EXPIRED
  | typeof SUBSCRIPTION_UPGRADED
  | typeof SUBSCRIPTION_DOWNGRADED
  // coupon
  | typeof COUPON_CREATED
  | typeof COUPON_USED
  | typeof COUPON_EXPIRED
  // payment
  | typeof PAYMENT_PROVIDER_SELECTED
  | typeof PAYMENT_SUCCEEDED
  | typeof PAYMENT_FAILED
  // creator tier
  | typeof CREATOR_TIER_CHANGED
  // analytics / billing
  | typeof ANALYTICS_UPDATED
  | typeof INVOICE_CREATED
  | typeof COUPON_REDEEMED
  | typeof INVOICE_PAID
  | typeof FEATURE_LIMIT_REACHED
  | typeof ANALYTICS_AGGREGATED
  // Phase 4A
  | typeof CLASSROOM_CREATED
  | typeof CLASSROOM_ARCHIVED
  | typeof STUDENT_JOINED_CLASS
  | typeof STUDENT_REMOVED
  | typeof ASSIGNMENT_CREATED
  | typeof ASSIGNMENT_PUBLISHED
  | typeof ASSIGNMENT_STARTED
  | typeof ASSIGNMENT_SUBMITTED
  | typeof ASSIGNMENT_RESUBMITTED
  | typeof SUBMISSION_GRADED
  | typeof GRADE_PUBLISHED
  | typeof SUBMISSION_RETURNED
  | typeof LEARNING_SESSION_STARTED
  | typeof LEARNING_SESSION_COMPLETED
  | typeof PROGRESS_UPDATED
  | typeof ASSIGNMENT_ARCHIVED
  | typeof ASSIGNMENT_DUPLICATED
  // Phase 4B — Assessment Engine
  | typeof QUESTION_CREATED
  | typeof QUESTION_UPDATED
  | typeof QUESTION_ARCHIVED
  | typeof QUESTION_DUPLICATED
  | typeof RUBRIC_CREATED
  | typeof RUBRIC_UPDATED
  | typeof RUBRIC_DUPLICATED
  | typeof ASSESSMENT_CREATED
  | typeof ASSESSMENT_PUBLISHED
  | typeof ASSESSMENT_ARCHIVED
  | typeof ASSESSMENT_DUPLICATED
  | typeof ASSESSMENT_STARTED
  | typeof ASSESSMENT_SUBMITTED
  | typeof ASSESSMENT_AUTO_GRADED
  | typeof ASSESSMENT_MANUALLY_GRADED
  | typeof EXAM_STARTED
  | typeof EXAM_PAUSED
  | typeof EXAM_RESUMED
  | typeof EXAM_COMPLETED
  | typeof EXAM_AUTO_SUBMITTED
  | typeof EXAM_EXPIRED
  | typeof CERTIFICATE_ISSUED
  | typeof CERTIFICATE_REVOKED
  | typeof CERTIFICATE_VERIFIED
  | typeof PROCTORING_INCIDENT
  | typeof PLAGIARISM_FLAGGED
  | typeof GRADEBOOK_UPDATED
  // Phase 4C — Live Quiz Engine
  | typeof LIVE_SESSION_CREATED
  | typeof LIVE_SESSION_STARTED
  | typeof LIVE_SESSION_PAUSED
  | typeof LIVE_SESSION_RESUMED
  | typeof LIVE_SESSION_FINISHED
  | typeof LIVE_SESSION_CANCELLED
  | typeof PLAYER_JOINED
  | typeof PLAYER_LEFT
  | typeof PLAYER_ELIMINATED
  | typeof PLAYER_RECONNECTED
  | typeof HOST_MIGRATED
  | typeof ROUND_STARTED
  | typeof ROUND_FINISHED
  | typeof ANSWER_SUBMITTED
  | typeof LEADERBOARD_UPDATED
  | typeof LOBBY_CREATED
  | typeof LOBBY_LOCKED
  | typeof TOURNAMENT_CREATED
  | typeof TOURNAMENT_STARTED
  | typeof MATCH_FINISHED
  | typeof REWARD_GRANTED
  | typeof REPLAY_CREATED
  // Phase 4C.1 — Production-readiness additive events
  | typeof COUNTDOWN_PAUSED
  | typeof COUNTDOWN_SKIPPED
  | typeof TIMER_EXTENDED
  | typeof QUESTION_ENDED_EARLY
  | typeof PLAYER_READY
  | typeof PLAYER_MUTE_TOGGLED
  | typeof SESSION_STATE_SYNCED;

// ---------------------------------------------------------------------------
// Phase 4A — Student Learning Platform events
// ---------------------------------------------------------------------------

export const CLASSROOM_CREATED = "classroom.created" as const;
export interface ClassroomCreatedEvent extends DomainEvent<typeof CLASSROOM_CREATED> { classroomId: string; name: string; teacherId: string; orgId: string | null }

export const CLASSROOM_ARCHIVED = "classroom.archived" as const;
export interface ClassroomArchivedEvent extends DomainEvent<typeof CLASSROOM_ARCHIVED> { classroomId: string }

export const STUDENT_JOINED_CLASS = "classroom.student_joined" as const;
export interface StudentJoinedClassEvent extends DomainEvent<typeof STUDENT_JOINED_CLASS> { classroomId: string; studentId: string }

export const STUDENT_REMOVED = "classroom.student_removed" as const;
export interface StudentRemovedEvent extends DomainEvent<typeof STUDENT_REMOVED> { classroomId: string; studentId: string }

export const ASSIGNMENT_CREATED = "assignment.created" as const;
export interface AssignmentCreatedEvent extends DomainEvent<typeof ASSIGNMENT_CREATED> { assignmentId: string; classroomId: string; resourceId: string; title: string }

export const ASSIGNMENT_PUBLISHED = "assignment.published" as const;
export interface AssignmentPublishedEvent extends DomainEvent<typeof ASSIGNMENT_PUBLISHED> { assignmentId: string; classroomId: string; studentCount: number }

export const ASSIGNMENT_STARTED = "assignment.started" as const;
export interface AssignmentStartedEvent extends DomainEvent<typeof ASSIGNMENT_STARTED> { assignmentId: string; attemptId: string; studentId: string }

export const ASSIGNMENT_SUBMITTED = "assignment.submitted" as const;
export interface AssignmentSubmittedEvent extends DomainEvent<typeof ASSIGNMENT_SUBMITTED> { assignmentId: string; attemptId: string; studentId: string; attemptNumber: number }

export const ASSIGNMENT_RESUBMITTED = "assignment.resubmitted" as const;
export interface AssignmentResubmittedEvent extends DomainEvent<typeof ASSIGNMENT_RESUBMITTED> { assignmentId: string; attemptId: string; studentId: string; attemptNumber: number }

export const SUBMISSION_GRADED = "submission.graded" as const;
export interface SubmissionGradedEvent extends DomainEvent<typeof SUBMISSION_GRADED> { submissionId: string; attemptId: string; studentId: string; points: number; maxPoints: number }

export const GRADE_PUBLISHED = "submission.grade_published" as const;
export interface GradePublishedEvent extends DomainEvent<typeof GRADE_PUBLISHED> { submissionId: string; attemptId: string; studentId: string }

export const SUBMISSION_RETURNED = "submission.returned" as const;
export interface SubmissionReturnedEvent extends DomainEvent<typeof SUBMISSION_RETURNED> { submissionId: string; attemptId: string; studentId: string }

export const LEARNING_SESSION_STARTED = "learning.session_started" as const;
export interface LearningSessionStartedEvent extends DomainEvent<typeof LEARNING_SESSION_STARTED> { sessionId: string; studentId: string; resourceId: string | null; attemptId: string | null }

export const LEARNING_SESSION_COMPLETED = "learning.session_completed" as const;
export interface LearningSessionCompletedEvent extends DomainEvent<typeof LEARNING_SESSION_COMPLETED> { sessionId: string; studentId: string; durationMs: number }

export const PROGRESS_UPDATED = "progress.updated" as const;
export interface ProgressUpdatedEvent extends DomainEvent<typeof PROGRESS_UPDATED> { studentId: string; metric: string; value: number; classroomId: string | null }

export const ASSIGNMENT_ARCHIVED = "assignment.archived" as const;
export interface AssignmentArchivedEvent extends DomainEvent<typeof ASSIGNMENT_ARCHIVED> { assignmentId: string; classroomId: string }

export const ASSIGNMENT_DUPLICATED = "assignment.duplicated" as const;
export interface AssignmentDuplicatedEvent extends DomainEvent<typeof ASSIGNMENT_DUPLICATED> { assignmentId: string; originalAssignmentId: string; classroomId: string }

// ---------------------------------------------------------------------------
// Phase 4B — Assessment Engine events
// ---------------------------------------------------------------------------

export const QUESTION_CREATED = "question.created" as const;
export interface QuestionCreatedEvent extends DomainEvent<typeof QUESTION_CREATED> { questionId: string; ownerId: string; questionType: string; subject: string | null }

export const QUESTION_UPDATED = "question.updated" as const;
export interface QuestionUpdatedEvent extends DomainEvent<typeof QUESTION_UPDATED> { questionId: string; ownerId: string; versionNumber: number }

export const QUESTION_ARCHIVED = "question.archived" as const;
export interface QuestionArchivedEvent extends DomainEvent<typeof QUESTION_ARCHIVED> { questionId: string }

export const QUESTION_DUPLICATED = "question.duplicated" as const;
export interface QuestionDuplicatedEvent extends DomainEvent<typeof QUESTION_DUPLICATED> { questionId: string; originalQuestionId: string }

export const RUBRIC_CREATED = "rubric.created" as const;
export interface RubricCreatedEvent extends DomainEvent<typeof RUBRIC_CREATED> { rubricId: string; ownerId: string; name: string }

export const RUBRIC_UPDATED = "rubric.updated" as const;
export interface RubricUpdatedEvent extends DomainEvent<typeof RUBRIC_UPDATED> { rubricId: string }

export const RUBRIC_DUPLICATED = "rubric.duplicated" as const;
export interface RubricDuplicatedEvent extends DomainEvent<typeof RUBRIC_DUPLICATED> { rubricId: string; originalRubricId: string }

export const ASSESSMENT_CREATED = "assessment.created" as const;
export interface AssessmentCreatedEvent extends DomainEvent<typeof ASSESSMENT_CREATED> { assessmentId: string; ownerId: string; assessmentType: string; classroomId: string | null; title: string }

export const ASSESSMENT_PUBLISHED = "assessment.published" as const;
export interface AssessmentPublishedEvent extends DomainEvent<typeof ASSESSMENT_PUBLISHED> { assessmentId: string; classroomId: string | null }

export const ASSESSMENT_ARCHIVED = "assessment.archived" as const;
export interface AssessmentArchivedEvent extends DomainEvent<typeof ASSESSMENT_ARCHIVED> { assessmentId: string }

export const ASSESSMENT_DUPLICATED = "assessment.duplicated" as const;
export interface AssessmentDuplicatedEvent extends DomainEvent<typeof ASSESSMENT_DUPLICATED> { assessmentId: string; originalAssessmentId: string }

export const ASSESSMENT_STARTED = "assessment.started" as const;
export interface AssessmentStartedEvent extends DomainEvent<typeof ASSESSMENT_STARTED> { assessmentId: string; attemptId: string; studentId: string; expiresAt: string | null }

export const ASSESSMENT_SUBMITTED = "assessment.submitted" as const;
export interface AssessmentSubmittedEvent extends DomainEvent<typeof ASSESSMENT_SUBMITTED> { assessmentId: string; attemptId: string; studentId: string; attemptNumber: number }

export const ASSESSMENT_AUTO_GRADED = "assessment.auto_graded" as const;
export interface AssessmentAutoGradedEvent extends DomainEvent<typeof ASSESSMENT_AUTO_GRADED> { assessmentId: string; attemptId: string; studentId: string; score: number; pointsAwarded: number; pointsMax: number; passed: boolean | null }

export const ASSESSMENT_MANUALLY_GRADED = "assessment.manually_graded" as const;
export interface AssessmentManuallyGradedEvent extends DomainEvent<typeof ASSESSMENT_MANUALLY_GRADED> { assessmentId: string; attemptId: string; studentId: string; gradedById: string; score: number }

export const EXAM_STARTED = "exam.started" as const;
export interface ExamStartedEvent extends DomainEvent<typeof EXAM_STARTED> { assessmentId: string; attemptId: string; studentId: string; expiresAt: string }

export const EXAM_PAUSED = "exam.paused" as const;
export interface ExamPausedEvent extends DomainEvent<typeof EXAM_PAUSED> { assessmentId: string; attemptId: string; studentId: string; timeRemainingMs: number }

export const EXAM_RESUMED = "exam.resumed" as const;
export interface ExamResumedEvent extends DomainEvent<typeof EXAM_RESUMED> { assessmentId: string; attemptId: string; studentId: string }

export const EXAM_COMPLETED = "exam.completed" as const;
export interface ExamCompletedEvent extends DomainEvent<typeof EXAM_COMPLETED> { assessmentId: string; attemptId: string; studentId: string; durationMs: number }

export const EXAM_AUTO_SUBMITTED = "exam.auto_submitted" as const;
export interface ExamAutoSubmittedEvent extends DomainEvent<typeof EXAM_AUTO_SUBMITTED> { assessmentId: string; attemptId: string; studentId: string; reason: string }

export const EXAM_EXPIRED = "exam.expired" as const;
export interface ExamExpiredEvent extends DomainEvent<typeof EXAM_EXPIRED> { assessmentId: string; attemptId: string; studentId: string }

export const CERTIFICATE_ISSUED = "certificate.issued" as const;
export interface CertificateIssuedEvent extends DomainEvent<typeof CERTIFICATE_ISSUED> { certificateId: string; verificationCode: string; studentId: string; issuedById: string; assessmentId: string | null }

export const CERTIFICATE_REVOKED = "certificate.revoked" as const;
export interface CertificateRevokedEvent extends DomainEvent<typeof CERTIFICATE_REVOKED> { certificateId: string; verificationCode: string; revokedById: string; reason: string }

export const CERTIFICATE_VERIFIED = "certificate.verified" as const;
export interface CertificateVerifiedEvent extends DomainEvent<typeof CERTIFICATE_VERIFIED> { certificateId: string; verificationCode: string; verified: boolean }

export const PROCTORING_INCIDENT = "proctoring.incident" as const;
export interface ProctoringIncidentEvent extends DomainEvent<typeof PROCTORING_INCIDENT> { attemptId: string; studentId: string; incidentType: string; severity: string }

export const PLAGIARISM_FLAGGED = "plagiarism.flagged" as const;
export interface PlagiarismFlaggedEvent extends DomainEvent<typeof PLAGIARISM_FLAGGED> { reportId: string; attemptId: string; studentId: string; similarityScore: number; threshold: number }

export const GRADEBOOK_UPDATED = "gradebook.updated" as const;
export interface GradebookUpdatedEvent extends DomainEvent<typeof GRADEBOOK_UPDATED> { entryId: string; studentId: string; sourceType: string; sourceId: string; classroomId: string | null }

// ---------------------------------------------------------------------------
// Phase 4C — Live Quiz Engine events
// ---------------------------------------------------------------------------

export const LIVE_SESSION_CREATED = "live.session_created" as const;
export interface LiveSessionCreatedEvent extends DomainEvent<typeof LIVE_SESSION_CREATED> { sessionId: string; code: string; hostId: string; gameMode: string; classroomId: string | null; orgId: string | null }

export const LIVE_SESSION_STARTED = "live.session_started" as const;
export interface LiveSessionStartedEvent extends DomainEvent<typeof LIVE_SESSION_STARTED> { sessionId: string; hostId: string; playerCount: number }

export const LIVE_SESSION_PAUSED = "live.session_paused" as const;
export interface LiveSessionPausedEvent extends DomainEvent<typeof LIVE_SESSION_PAUSED> { sessionId: string; hostId: string }

export const LIVE_SESSION_RESUMED = "live.session_resumed" as const;
export interface LiveSessionResumedEvent extends DomainEvent<typeof LIVE_SESSION_RESUMED> { sessionId: string; hostId: string }

export const LIVE_SESSION_FINISHED = "live.session_finished" as const;
export interface LiveSessionFinishedEvent extends DomainEvent<typeof LIVE_SESSION_FINISHED> { sessionId: string; hostId: string; durationMs: number; playerCount: number }

export const LIVE_SESSION_CANCELLED = "live.session_cancelled" as const;
export interface LiveSessionCancelledEvent extends DomainEvent<typeof LIVE_SESSION_CANCELLED> { sessionId: string; hostId: string; reason: string }

export const PLAYER_JOINED = "live.player_joined" as const;
export interface PlayerJoinedEvent extends DomainEvent<typeof PLAYER_JOINED> { sessionId: string; playerId: string; userId: string; displayName: string; role: string }

export const PLAYER_LEFT = "live.player_left" as const;
export interface PlayerLeftEvent extends DomainEvent<typeof PLAYER_LEFT> { sessionId: string; playerId: string; userId: string; reason: string }

export const PLAYER_ELIMINATED = "live.player_eliminated" as const;
export interface PlayerEliminatedEvent extends DomainEvent<typeof PLAYER_ELIMINATED> { sessionId: string; playerId: string; userId: string; roundNumber: number; reason: string }

export const PLAYER_RECONNECTED = "live.player_reconnected" as const;
export interface PlayerReconnectedEvent extends DomainEvent<typeof PLAYER_RECONNECTED> { sessionId: string; playerId: string; userId: string }

export const HOST_MIGRATED = "live.host_migrated" as const;
export interface HostMigratedEvent extends DomainEvent<typeof HOST_MIGRATED> { sessionId: string; oldHostId: string; newHostId: string; reason: string }

export const ROUND_STARTED = "live.round_started" as const;
export interface RoundStartedEvent extends DomainEvent<typeof ROUND_STARTED> { sessionId: string; roundId: string; roundNumber: number; questionId: string | null; durationMs: number }

export const ROUND_FINISHED = "live.round_finished" as const;
export interface RoundFinishedEvent extends DomainEvent<typeof ROUND_FINISHED> { sessionId: string; roundId: string; roundNumber: number; answerCount: number; correctCount: number }

export const ANSWER_SUBMITTED = "live.answer_submitted" as const;
export interface AnswerSubmittedEvent extends DomainEvent<typeof ANSWER_SUBMITTED> { sessionId: string; roundId: string; playerId: string; userId: string; isCorrect: boolean; responseMs: number; pointsAwarded: number }

export const LEADERBOARD_UPDATED = "live.leaderboard_updated" as const;
export interface LeaderboardUpdatedEvent extends DomainEvent<typeof LEADERBOARD_UPDATED> { sessionId: string; roundNumber: number; topPlayerId: string | null; playerCount: number }

export const LOBBY_CREATED = "live.lobby_created" as const;
export interface LobbyCreatedEvent extends DomainEvent<typeof LOBBY_CREATED> { lobbyId: string; sessionId: string; joinCode: string; visibility: string }

export const LOBBY_LOCKED = "live.lobby_locked" as const;
export interface LobbyLockedEvent extends DomainEvent<typeof LOBBY_LOCKED> { lobbyId: string; sessionId: string }

export const TOURNAMENT_CREATED = "live.tournament_created" as const;
export interface TournamentCreatedEvent extends DomainEvent<typeof TOURNAMENT_CREATED> { tournamentId: string; name: string; hostId: string; format: string; bracketSize: number }

export const TOURNAMENT_STARTED = "live.tournament_started" as const;
export interface TournamentStartedEvent extends DomainEvent<typeof TOURNAMENT_STARTED> { tournamentId: string; participantCount: number }

export const MATCH_FINISHED = "live.match_finished" as const;
export interface MatchFinishedEvent extends DomainEvent<typeof MATCH_FINISHED> { tournamentId: string; matchId: string; winnerId: string; roundNumber: number }

export const REWARD_GRANTED = "live.reward_granted" as const;
export interface RewardGrantedEvent extends DomainEvent<typeof REWARD_GRANTED> { rewardId: string; userId: string; rewardType: string; amount: number | null; code: string | null; sessionId: string | null }

export const REPLAY_CREATED = "live.replay_created" as const;
export interface ReplayCreatedEvent extends DomainEvent<typeof REPLAY_CREATED> { replayId: string; sessionId: string; durationMs: number; eventCount: number }

// ---------------------------------------------------------------------------
// Phase 4C.1 — Production-readiness additive events
// ---------------------------------------------------------------------------

export const COUNTDOWN_PAUSED = "live.countdown_paused" as const;
export interface CountdownPausedEvent extends DomainEvent<typeof COUNTDOWN_PAUSED> { sessionId: string; hostId: string; remainingMs: number }

export const COUNTDOWN_SKIPPED = "live.countdown_skipped" as const;
export interface CountdownSkippedEvent extends DomainEvent<typeof COUNTDOWN_SKIPPED> { sessionId: string; hostId: string }

export const TIMER_EXTENDED = "live.timer_extended" as const;
export interface TimerExtendedEvent extends DomainEvent<typeof TIMER_EXTENDED> { sessionId: string; roundId: string; hostId: string; addedMs: number; newAnswerLockAt: string }

export const QUESTION_ENDED_EARLY = "live.question_ended_early" as const;
export interface QuestionEndedEarlyEvent extends DomainEvent<typeof QUESTION_ENDED_EARLY> { sessionId: string; roundId: string; hostId: string; roundNumber: number }

export const PLAYER_READY = "live.player_ready" as const;
export interface PlayerReadyEvent extends DomainEvent<typeof PLAYER_READY> { sessionId: string; playerId: string; userId: string; ready: boolean }

export const PLAYER_MUTE_TOGGLED = "live.player_mute_toggled" as const;
export interface PlayerMuteToggledEvent extends DomainEvent<typeof PLAYER_MUTE_TOGGLED> { sessionId: string; playerId: string; userId: string; muted: boolean; byHostId: string }

export const SESSION_STATE_SYNCED = "live.session_state_synced" as const;
export interface SessionStateSyncedEvent extends DomainEvent<typeof SESSION_STATE_SYNCED> { sessionId: string; playerId: string; missedEventCount: number }
