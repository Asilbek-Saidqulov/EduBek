/**
 * In-memory repository for Notification Platform. Phase 6G.17.
 * Stateless, Redis-compatible storage abstraction.
 */
import type {
  NotificationRegistryEntry, NotificationTemplate, DeliveryChannelConfig,
  UserNotificationPreferences, InboxItem, RealtimeNotification,
  Announcement, SystemMessage, RoutingRule, NotificationSchedule,
} from "./types";

const registry = new Map<string, NotificationRegistryEntry>();
const templates = new Map<string, NotificationTemplate>();
const channels = new Map<string, DeliveryChannelConfig>();
const preferences = new Map<string, UserNotificationPreferences>(); // key: userId
const inbox = new Map<string, InboxItem[]>(); // key: userId
const realtimeQueue = new Map<string, RealtimeNotification>();
const announcements = new Map<string, Announcement>();
const systemMessages = new Map<string, SystemMessage>();
const routingRules = new Map<string, RoutingRule>();
const schedules = new Map<string, NotificationSchedule>();

// === Registry ===
export const storeRegistryEntry = (e: NotificationRegistryEntry) => registry.set(e.id, e);
export const getRegistryEntry = (id: string) => registry.get(id) ?? null;
export const getRegistryEntryByKey = (key: string) => Array.from(registry.values()).find(e => e.key === key) ?? null;
export const getAllRegistryEntries = () => Array.from(registry.values());

// === Templates ===
export const storeTemplate = (t: NotificationTemplate) => templates.set(t.id, t);
export const getTemplate = (id: string) => templates.get(id) ?? null;
export const getTemplateByKey = (key: string) => Array.from(templates.values()).find(t => t.key === key) ?? null;
export const getAllTemplates = () => Array.from(templates.values());

// === Channels ===
export const storeChannel = (c: DeliveryChannelConfig) => channels.set(c.id, c);
export const getChannel = (id: string) => channels.get(id) ?? null;
export const getAllChannels = () => Array.from(channels.values());

// === Preferences ===
export const storePreferences = (p: UserNotificationPreferences) => preferences.set(p.userId, p);
export const getPreferences = (userId: string) => preferences.get(userId) ?? null;
export const getAllPreferences = () => Array.from(preferences.values());

// === Inbox ===
export const storeInboxItem = (item: InboxItem) => {
  const list = inbox.get(item.userId) ?? [];
  list.push(item);
  inbox.set(item.userId, list);
};
export const getInboxItems = (userId: string) => inbox.get(userId) ?? [];
export const getInboxItem = (userId: string, itemId: string) => {
  const list = inbox.get(userId) ?? [];
  return list.find(i => i.id === itemId) ?? null;
};
export const updateInboxItem = (item: InboxItem) => {
  const list = inbox.get(item.userId) ?? [];
  const idx = list.findIndex(i => i.id === item.id);
  if (idx >= 0) list[idx] = item;
  inbox.set(item.userId, list);
};
export const getAllInboxItems = () => {
  const all: InboxItem[] = [];
  for (const list of inbox.values()) all.push(...list);
  return all;
};

// === Realtime ===
export const storeRealtime = (n: RealtimeNotification) => realtimeQueue.set(n.id, n);
export const getRealtime = (id: string) => realtimeQueue.get(id) ?? null;
export const getAllRealtime = () => Array.from(realtimeQueue.values());
export const getRealtimeByDedupKey = (key: string) => Array.from(realtimeQueue.values()).find(n => n.deduplicationKey === key) ?? null;
export const getRealtimeByGroupKey = (key: string) => Array.from(realtimeQueue.values()).filter(n => n.groupKey === key);

// === Announcements ===
export const storeAnnouncement = (a: Announcement) => announcements.set(a.id, a);
export const getAnnouncement = (id: string) => announcements.get(id) ?? null;
export const getAllAnnouncements = () => Array.from(announcements.values());

// === System Messages ===
export const storeSystemMessage = (m: SystemMessage) => systemMessages.set(m.id, m);
export const getSystemMessage = (id: string) => systemMessages.get(id) ?? null;
export const getAllSystemMessages = () => Array.from(systemMessages.values());

// === Routing Rules ===
export const storeRoutingRule = (r: RoutingRule) => routingRules.set(r.id, r);
export const getRoutingRule = (id: string) => routingRules.get(id) ?? null;
export const getAllRoutingRules = () => Array.from(routingRules.values());

// === Schedules ===
export const storeSchedule = (s: NotificationSchedule) => schedules.set(s.id, s);
export const getSchedule = (id: string) => schedules.get(id) ?? null;
export const getAllSchedules = () => Array.from(schedules.values());

// === Reset ===
export function _resetRepositoryForTesting() {
  registry.clear(); templates.clear(); channels.clear(); preferences.clear();
  inbox.clear(); realtimeQueue.clear(); announcements.clear();
  systemMessages.clear(); routingRules.clear(); schedules.clear();
}
