/**
 * EduBek — RBAC permission catalogue.
 *
 * Permissions are split into three namespaces:
 *
 *   • PlatformPermission   — global, cross-tenant powers. Granted to platform
 *                            staff (SUPERADMIN, ADMIN, MODERATOR). Examples:
 *                            ban a user, moderate the marketplace, change
 *                            feature flags.
 *
 *   • OrgPermission        — scoped to a single organization. Granted via the
 *                            org's role table. Examples: invite members, read
 *                            org billing, archive any resource in the org.
 *
 *   • PersonalPermission   — self-service powers that every authenticated
 *                            user has by default, but which can be revoked
 *                            by an admin (e.g. marketplace ban). Examples:
 *                            publish a listing, manage own wallet, request a
 *                            creator payout.
 *
 * The union is `Permission`. The string form (`"users.read"`, `"org.billing.read"`,
 * …) is what we persist to `UserPermission.permission` and `OrganizationRole.permissions`.
 * Always use the enum members, never inline strings.
 */

// ---------------------------------------------------------------------------
// Platform permissions (global, staff-only)
// ---------------------------------------------------------------------------

export const PlatformPermission = {
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_BAN: "users.ban",
  USERS_DELETE: "users.delete",
  ORGS_READ_ALL: "orgs.read_all",
  ORGS_SUSPEND: "orgs.suspend",
  MARKETPLACE_MODERATE: "marketplace.moderate",
  MARKETPLACE_FEATURE: "marketplace.feature",
  SYSTEM_CONFIG: "system.config",
  SYSTEM_FEATURE_FLAGS: "system.feature_flags",
  // Phase 3C
  SUBSCRIPTION_MANAGE: "subscription.manage",
  COUPON_MANAGE: "coupon.manage",
  ANALYTICS_VIEW: "analytics.view",
  CREATOR_TIER_MANAGE: "creator.tier.manage",
  PAYMENT_MANAGE: "payment.manage",
  INVOICE_MANAGE: "invoice.manage",
  PLATFORM_ADMIN: "platform.admin",
  // Phase 4A
  CLASSROOM_MANAGE_ALL: "classroom.manage_all",
  ASSIGNMENT_MANAGE_ALL: "assignment.manage_all",
  GRADING_MANAGE_ALL: "grading.manage_all",
  // Phase 4B
  ASSESSMENT_MANAGE_ALL: "assessment.manage_all",
  CERTIFICATE_MANAGE_ALL: "certificate.manage_all",
  QUESTION_MANAGE_ALL: "question.manage_all",
  // Phase 4C
  LIVEQUIZ_MANAGE_ALL: "livequiz.manage_all",
  TOURNAMENT_MANAGE_ALL: "tournament.manage_all",
} as const;

export type PlatformPermission =
  (typeof PlatformPermission)[keyof typeof PlatformPermission];

// ---------------------------------------------------------------------------
// Org permissions (scoped to a single org)
// ---------------------------------------------------------------------------

export const OrgPermission = {
  ORG_READ: "org.read",
  ORG_UPDATE: "org.update",
  ORG_DELETE: "org.delete",
  ORG_TRANSFER_OWNERSHIP: "org.transfer_ownership",
  MEMBERS_READ: "members.read",
  MEMBERS_INVITE: "members.invite",
  MEMBERS_REMOVE: "members.remove",
  MEMBERS_UPDATE_ROLE: "members.update_role",
  ROLES_READ: "roles.read",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",
  BILLING_READ: "billing.read",
  BILLING_MANAGE: "billing.manage",
  QUIZ_CREATE: "quiz.create",
  QUIZ_PUBLISH: "quiz.publish",
  QUIZ_DELETE: "quiz.delete",
  LIBRARY_MANAGE: "library.manage",
  RESOURCE_CREATE: "resource.create",
  RESOURCE_READ: "resource.read",
  RESOURCE_UPDATE_ANY: "resource.update_any",
  RESOURCE_DELETE_ANY: "resource.delete_any",
  RESOURCE_ARCHIVE_ANY: "resource.archive_any",
  RESOURCE_DUPLICATE: "resource.duplicate",
  MARKETPLACE_PUBLISH: "marketplace.publish",
  MARKETPLACE_MANAGE: "marketplace.manage",
  MARKETPLACE_REVIEW: "marketplace.review",
  ANALYTICS_READ: "analytics.read",
  ANALYTICS_EXPORT: "analytics.export",
  // Phase 3C
  ORG_BILLING_MANAGE: "org.billing.manage",
  // Phase 4A
  ORG_CLASSROOM_MANAGE: "org.classroom.manage",
  ORG_ASSIGNMENT_MANAGE: "org.assignment.manage",
  // Phase 4B
  ORG_ASSESSMENT_MANAGE: "org.assessment.manage",
  ORG_GRADEBOOK_VIEW: "org.gradebook.view",
  ORG_CERTIFICATE_MANAGE: "org.certificate.manage",
  ORG_QUESTION_MANAGE: "org.question.manage",
  // Phase 4C
  ORG_LIVEQUIZ_MANAGE: "org.livequiz.manage",
  ORG_TOURNAMENT_MANAGE: "org.tournament.manage",
} as const;

