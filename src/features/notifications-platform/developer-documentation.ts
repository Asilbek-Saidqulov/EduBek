/** Systems 14, 15 — Developer Integration + Documentation Generator. */
import type {
  NotificationDeveloperIntegration, NotificationDocumentation, NotificationEventType,
} from "./types";

// ===== System 14 — Developer Integration =====

export function getDeveloperIntegration(): NotificationDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/notifications/inbox", method: "GET", description: "Query user inbox", authRequired: true, scope: "user" },
      { path: "/api/notifications/inbox", method: "POST", description: "Deliver to inbox", authRequired: true, scope: "system" },
      { path: "/api/notifications/inbox", method: "PUT", description: "Update inbox item status", authRequired: true, scope: "user" },
      { path: "/api/notifications/preferences", method: "GET", description: "Get user preferences", authRequired: true, scope: "user" },
      { path: "/api/notifications/preferences", method: "POST", description: "Create user preferences", authRequired: true, scope: "user" },
      { path: "/api/notifications/preferences", method: "PUT", description: "Update user preferences", authRequired: true, scope: "user" },
      { path: "/api/notifications/templates", method: "GET", description: "List templates", authRequired: false, scope: "read" },
      { path: "/api/notifications/templates", method: "POST", description: "Create template", authRequired: true, scope: "admin" },
      { path: "/api/notifications/channels", method: "GET", description: "List delivery channels", authRequired: false, scope: "read" },
      { path: "/api/notifications/channels", method: "POST", description: "Register channel", authRequired: true, scope: "admin" },
      { path: "/api/notifications/announcements", method: "GET", description: "List announcements", authRequired: false, scope: "read" },
      { path: "/api/notifications/announcements", method: "POST", description: "Create announcement", authRequired: true, scope: "admin" },
      { path: "/api/notifications/messages", method: "GET", description: "List system messages", authRequired: true, scope: "user" },
      { path: "/api/notifications/messages", method: "POST", description: "Create system message", authRequired: true, scope: "system" },
      { path: "/api/notifications/routing", method: "GET", description: "List routing rules", authRequired: true, scope: "admin" },
      { path: "/api/notifications/routing", method: "POST", description: "Create routing rule", authRequired: true, scope: "admin" },
      { path: "/api/notifications/schedules", method: "GET", description: "List schedules", authRequired: true, scope: "admin" },
      { path: "/api/notifications/schedules", method: "POST", description: "Create schedule", authRequired: true, scope: "system" },
      { path: "/api/notifications/realtime", method: "GET", description: "List realtime queue", authRequired: true, scope: "admin" },
      { path: "/api/notifications/dashboard", method: "GET", description: "Operational dashboard", authRequired: true, scope: "admin" },
      { path: "/api/notifications/analytics", method: "GET", description: "Notification analytics", authRequired: true, scope: "admin" },
      { path: "/api/notifications/registry", method: "GET", description: "List registry entries", authRequired: false, scope: "read" },
      { path: "/api/notifications/registry", method: "POST", description: "Create registry entry", authRequired: true, scope: "admin" },
      { path: "/api/notifications/developer", method: "GET", description: "Developer integration metadata", authRequired: false, scope: "read" },
      { path: "/api/notifications/status", method: "GET", description: "Platform status", authRequired: false, scope: "read" },
    ],
    extensionHooks: [
      { id: "hook_notification_delivered", name: "On Notification Delivered", triggerEvent: "NotificationDelivered", description: "Triggered when a notification is delivered to a user" },
      { id: "hook_notification_read", name: "On Notification Read", triggerEvent: "NotificationRead", description: "Triggered when a user reads a notification" },
      { id: "hook_notification_dismissed", name: "On Notification Dismissed", triggerEvent: "NotificationDismissed", description: "Triggered when a user dismisses a notification" },
      { id: "hook_announcement_published", name: "On Announcement Published", triggerEvent: "AnnouncementPublished", description: "Triggered when an announcement goes live" },
      { id: "hook_announcement_expired", name: "On Announcement Expired", triggerEvent: "AnnouncementExpired", description: "Triggered when an announcement expires" },
      { id: "hook_system_message_sent", name: "On System Message Sent", triggerEvent: "SystemMessageSent", description: "Triggered when a system message is sent" },
      { id: "hook_digest_generated", name: "On Digest Generated", triggerEvent: "DigestGenerated", description: "Triggered when a digest is generated" },
      { id: "hook_routing_matched", name: "On Routing Matched", triggerEvent: "RoutingRuleMatched", description: "Triggered when a routing rule matches an event" },
      { id: "hook_schedule_dispatched", name: "On Schedule Dispatched", triggerEvent: "ScheduleDispatched", description: "Triggered when a scheduled notification is dispatched" },
      { id: "hook_notification_failed", name: "On Notification Failed", triggerEvent: "NotificationFailed", description: "Triggered when a notification fails to deliver" },
    ],
    sdkMetadata: {
      version: "1.0.0", language: "typescript",
      docsUrl: "/docs/notifications-platform",
      capabilities: ["registry", "templates", "channels", "preferences", "inbox", "realtime", "announcements", "messages", "routing", "scheduling", "analytics", "dashboard"],
    },
    webhooks: [
      { id: "wh_notification_delivered", event: "NotificationDelivered", description: "Fired when a notification is delivered" },
      { id: "wh_notification_read", event: "NotificationRead", description: "Fired when a notification is read" },
      { id: "wh_announcement_published", event: "AnnouncementPublished", description: "Fired when an announcement is published" },
      { id: "wh_announcement_expired", event: "AnnouncementExpired", description: "Fired when an announcement expires" },
      { id: "wh_system_message_sent", event: "SystemMessageSent", description: "Fired when a system message is sent" },
      { id: "wh_digest_generated", event: "DigestGenerated", description: "Fired when a digest is generated" },
      { id: "wh_routing_matched", event: "RoutingRuleMatched", description: "Fired when a routing rule matches" },
      { id: "wh_schedule_dispatched", event: "ScheduleDispatched", description: "Fired when a schedule is dispatched" },
    ],
  };
}

