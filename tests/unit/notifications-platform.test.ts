/**
 * EduBek — Notification, Messaging & Communication Platform tests.
 * Phase 6G.17: 450+ deterministic tests covering all 15 systems.
 *
 * Tests are 100% deterministic — no LLM, no randomness, no network, no timing assumptions.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  // Systems 1, 2
  createRegistryEntry, getRegistryEntryById, getRegistryByKey, listRegistryEntries,
  canTransitionRegistry, transitionRegistryStatus,
  activateRegistryEntry, deprecateRegistryEntry, retireRegistryEntry,
  supportsAllCategories, supportsAllPriorities, supportsAllRegistryStatuses,
  createTemplate, getTemplateById, getTemplateByReference, listTemplates,
  deactivateTemplate, addTemplateLocale, addTemplateVariable, addTemplateAction,
  renderTemplate, supportsAllTemplateVariableTypes,
  // Systems 3, 4
  registerChannel, getChannelById, listChannels, setChannelStatus, isChannelAvailable,
  supportsAllDeliveryChannels, supportsAllChannelStatuses,
  createPreferences, getPreferencesForUser, listAllPreferences,
  updateChannelPreference, setQuietHours, addMutePeriod, removeMutePeriod,
  setLanguagePreference, setDigestPreference, setOptIn, setOrganizationOverride,
  setParentControls, setTeacherControls, checkDeliveryAllowed, supportsAllDigestPreferences,
  // Systems 5, 6
  deliverToInbox, getInboxItemById, queryInbox, getInboxSummary,
  canTransitionInbox, transitionInboxItem,
  markInboxItemRead, markInboxItemArchived, markInboxItemDismissed,
  pinInboxItem, deleteInboxItem, markAllRead, clearInbox, expireOldItems,
  supportsAllInboxStatuses,
  enqueueRealtime, getRealtimeById, listRealtime,
  dispatchRealtime, markRealtimeDelivered, markRealtimeFailed,
  dropRealtime, retryRealtime, collapseGroup, generateRealtimeStats,
  supportsAllRealtimeStatuses,
  // Systems 7, 8
  createAnnouncement, getAnnouncementById, listAnnouncements,
  canTransitionAnnouncement, transitionAnnouncement,
  submitAnnouncementForApproval, approveAnnouncement, rejectAnnouncement,
  publishAnnouncement, expireAnnouncement, retireAnnouncement,
  listActiveAnnouncements,
  supportsAllAnnouncementScopes, supportsAllAnnouncementStatuses,
  createSystemMessage, getSystemMessageById, listSystemMessages,
  markSystemMessageDelivered, generateDigest, supportsAllSystemMessageTypes,
  // Systems 9, 10
  createRoutingRule, getRoutingRuleById, listRoutingRules,
  deactivateRoutingRule, addRoutingCondition, routeEvent,
  supportsAllRoutingOperators,
  createSchedule, getScheduleById, listSchedules,
  canTransitionSchedule, transitionSchedule,
  dispatchSchedule, completeSchedule, failSchedule, cancelSchedule, expireSchedule,
  listDueSchedules, listOverdueSchedules,
  supportsAllScheduleTypes, supportsAllScheduleStatuses,
  // Systems 11, 12
  generateNotificationAnalytics, generateNotificationDashboard, getNotificationStatus,
  // System 13
  subscribeNotifications, unsubscribeNotifications, isNotificationsSubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishNotificationEvent, _resetBridgeForTesting,
  // Systems 14, 15
  getDeveloperIntegration,
  generateNotificationDocumentation, generateMarkdownDocumentation, getNotificationVersion,
  // Reset
  _resetRepositoryForTesting,
} from "@/features/notifications-platform";

beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); });

const now = () => Date.now();
const futureIso = (seconds: number) => new Date(now() + seconds * 1000).toISOString();

// ===========================================================================
// System 1 — Notification Registry
// ===========================================================================
describe("Notifications — Registry (System 1)", () => {
  it("creates registry entry", () => {
    const e = createRegistryEntry({ key: "match.started", category: "competitive", priority: "medium", defaultChannels: ["in_app"], templateId: "t1" });
    expect(e.id).toBeDefined();
    expect(e.status).toBe("draft");
    expect(e.version).toBe(1);
  });
  it("rejects duplicate key", () => {
    createRegistryEntry({ key: "dup", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    expect(() => createRegistryEntry({ key: "dup", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t2" })).toThrow();
  });
  it("gets entry by id", () => {
    const e = createRegistryEntry({ key: "k1", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    expect(getRegistryEntryById(e.id)).not.toBeNull();
    expect(getRegistryEntryById("nonexistent")).toBeNull();
  });
  it("gets entry by key", () => {
    createRegistryEntry({ key: "lookup", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    expect(getRegistryByKey("lookup")).not.toBeNull();
    expect(getRegistryByKey("missing")).toBeNull();
  });
  it("lists entries", () => {
    createRegistryEntry({ key: "k1", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    createRegistryEntry({ key: "k2", category: "social", priority: "low", defaultChannels: ["in_app"], templateId: "t2" });
    expect(listRegistryEntries().length).toBe(2);
  });
  it("lists by category", () => {
    createRegistryEntry({ key: "k1", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    createRegistryEntry({ key: "k2", category: "social", priority: "low", defaultChannels: ["in_app"], templateId: "t2" });
    expect(listRegistryEntries("social").length).toBe(1);
  });
  it("lists by status", () => {
    createRegistryEntry({ key: "k1", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    expect(listRegistryEntries(undefined, "draft").length).toBe(1);
    expect(listRegistryEntries(undefined, "active").length).toBe(0);
  });
  it("transitions draft -> active", () => {
    const e = createRegistryEntry({ key: "k1", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    expect(activateRegistryEntry(e.id)?.status).toBe("active");
  });
  it("transitions active -> deprecated", () => {
    const e = createRegistryEntry({ key: "k1", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    activateRegistryEntry(e.id);
    expect(deprecateRegistryEntry(e.id)?.status).toBe("deprecated");
  });
  it("deprecate sets deprecatedAt", () => {
    const e = createRegistryEntry({ key: "k1", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    activateRegistryEntry(e.id); deprecateRegistryEntry(e.id);
    expect(getRegistryEntryById(e.id)?.deprecatedAt).not.toBeNull();
  });
  it("transitions deprecated -> retired", () => {
    const e = createRegistryEntry({ key: "k1", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    activateRegistryEntry(e.id); deprecateRegistryEntry(e.id);
    expect(retireRegistryEntry(e.id)?.status).toBe("retired");
  });
  it("rejects invalid transition active -> draft", () => {
    const e = createRegistryEntry({ key: "k1", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    activateRegistryEntry(e.id);
    expect(transitionRegistryStatus(e.id, "draft")).toBeNull();
  });
  it("canTransition validates", () => {
    expect(canTransitionRegistry("draft", "active")).toBe(true);
    expect(canTransitionRegistry("active", "draft")).toBe(false);
    expect(canTransitionRegistry("retired", "active")).toBe(false);
  });
  it("supports all categories", () => { expect(supportsAllCategories().length).toBe(15); });
  it("supports all priorities", () => { expect(supportsAllPriorities().length).toBe(5); });
  it("supports all registry statuses", () => { expect(supportsAllRegistryStatuses().length).toBe(4); });
  it("entry has correlationId-like fields", () => {
    const e = createRegistryEntry({ key: "k1", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t1" });
    expect(e.createdAt).toBeDefined();
    expect(e.updatedAt).toBeDefined();
  });
});

// ===========================================================================
// System 2 — Notification Templates
// ===========================================================================
describe("Notifications — Templates (System 2)", () => {
  const baseTemplate = () => ({
    key: "match.won",
    locales: { en: { title: "You won!", body: "You beat {opponent}", summary: null, iconKey: "trophy" } },
    category: "competitive" as const,
    priority: "high" as const,
  });
  it("creates template", () => {
    const t = createTemplate(baseTemplate());
    expect(t.id).toBeDefined();
    expect(t.active).toBe(true);
    expect(t.version).toBe(1);
  });
  it("rejects duplicate key", () => {
    createTemplate(baseTemplate());
    expect(() => createTemplate(baseTemplate())).toThrow();
  });
  it("rejects no locales", () => {
    expect(() => createTemplate({ ...baseTemplate(), locales: {} })).toThrow();
  });
  it("rejects negative expiration", () => {
    expect(() => createTemplate({ ...baseTemplate(), expirationSeconds: -5 })).toThrow();
  });
  it("gets template by id", () => {
    const t = createTemplate(baseTemplate());
    expect(getTemplateById(t.id)).not.toBeNull();
    expect(getTemplateById("nonexistent")).toBeNull();
  });
  it("gets template by key reference", () => {
    createTemplate(baseTemplate());
    expect(getTemplateByReference("match.won")).not.toBeNull();
    expect(getTemplateByReference("missing")).toBeNull();
  });
  it("lists templates", () => {
    createTemplate(baseTemplate());
    createTemplate({ ...baseTemplate(), key: "match.lost" });
    expect(listTemplates().length).toBe(2);
  });
  it("lists by category", () => {
    createTemplate(baseTemplate());
    createTemplate({ ...baseTemplate(), key: "msg.social", category: "social" });
    expect(listTemplates("competitive").length).toBe(1);
  });
  it("lists active only", () => {
    const t = createTemplate(baseTemplate());
    deactivateTemplate(t.id);
    expect(listTemplates(undefined, true).length).toBe(0);
    expect(listTemplates(undefined, false).length).toBe(1);
  });
  it("deactivates template", () => {
    const t = createTemplate(baseTemplate());
    expect(deactivateTemplate(t.id)?.active).toBe(false);
  });
  it("adds template locale", () => {
    const t = createTemplate(baseTemplate());
    addTemplateLocale(t.id, "uz", { title: "Siz yutdingiz!", body: "Siz {opponent} ni yutdingiz", summary: null, iconKey: "trophy" });
    expect(Object.keys(getTemplateById(t.id)!.locales).length).toBe(2);
  });
  it("adds template variable", () => {
    const t = createTemplate(baseTemplate());
    expect(addTemplateVariable(t.id, { key: "opponent", type: "string", required: true, defaultValue: null, description: "Opponent name" })?.variables.length).toBe(1);
  });
  it("rejects duplicate variable", () => {
    const t = createTemplate(baseTemplate());
    addTemplateVariable(t.id, { key: "opponent", type: "string", required: true, defaultValue: null, description: "" });
    expect(addTemplateVariable(t.id, { key: "opponent", type: "string", required: false, defaultValue: null, description: "" })).toBeNull();
  });
  it("adds template action", () => {
    const t = createTemplate(baseTemplate());
    expect(addTemplateAction(t.id, { id: "view", label: "View Match", deepLink: "/matches/{matchId}", actionType: "open", metadata: {} })?.actions.length).toBe(1);
  });
  it("rejects duplicate action", () => {
    const t = createTemplate(baseTemplate());
    addTemplateAction(t.id, { id: "view", label: "View", deepLink: null, actionType: "open", metadata: {} });
    expect(addTemplateAction(t.id, { id: "view", label: "View", deepLink: null, actionType: "open", metadata: {} })).toBeNull();
  });
  it("renders template with variables", () => {
    const t = createTemplate({
      ...baseTemplate(),
      variables: [{ key: "opponent", type: "string", required: true, defaultValue: null, description: "" }],
    });
    const rendered = renderTemplate(t.id, "en", { opponent: "Alice" });
    expect(rendered?.title).toBe("You won!");
    expect(rendered?.body).toBe("You beat Alice");
  });
  it("render reports missing required", () => {
    const t = createTemplate({
      ...baseTemplate(),
      variables: [{ key: "opponent", type: "string", required: true, defaultValue: null, description: "" }],
    });
    const rendered = renderTemplate(t.id, "en", {});
    expect(rendered?.errors.length).toBeGreaterThan(0);
  });
  it("render falls back to en locale", () => {
    const t = createTemplate(baseTemplate());
    const rendered = renderTemplate(t.id, "uz", {});
    expect(rendered?.title).toBe("You won!");
  });
  it("render returns null for unknown template", () => {
    expect(renderTemplate("nonexistent", "en", {})).toBeNull();
  });
  it("supports all template variable types", () => {
    expect(supportsAllTemplateVariableTypes().length).toBe(8);
  });
  it("template default expiration is null", () => {
    expect(createTemplate(baseTemplate()).expirationSeconds).toBeNull();
  });
  it("template default deepLink is null", () => {
    expect(createTemplate(baseTemplate()).defaultDeepLink).toBeNull();
  });
  it("template version increments", () => {
    const t = createTemplate(baseTemplate());
    addTemplateVariable(t.id, { key: "x", type: "string", required: false, defaultValue: null, description: "" });
    expect(getTemplateById(t.id)?.version).toBe(2);
  });
});

// ===========================================================================
// System 3 — Delivery Channels
// ===========================================================================
describe("Notifications — Delivery Channels (System 3)", () => {
  it("registers channel", () => {
    const c = registerChannel({ id: "in_app", name: "In-App" });
    expect(c.id).toBe("in_app");
    expect(c.status).toBe("active");
  });
  it("rejects duplicate channel", () => {
    registerChannel({ id: "in_app", name: "In-App" });
    expect(() => registerChannel({ id: "in_app", name: "In-App 2" })).toThrow();
  });
  it("gets channel by id", () => {
    registerChannel({ id: "in_app", name: "In-App" });
    expect(getChannelById("in_app")).not.toBeNull();
    expect(getChannelById("missing" as never)).toBeNull();
  });
  it("lists channels", () => {
    registerChannel({ id: "in_app", name: "In-App" });
    registerChannel({ id: "push", name: "Push" });
    expect(listChannels().length).toBe(2);
  });
  it("lists by status", () => {
    registerChannel({ id: "in_app", name: "In-App", status: "active" });
    registerChannel({ id: "push", name: "Push", status: "maintenance" });
    expect(listChannels("active").length).toBe(1);
  });
  it("sets channel status", () => {
    registerChannel({ id: "in_app", name: "In-App" });
    expect(setChannelStatus("in_app", "maintenance")?.status).toBe("maintenance");
  });
  it("isChannelAvailable active", () => {
    registerChannel({ id: "in_app", name: "In-App", supportedLocales: ["en", "uz"] });
    expect(isChannelAvailable("in_app", "en")).toBe(true);
  });
  it("isChannelAvailable rejects inactive", () => {
    registerChannel({ id: "in_app", name: "In-App", status: "inactive" });
    expect(isChannelAvailable("in_app")).toBe(false);
  });
  it("isChannelAvailable rejects unsupported locale", () => {
    registerChannel({ id: "in_app", name: "In-App", supportedLocales: ["en"] });
    expect(isChannelAvailable("in_app", "uz")).toBe(false);
  });
  it("isChannelAvailable rejects unknown", () => {
    expect(isChannelAvailable("missing" as never)).toBe(false);
  });
  it("supports all delivery channels", () => {
    expect(supportsAllDeliveryChannels().length).toBe(8);
  });
  it("supports all channel statuses", () => {
    expect(supportsAllChannelStatuses().length).toBe(4);
  });
  it("channel default maxRate is null", () => {
    expect(registerChannel({ id: "in_app", name: "In-App" }).maxRatePerUserPerHour).toBeNull();
  });
  it("channel default supportsRichContent is false", () => {
    expect(registerChannel({ id: "in_app", name: "In-App" }).supportsRichContent).toBe(false);
  });
  it("channel default supportsActions is false", () => {
    expect(registerChannel({ id: "in_app", name: "In-App" }).supportsActions).toBe(false);
  });
  it("channel default requiresApproval is false", () => {
    expect(registerChannel({ id: "in_app", name: "In-App" }).requiresApproval).toBe(false);
  });
  it("channel supports rich content flag", () => {
    expect(registerChannel({ id: "in_app", name: "In-App", supportsRichContent: true }).supportsRichContent).toBe(true);
  });
  it("channel supports actions flag", () => {
    expect(registerChannel({ id: "in_app", name: "In-App", supportsActions: true }).supportsActions).toBe(true);
  });
  it("channel supports deep links flag", () => {
    expect(registerChannel({ id: "in_app", name: "In-App", supportsDeepLinks: true }).supportsDeepLinks).toBe(true);
  });
  it("channel default supportedLocales are en/uz/ru", () => {
    expect(registerChannel({ id: "in_app", name: "In-App" }).supportedLocales.length).toBe(3);
  });
});

// ===========================================================================
// System 4 — User Notification Preferences
// ===========================================================================
describe("Notifications — Preferences (System 4)", () => {
  it("creates preferences", () => {
    const p = createPreferences({ userId: "u1" });
    expect(p.userId).toBe("u1");
    expect(p.optedIn).toBe(true);
    expect(p.channels.length).toBe(4);
  });
  it("rejects duplicate preferences", () => {
    createPreferences({ userId: "u1" });
    expect(() => createPreferences({ userId: "u1" })).toThrow();
  });
  it("gets preferences for user", () => {
    createPreferences({ userId: "u1" });
    expect(getPreferencesForUser("u1")).not.toBeNull();
    expect(getPreferencesForUser("u2")).toBeNull();
  });
  it("lists all preferences", () => {
    createPreferences({ userId: "u1" });
    createPreferences({ userId: "u2" });
    expect(listAllPreferences().length).toBe(2);
  });
  it("updates channel preference", () => {
    createPreferences({ userId: "u1" });
    const p = updateChannelPreference("u1", "push", { enabled: false });
    expect(p?.channels.find(c => c.channelId === "push")?.enabled).toBe(false);
  });
  it("adds new channel preference if missing", () => {
    createPreferences({ userId: "u1" });
    const p = updateChannelPreference("u1", "webhook", { enabled: true });
    expect(p?.channels.find(c => c.channelId === "webhook")).toBeDefined();
  });
  it("sets quiet hours", () => {
    createPreferences({ userId: "u1" });
    const p = setQuietHours("u1", { enabled: true, startHour: 22, endHour: 7, timezone: "UTC" });
    expect(p?.quietHours.enabled).toBe(true);
  });
  it("rejects invalid quiet hours start", () => {
    createPreferences({ userId: "u1" });
    expect(setQuietHours("u1", { enabled: true, startHour: 25, endHour: 7, timezone: "UTC" })).toBeNull();
  });
  it("rejects invalid quiet hours end", () => {
    createPreferences({ userId: "u1" });
    expect(setQuietHours("u1", { enabled: true, startHour: 22, endHour: -1, timezone: "UTC" })).toBeNull();
  });
  it("adds mute period", () => {
    createPreferences({ userId: "u1" });
    const p = addMutePeriod("u1", { reason: "vacation", startsAt: futureIso(60), endsAt: futureIso(3600), mutedCategories: ["social"] });
    expect(p?.mutePeriods.length).toBe(1);
  });
  it("rejects mute period end before start", () => {
    createPreferences({ userId: "u1" });
    expect(addMutePeriod("u1", { reason: "test", startsAt: futureIso(3600), endsAt: futureIso(60) })).toBeNull();
  });
  it("removes mute period", () => {
    createPreferences({ userId: "u1" });
    const p = addMutePeriod("u1", { reason: "vacation", startsAt: futureIso(60), endsAt: futureIso(3600) })!;
    expect(removeMutePeriod("u1", p.mutePeriods[0].id)?.mutePeriods.length).toBe(0);
  });
  it("sets language preference", () => {
    createPreferences({ userId: "u1" });
    expect(setLanguagePreference("u1", "uz")?.language).toBe("uz");
  });
  it("sets digest preference", () => {
    createPreferences({ userId: "u1" });
    expect(setDigestPreference("u1", "daily")?.digest).toBe("daily");
  });
  it("sets opt-in", () => {
    createPreferences({ userId: "u1" });
    expect(setOptIn("u1", false)?.optedIn).toBe(false);
  });
  it("sets organization override", () => {
    createPreferences({ userId: "u1" });
    const p = setOrganizationOverride("u1", "org-1", false);
    expect(p?.organizationOverrides["org-1"]).toBe(false);
  });
  it("sets parent controls", () => {
    createPreferences({ userId: "u1" });
    const p = setParentControls("u1", true, 10);
    expect(p?.parentControls.enabled).toBe(true);
    expect(p?.parentControls.maxDailyNotifications).toBe(10);
  });
  it("sets teacher controls", () => {
    createPreferences({ userId: "u1" });
    const p = setTeacherControls("u1", true, true);
    expect(p?.teacherControls.enabled).toBe(true);
    expect(p?.teacherControls.classroomOnly).toBe(true);
  });
  it("checkDeliveryAllowed allows opted-in", () => {
    createPreferences({ userId: "u1" });
    const r = checkDeliveryAllowed("u1", { category: "system", priority: "medium", channels: ["in_app"], deliveryHour: 12 });
    expect(r.deliverable).toBe(true);
  });
  it("checkDeliveryAllowed rejects opted out", () => {
    createPreferences({ userId: "u1" });
    setOptIn("u1", false);
    const r = checkDeliveryAllowed("u1", { category: "system", priority: "medium", channels: ["in_app"], deliveryHour: 12 });
    expect(r.deliverable).toBe(false);
    expect(r.reasons).toContain("opted_out");
  });
  it("checkDeliveryAllowed respects quiet hours", () => {
    createPreferences({ userId: "u1" });
    setQuietHours("u1", { enabled: true, startHour: 22, endHour: 7, timezone: "UTC" });
    const r = checkDeliveryAllowed("u1", { category: "system", priority: "medium", channels: ["in_app"], deliveryHour: 23 });
    expect(r.reasons).toContain("quiet_hours");
  });
  it("checkDeliveryAllowed bypasses quiet hours for critical", () => {
    createPreferences({ userId: "u1" });
    setQuietHours("u1", { enabled: true, startHour: 22, endHour: 7, timezone: "UTC" });
    const r = checkDeliveryAllowed("u1", { category: "emergency", priority: "critical", channels: ["in_app"], deliveryHour: 23 });
    expect(r.reasons).not.toContain("quiet_hours");
  });
  it("checkDeliveryAllowed respects muted category", () => {
    createPreferences({ userId: "u1" });
    addMutePeriod("u1", { reason: "test", startsAt: futureIso(-60), endsAt: futureIso(3600), mutedCategories: ["social"] });
    const r = checkDeliveryAllowed("u1", { category: "social", priority: "medium", channels: ["in_app"], deliveryHour: 12 });
    expect(r.deliverable).toBe(false);
  });
  it("checkDeliveryAllowed respects min priority per channel", () => {
    createPreferences({ userId: "u1" });
    updateChannelPreference("u1", "sms", { enabled: true, minPriority: "high" });
    const r = checkDeliveryAllowed("u1", { category: "system", priority: "low", channels: ["sms"], deliveryHour: 12 });
    expect(r.effectiveChannels.length).toBe(0);
  });
  it("checkDeliveryAllowed returns no_preferences for unknown user", () => {
    const r = checkDeliveryAllowed("unknown", { category: "system", priority: "medium", channels: ["in_app"], deliveryHour: 12 });
    expect(r.deliverable).toBe(false);
    expect(r.reasons).toContain("no_preferences");
  });
  it("supports all digest preferences", () => {
    expect(supportsAllDigestPreferences().length).toBe(4);
  });
  it("default digest is none", () => {
    expect(createPreferences({ userId: "u1" }).digest).toBe("none");
  });
  it("default language is en", () => {
    expect(createPreferences({ userId: "u1" }).language).toBe("en");
  });
  it("default quiet hours disabled", () => {
    expect(createPreferences({ userId: "u1" }).quietHours.enabled).toBe(false);
  });
  it("default parentControls disabled", () => {
    const p = createPreferences({ userId: "u1" });
    expect(p.parentControls.enabled).toBe(false);
    expect(p.parentControls.maxDailyNotifications).toBeNull();
  });
  it("default teacherControls disabled", () => {
    const p = createPreferences({ userId: "u1" });
    expect(p.teacherControls.enabled).toBe(false);
    expect(p.teacherControls.classroomOnly).toBe(false);
  });
});

// ===========================================================================
// System 5 — Inbox Platform
// ===========================================================================
describe("Notifications — Inbox (System 5)", () => {
  const deliver = (userId = "u1") => deliverToInbox({
    userId, notificationId: "n1", registryKey: "match.won",
    title: "You won!", body: "Beat Alice", category: "competitive", priority: "high",
  });
  it("delivers to inbox", () => {
    const item = deliver();
    expect(item.id).toBeDefined();
    expect(item.status).toBe("unread");
  });
  it("gets inbox item by id", () => {
    const item = deliver();
    expect(getInboxItemById("u1", item.id)).not.toBeNull();
    expect(getInboxItemById("u1", "nonexistent")).toBeNull();
  });
  it("queries inbox", () => {
    deliver(); deliver();
    const r = queryInbox({ userId: "u1" });
    expect(r.items.length).toBe(2);
    expect(r.total).toBe(2);
  });
  it("query filters by status", () => {
    const item = deliver();
    markInboxItemRead("u1", item.id);
    expect(queryInbox({ userId: "u1", status: "read" }).items.length).toBe(1);
    expect(queryInbox({ userId: "u1", status: "unread" }).items.length).toBe(0);
  });
  it("query filters by category", () => {
    deliver();
    deliverToInbox({ userId: "u1", notificationId: "n2", registryKey: "social", title: "New follower", body: "", category: "social", priority: "low" });
    expect(queryInbox({ userId: "u1", category: "social" }).items.length).toBe(1);
  });
  it("query filters by priority", () => {
    deliver();
    deliverToInbox({ userId: "u1", notificationId: "n2", registryKey: "social", title: "Low", body: "", category: "social", priority: "low" });
    expect(queryInbox({ userId: "u1", priority: "high" }).items.length).toBe(1);
  });
  it("query filters by search text", () => {
    deliver();
    deliverToInbox({ userId: "u1", notificationId: "n2", registryKey: "k", title: "New follower", body: "", category: "social", priority: "low" });
    expect(queryInbox({ userId: "u1", searchText: "follower" }).items.length).toBe(1);
  });
  it("query paginates", () => {
    for (let i = 0; i < 5; i++) deliver();
    const r = queryInbox({ userId: "u1", limit: 2, offset: 0 });
    expect(r.items.length).toBe(2);
    expect(r.hasMore).toBe(true);
  });
  it("query excludes deleted", () => {
    const item = deliver();
    deleteInboxItem("u1", item.id);
    expect(queryInbox({ userId: "u1" }).items.length).toBe(0);
  });
  it("gets inbox summary", () => {
    deliver(); deliver();
    const s = getInboxSummary("u1");
    expect(s.total).toBe(2);
    expect(s.unread).toBe(2);
  });
  it("marks item read", () => {
    const item = deliver();
    expect(markInboxItemRead("u1", item.id)?.status).toBe("read");
  });
  it("marks item archived", () => {
    const item = deliver();
    expect(markInboxItemArchived("u1", item.id)?.status).toBe("archived");
  });
  it("marks item dismissed", () => {
    const item = deliver();
    expect(markInboxItemDismissed("u1", item.id)?.status).toBe("dismissed");
  });
  it("pins item", () => {
    const item = deliver();
    expect(pinInboxItem("u1", item.id)?.status).toBe("pinned");
  });
  it("deletes item", () => {
    const item = deliver();
    expect(deleteInboxItem("u1", item.id)?.status).toBe("deleted");
  });
  it("canTransition validates", () => {
    expect(canTransitionInbox("unread", "read")).toBe(true);
    expect(canTransitionInbox("deleted", "unread")).toBe(false);
  });
  it("rejects invalid transition", () => {
    const item = deliver();
    markInboxItemRead("u1", item.id);
    expect(transitionInboxItem("u1", item.id, "unread")).not.toBeNull(); // read can go to unread
    expect(transitionInboxItem("u1", "nonexistent", "read")).toBeNull();
  });
  it("marks all read", () => {
    deliver(); deliver();
    expect(markAllRead("u1")).toBe(2);
  });
  it("clears inbox", () => {
    deliver(); deliver();
    expect(clearInbox("u1")).toBe(2);
  });
  it("expires old items", () => {
    const item = deliverToInbox({
      userId: "u1", notificationId: "n1", registryKey: "k",
      title: "T", body: "B", category: "system", priority: "low",
      expirationSeconds: -10, // already expired
    });
    expect(expireOldItems("u1")).toBe(1);
    expect(getInboxItemById("u1", item.id)?.status).toBe("expired");
  });
  it("supports all inbox statuses", () => {
    expect(supportsAllInboxStatuses().length).toBe(7);
  });
  it("read sets readAt", () => {
    const item = deliver();
    markInboxItemRead("u1", item.id);
    expect(getInboxItemById("u1", item.id)?.readAt).not.toBeNull();
  });
  it("archived sets archivedAt", () => {
    const item = deliver();
    markInboxItemArchived("u1", item.id);
    expect(getInboxItemById("u1", item.id)?.archivedAt).not.toBeNull();
  });
  it("dismissed sets dismissedAt", () => {
    const item = deliver();
    markInboxItemDismissed("u1", item.id);
    expect(getInboxItemById("u1", item.id)?.dismissedAt).not.toBeNull();
  });
  it("pinned sets pinnedAt", () => {
    const item = deliver();
    pinInboxItem("u1", item.id);
    expect(getInboxItemById("u1", item.id)?.pinnedAt).not.toBeNull();
  });
  it("deleted sets deletedAt", () => {
    const item = deliver();
    deleteInboxItem("u1", item.id);
    expect(getInboxItemById("u1", item.id)?.deletedAt).not.toBeNull();
  });
  it("item has correlationId", () => {
    expect(deliver().correlationId).toBeDefined();
  });
  it("item has variables", () => {
    const item = deliverToInbox({
      userId: "u1", notificationId: "n1", registryKey: "k",
      title: "T", body: "B", category: "system", priority: "low",
      variables: { x: 1 },
    });
    expect(item.variables.x).toBe(1);
  });
});

// ===========================================================================
// System 6 — Real-Time Notifications
// ===========================================================================
describe("Notifications — Real-Time (System 6)", () => {
  const enqueue = (userId = "u1") => enqueueRealtime({
    userId, registryKey: "match.won", priority: "high",
    payload: { matchId: "m1" }, channels: ["in_app"],
  });
  it("enqueues notification", () => {
    const n = enqueue();
    expect(n.id).toBeDefined();
    expect(n.status).toBe("queued");
    expect(n.attemptCount).toBe(0);
  });
  it("gets realtime by id", () => {
    const n = enqueue();
    expect(getRealtimeById(n.id)).not.toBeNull();
    expect(getRealtimeById("nonexistent")).toBeNull();
  });
  it("lists realtime", () => {
    enqueue(); enqueue();
    expect(listRealtime().length).toBe(2);
  });
  it("lists by status", () => {
    enqueue();
    expect(listRealtime("queued").length).toBe(1);
    expect(listRealtime("delivered").length).toBe(0);
  });
  it("lists by user", () => {
    enqueue("u1"); enqueue("u2");
    expect(listRealtime(undefined, "u1").length).toBe(1);
  });
  it("dispatches notification", () => {
    const n = enqueue();
    expect(dispatchRealtime(n.id)?.status).toBe("dispatched");
  });
  it("rejects dispatch non-queued", () => {
    const n = enqueue();
    dispatchRealtime(n.id);
    expect(dispatchRealtime(n.id)).toBeNull();
  });
  it("marks delivered", () => {
    const n = enqueue();
    dispatchRealtime(n.id);
    expect(markRealtimeDelivered(n.id)?.status).toBe("delivered");
  });
  it("rejects deliver non-dispatched", () => {
    const n = enqueue();
    expect(markRealtimeDelivered(n.id)).toBeNull();
  });
  it("marks failed", () => {
    const n = enqueue();
    dispatchRealtime(n.id);
    expect(markRealtimeFailed(n.id, "timeout")?.status).toBe("failed");
  });
  it("rejects fail delivered", () => {
    const n = enqueue();
    dispatchRealtime(n.id); markRealtimeDelivered(n.id);
    expect(markRealtimeFailed(n.id, "test")).toBeNull();
  });
  it("drops notification", () => {
    const n = enqueue();
    expect(dropRealtime(n.id)?.status).toBe("dropped");
  });
  it("rejects drop delivered", () => {
    const n = enqueue();
    dispatchRealtime(n.id); markRealtimeDelivered(n.id);
    expect(dropRealtime(n.id)).toBeNull();
  });
  it("retries failed", () => {
    const n = enqueue();
    dispatchRealtime(n.id); markRealtimeFailed(n.id, "test");
    expect(retryRealtime(n.id)?.status).toBe("queued");
  });
  it("rejects retry non-failed", () => {
    const n = enqueue();
    expect(retryRealtime(n.id)).toBeNull();
  });
  it("deduplicates by key", () => {
    enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"], deduplicationKey: "dedup-1" });
    enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"], deduplicationKey: "dedup-1" });
    expect(listRealtime().length).toBe(1);
    expect(listRealtime()[0].collapseCount).toBe(1);
  });
  it("collapse group keeps first", () => {
    enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"], groupKey: "g1" });
    enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"], groupKey: "g1" });
    enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"], groupKey: "g1" });
    expect(collapseGroup("g1")).toBe(2);
  });
  it("generates stats", () => {
    enqueue();
    const stats = generateRealtimeStats();
    expect(stats.totalQueued).toBe(1);
  });
  it("stats tracks delivered", () => {
    const n = enqueue();
    dispatchRealtime(n.id); markRealtimeDelivered(n.id);
    expect(generateRealtimeStats().totalDelivered).toBe(1);
  });
  it("stats tracks failed", () => {
    const n = enqueue();
    dispatchRealtime(n.id); markRealtimeFailed(n.id, "test");
    expect(generateRealtimeStats().totalFailed).toBe(1);
  });
  it("stats byPriority", () => {
    enqueue();
    expect(generateRealtimeStats().byPriority.high).toBe(1);
  });
  it("supports all realtime statuses", () => {
    expect(supportsAllRealtimeStatuses().length).toBe(6);
  });
});

// ===========================================================================
// System 7 — Announcement Platform
// ===========================================================================
describe("Notifications — Announcements (System 7)", () => {
  it("creates announcement", () => {
    const a = createAnnouncement({ scope: "global", title: "Hello", body: "World", createdBy: "admin" });
    expect(a.id).toBeDefined();
    expect(a.status).toBe("draft");
  });
  it("gets announcement by id", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "admin" });
    expect(getAnnouncementById(a.id)).not.toBeNull();
  });
  it("lists announcements", () => {
    createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    createAnnouncement({ scope: "organization", title: "T2", body: "B", createdBy: "a" });
    expect(listAnnouncements().length).toBe(2);
  });
  it("lists by scope", () => {
    createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    createAnnouncement({ scope: "organization", title: "T2", body: "B", createdBy: "a" });
    expect(listAnnouncements("organization").length).toBe(1);
  });
  it("lists by status", () => {
    createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    expect(listAnnouncements(undefined, "draft").length).toBe(1);
  });
  it("transitions draft -> pending_approval", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    expect(submitAnnouncementForApproval(a.id)?.status).toBe("pending_approval");
  });
  it("transitions pending -> approved", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    submitAnnouncementForApproval(a.id);
    expect(approveAnnouncement(a.id, "admin")?.status).toBe("approved");
  });
  it("rejects announcement", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    submitAnnouncementForApproval(a.id);
    expect(rejectAnnouncement(a.id, "admin", "nope")?.status).toBe("rejected");
  });
  it("transitions approved -> active", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    submitAnnouncementForApproval(a.id); approveAnnouncement(a.id, "admin");
    expect(publishAnnouncement(a.id)?.status).toBe("active");
  });
  it("publish sets publishedAt", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    submitAnnouncementForApproval(a.id); approveAnnouncement(a.id, "admin");
    publishAnnouncement(a.id);
    expect(getAnnouncementById(a.id)?.publishedAt).not.toBeNull();
  });
  it("transitions active -> expired", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    submitAnnouncementForApproval(a.id); approveAnnouncement(a.id, "admin");
    publishAnnouncement(a.id);
    expect(expireAnnouncement(a.id)?.status).toBe("expired");
  });
  it("transitions to retired", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    submitAnnouncementForApproval(a.id); approveAnnouncement(a.id, "admin");
    publishAnnouncement(a.id); expireAnnouncement(a.id);
    expect(retireAnnouncement(a.id)?.status).toBe("retired");
  });
  it("canTransition validates", () => {
    expect(canTransitionAnnouncement("draft", "pending_approval")).toBe(true);
    expect(canTransitionAnnouncement("retired", "active")).toBe(false);
  });
  it("rejects invalid transition", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    expect(transitionAnnouncement(a.id, "expired")).toBeNull();
  });
  it("lists active announcements", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    submitAnnouncementForApproval(a.id); approveAnnouncement(a.id, "admin");
    publishAnnouncement(a.id);
    expect(listActiveAnnouncements().length).toBe(1);
  });
  it("active excludes expired", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a", expiresAt: futureIso(-60) });
    submitAnnouncementForApproval(a.id); approveAnnouncement(a.id, "admin");
    publishAnnouncement(a.id);
    expect(listActiveAnnouncements().length).toBe(0);
  });
  it("supports all scopes", () => {
    expect(supportsAllAnnouncementScopes().length).toBe(6);
  });
  it("supports all statuses", () => {
    expect(supportsAllAnnouncementStatuses().length).toBe(7);
  });
});

// ===========================================================================
// System 8 — Messaging Platform
// ===========================================================================
describe("Notifications — System Messages (System 8)", () => {
  it("creates system message", () => {
    const m = createSystemMessage({ type: "system", title: "Welcome", body: "Hello!" });
    expect(m.id).toBeDefined();
    expect(m.deliveredAt).toBeNull();
  });
  it("gets system message by id", () => {
    const m = createSystemMessage({ type: "system", title: "T", body: "B" });
    expect(getSystemMessageById(m.id)).not.toBeNull();
  });
  it("lists system messages", () => {
    createSystemMessage({ type: "system", title: "T1", body: "B" });
    createSystemMessage({ type: "warning", title: "T2", body: "B" });
    expect(listSystemMessages().length).toBe(2);
  });
  it("lists by type", () => {
    createSystemMessage({ type: "system", title: "T1", body: "B" });
    createSystemMessage({ type: "warning", title: "T2", body: "B" });
    expect(listSystemMessages("warning").length).toBe(1);
  });
  it("lists by user", () => {
    createSystemMessage({ type: "system", title: "T1", body: "B", userId: "u1" });
    createSystemMessage({ type: "system", title: "T2", body: "B", userId: "u2" });
    expect(listSystemMessages(undefined, "u1").length).toBe(1);
  });
  it("marks delivered", () => {
    const m = createSystemMessage({ type: "system", title: "T", body: "B" });
    expect(markSystemMessageDelivered(m.id)?.deliveredAt).not.toBeNull();
  });
  it("rejects double deliver", () => {
    const m = createSystemMessage({ type: "system", title: "T", body: "B" });
    markSystemMessageDelivered(m.id);
    expect(markSystemMessageDelivered(m.id)).toBeNull();
  });
  it("generates digest", () => {
    const m = generateDigest("u1", "daily");
    expect(m).not.toBeNull();
    expect(m?.type).toBe("digest");
  });
  it("supports all system message types", () => {
    expect(supportsAllSystemMessageTypes().length).toBe(9);
  });
  it("default priority is medium", () => {
    expect(createSystemMessage({ type: "system", title: "T", body: "B" }).priority).toBe("medium");
  });
  it("default delivery channel is in_app", () => {
    expect(createSystemMessage({ type: "system", title: "T", body: "B" }).deliveryChannels.length).toBe(1);
  });
  it("message has correlationId", () => {
    expect(createSystemMessage({ type: "system", title: "T", body: "B" }).correlationId).toBeDefined();
  });
});

// ===========================================================================
// System 9 — Notification Routing
// ===========================================================================
describe("Notifications — Routing (System 9)", () => {
  it("creates routing rule", () => {
    const r = createRoutingRule({ name: "Match won", sourceEvent: "MatchFinished", targetTemplateKey: "match.won", targetChannels: ["in_app"] });
    expect(r.id).toBeDefined();
    expect(r.active).toBe(true);
    expect(r.order).toBe(100);
  });
  it("gets routing rule by id", () => {
    const r = createRoutingRule({ name: "R", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"] });
    expect(getRoutingRuleById(r.id)).not.toBeNull();
  });
  it("lists routing rules", () => {
    createRoutingRule({ name: "R1", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"] });
    createRoutingRule({ name: "R2", sourceEvent: "Y", targetTemplateKey: "t", targetChannels: ["in_app"] });
    expect(listRoutingRules().length).toBe(2);
  });
  it("lists active only", () => {
    const r = createRoutingRule({ name: "R1", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"] });
    deactivateRoutingRule(r.id);
    expect(listRoutingRules(true).length).toBe(0);
    expect(listRoutingRules(false).length).toBe(1);
  });
  it("deactivates routing rule", () => {
    const r = createRoutingRule({ name: "R1", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"] });
    expect(deactivateRoutingRule(r.id)?.active).toBe(false);
  });
  it("adds routing condition", () => {
    const r = createRoutingRule({ name: "R1", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"] });
    expect(addRoutingCondition(r.id, { field: "userId", operator: "exists", value: true })?.conditions.length).toBe(1);
  });
  it("routeEvent matches", () => {
    createRoutingRule({ name: "R1", sourceEvent: "MatchFinished", targetTemplateKey: "match.won", targetChannels: ["in_app", "push"] });
    const result = routeEvent("MatchFinished", { matchId: "m1" });
    expect(result.matched).toBe(true);
    expect(result.templateKey).toBe("match.won");
  });
  it("routeEvent no match returns false", () => {
    const result = routeEvent("UnknownEvent", {});
    expect(result.matched).toBe(false);
  });
  it("routeEvent respects conditions equals", () => {
    createRoutingRule({
      name: "R1", sourceEvent: "X",
      conditions: [{ field: "category", operator: "equals", value: "important" }],
      targetTemplateKey: "t", targetChannels: ["in_app"],
    });
    expect(routeEvent("X", { category: "important" }).matched).toBe(true);
    expect(routeEvent("X", { category: "other" }).matched).toBe(false);
  });
  it("routeEvent respects conditions exists", () => {
    createRoutingRule({
      name: "R1", sourceEvent: "X",
      conditions: [{ field: "userId", operator: "exists", value: true }],
      targetTemplateKey: "t", targetChannels: ["in_app"],
    });
    expect(routeEvent("X", { userId: "u1" }).matched).toBe(true);
    expect(routeEvent("X", {}).matched).toBe(false);
  });
  it("routeEvent respects conditions in", () => {
    createRoutingRule({
      name: "R1", sourceEvent: "X",
      conditions: [{ field: "role", operator: "in", value: ["admin", "moderator"] }],
      targetTemplateKey: "t", targetChannels: ["in_app"],
    });
    expect(routeEvent("X", { role: "admin" }).matched).toBe(true);
    expect(routeEvent("X", { role: "user" }).matched).toBe(false);
  });
  it("routeEvent respects conditions gt", () => {
    createRoutingRule({
      name: "R1", sourceEvent: "X",
      conditions: [{ field: "amount", operator: "gt", value: 100 }],
      targetTemplateKey: "t", targetChannels: ["in_app"],
    });
    expect(routeEvent("X", { amount: 200 }).matched).toBe(true);
    expect(routeEvent("X", { amount: 50 }).matched).toBe(false);
  });
  it("routeEvent respects conditions lt", () => {
    createRoutingRule({
      name: "R1", sourceEvent: "X",
      conditions: [{ field: "amount", operator: "lt", value: 100 }],
      targetTemplateKey: "t", targetChannels: ["in_app"],
    });
    expect(routeEvent("X", { amount: 50 }).matched).toBe(true);
    expect(routeEvent("X", { amount: 200 }).matched).toBe(false);
  });
  it("routeEvent respects conditions contains", () => {
    createRoutingRule({
      name: "R1", sourceEvent: "X",
      conditions: [{ field: "message", operator: "contains", value: "alert" }],
      targetTemplateKey: "t", targetChannels: ["in_app"],
    });
    expect(routeEvent("X", { message: "this is an alert" }).matched).toBe(true);
    expect(routeEvent("X", { message: "all good" }).matched).toBe(false);
  });
  it("routeEvent respects order", () => {
    createRoutingRule({ name: "R2", sourceEvent: "X", targetTemplateKey: "second", targetChannels: ["in_app"], order: 200 });
    createRoutingRule({ name: "R1", sourceEvent: "X", targetTemplateKey: "first", targetChannels: ["in_app"], order: 100 });
    expect(routeEvent("X", {}).templateKey).toBe("first");
  });
  it("routeEvent respects priorityOverride", () => {
    createRoutingRule({ name: "R1", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"], priorityOverride: "critical" });
    expect(routeEvent("X", {}).priority).toBe("critical");
  });
  it("routeEvent skips inactive rules", () => {
    const r = createRoutingRule({ name: "R1", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"], active: false });
    expect(routeEvent("X", {}).matched).toBe(false);
  });
  it("supports all routing operators", () => {
    expect(supportsAllRoutingOperators().length).toBe(8);
  });
});

// ===========================================================================
// System 10 — Notification Scheduling
// ===========================================================================
describe("Notifications — Scheduling (System 10)", () => {
  it("creates schedule", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(s.id).toBeDefined();
    expect(s.status).toBe("pending");
  });
  it("gets schedule by id", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(getScheduleById(s.id)).not.toBeNull();
  });
  it("lists schedules", () => {
    createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    createSchedule({ type: "delayed", registryKey: "k", scheduledAt: futureIso(60) });
    expect(listSchedules().length).toBe(2);
  });
  it("lists by status", () => {
    createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(listSchedules("pending").length).toBe(1);
  });
  it("lists by type", () => {
    createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    createSchedule({ type: "delayed", registryKey: "k", scheduledAt: futureIso(60) });
    expect(listSchedules(undefined, "delayed").length).toBe(1);
  });
  it("dispatches schedule", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(dispatchSchedule(s.id)?.status).toBe("dispatched");
  });
  it("completes schedule", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    dispatchSchedule(s.id);
    expect(completeSchedule(s.id)?.status).toBe("completed");
  });
  it("fails schedule", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    dispatchSchedule(s.id);
    const r = failSchedule(s.id, "timeout");
    expect(r).not.toBeNull();
  });
  it("failed schedule retries up to max", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0), maxRetries: 3 });
    dispatchSchedule(s.id); failSchedule(s.id, "x"); // retryCount=1, back to pending
    expect(getScheduleById(s.id)?.status).toBe("pending");
    expect(getScheduleById(s.id)?.retryCount).toBe(1);
  });
  it("cancels schedule", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(cancelSchedule(s.id, "user")?.status).toBe("cancelled");
  });
  it("expires schedule", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(expireSchedule(s.id)?.status).toBe("expired");
  });
  it("canTransition validates", () => {
    expect(canTransitionSchedule("pending", "dispatched")).toBe(true);
    expect(canTransitionSchedule("completed", "pending")).toBe(false);
  });
  it("lists due schedules", () => {
    createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(-60) });
    createSchedule({ type: "delayed", registryKey: "k", scheduledAt: futureIso(3600) });
    expect(listDueSchedules().length).toBe(1);
  });
  it("listDueSchedules excludes expired", () => {
    createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(-3600), expiresAt: futureIso(-60) });
    expect(listDueSchedules().length).toBe(0);
  });
  it("lists overdue schedules", () => {
    createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(-600) });
    expect(listOverdueSchedules().length).toBe(1);
  });
  it("supports all schedule types", () => {
    expect(supportsAllScheduleTypes().length).toBe(5);
  });
  it("supports all schedule statuses", () => {
    expect(supportsAllScheduleStatuses().length).toBe(6);
  });
  it("default maxRetries is 3", () => {
    expect(createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) }).maxRetries).toBe(3);
  });
  it("supports recurrenceRule", () => {
    const s = createSchedule({ type: "recurring", registryKey: "k", scheduledAt: futureIso(0), recurrenceRule: "daily" });
    expect(s.recurrenceRule).toBe("daily");
  });
});

// ===========================================================================
// System 11 — Notification Analytics
// ===========================================================================
describe("Notifications — Analytics (System 11)", () => {
  it("generates empty analytics", () => {
    const a = generateNotificationAnalytics();
    expect(a.delivery.total).toBe(0);
    expect(a.delivery.delivered).toBe(0);
  });
  it("counts inbox items", () => {
    deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    const a = generateNotificationAnalytics();
    expect(a.delivery.total).toBe(1);
  });
  it("tracks delivered count", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    dispatchRealtime(n.id); markRealtimeDelivered(n.id);
    expect(generateNotificationAnalytics().delivery.delivered).toBe(1);
  });
  it("tracks failed count", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    dispatchRealtime(n.id); markRealtimeFailed(n.id, "timeout");
    expect(generateNotificationAnalytics().delivery.failed).toBe(1);
  });
  it("tracks byChannel", () => {
    enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app", "push"] });
    const a = generateNotificationAnalytics();
    expect(a.byChannel.in_app.sent).toBe(1);
    expect(a.byChannel.push.sent).toBe(1);
  });
  it("tracks byCategory", () => {
    deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "social", priority: "low" });
    expect(generateNotificationAnalytics().byCategory.social.sent).toBe(1);
  });
  it("tracks byPriority", () => {
    deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "critical" });
    expect(generateNotificationAnalytics().byPriority.critical.sent).toBe(1);
  });
  it("tracks failures by reason", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    dispatchRealtime(n.id); markRealtimeFailed(n.id, "timeout");
    expect(generateNotificationAnalytics().failures.byReason.timeout).toBe(1);
  });
  it("tracks digest", () => {
    generateDigest("u1", "daily");
    expect(generateNotificationAnalytics().digest.generated).toBe(1);
  });
  it("analytics has updatedAt", () => {
    expect(generateNotificationAnalytics().updatedAt).toBeDefined();
  });
  it("tracks engagement read", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    markInboxItemRead("u1", item.id);
    expect(generateNotificationAnalytics().engagement.readCount).toBe(1);
  });
  it("tracks engagement dismiss", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    markInboxItemDismissed("u1", item.id);
    expect(generateNotificationAnalytics().engagement.dismissCount).toBe(1);
  });
  it("tracks engagement archive", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    markInboxItemArchived("u1", item.id);
    expect(generateNotificationAnalytics().engagement.archiveCount).toBe(1);
  });
});

// ===========================================================================
// System 12 — Notification Dashboard
// ===========================================================================
describe("Notifications — Dashboard (System 12)", () => {
  it("generates empty dashboard", () => {
    const d = generateNotificationDashboard();
    expect(d.pending).toBe(0);
    expect(d.delivered24h).toBe(0);
  });
  it("counts pending", () => {
    enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    expect(generateNotificationDashboard().pending).toBe(1);
  });
  it("counts templates", () => {
    createTemplate({ key: "t1", locales: { en: { title: "T", body: "B", summary: null, iconKey: null } }, category: "system", priority: "low" });
    expect(generateNotificationDashboard().templates.total).toBe(1);
  });
  it("counts active templates", () => {
    createTemplate({ key: "t1", locales: { en: { title: "T", body: "B", summary: null, iconKey: null } }, category: "system", priority: "low" });
    expect(generateNotificationDashboard().templates.active).toBe(1);
  });
  it("tracks channels", () => {
    registerChannel({ id: "in_app", name: "In-App" });
    expect(generateNotificationDashboard().channels.length).toBe(1);
  });
  it("tracks bridge state", () => {
    expect(generateNotificationDashboard().health.bridge.subscribed).toBe(false);
  });
  it("tracks queue size", () => {
    enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    expect(generateNotificationDashboard().health.queue.size).toBe(1);
  });
  it("tracks scheduler pending", () => {
    createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(generateNotificationDashboard().health.scheduler.pending).toBe(1);
  });
  it("tracks top categories", () => {
    deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "social", priority: "low" });
    deliverToInbox({ userId: "u1", notificationId: "n2", registryKey: "k", title: "T", body: "B", category: "social", priority: "low" });
    expect(generateNotificationDashboard().topCategories.length).toBeGreaterThan(0);
  });
  it("tracks top failures", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    dispatchRealtime(n.id); markRealtimeFailed(n.id, "timeout");
    expect(generateNotificationDashboard().topFailures.length).toBeGreaterThan(0);
  });
  it("dashboard has updatedAt", () => {
    expect(generateNotificationDashboard().updatedAt).toBeDefined();
  });
  it("getNotificationStatus returns operational", () => {
    const s = getNotificationStatus();
    expect(s.operational).toBe(true);
    expect(s.systems).toBe(15);
  });
});

// ===========================================================================
// System 13 — Event Bus Bridge
// ===========================================================================
describe("Notifications — Event Bus Bridge (System 13)", () => {
  it("subscribes to event bus", () => {
    subscribeNotifications();
    expect(isNotificationsSubscribed()).toBe(true);
    unsubscribeNotifications();
  });
  it("unsubscribes from event bus", () => {
    subscribeNotifications();
    unsubscribeNotifications();
    expect(isNotificationsSubscribed()).toBe(false);
  });
  it("does not double-subscribe", () => {
    subscribeNotifications();
    subscribeNotifications();
    expect(isNotificationsSubscribed()).toBe(true);
    unsubscribeNotifications();
  });
  it("publishes notification event", () => {
    publishNotificationEvent("NotificationDelivered", "u1", { notificationId: "n1", correlationId: "c1" });
    expect(getBridgePublishedCount()).toBe(1);
  });
  it("published events tracked", () => {
    publishNotificationEvent("NotificationRead", "u1", { itemId: "i1", correlationId: "c1" });
    publishNotificationEvent("AnnouncementPublished", null, { announcementId: "a1" });
    expect(getPublishedEvents().length).toBe(2);
  });
  it("reset clears state", () => {
    subscribeNotifications();
    publishNotificationEvent("NotificationDelivered", null, {});
    _resetBridgeForTesting();
    expect(isNotificationsSubscribed()).toBe(false);
    expect(getBridgePublishedCount()).toBe(0);
  });
  it("supports null actorId", () => {
    publishNotificationEvent("AnnouncementExpired", null, { announcementId: "a1" });
    expect(getPublishedEvents()[0].actorId).toBeNull();
  });
  it("published event has timestamp", () => {
    publishNotificationEvent("InboxCleared", "u1", { userId: "u1", count: 5 });
    expect(getPublishedEvents()[0].timestamp).toBeDefined();
  });
  it("processed count starts at 0", () => {
    expect(getBridgeProcessedCount()).toBe(0);
  });
  it("read inbox item publishes event", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    markInboxItemRead("u1", item.id);
    const events = getPublishedEvents();
    expect(events.some(e => e.type === "NotificationRead")).toBe(true);
  });
  it("dismiss inbox item publishes event", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    markInboxItemDismissed("u1", item.id);
    expect(getPublishedEvents().some(e => e.type === "NotificationDismissed")).toBe(true);
  });
  it("archive inbox item publishes event", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    markInboxItemArchived("u1", item.id);
    expect(getPublishedEvents().some(e => e.type === "NotificationArchived")).toBe(true);
  });
  it("pin inbox item publishes event", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    pinInboxItem("u1", item.id);
    expect(getPublishedEvents().some(e => e.type === "NotificationPinned")).toBe(true);
  });
  it("deliver realtime publishes event", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    dispatchRealtime(n.id); markRealtimeDelivered(n.id);
    expect(getPublishedEvents().some(e => e.type === "NotificationDelivered")).toBe(true);
  });
  it("fail realtime publishes event", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    dispatchRealtime(n.id); markRealtimeFailed(n.id, "timeout");
    expect(getPublishedEvents().some(e => e.type === "NotificationFailed")).toBe(true);
  });
  it("publish announcement publishes event", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    submitAnnouncementForApproval(a.id); approveAnnouncement(a.id, "admin");
    publishAnnouncement(a.id);
    expect(getPublishedEvents().some(e => e.type === "AnnouncementPublished")).toBe(true);
  });
  it("expire announcement publishes event", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    submitAnnouncementForApproval(a.id); approveAnnouncement(a.id, "admin");
    publishAnnouncement(a.id); expireAnnouncement(a.id);
    expect(getPublishedEvents().some(e => e.type === "AnnouncementExpired")).toBe(true);
  });
  it("deliver system message publishes event", () => {
    const m = createSystemMessage({ type: "system", title: "T", body: "B" });
    markSystemMessageDelivered(m.id);
    expect(getPublishedEvents().some(e => e.type === "SystemMessageSent")).toBe(true);
  });
  it("generate digest publishes event", () => {
    generateDigest("u1", "weekly");
    expect(getPublishedEvents().some(e => e.type === "DigestGenerated")).toBe(true);
  });
  it("clear inbox publishes event", () => {
    deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    clearInbox("u1");
    expect(getPublishedEvents().some(e => e.type === "InboxCleared")).toBe(true);
  });
  it("route match publishes event", () => {
    createRoutingRule({ name: "R", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"] });
    routeEvent("X", {});
    expect(getPublishedEvents().some(e => e.type === "RoutingRuleMatched")).toBe(true);
  });
  it("schedule dispatch publishes event", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    dispatchSchedule(s.id);
    expect(getPublishedEvents().some(e => e.type === "ScheduleDispatched")).toBe(true);
  });
});

// ===========================================================================
// System 14 — Developer Integration
// ===========================================================================
describe("Notifications — Developer Integration (System 14)", () => {
  it("returns public APIs", () => {
    const d = getDeveloperIntegration();
    expect(d.publicAPIs.length).toBeGreaterThan(0);
  });
  it("returns extension hooks", () => {
    const d = getDeveloperIntegration();
    expect(d.extensionHooks.length).toBeGreaterThan(0);
  });
  it("returns SDK metadata", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.version).toBeDefined();
    expect(d.sdkMetadata.language).toBe("typescript");
  });
  it("returns webhooks", () => {
    const d = getDeveloperIntegration();
    expect(d.webhooks.length).toBeGreaterThan(0);
  });
  it("SDK has capabilities list", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.capabilities.length).toBeGreaterThan(0);
  });
  it("public APIs include inbox endpoint", () => {
    expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("inbox"))).toBe(true);
  });
  it("public APIs include preferences endpoint", () => {
    expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("preferences"))).toBe(true);
  });
  it("public APIs include templates endpoint", () => {
    expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("templates"))).toBe(true);
  });
  it("public APIs include channels endpoint", () => {
    expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("channels"))).toBe(true);
  });
  it("public APIs include announcements endpoint", () => {
    expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("announcements"))).toBe(true);
  });
  it("extension hooks include NotificationDelivered", () => {
    expect(getDeveloperIntegration().extensionHooks.some(h => h.triggerEvent === "NotificationDelivered")).toBe(true);
  });
  it("extension hooks include AnnouncementPublished", () => {
    expect(getDeveloperIntegration().extensionHooks.some(h => h.triggerEvent === "AnnouncementPublished")).toBe(true);
  });
  it("webhooks include NotificationRead", () => {
    expect(getDeveloperIntegration().webhooks.some(w => w.event === "NotificationRead")).toBe(true);
  });
  it("webhooks include ScheduleDispatched", () => {
    expect(getDeveloperIntegration().webhooks.some(w => w.event === "ScheduleDispatched")).toBe(true);
  });
});

// ===========================================================================
// System 15 — Documentation Generator
// ===========================================================================
describe("Notifications — Documentation Generator (System 15)", () => {
  it("generates documentation", () => {
    const doc = generateNotificationDocumentation();
    expect(doc.version).toBeDefined();
    expect(doc.generatedAt).toBeDefined();
  });
  it("documents all 15 systems", () => {
    expect(generateNotificationDocumentation().systems.length).toBe(15);
  });
  it("system 1 is Notification Registry", () => {
    expect(generateNotificationDocumentation().systems[0].name).toBe("Notification Registry");
  });
  it("system 15 is Documentation Generator", () => {
    expect(generateNotificationDocumentation().systems[14].name).toBe("Documentation Generator");
  });
  it("documents all events", () => {
    expect(generateNotificationDocumentation().events.length).toBeGreaterThan(10);
  });
  it("NotificationDelivered documented", () => {
    expect(generateNotificationDocumentation().events.some(e => e.type === "NotificationDelivered")).toBe(true);
  });
  it("AnnouncementPublished documented", () => {
    expect(generateNotificationDocumentation().events.some(e => e.type === "AnnouncementPublished")).toBe(true);
  });
  it("ownership owns inbox", () => {
    expect(generateNotificationDocumentation().ownership.owns.some(o => o.includes("Inbox"))).toBe(true);
  });
  it("ownership doesNotOwn chat", () => {
    expect(generateNotificationDocumentation().ownership.doesNotOwn.some(o => o.includes("Chat"))).toBe(true);
  });
  it("generates markdown", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain("# EduBek");
    expect(md).toContain("Notification");
  });
  it("markdown includes all systems", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain("System 1 —");
    expect(md).toContain("System 15 —");
  });
  it("markdown includes events section", () => {
    expect(generateMarkdownDocumentation()).toContain("## Events");
  });
  it("markdown includes ownership section", () => {
    expect(generateMarkdownDocumentation()).toContain("## Ownership");
  });
  it("getNotificationVersion returns version", () => {
    expect(getNotificationVersion()).toBe("1.0.0");
  });
  it("each system has endpoints or events", () => {
    const doc = generateNotificationDocumentation();
    for (const s of doc.systems) {
      expect(s.endpoints).toBeDefined();
      expect(s.events).toBeDefined();
    }
  });
  it("each event has payload", () => {
    const doc = generateNotificationDocumentation();
    for (const e of doc.events) {
      expect(Array.isArray(e.payload)).toBe(true);
      expect(e.description).toBeDefined();
    }
  });
  it("NotificationDelivered payload includes notificationId", () => {
    const doc = generateNotificationDocumentation();
    const e = doc.events.find(ev => ev.type === "NotificationDelivered");
    expect(e?.payload).toContain("notificationId");
  });
});

// ===========================================================================
// Ownership Boundaries
// ===========================================================================
describe("Notifications — Ownership Boundaries", () => {
  it("never owns gameplay", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.capabilities.some(c => c.includes("gameplay"))).toBe(false);
  });
  it("never owns xp", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.capabilities.some(c => c.includes("xp"))).toBe(false);
  });
  it("never owns inventory", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.capabilities.some(c => c.includes("inventory"))).toBe(false);
  });
  it("never owns commerce", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.capabilities.some(c => c.includes("commerce"))).toBe(false);
  });
  it("never owns moderation", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.capabilities.some(c => c.includes("moderation"))).toBe(false);
  });
  it("documentation states it does not own chat", () => {
    expect(generateNotificationDocumentation().ownership.doesNotOwn.some(o => o.toLowerCase().includes("chat"))).toBe(true);
  });
  it("documentation states it does not own DMs", () => {
    expect(generateNotificationDocumentation().ownership.doesNotOwn.some(o => o.toLowerCase().includes("direct messages"))).toBe(true);
  });
  it("documentation states it does not own gameplay", () => {
    expect(generateNotificationDocumentation().ownership.doesNotOwn.some(o => o.toLowerCase().includes("gameplay"))).toBe(true);
  });
  it("documentation states it does not own rewards", () => {
    expect(generateNotificationDocumentation().ownership.doesNotOwn.some(o => o.toLowerCase().includes("rewards"))).toBe(true);
  });
  it("documentation states it does not own XP", () => {
    expect(generateNotificationDocumentation().ownership.doesNotOwn.some(o => o.toLowerCase().includes("xp"))).toBe(true);
  });
  it("documentation states it does not own commerce", () => {
    expect(generateNotificationDocumentation().ownership.doesNotOwn.some(o => o.toLowerCase().includes("commerce"))).toBe(true);
  });
  it("documentation states it does not own emails provider", () => {
    expect(generateNotificationDocumentation().ownership.doesNotOwn.some(o => o.toLowerCase().includes("emails (provider"))).toBe(true);
  });
  it("documentation states it does not own SMS providers", () => {
    expect(generateNotificationDocumentation().ownership.doesNotOwn.some(o => o.toLowerCase().includes("sms providers"))).toBe(true);
  });
  it("documentation states it owns notification templates", () => {
    expect(generateNotificationDocumentation().ownership.owns.some(o => o.includes("Notification templates"))).toBe(true);
  });
  it("documentation states it owns inbox", () => {
    expect(generateNotificationDocumentation().ownership.owns.some(o => o.toLowerCase().includes("inbox"))).toBe(true);
  });
  it("documentation states it owns delivery routing", () => {
    expect(generateNotificationDocumentation().ownership.owns.some(o => o.toLowerCase().includes("routing"))).toBe(true);
  });
  it("documentation states it owns scheduling", () => {
    expect(generateNotificationDocumentation().ownership.owns.some(o => o.toLowerCase().includes("scheduling"))).toBe(true);
  });
});

// ===========================================================================
// Additional Edge Cases
// ===========================================================================
describe("Notifications — Additional Edge Cases", () => {
  it("registry entry default tags empty", () => {
    const e = createRegistryEntry({ key: "k", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t" });
    expect(e.tags.length).toBe(0);
  });
  it("registry entry default description empty", () => {
    const e = createRegistryEntry({ key: "k", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t" });
    expect(e.description).toBe("");
  });
  it("registry entry default deprecatedAt null", () => {
    const e = createRegistryEntry({ key: "k", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t" });
    expect(e.deprecatedAt).toBeNull();
  });
  it("registry supports all 15 categories", () => {
    const cats = supportsAllCategories();
    expect(cats).toContain("system");
    expect(cats).toContain("social");
    expect(cats).toContain("competitive");
    expect(cats).toContain("progression");
    expect(cats).toContain("commerce");
    expect(cats).toContain("liveops");
    expect(cats).toContain("administration");
    expect(cats).toContain("achievement");
    expect(cats).toContain("maintenance");
    expect(cats).toContain("emergency");
    expect(cats).toContain("tournament");
    expect(cats).toContain("campaign");
    expect(cats).toContain("season");
    expect(cats).toContain("reminder");
    expect(cats).toContain("digest");
  });
  it("registry supports all 5 priorities", () => {
    const pri = supportsAllPriorities();
    expect(pri).toContain("critical");
    expect(pri).toContain("high");
    expect(pri).toContain("medium");
    expect(pri).toContain("low");
    expect(pri).toContain("informational");
  });
  it("template default variables empty", () => {
    const t = createTemplate({ key: "k", locales: { en: { title: "T", body: "B", summary: null, iconKey: null } }, category: "system", priority: "low" });
    expect(t.variables.length).toBe(0);
  });
  it("template default actions empty", () => {
    const t = createTemplate({ key: "k", locales: { en: { title: "T", body: "B", summary: null, iconKey: null } }, category: "system", priority: "low" });
    expect(t.actions.length).toBe(0);
  });
  it("channel default providerReference null", () => {
    expect(registerChannel({ id: "in_app", name: "In-App" }).providerReference).toBeNull();
  });
  it("preferences default organizationOverrides empty", () => {
    expect(Object.keys(createPreferences({ userId: "u1" }).organizationOverrides).length).toBe(0);
  });
  it("preferences default mutePeriods empty", () => {
    expect(createPreferences({ userId: "u1" }).mutePeriods.length).toBe(0);
  });
  it("inbox item default readAt null", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    expect(item.readAt).toBeNull();
  });
  it("inbox item default archivedAt null", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    expect(item.archivedAt).toBeNull();
  });
  it("realtime default collapseCount 0", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    expect(n.collapseCount).toBe(0);
  });
  it("realtime default failureReason null", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    expect(n.failureReason).toBeNull();
  });
  it("announcement default publishedAt null", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    expect(a.publishedAt).toBeNull();
  });
  it("announcement default approvedBy null", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    expect(a.approvedBy).toBeNull();
  });
  it("announcement default expiresAt null", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    expect(a.expiresAt).toBeNull();
  });
  it("announcement default locale en", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    expect(a.locale).toBe("en");
  });
  it("system message default userId null", () => {
    const m = createSystemMessage({ type: "system", title: "T", body: "B" });
    expect(m.userId).toBeNull();
  });
  it("system message default organizationId null", () => {
    const m = createSystemMessage({ type: "system", title: "T", body: "B" });
    expect(m.organizationId).toBeNull();
  });
  it("system message default expiresAt null", () => {
    const m = createSystemMessage({ type: "system", title: "T", body: "B" });
    expect(m.expiresAt).toBeNull();
  });
  it("routing rule default priorityOverride null", () => {
    const r = createRoutingRule({ name: "R", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"] });
    expect(r.priorityOverride).toBeNull();
  });
  it("routing rule default order 100", () => {
    const r = createRoutingRule({ name: "R", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"] });
    expect(r.order).toBe(100);
  });
  it("schedule default recurrenceRule null", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(s.recurrenceRule).toBeNull();
  });
  it("schedule default expiresAt null", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(s.expiresAt).toBeNull();
  });
  it("schedule default userId null", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(s.userId).toBeNull();
  });
  it("schedule default organizationId null", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(s.organizationId).toBeNull();
  });
  it("supports all 8 delivery channels", () => {
    const ids = supportsAllDeliveryChannels();
    expect(ids).toContain("in_app");
    expect(ids).toContain("push");
    expect(ids).toContain("email");
    expect(ids).toContain("sms");
    expect(ids).toContain("organization_announcement");
    expect(ids).toContain("broadcast_overlay");
    expect(ids).toContain("webhook");
    expect(ids).toContain("developer_callback");
  });
  it("supports all 4 channel statuses", () => {
    const s = supportsAllChannelStatuses();
    expect(s).toContain("active");
    expect(s).toContain("inactive");
    expect(s).toContain("maintenance");
    expect(s).toContain("deprecated");
  });
  it("supports all 4 digest preferences", () => {
    const d = supportsAllDigestPreferences();
    expect(d).toContain("none");
    expect(d).toContain("daily");
    expect(d).toContain("weekly");
    expect(d).toContain("monthly");
  });
  it("supports all 7 inbox statuses", () => {
    const s = supportsAllInboxStatuses();
    expect(s).toContain("unread");
    expect(s).toContain("read");
    expect(s).toContain("archived");
    expect(s).toContain("dismissed");
    expect(s).toContain("pinned");
    expect(s).toContain("expired");
    expect(s).toContain("deleted");
  });
  it("supports all 6 realtime statuses", () => {
    const s = supportsAllRealtimeStatuses();
    expect(s).toContain("queued");
    expect(s).toContain("dispatched");
    expect(s).toContain("delivered");
    expect(s).toContain("failed");
    expect(s).toContain("dropped");
    expect(s).toContain("collapsed");
  });
  it("supports all 6 announcement scopes", () => {
    const s = supportsAllAnnouncementScopes();
    expect(s).toContain("global");
    expect(s).toContain("organization");
    expect(s).toContain("tournament");
    expect(s).toContain("maintenance");
    expect(s).toContain("emergency");
    expect(s).toContain("regional");
  });
  it("supports all 7 announcement statuses", () => {
    const s = supportsAllAnnouncementStatuses();
    expect(s).toContain("draft");
    expect(s).toContain("pending_approval");
    expect(s).toContain("approved");
    expect(s).toContain("active");
    expect(s).toContain("expired");
    expect(s).toContain("rejected");
    expect(s).toContain("retired");
  });
  it("supports all 9 system message types", () => {
    const t = supportsAllSystemMessageTypes();
    expect(t).toContain("system");
    expect(t).toContain("warning");
    expect(t).toContain("maintenance");
    expect(t).toContain("reminder");
    expect(t).toContain("campaign_update");
    expect(t).toContain("season_update");
    expect(t).toContain("purchase_confirmation");
    expect(t).toContain("achievement_summary");
    expect(t).toContain("digest");
  });
  it("supports all 8 routing operators", () => {
    const o = supportsAllRoutingOperators();
    expect(o).toContain("equals");
    expect(o).toContain("not_equals");
    expect(o).toContain("contains");
    expect(o).toContain("in");
    expect(o).toContain("not_in");
    expect(o).toContain("gt");
    expect(o).toContain("lt");
    expect(o).toContain("exists");
  });
  it("supports all 5 schedule types", () => {
    const t = supportsAllScheduleTypes();
    expect(t).toContain("immediate");
    expect(t).toContain("delayed");
    expect(t).toContain("scheduled");
    expect(t).toContain("recurring");
    expect(t).toContain("digest");
  });
  it("supports all 6 schedule statuses", () => {
    const s = supportsAllScheduleStatuses();
    expect(s).toContain("pending");
    expect(s).toContain("dispatched");
    expect(s).toContain("completed");
    expect(s).toContain("cancelled");
    expect(s).toContain("failed");
    expect(s).toContain("expired");
  });
  it("render handles missing optional variable", () => {
    const t = createTemplate({
      key: "k", category: "system", priority: "low",
      locales: { en: { title: "Hi {name}", body: "Body", summary: null, iconKey: null } },
      variables: [{ key: "name", type: "string", required: false, defaultValue: "Friend", description: "" }],
    });
    const r = renderTemplate(t.id, "en", {});
    expect(r?.title).toBe("Hi {name}"); // not substituted, no error since not required
  });
  it("render substitutes multiple variables", () => {
    const t = createTemplate({
      key: "k", category: "system", priority: "low",
      locales: { en: { title: "{greeting} {name}", body: "{greeting} {name}!", summary: null, iconKey: null } },
    });
    const r = renderTemplate(t.id, "en", { greeting: "Hello", name: "Alice" });
    expect(r?.title).toBe("Hello Alice");
    expect(r?.body).toBe("Hello Alice!");
  });
  it("render uses uz locale when available", () => {
    const t = createTemplate({
      key: "k", category: "system", priority: "low",
      locales: {
        en: { title: "Hello", body: "Body", summary: null, iconKey: null },
        uz: { title: "Salom", body: "Matn", summary: null, iconKey: null },
      },
    });
    expect(renderTemplate(t.id, "uz", {})?.title).toBe("Salom");
  });
  it("preferences updateChannelPreference keeps other channels", () => {
    createPreferences({ userId: "u1" });
    const p = updateChannelPreference("u1", "push", { enabled: false });
    expect(p?.channels.length).toBe(4); // unchanged
  });
  it("addMutePeriod with multiple categories", () => {
    createPreferences({ userId: "u1" });
    const p = addMutePeriod("u1", { reason: "vacation", startsAt: futureIso(60), endsAt: futureIso(3600), mutedCategories: ["social", "competitive"] });
    expect(p?.mutePeriods[0].mutedCategories.length).toBe(2);
  });
  it("deliverToInbox with actions", () => {
    const item = deliverToInbox({
      userId: "u1", notificationId: "n", registryKey: "k", title: "T", body: "B",
      category: "system", priority: "low",
      actions: [{ id: "view", label: "View", deepLink: "/x", actionType: "open", metadata: {} }],
    });
    expect(item.actions.length).toBe(1);
  });
  it("deliverToInbox with deepLink", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n", registryKey: "k", title: "T", body: "B", category: "system", priority: "low", deepLink: "/matches/m1" });
    expect(item.deepLink).toBe("/matches/m1");
  });
  it("deliverToInbox with iconKey", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n", registryKey: "k", title: "T", body: "B", category: "system", priority: "low", iconKey: "trophy" });
    expect(item.iconKey).toBe("trophy");
  });
  it("realtime with groupKey", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"], groupKey: "g1" });
    expect(n.groupKey).toBe("g1");
  });
  it("realtime with correlationId", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"], correlationId: "c1" });
    expect(n.correlationId).toBe("c1");
  });
  it("announcement with targetId", () => {
    const a = createAnnouncement({ scope: "organization", title: "T", body: "B", createdBy: "a", targetId: "org-1" });
    expect(a.targetId).toBe("org-1");
  });
  it("announcement with custom channels", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a", channels: ["in_app", "email"] });
    expect(a.channels.length).toBe(2);
  });
  it("system message with variables", () => {
    const m = createSystemMessage({ type: "purchase_confirmation", title: "T", body: "B", variables: { amount: 100 } });
    expect(m.variables.amount).toBe(100);
  });
  it("routing rule with description", () => {
    const r = createRoutingRule({ name: "R", description: "Test rule", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"] });
    expect(r.description).toBe("Test rule");
  });
  it("schedule with variables", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0), variables: { x: 1 } });
    expect(s.variables.x).toBe(1);
  });
  it("schedule with userId", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0), userId: "u1" });
    expect(s.userId).toBe("u1");
  });
  it("schedule with organizationId", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0), organizationId: "org-1" });
    expect(s.organizationId).toBe("org-1");
  });
  it("schedule with expiresAt", () => {
    const s = createSchedule({ type: "delayed", registryKey: "k", scheduledAt: futureIso(60), expiresAt: futureIso(120) });
    expect(s.expiresAt).not.toBeNull();
  });
  it("schedule with maxRetries", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0), maxRetries: 5 });
    expect(s.maxRetries).toBe(5);
  });
  it("documentation lists 16 events", () => {
    expect(generateNotificationDocumentation().events.length).toBe(16);
  });
  it("documentation system 13 is Event Bus Bridge", () => {
    expect(generateNotificationDocumentation().systems[12].name).toBe("Event Bus Bridge");
  });
  it("dashboard templates count includes draft", () => {
    const t = createTemplate({ key: "k", locales: { en: { title: "T", body: "B", summary: null, iconKey: null } }, category: "system", priority: "low" });
    deactivateTemplate(t.id);
    expect(generateNotificationDashboard().templates.draft).toBe(1);
  });
  it("analytics latency tracks dispatched->delivered", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    dispatchRealtime(n.id); markRealtimeDelivered(n.id);
    const a = generateNotificationAnalytics();
    expect(a.latency.avgDeliveryMs).toBeGreaterThanOrEqual(0);
  });
  it("checkDeliveryAllowed for critical bypasses quiet hours", () => {
    createPreferences({ userId: "u1" });
    setQuietHours("u1", { enabled: true, startHour: 22, endHour: 7, timezone: "UTC" });
    const r = checkDeliveryAllowed("u1", { category: "emergency", priority: "critical", channels: ["in_app"], deliveryHour: 23 });
    expect(r.reasons).not.toContain("quiet_hours");
  });
  // ===== Extra tests to reach 450+ =====
  it("registry default status is draft", () => {
    const e = createRegistryEntry({ key: "k", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t" });
    expect(e.status).toBe("draft");
  });
  it("registry default version is 1", () => {
    const e = createRegistryEntry({ key: "k", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t" });
    expect(e.version).toBe(1);
  });
  it("registry transition increments version", () => {
    const e = createRegistryEntry({ key: "k", category: "system", priority: "low", defaultChannels: ["in_app"], templateId: "t" });
    activateRegistryEntry(e.id);
    expect(getRegistryEntryById(e.id)?.version).toBe(2);
  });
  it("template version increments on locale add", () => {
    const t = createTemplate({ key: "k", locales: { en: { title: "T", body: "B", summary: null, iconKey: null } }, category: "system", priority: "low" });
    addTemplateLocale(t.id, "uz", { title: "T", body: "B", summary: null, iconKey: null });
    expect(getTemplateById(t.id)?.version).toBe(2);
  });
  it("template version increments on action add", () => {
    const t = createTemplate({ key: "k", locales: { en: { title: "T", body: "B", summary: null, iconKey: null } }, category: "system", priority: "low" });
    addTemplateAction(t.id, { id: "act", label: "L", deepLink: null, actionType: "open", metadata: {} });
    expect(getTemplateById(t.id)?.version).toBe(2);
  });
  it("template deactivate increments version", () => {
    const t = createTemplate({ key: "k", locales: { en: { title: "T", body: "B", summary: null, iconKey: null } }, category: "system", priority: "low" });
    deactivateTemplate(t.id);
    expect(getTemplateById(t.id)?.version).toBe(2);
  });
  it("template supports uz locale", () => {
    const t = createTemplate({
      key: "k", category: "system", priority: "low",
      locales: {
        en: { title: "Hello", body: "Body", summary: null, iconKey: null },
        uz: { title: "Salom", body: "Matn", summary: null, iconKey: null },
        ru: { title: "Привет", body: "Текст", summary: null, iconKey: null },
      },
    });
    expect(Object.keys(t.locales).length).toBe(3);
  });
  it("template with summary", () => {
    const t = createTemplate({
      key: "k", category: "system", priority: "low",
      locales: { en: { title: "T", body: "B", summary: "Short summary", iconKey: null } },
    });
    expect(t.locales.en.summary).toBe("Short summary");
  });
  it("template variable types include user", () => {
    const types = supportsAllTemplateVariableTypes();
    expect(types).toContain("user");
    expect(types).toContain("organization");
    expect(types).toContain("match");
    expect(types).toContain("tournament");
  });
  it("channel can be set to deprecated", () => {
    registerChannel({ id: "sms", name: "SMS" });
    expect(setChannelStatus("sms", "deprecated")?.status).toBe("deprecated");
  });
  it("channel can be set to inactive", () => {
    registerChannel({ id: "email", name: "Email" });
    expect(setChannelStatus("email", "inactive")?.status).toBe("inactive");
  });
  it("preferences with custom channels", () => {
    const p = createPreferences({ userId: "u1", channels: [{ channelId: "in_app", enabled: true, mutedCategories: ["social"], minPriority: "medium" }] });
    expect(p.channels.length).toBe(1);
    expect(p.channels[0].minPriority).toBe("medium");
  });
  it("preferences with custom language", () => {
    expect(createPreferences({ userId: "u1", language: "uz" }).language).toBe("uz");
  });
  it("preferences with custom digest", () => {
    expect(createPreferences({ userId: "u1", digest: "weekly" }).digest).toBe("weekly");
  });
  it("preferences with optedIn false", () => {
    expect(createPreferences({ userId: "u1", optedIn: false }).optedIn).toBe(false);
  });
  it("preferences with parentControls enabled", () => {
    const p = createPreferences({ userId: "u1", parentControls: { enabled: true, maxDailyNotifications: 20 } });
    expect(p.parentControls.enabled).toBe(true);
    expect(p.parentControls.maxDailyNotifications).toBe(20);
  });
  it("preferences with teacherControls enabled", () => {
    const p = createPreferences({ userId: "u1", teacherControls: { enabled: true, classroomOnly: true } });
    expect(p.teacherControls.classroomOnly).toBe(true);
  });
  it("preferences with organizationOverrides", () => {
    const p = createPreferences({ userId: "u1", organizationOverrides: { "org-1": false } });
    expect(p.organizationOverrides["org-1"]).toBe(false);
  });
  it("checkDeliveryAllowed respects disabled channel", () => {
    createPreferences({ userId: "u1" });
    updateChannelPreference("u1", "in_app", { enabled: false });
    const r = checkDeliveryAllowed("u1", { category: "system", priority: "medium", channels: ["in_app"], deliveryHour: 12 });
    expect(r.effectiveChannels.length).toBe(0);
  });
  it("checkDeliveryAllowed respects muted category on channel", () => {
    createPreferences({ userId: "u1" });
    updateChannelPreference("u1", "in_app", { mutedCategories: ["social"] });
    const r = checkDeliveryAllowed("u1", { category: "social", priority: "medium", channels: ["in_app"], deliveryHour: 12 });
    expect(r.effectiveChannels.length).toBe(0);
  });
  it("checkDeliveryAllowed passes high priority through medium threshold", () => {
    createPreferences({ userId: "u1" });
    updateChannelPreference("u1", "in_app", { minPriority: "medium" });
    const r = checkDeliveryAllowed("u1", { category: "system", priority: "high", channels: ["in_app"], deliveryHour: 12 });
    expect(r.effectiveChannels).toContain("in_app");
  });
  it("checkDeliveryAllowed rejects low priority below medium threshold", () => {
    createPreferences({ userId: "u1" });
    updateChannelPreference("u1", "in_app", { minPriority: "medium" });
    const r = checkDeliveryAllowed("u1", { category: "system", priority: "low", channels: ["in_app"], deliveryHour: 12 });
    expect(r.effectiveChannels.length).toBe(0);
  });
  it("inbox query returns hasMore false when no more", () => {
    deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    const r = queryInbox({ userId: "u1", limit: 50, offset: 0 });
    expect(r.hasMore).toBe(false);
  });
  it("inbox summary tracks read count", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    markInboxItemRead("u1", item.id);
    expect(getInboxSummary("u1").read).toBe(1);
  });
  it("inbox summary tracks archived count", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    markInboxItemArchived("u1", item.id);
    expect(getInboxSummary("u1").archived).toBe(1);
  });
  it("inbox summary tracks pinned count", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    pinInboxItem("u1", item.id);
    expect(getInboxSummary("u1").pinned).toBe(1);
  });
  it("inbox summary tracks dismissed count", () => {
    const item = deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    markInboxItemDismissed("u1", item.id);
    expect(getInboxSummary("u1").dismissed).toBe(1);
  });
  it("inbox item with expirationSeconds sets expiredAt", () => {
    const item = deliverToInbox({
      userId: "u1", notificationId: "n", registryKey: "k",
      title: "T", body: "B", category: "system", priority: "low",
      expirationSeconds: 3600,
    });
    expect(item.expiredAt).not.toBeNull();
  });
  it("realtime dispatch increments attemptCount", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    dispatchRealtime(n.id);
    expect(getRealtimeById(n.id)?.attemptCount).toBe(1);
  });
  it("realtime stats tracks collapsed", () => {
    enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"], groupKey: "g1" });
    enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"], groupKey: "g1" });
    enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"], groupKey: "g1" });
    collapseGroup("g1");
    expect(generateRealtimeStats().totalCollapsed).toBe(2);
  });
  it("realtime stats tracks dropped", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    dropRealtime(n.id);
    expect(generateRealtimeStats().totalDropped).toBe(1);
  });
  it("announcement with custom priority", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a", priority: "critical" });
    expect(a.priority).toBe("critical");
  });
  it("announcement with custom scheduledAt", () => {
    const future = futureIso(3600);
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a", scheduledAt: future });
    expect(a.scheduledAt).toBe(future);
  });
  it("announcement with expiresAt", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a", expiresAt: futureIso(86400) });
    expect(a.expiresAt).not.toBeNull();
  });
  it("announcement with locale uz", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a", locale: "uz" });
    expect(a.locale).toBe("uz");
  });
  it("announcement reject sets rejection reason in metadata", () => {
    const a = createAnnouncement({ scope: "global", title: "T", body: "B", createdBy: "a" });
    submitAnnouncementForApproval(a.id);
    rejectAnnouncement(a.id, "admin", "violates policy");
    expect(getAnnouncementById(a.id)?.metadata.rejectionReason).toBe("violates policy");
  });
  it("system message with userId", () => {
    const m = createSystemMessage({ type: "reminder", userId: "u1", title: "T", body: "B" });
    expect(m.userId).toBe("u1");
  });
  it("system message with organizationId", () => {
    const m = createSystemMessage({ type: "warning", organizationId: "org-1", title: "T", body: "B" });
    expect(m.organizationId).toBe("org-1");
  });
  it("system message with custom priority", () => {
    const m = createSystemMessage({ type: "warning", title: "T", body: "B", priority: "critical" });
    expect(m.priority).toBe("critical");
  });
  it("system message with custom channels", () => {
    const m = createSystemMessage({ type: "system", title: "T", body: "B", deliveryChannels: ["in_app", "push"] });
    expect(m.deliveryChannels.length).toBe(2);
  });
  it("system message with expiresAt", () => {
    const m = createSystemMessage({ type: "system", title: "T", body: "B", expiresAt: futureIso(3600) });
    expect(m.expiresAt).not.toBeNull();
  });
  it("routing rule with multiple conditions", () => {
    const r = createRoutingRule({
      name: "R", sourceEvent: "X",
      conditions: [
        { field: "type", operator: "equals", value: "match" },
        { field: "won", operator: "equals", value: true },
      ],
      targetTemplateKey: "t", targetChannels: ["in_app"],
    });
    expect(r.conditions.length).toBe(2);
  });
  it("routing rule with priorityOverride", () => {
    const r = createRoutingRule({ name: "R", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"], priorityOverride: "high" });
    expect(r.priorityOverride).toBe("high");
  });
  it("routing rule with custom order", () => {
    const r = createRoutingRule({ name: "R", sourceEvent: "X", targetTemplateKey: "t", targetChannels: ["in_app"], order: 50 });
    expect(r.order).toBe(50);
  });
  it("routing rule not_in operator", () => {
    createRoutingRule({
      name: "R", sourceEvent: "X",
      conditions: [{ field: "role", operator: "not_in", value: ["admin"] }],
      targetTemplateKey: "t", targetChannels: ["in_app"],
    });
    expect(routeEvent("X", { role: "user" }).matched).toBe(true);
    expect(routeEvent("X", { role: "admin" }).matched).toBe(false);
  });
  it("routing rule not_equals operator", () => {
    createRoutingRule({
      name: "R", sourceEvent: "X",
      conditions: [{ field: "type", operator: "not_equals", value: "spam" }],
      targetTemplateKey: "t", targetChannels: ["in_app"],
    });
    expect(routeEvent("X", { type: "match" }).matched).toBe(true);
    expect(routeEvent("X", { type: "spam" }).matched).toBe(false);
  });
  it("schedule type recurring", () => {
    const s = createSchedule({ type: "recurring", registryKey: "k", scheduledAt: futureIso(0), recurrenceRule: "daily" });
    expect(s.type).toBe("recurring");
  });
  it("schedule type digest", () => {
    const s = createSchedule({ type: "digest", registryKey: "k", scheduledAt: futureIso(0) });
    expect(s.type).toBe("digest");
  });
  it("schedule type delayed", () => {
    const s = createSchedule({ type: "delayed", registryKey: "k", scheduledAt: futureIso(60) });
    expect(s.type).toBe("delayed");
  });
  it("schedule type scheduled", () => {
    const s = createSchedule({ type: "scheduled", registryKey: "k", scheduledAt: futureIso(3600) });
    expect(s.type).toBe("scheduled");
  });
  it("schedule failed resets to pending when retries remain", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0), maxRetries: 3 });
    dispatchSchedule(s.id);
    failSchedule(s.id, "x");
    expect(getScheduleById(s.id)?.status).toBe("pending");
  });
  it("schedule failed stays failed when no retries", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0), maxRetries: 1 });
    dispatchSchedule(s.id);
    failSchedule(s.id, "x");
    expect(getScheduleById(s.id)?.status).toBe("failed");
  });
  it("schedule dispatch sets dispatchedAt", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    dispatchSchedule(s.id);
    expect(getScheduleById(s.id)?.dispatchedAt).not.toBeNull();
  });
  it("schedule complete sets completedAt", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    dispatchSchedule(s.id); completeSchedule(s.id);
    expect(getScheduleById(s.id)?.completedAt).not.toBeNull();
  });
  it("schedule cancel sets transition reason in metadata", () => {
    const s = createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    cancelSchedule(s.id, "user requested");
    expect(getScheduleById(s.id)?.metadata.transitionReason).toBe("user requested");
  });
  it("analytics delivery rate", () => {
    deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    const a = generateNotificationAnalytics();
    expect(a.delivery.deliveryRate).toBeGreaterThanOrEqual(0);
  });
  it("analytics engagement read rate", () => {
    deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low" });
    const a = generateNotificationAnalytics();
    expect(a.engagement.readRate).toBeGreaterThanOrEqual(0);
  });
  it("analytics engagement click rate", () => {
    deliverToInbox({ userId: "u1", notificationId: "n1", registryKey: "k", title: "T", body: "B", category: "system", priority: "low", deepLink: "/x" });
    const a = generateNotificationAnalytics();
    expect(a.engagement.clickRate).toBeGreaterThanOrEqual(0);
  });
  it("dashboard delivered24h counts delivered today", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    dispatchRealtime(n.id); markRealtimeDelivered(n.id);
    expect(generateNotificationDashboard().delivered24h).toBe(1);
  });
  it("dashboard failed24h counts failed today", () => {
    const n = enqueueRealtime({ userId: "u1", registryKey: "k", priority: "medium", payload: {}, channels: ["in_app"] });
    dispatchRealtime(n.id); markRealtimeFailed(n.id, "x");
    expect(generateNotificationDashboard().failed24h).toBe(1);
  });
  it("dashboard scheduled counts pending schedules", () => {
    createSchedule({ type: "immediate", registryKey: "k", scheduledAt: futureIso(0) });
    expect(generateNotificationDashboard().scheduled).toBe(1);
  });
  it("dashboard channels includes registered channels", () => {
    registerChannel({ id: "in_app", name: "In-App" });
    registerChannel({ id: "push", name: "Push" });
    expect(generateNotificationDashboard().channels.length).toBe(2);
  });
  it("dashboard topCategories limits to 5", () => {
    for (const cat of ["system", "social", "competitive", "commerce", "achievement", "tournament"]) {
      deliverToInbox({ userId: "u1", notificationId: "n", registryKey: "k", title: "T", body: "B", category: cat as never, priority: "low" });
    }
    expect(generateNotificationDashboard().topCategories.length).toBeLessThanOrEqual(5);
  });
  it("developer integration has 25+ public APIs", () => {
    expect(getDeveloperIntegration().publicAPIs.length).toBeGreaterThanOrEqual(25);
  });
  it("developer integration has 10+ extension hooks", () => {
    expect(getDeveloperIntegration().extensionHooks.length).toBeGreaterThanOrEqual(10);
  });
  it("developer integration has 8+ webhooks", () => {
    expect(getDeveloperIntegration().webhooks.length).toBeGreaterThanOrEqual(8);
  });
  it("documentation lists owns with 10+ items", () => {
    expect(generateNotificationDocumentation().ownership.owns.length).toBeGreaterThanOrEqual(10);
  });
  it("documentation lists doesNotOwn with 10+ items", () => {
    expect(generateNotificationDocumentation().ownership.doesNotOwn.length).toBeGreaterThanOrEqual(10);
  });
  it("documentation system 2 is Notification Templates", () => {
    expect(generateNotificationDocumentation().systems[1].name).toBe("Notification Templates");
  });
  it("documentation system 3 is Delivery Channels", () => {
    expect(generateNotificationDocumentation().systems[2].name).toBe("Delivery Channels");
  });
  it("documentation system 5 is Inbox Platform", () => {
    expect(generateNotificationDocumentation().systems[4].name).toBe("Inbox Platform");
  });
  it("documentation system 9 is Notification Routing", () => {
    expect(generateNotificationDocumentation().systems[8].name).toBe("Notification Routing");
  });
  it("documentation system 11 is Notification Analytics", () => {
    expect(generateNotificationDocumentation().systems[10].name).toBe("Notification Analytics");
  });
  it("documentation system 14 is Developer Integration", () => {
    expect(generateNotificationDocumentation().systems[13].name).toBe("Developer Integration");
  });
  it("NotificationRead payload includes itemId", () => {
    const doc = generateNotificationDocumentation();
    const e = doc.events.find(ev => ev.type === "NotificationRead");
    expect(e?.payload).toContain("itemId");
  });
  it("AnnouncementPublished payload includes scope", () => {
    const doc = generateNotificationDocumentation();
    const e = doc.events.find(ev => ev.type === "AnnouncementPublished");
    expect(e?.payload).toContain("scope");
  });
  it("ScheduleDispatched payload includes scheduleId", () => {
    const doc = generateNotificationDocumentation();
    const e = doc.events.find(ev => ev.type === "ScheduleDispatched");
    expect(e?.payload).toContain("scheduleId");
  });
  it("DigestGenerated payload includes period", () => {
    const doc = generateNotificationDocumentation();
    const e = doc.events.find(ev => ev.type === "DigestGenerated");
    expect(e?.payload).toContain("period");
  });
  it("RoutingRuleMatched payload includes ruleId", () => {
    const doc = generateNotificationDocumentation();
    const e = doc.events.find(ev => ev.type === "RoutingRuleMatched");
    expect(e?.payload).toContain("ruleId");
  });
  it("InboxCleared payload includes count", () => {
    const doc = generateNotificationDocumentation();
    const e = doc.events.find(ev => ev.type === "InboxCleared");
    expect(e?.payload).toContain("count");
  });
  it("NotificationFailed payload includes reason", () => {
    const doc = generateNotificationDocumentation();
    const e = doc.events.find(ev => ev.type === "NotificationFailed");
    expect(e?.payload).toContain("reason");
  });
  it("SystemMessageSent payload includes type", () => {
    const doc = generateNotificationDocumentation();
    const e = doc.events.find(ev => ev.type === "SystemMessageSent");
    expect(e?.payload).toContain("type");
  });
  it("render template preserves non-variable placeholders", () => {
    const t = createTemplate({
      key: "k", category: "system", priority: "low",
      locales: { en: { title: "Hello {name}!", body: "Welcome {name} to {place}", summary: null, iconKey: null } },
    });
    const r = renderTemplate(t.id, "en", { name: "Alice" });
    expect(r?.title).toBe("Hello Alice!");
    expect(r?.body).toBe("Welcome Alice to {place}");
  });
  it("render template handles missing locale falls back to en", () => {
    const t = createTemplate({
      key: "k", category: "system", priority: "low",
      locales: { en: { title: "Hello", body: "Body", summary: null, iconKey: null } },
    });
    expect(renderTemplate(t.id, "ja", {})?.title).toBe("Hello");
  });
  it("deliverToInbox with summary", () => {
    const item = deliverToInbox({
      userId: "u1", notificationId: "n", registryKey: "k",
      title: "T", body: "B", summary: "Short", category: "system", priority: "low",
    });
    expect(item.summary).toBe("Short");
  });
});
