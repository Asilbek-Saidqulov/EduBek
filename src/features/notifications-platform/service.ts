/** Notification Platform service — composes all 15 systems. Phase 6G.17. */
// Systems 1, 2
export {
  createRegistryEntry, getRegistryEntryById, getRegistryByKey, listRegistryEntries,
  canTransitionRegistry, transitionRegistryStatus,
  activateRegistryEntry, deprecateRegistryEntry, retireRegistryEntry,
  supportsAllCategories, supportsAllPriorities, supportsAllRegistryStatuses,
  createTemplate, getTemplateById, getTemplateByReference, listTemplates,
  deactivateTemplate, addTemplateLocale, addTemplateVariable, addTemplateAction,
  renderTemplate, supportsAllTemplateVariableTypes,
} from "./registry-templates";

// Systems 3, 4
export {
  registerChannel, getChannelById, listChannels, setChannelStatus, isChannelAvailable,
  supportsAllDeliveryChannels, supportsAllChannelStatuses,
  createPreferences, getPreferencesForUser, listAllPreferences,
  updateChannelPreference, setQuietHours, addMutePeriod, removeMutePeriod,
  setLanguagePreference, setDigestPreference, setOptIn, setOrganizationOverride,
  setParentControls, setTeacherControls, checkDeliveryAllowed, supportsAllDigestPreferences,
} from "./channels-preferences";

// Systems 5, 6
export {
  deliverToInbox, getInboxItemById, queryInbox, getInboxSummary,
  canTransitionInbox, transitionInboxItem,
  markInboxItemRead, markInboxItemArchived, markInboxItemDismissed,
  pinInboxItem, deleteInboxItem, markAllRead, clearInbox, expireOldItems,
  supportsAllInboxStatuses,
  enqueueRealtime, getRealtimeById, listRealtime,
  dispatchRealtime, markRealtimeDelivered, markRealtimeFailed,
  dropRealtime, retryRealtime, collapseGroup, generateRealtimeStats,
  supportsAllRealtimeStatuses,
} from "./inbox-realtime";

// Systems 7, 8
export {
  createAnnouncement, getAnnouncementById, listAnnouncements,
  canTransitionAnnouncement, transitionAnnouncement,
  submitAnnouncementForApproval, approveAnnouncement, rejectAnnouncement,
  publishAnnouncement, expireAnnouncement, retireAnnouncement,
  listActiveAnnouncements,
  supportsAllAnnouncementScopes, supportsAllAnnouncementStatuses,
  createSystemMessage, getSystemMessageById, listSystemMessages,
  markSystemMessageDelivered, generateDigest,
  supportsAllSystemMessageTypes,
} from "./announcements-messaging";

// Systems 9, 10
export {
  createRoutingRule, getRoutingRuleById, listRoutingRules,
  deactivateRoutingRule, addRoutingCondition, routeEvent,
  supportsAllRoutingOperators,
  createSchedule, getScheduleById, listSchedules,
  canTransitionSchedule, transitionSchedule,
  dispatchSchedule, completeSchedule, failSchedule, cancelSchedule, expireSchedule,
  listDueSchedules, listOverdueSchedules,
  supportsAllScheduleTypes, supportsAllScheduleStatuses,
} from "./routing-scheduling";

// Systems 11, 12
export {
  generateNotificationAnalytics, generateNotificationDashboard, getNotificationStatus,
} from "./analytics-dashboard";

// System 13
export {
  subscribeNotifications, unsubscribeNotifications, isNotificationsSubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishNotificationEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";

// Systems 14, 15
export {
  getDeveloperIntegration,
  generateNotificationDocumentation, generateMarkdownDocumentation, getNotificationVersion,
} from "./developer-documentation";

// Repository reset
export { _resetRepositoryForTesting } from "./repository";

// Type re-exports
export type {
  NotificationCategory, NotificationPriority, NotificationRegistryStatus, NotificationRegistryEntry,
  TemplateVariableType, TemplateVariable, TemplateAction, TemplateLocaleContent, NotificationTemplate,
  DeliveryChannelId, DeliveryChannelStatus, DeliveryChannelConfig,
  DigestPreference, QuietHours, MutePeriod, ChannelPreference, UserNotificationPreferences,
  InboxItemStatus, InboxItem, InboxQuery, InboxResult,
  RealtimeQueueStatus, RealtimeNotification, RealtimeQueueStats,
  AnnouncementScope, AnnouncementStatus, Announcement,
  SystemMessageType, SystemMessage,
  RoutingRuleOperator, RoutingCondition, RoutingRule, RoutingResult,
  ScheduleType, ScheduleStatus, NotificationSchedule,
  NotificationAnalytics, NotificationDashboard,
  NotificationEventType,
  NotificationDeveloperIntegration, NotificationDocumentation,
} from "./types";