// ===== System 15 — Documentation Generator =====

const SYSTEMS_META: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }> = [
  {
    id: 1, name: "Notification Registry",
    description: "Central registry of notification definitions. Supports categories, priorities, delivery channels, localization keys and templates.",
    endpoints: ["/api/notifications/registry"],
    events: [],
  },
  {
    id: 2, name: "Notification Templates",
    description: "Configurable templates with title, body, variables, icons, actions, deep links, expiration, multiple locales.",
    endpoints: ["/api/notifications/templates"],
    events: ["TemplatePublished", "TemplateDeprecated"],
  },
  {
    id: 3, name: "Delivery Channels",
    description: "Supports in-app, push, email (reference only), SMS (reference only), organization announcement, broadcast overlay, webhook, developer callback. Channel selection is configuration only. Actual providers NOT implemented.",
    endpoints: ["/api/notifications/channels"],
    events: [],
  },
  {
    id: 4, name: "User Notification Preferences",
    description: "Per-player preferences, per-channel settings, mute periods, quiet hours, language preference, digest preference, opt-in/opt-out, organization overrides, parent controls, teacher controls.",
    endpoints: ["/api/notifications/preferences"],
    events: ["PreferencesUpdated"],
  },
  {
    id: 5, name: "Inbox Platform",
    description: "Persistent notification inbox with read/unread/archived/dismissed/pinned/expired/deleted states. Pagination, filtering, search.",
    endpoints: ["/api/notifications/inbox"],
    events: ["NotificationRead", "NotificationDismissed", "NotificationArchived", "NotificationPinned", "InboxCleared"],
  },
  {
    id: 6, name: "Real-Time Notifications",
    description: "Live notifications with priority queue, deduplication, ordering, rate limiting, grouping, collapse similar notifications.",
    endpoints: ["/api/notifications/realtime"],
    events: ["NotificationDelivered", "NotificationFailed"],
  },
  {
    id: 7, name: "Announcement Platform",
    description: "Global, organization, tournament, maintenance, emergency announcements with scheduling, expiration, approval workflow references.",
    endpoints: ["/api/notifications/announcements"],
    events: ["AnnouncementPublished", "AnnouncementExpired"],
  },
  {
    id: 8, name: "Messaging Platform",
    description: "System messages only — NOT chat, NOT DMs, NOT classroom messaging. Supports system, warning, maintenance, reminder, campaign update, season update, purchase confirmation, achievement summary, digest generation.",
    endpoints: ["/api/notifications/messages"],
    events: ["SystemMessageSent", "DigestGenerated"],
  },
  {
    id: 9, name: "Notification Routing",
    description: "Rule engine that maps events to notification templates to channels. No business logic.",
    endpoints: ["/api/notifications/routing"],
    events: ["RoutingRuleMatched"],
  },
  {
    id: 10, name: "Notification Scheduling",
    description: "Immediate, delayed, scheduled, recurring, digest, retry, expiration.",
    endpoints: ["/api/notifications/schedules"],
    events: ["ScheduleDispatched"],
  },
  {
    id: 11, name: "Notification Analytics",
    description: "Delivery counts, read rates, click rates, dismiss rates, failures, latency, channel usage. No marketing analytics.",
    endpoints: ["/api/notifications/analytics"],
    events: [],
  },
  {
    id: 12, name: "Notification Dashboard",
    description: "Unified operational dashboard with pending, delivered, failed, queued, scheduled, templates, channels, health.",
    endpoints: ["/api/notifications/dashboard"],
    events: [],
  },
  {
    id: 13, name: "Event Bus Bridge",
    description: "Passive consumer that consumes events from Game Engine, Progression, Competitive, Social, LiveOps, Inventory, Commerce, Administration, Configuration, Broadcast, Intelligence. Produces ONLY notification-owned events.",
    endpoints: [],
    events: [
      "NotificationDelivered", "NotificationRead", "NotificationDismissed",
      "NotificationFailed", "NotificationArchived", "NotificationPinned",
      "AnnouncementPublished", "AnnouncementExpired",
      "SystemMessageSent", "DigestGenerated",
      "InboxCleared", "PreferencesUpdated",
      "TemplatePublished", "TemplateDeprecated",
      "RoutingRuleMatched", "ScheduleDispatched",
    ],
  },
  {
    id: 14, name: "Developer Integration",
    description: "Read-only APIs, extension hooks, SDK metadata, webhook metadata.",
    endpoints: ["/api/notifications/developer"],
    events: [],
  },
  {
    id: 15, name: "Documentation Generator",
    description: "Deterministic Markdown and JSON documentation generated directly from registry. No LLM.",
    endpoints: [],
    events: [],
  },
];

