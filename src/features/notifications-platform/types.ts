/**
 * EduBek — Notification, Messaging & Communication Platform types.
 * Phase 6G.17: Single source of truth for all user communications.
 *
 * Owns ONLY: notification templates, inbox, delivery routing, preferences,
 * scheduling, analytics, announcement metadata, notification events,
 * developer notification metadata.
 *
 * Does NOT own: emails, SMS providers, push providers, chat, DMs, gameplay,
 * rewards, XP, inventory, commerce, leaderboards, moderation, campaign logic,
 * teacher messaging, organization management.
 *
 * All cross-module communication happens exclusively through the Event Bus.
 */

// ===========================================================================
// System 1 — Notification Registry
// ===========================================================================
export type NotificationCategory =
  | "system" | "social" | "competitive" | "progression" | "commerce"
  | "liveops" | "administration" | "achievement" | "maintenance" | "emergency"
  | "tournament" | "campaign" | "season" | "reminder" | "digest";

export type NotificationPriority =
  | "critical" | "high" | "medium" | "low" | "informational";

export type NotificationRegistryStatus = "active" | "draft" | "deprecated" | "retired";

export interface NotificationRegistryEntry {
  id: string; key: string; category: NotificationCategory;
  priority: NotificationPriority;
  defaultChannels: DeliveryChannelId[];
  templateId: string;
  status: NotificationRegistryStatus;
  tags: string[];
  description: string;
  version: number;
  createdAt: string; updatedAt: string;
  deprecatedAt: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 2 — Notification Templates
// ===========================================================================
export type TemplateVariableType = "string" | "number" | "boolean" | "date" | "user" | "organization" | "match" | "tournament";

export interface TemplateVariable {
  key: string; type: TemplateVariableType;
  required: boolean; defaultValue: string | null;
  description: string;
}

export interface TemplateAction {
  id: string; label: string; deepLink: string | null;
  actionType: "open" | "acknowledge" | "dismiss" | "custom";
  metadata: Record<string, unknown>;
}

export interface TemplateLocaleContent {
  title: string; body: string;
  summary: string | null;
  iconKey: string | null;
}

export interface NotificationTemplate {
  id: string; key: string;
  locales: Record<string, TemplateLocaleContent>;
  variables: TemplateVariable[];
  actions: TemplateAction[];
  defaultDeepLink: string | null;
  expirationSeconds: number | null;
  category: NotificationCategory;
  priority: NotificationPriority;
  version: number;
  createdAt: string; updatedAt: string;
  active: boolean;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 3 — Delivery Channels
// ===========================================================================
export type DeliveryChannelId =
  | "in_app" | "push" | "email" | "sms"
  | "organization_announcement" | "broadcast_overlay" | "webhook" | "developer_callback";

export type DeliveryChannelStatus = "active" | "inactive" | "maintenance" | "deprecated";

export interface DeliveryChannelConfig {
  id: DeliveryChannelId; name: string;
  status: DeliveryChannelStatus;
  supportedLocales: string[];
  maxRatePerUserPerHour: number | null;
  supportsRichContent: boolean;
  supportsActions: boolean;
  supportsDeepLinks: boolean;
  requiresApproval: boolean;
  providerReference: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 4 — User Notification Preferences
// ===========================================================================
export type DigestPreference = "none" | "daily" | "weekly" | "monthly";

export interface QuietHours {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number;   // 0-23
  timezone: string;
}

export interface MutePeriod {
  id: string; reason: string;
  startsAt: string; endsAt: string;
  mutedCategories: NotificationCategory[];
  mutedChannels: DeliveryChannelId[];
  active: boolean;
}

export interface ChannelPreference {
  channelId: DeliveryChannelId;
  enabled: boolean;
  mutedCategories: NotificationCategory[];
  minPriority: NotificationPriority;
}

export interface UserNotificationPreferences {
  userId: string;
  channels: ChannelPreference[];
  quietHours: QuietHours;
  mutePeriods: MutePeriod[];
  language: string;
  digest: DigestPreference;
  optedIn: boolean;
  organizationOverrides: Record<string, boolean>;
  parentControls: { enabled: boolean; maxDailyNotifications: number | null };
  teacherControls: { enabled: boolean; classroomOnly: boolean };
  updatedAt: string;
}

// ===========================================================================
// System 5 — Inbox Platform
// ===========================================================================
export type InboxItemStatus = "unread" | "read" | "archived" | "dismissed" | "pinned" | "expired" | "deleted";

export interface InboxItem {
  id: string; userId: string;
  notificationId: string; registryKey: string;
  title: string; body: string; summary: string | null;
  category: NotificationCategory; priority: NotificationPriority;
  iconKey: string | null; deepLink: string | null;
  actions: TemplateAction[];
  status: InboxItemStatus;
  deliveredAt: string; readAt: string | null;
  archivedAt: string | null; dismissedAt: string | null;
  pinnedAt: string | null; expiredAt: string | null;
  deletedAt: string | null;
  variables: Record<string, unknown>;
  correlationId: string;
  metadata: Record<string, unknown>;
}

export interface InboxQuery {
  userId: string;
  status?: InboxItemStatus;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  searchText?: string;
  limit?: number;
  offset?: number;
}

export interface InboxResult {
  items: InboxItem[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

// ===========================================================================
// System 6 — Real-Time Notifications
// ===========================================================================
export type RealtimeQueueStatus = "queued" | "dispatched" | "delivered" | "failed" | "dropped" | "collapsed";

export interface RealtimeNotification {
  id: string; userId: string;
  registryKey: string;
  priority: NotificationPriority;
  payload: Record<string, unknown>;
  channels: DeliveryChannelId[];
  status: RealtimeQueueStatus;
  deduplicationKey: string | null;
  groupKey: string | null;
  queuedAt: string; dispatchedAt: string | null;
  deliveredAt: string | null; failedAt: string | null;
  failureReason: string | null;
  attemptCount: number;
  collapseCount: number;
  correlationId: string;
}

export interface RealtimeQueueStats {
  totalQueued: number;
  totalDispatched: number;
  totalDelivered: number;
  totalFailed: number;
  totalDropped: number;
  totalCollapsed: number;
  avgLatencyMs: number;
  byPriority: Record<NotificationPriority, number>;
}

// ===========================================================================
// System 7 — Announcement Platform
// ===========================================================================
export type AnnouncementScope =
  | "global" | "organization" | "tournament" | "maintenance" | "emergency" | "regional";

export type AnnouncementStatus =
  | "draft" | "pending_approval" | "approved" | "active"
  | "expired" | "rejected" | "retired";

export interface Announcement {
  id: string; scope: AnnouncementScope;
  title: string; body: string;
  targetId: string | null;
  priority: NotificationPriority;
  channels: DeliveryChannelId[];
  status: AnnouncementStatus;
  scheduledAt: string; publishedAt: string | null;
  expiresAt: string | null;
  approvalReference: string | null;
  approvedBy: string | null; approvedAt: string | null;
  createdBy: string; createdAt: string; updatedAt: string;
  locale: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 8 — Messaging Platform
// ===========================================================================
export type SystemMessageType =
  | "system" | "warning" | "maintenance" | "reminder"
  | "campaign_update" | "season_update" | "purchase_confirmation"
  | "achievement_summary" | "digest";

export interface SystemMessage {
  id: string; type: SystemMessageType;
  userId: string | null; organizationId: string | null;
  title: string; body: string;
  priority: NotificationPriority;
  deliveryChannels: DeliveryChannelId[];
  scheduledAt: string;
  deliveredAt: string | null;
  expiresAt: string | null;
  correlationId: string;
  variables: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 9 — Notification Routing
// ===========================================================================
export type RoutingRuleOperator = "equals" | "not_equals" | "contains" | "in" | "not_in" | "gt" | "lt" | "exists";

export interface RoutingCondition {
  field: string; operator: RoutingRuleOperator;
  value: string | number | boolean | string[];
}

export interface RoutingRule {
  id: string; name: string; description: string;
  sourceEvent: string;
  conditions: RoutingCondition[];
  targetTemplateKey: string;
  targetChannels: DeliveryChannelId[];
  priorityOverride: NotificationPriority | null;
  active: boolean;
  order: number;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface RoutingResult {
  matched: boolean;
  ruleId: string | null;
  templateKey: string | null;
  channels: DeliveryChannelId[];
  priority: NotificationPriority | null;
  errors: string[];
}

// ===========================================================================
// System 10 — Notification Scheduling
// ===========================================================================
export type ScheduleType = "immediate" | "delayed" | "scheduled" | "recurring" | "digest";

export type ScheduleStatus = "pending" | "dispatched" | "completed" | "cancelled" | "failed" | "expired";

export interface NotificationSchedule {
  id: string; type: ScheduleType;
  registryKey: string;
  userId: string | null; organizationId: string | null;
  scheduledAt: string;
  dispatchedAt: string | null; completedAt: string | null;
  status: ScheduleStatus;
  recurrenceRule: string | null;
  retryCount: number; maxRetries: number;
  variables: Record<string, unknown>;
  expiresAt: string | null;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 11 — Notification Analytics
// ===========================================================================
export interface NotificationAnalytics {
  delivery: {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
  };
  engagement: {
    readCount: number;
    readRate: number;
    clickCount: number;
    clickRate: number;
    dismissCount: number;
    dismissRate: number;
    archiveCount: number;
    pinCount: number;
  };
  latency: {
    avgDispatchMs: number;
    avgDeliveryMs: number;
    p50Ms: number; p95Ms: number; p99Ms: number;
  };
  byChannel: Record<DeliveryChannelId, { sent: number; delivered: number; failed: number }>;
  byCategory: Record<NotificationCategory, { sent: number; delivered: number; read: number }>;
  byPriority: Record<NotificationPriority, { sent: number; delivered: number }>;
  failures: {
    total: number;
    byReason: Record<string, number>;
  };
  digest: {
    generated: number;
    delivered: number;
    opened: number;
  };
  updatedAt: string;
}

// ===========================================================================
// System 12 — Notification Dashboard
// ===========================================================================
export interface NotificationDashboard {
  pending: number;
  delivered24h: number;
  failed24h: number;
  queued: number;
  scheduled: number;
  templates: { total: number; active: number; draft: number };
  channels: Array<{ id: DeliveryChannelId; status: DeliveryChannelStatus; sent24h: number }>;
  health: {
    bridge: { subscribed: boolean; processedCount: number };
    queue: { size: number; oldestItemAgeMs: number };
    scheduler: { pending: number; overdue: number };
  };
  topCategories: Array<{ category: NotificationCategory; count: number }>;
  topFailures: Array<{ reason: string; count: number }>;
  updatedAt: string;
}

// ===========================================================================
// System 13 — Event Bus Bridge
// ===========================================================================
export type NotificationEventType =
  | "NotificationDelivered" | "NotificationRead" | "NotificationDismissed"
  | "NotificationFailed" | "NotificationArchived" | "NotificationPinned"
  | "AnnouncementPublished" | "AnnouncementExpired"
  | "SystemMessageSent" | "DigestGenerated"
  | "InboxCleared" | "PreferencesUpdated"
  | "TemplatePublished" | "TemplateDeprecated"
  | "RoutingRuleMatched" | "ScheduleDispatched";

// ===========================================================================
// System 14 — Developer Integration
// ===========================================================================
export interface NotificationDeveloperIntegration {
  publicAPIs: Array<{
    path: string; method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    description: string; authRequired: boolean; scope: string;
  }>;
  extensionHooks: Array<{
    id: string; name: string; triggerEvent: NotificationEventType;
    description: string;
  }>;
  sdkMetadata: {
    version: string; language: string; docsUrl: string;
    capabilities: string[];
  };
  webhooks: Array<{
    id: string; event: NotificationEventType; description: string;
  }>;
}

// ===========================================================================
// System 15 — Documentation Generator
// ===========================================================================
export interface NotificationDocumentation {
  version: string; generatedAt: string;
  systems: Array<{
    id: number; name: string; description: string;
    endpoints: string[]; events: string[];
  }>;
  events: Array<{
    type: NotificationEventType; payload: string[]; description: string;
  }>;
  ownership: {
    owns: string[]; doesNotOwn: string[];
  };
}