export type OrgPermission =
  (typeof OrgPermission)[keyof typeof OrgPermission];

// ---------------------------------------------------------------------------
// Personal permissions (self-service; default-allow for authenticated users)
// ---------------------------------------------------------------------------

export const PersonalPermission = {
  MARKETPLACE_LISTING_CREATE: "marketplace.listing.create",
  MARKETPLACE_LISTING_PUBLISH: "marketplace.listing.publish",
  MARKETPLACE_LISTING_EDIT: "marketplace.listing.edit",
  MARKETPLACE_LISTING_DELETE: "marketplace.listing.delete",
  WALLET_READ: "wallet.read",
  WALLET_TRANSFER: "wallet.transfer",
  CREATOR_PROFILE_MANAGE: "creator.profile.manage",
  CREATOR_PAYOUTS_REQUEST: "creator.payouts.request",
  RESOURCE_CREATE: "resource.create",
  RESOURCE_UPDATE_OWN: "resource.update_own",
  RESOURCE_DELETE_OWN: "resource.delete_own",
  RESOURCE_ARCHIVE_OWN: "resource.archive_own",
  RESOURCE_DUPLICATE: "resource.duplicate",
  MARKETPLACE_PUBLISH: "marketplace.publish",
  MARKETPLACE_FAVORITE: "marketplace.favorite",
  MARKETPLACE_VIEW: "marketplace.view",
  WALLET_VIEW: "wallet.view",
  MARKETPLACE_PURCHASE: "marketplace.purchase",
  REVIEW_CREATE: "review.create",
  REVIEW_UPDATE_OWN: "review.update_own",
  REVIEW_DELETE_OWN: "review.delete_own",
  WISHLIST_MANAGE: "wishlist.manage",
  CREATOR_VIEW_DASHBOARD: "creator.view_dashboard",
  CREATOR_REQUEST_PAYOUT: "creator.request_payout",
  // Phase 3C
  SUBSCRIPTION_VIEW: "subscription.view",
  SUBSCRIPTION_MANAGE_SELF: "subscription.manage_self",
  COUPON_VIEW: "coupon.view",
  COUPON_REDEEM: "coupon.redeem",
  INVOICE_VIEW: "invoice.view",
  ANALYTICS_VIEW_OWN: "analytics.view_own",
  // Phase 4A
  CLASSROOM_MANAGE: "classroom.manage",
  ASSIGNMENT_MANAGE: "assignment.manage",
  GRADING_MANAGE: "grading.manage",
  PROGRESS_VIEW: "progress.view",
  ASSIGNMENT_VIEW: "assignment.view",
  ASSIGNMENT_SUBMIT: "assignment.submit",
  SUBMISSION_VIEW_OWN: "submission.view_own",
  PROGRESS_VIEW_OWN: "progress.view_own",
  // Phase 4B — Teacher
  ASSESSMENT_MANAGE: "assessment.manage",
  EXAM_MANAGE: "exam.manage",
  QUESTION_MANAGE: "question.manage",
  GRADEBOOK_VIEW: "gradebook.view",
  CERTIFICATE_ISSUE: "certificate.issue",
  RUBRIC_MANAGE: "rubric.manage",
  PROCTORING_VIEW: "proctoring.view",
  PLAGIARISM_VIEW: "plagiarism.view",
  // Phase 4B — Student
  ASSESSMENT_TAKE: "assessment.take",
  EXAM_TAKE: "exam.take",
  CERTIFICATE_VIEW_OWN: "certificate.view_own",
  GRADEBOOK_VIEW_OWN: "gradebook.view_own",
  // Phase 4C — Live Quiz Engine
  LIVEQUIZ_HOST: "livequiz.host",
  LIVEQUIZ_JOIN: "livequiz.join",
  LIVEQUIZ_SPECTATE: "livequiz.spectate",
  LIVEQUIZ_MANAGE: "livequiz.manage",
  TOURNAMENT_MANAGE: "tournament.manage",
  REPLAY_VIEW: "replay.view",
  ANALYTICS_LIVE_VIEW: "analytics.live.view",
} as const;

export type PersonalPermission =
  (typeof PersonalPermission)[keyof typeof PersonalPermission];

// ---------------------------------------------------------------------------
// Union + catalogue
// ---------------------------------------------------------------------------

export type Permission =
  | PlatformPermission
  | OrgPermission
  | PersonalPermission;

/**
 * The full catalogue. Used by the seed scripts and by the UI to render the
 * permission matrix. Order matters — keep platform first, then org, then
 * personal, so that the UI can group permissions by namespace.
 */
export const PERMISSIONS: readonly Permission[] = Object.freeze([
  ...Object.values(PlatformPermission),
  ...Object.values(OrgPermission),
  ...Object.values(PersonalPermission),
]);

const PERMISSION_SET: ReadonlySet<string> = new Set(
  PERMISSIONS.map((p) => p as string),
);

/** Type guard — true when `value` is one of the canonical permission strings. */
export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && PERMISSION_SET.has(value);
}