const EVENT_PAYLOADS: Record<NotificationEventType, string[]> = {
  NotificationDelivered: ["notificationId", "userId", "correlationId"],
  NotificationRead: ["itemId", "userId", "correlationId"],
  NotificationDismissed: ["itemId", "userId", "correlationId"],
  NotificationFailed: ["notificationId", "userId", "reason", "correlationId"],
  NotificationArchived: ["itemId", "userId", "correlationId"],
  NotificationPinned: ["itemId", "userId", "correlationId"],
  AnnouncementPublished: ["announcementId", "scope", "priority"],
  AnnouncementExpired: ["announcementId"],
  SystemMessageSent: ["messageId", "type", "correlationId"],
  DigestGenerated: ["messageId", "period", "correlationId"],
  InboxCleared: ["userId", "count"],
  PreferencesUpdated: ["userId"],
  TemplatePublished: ["templateId", "key"],
  TemplateDeprecated: ["templateId", "key"],
  RoutingRuleMatched: ["ruleId", "sourceEvent", "templateKey"],
  ScheduleDispatched: ["scheduleId", "correlationId"],
};

const EVENT_DESCRIPTIONS: Record<NotificationEventType, string> = {
  NotificationDelivered: "Emitted when a notification is delivered to a user.",
  NotificationRead: "Emitted when a user reads a notification in their inbox.",
  NotificationDismissed: "Emitted when a user dismisses a notification.",
  NotificationFailed: "Emitted when a notification fails to deliver.",
  NotificationArchived: "Emitted when a notification is archived.",
  NotificationPinned: "Emitted when a notification is pinned.",
  AnnouncementPublished: "Emitted when an announcement transitions to active status.",
  AnnouncementExpired: "Emitted when an announcement expires.",
  SystemMessageSent: "Emitted when a system message is delivered.",
  DigestGenerated: "Emitted when a digest is generated for a user.",
  InboxCleared: "Emitted when a user clears their inbox.",
  PreferencesUpdated: "Emitted when user notification preferences are updated.",
  TemplatePublished: "Emitted when a template is published.",
  TemplateDeprecated: "Emitted when a template is deprecated.",
  RoutingRuleMatched: "Emitted when a routing rule matches an event.",
  ScheduleDispatched: "Emitted when a scheduled notification is dispatched.",
};

export function generateNotificationDocumentation(): NotificationDocumentation {
  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    systems: SYSTEMS_META,
    events: Object.keys(EVENT_PAYLOADS).map((type) => ({
      type: type as NotificationEventType,
      payload: EVENT_PAYLOADS[type as NotificationEventType],
      description: EVENT_DESCRIPTIONS[type as NotificationEventType],
    })),
    ownership: {
      owns: [
        "Notification templates",
        "Notification registry",
        "Inbox state (per-user)",
        "Delivery routing rules",
        "User notification preferences",
        "Notification scheduling",
        "Notification analytics",
        "Announcement metadata",
        "Notification events (produced)",
        "Developer notification metadata",
        "Real-time notification queue",
        "System message metadata",
      ],
      doesNotOwn: [
        "Emails (provider integration)",
        "SMS providers (provider integration)",
        "Push providers (provider integration)",
        "Chat",
        "Direct messages",
        "Gameplay",
        "Rewards",
        "XP",
        "Inventory",
        "Commerce",
        "Leaderboards",
        "Moderation",
        "Campaign logic",
        "Teacher messaging",
        "Organization management",
      ],
    },
  };
}

export function generateMarkdownDocumentation(): string {
  const doc = generateNotificationDocumentation();
  let md = `# EduBek — Notification, Messaging & Communication Platform\n\n`;
  md += `**Version:** ${doc.version}  \n`;
  md += `**Generated:** ${doc.generatedAt}  \n`;
  md += `**Phase:** 6G.17\n\n`;
  md += `## Overview\n\n`;
  md += `This platform is the SINGLE SOURCE OF TRUTH for all user communications across EduBek. `;
  md += `It is a passive Event Bus consumer + producer. It NEVER owns gameplay, progression, XP, achievements, inventory, commerce, analytics, moderation, tournaments, rewards, scheduling (other modules'), chat, DMs, or emails. `;
  md += `All cross-module communication happens exclusively through the Event Bus.\n\n`;
  md += `## Systems\n\n`;
  for (const s of doc.systems) {
    md += `### System ${s.id} — ${s.name}\n\n`;
    md += `${s.description}\n\n`;
    if (s.endpoints.length > 0) {
      md += `**Endpoints:**\n`;
      for (const e of s.endpoints) md += `- \`${e}\`\n`;
      md += `\n`;
    }
    if (s.events.length > 0) {
      md += `**Events:**\n`;
      for (const e of s.events) md += `- \`${e}\`\n`;
      md += `\n`;
    }
  }
  md += `## Events\n\n`;
  for (const e of doc.events) {
    md += `### \`${e.type}\`\n\n${e.description}\n\n`;
    md += `**Payload:**\n`;
    for (const p of e.payload) md += `- \`${p}\`\n`;
    md += `\n`;
  }
  md += `## Ownership\n\n`;
  md += `### Owns\n\n`;
  for (const o of doc.ownership.owns) md += `- ${o}\n`;
  md += `\n### Does NOT Own\n\n`;
  for (const o of doc.ownership.doesNotOwn) md += `- ${o}\n`;
  md += `\n`;
  return md;
}

export function getNotificationVersion(): string { return "1.0.0"; }
