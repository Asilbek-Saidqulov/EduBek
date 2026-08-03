/** Systems 3, 4 — Delivery Channels + User Preferences. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeChannel, getChannel, getAllChannels,
  storePreferences, getPreferences, getAllPreferences,
} from "./repository";
import type {
  DeliveryChannelId, DeliveryChannelConfig, DeliveryChannelStatus,
  UserNotificationPreferences, ChannelPreference, QuietHours, MutePeriod,
  NotificationCategory, NotificationPriority, DigestPreference,
} from "./types";

const log = getLogger("notifications.channels");

// ===== System 3 — Delivery Channels =====

export function registerChannel(input: {
  id: DeliveryChannelId; name: string;
  status?: DeliveryChannelStatus;
  supportedLocales?: string[];
  maxRatePerUserPerHour?: number | null;
  supportsRichContent?: boolean;
  supportsActions?: boolean;
  supportsDeepLinks?: boolean;
  requiresApproval?: boolean;
  providerReference?: string | null;
  metadata?: Record<string, unknown>;
}): DeliveryChannelConfig {
  if (getChannel(input.id)) throw new Error(`Channel already registered: ${input.id}`);
  const channel: DeliveryChannelConfig = {
    id: input.id, name: input.name,
    status: input.status ?? "active",
    supportedLocales: input.supportedLocales ?? ["en", "uz", "ru"],
    maxRatePerUserPerHour: input.maxRatePerUserPerHour ?? null,
    supportsRichContent: input.supportsRichContent ?? false,
    supportsActions: input.supportsActions ?? false,
    supportsDeepLinks: input.supportsDeepLinks ?? false,
    requiresApproval: input.requiresApproval ?? false,
    providerReference: input.providerReference ?? null,
    metadata: input.metadata ?? {},
  };
  storeChannel(channel);
  log.info("channel.registered", { id: channel.id });
  return channel;
}

export function getChannelById(id: DeliveryChannelId): DeliveryChannelConfig | null { return getChannel(id); }
export function listChannels(status?: DeliveryChannelStatus): DeliveryChannelConfig[] {
  const all = getAllChannels();
  return status ? all.filter(c => c.status === status) : all;
}

export function setChannelStatus(id: DeliveryChannelId, status: DeliveryChannelStatus): DeliveryChannelConfig | null {
  const c = getChannel(id);
  if (!c) return null;
  c.status = status;
  storeChannel(c);
  return c;
}

export function isChannelAvailable(id: DeliveryChannelId, locale?: string): boolean {
  const c = getChannel(id);
  if (!c) return false;
  if (c.status !== "active") return false;
  if (locale && c.supportedLocales.length > 0 && !c.supportedLocales.includes(locale)) return false;
  return true;
}

export function supportsAllDeliveryChannels(): DeliveryChannelId[] {
  return ["in_app", "push", "email", "sms", "organization_announcement", "broadcast_overlay", "webhook", "developer_callback"];
}
export function supportsAllChannelStatuses(): DeliveryChannelStatus[] {
  return ["active", "inactive", "maintenance", "deprecated"];
}

// ===== System 4 — User Notification Preferences =====

const DEFAULT_CHANNEL_PREFS: ChannelPreference[] = [
  { channelId: "in_app", enabled: true, mutedCategories: [], minPriority: "informational" },
  { channelId: "push", enabled: true, mutedCategories: [], minPriority: "low" },
  { channelId: "email", enabled: false, mutedCategories: [], minPriority: "medium" },
  { channelId: "sms", enabled: false, mutedCategories: [], minPriority: "high" },
];

export function createPreferences(input: {
  userId: string;
  channels?: ChannelPreference[];
  quietHours?: Partial<QuietHours>;
  language?: string;
  digest?: DigestPreference;
  optedIn?: boolean;
  organizationOverrides?: Record<string, boolean>;
  parentControls?: { enabled: boolean; maxDailyNotifications: number | null };
  teacherControls?: { enabled: boolean; classroomOnly: boolean };
}): UserNotificationPreferences {
  if (getPreferences(input.userId)) throw new Error(`Preferences already exist for user: ${input.userId}`);
  const prefs: UserNotificationPreferences = {
    userId: input.userId,
    channels: input.channels ?? DEFAULT_CHANNEL_PREFS.map(p => ({ ...p })),
    quietHours: {
      enabled: input.quietHours?.enabled ?? false,
      startHour: input.quietHours?.startHour ?? 22,
      endHour: input.quietHours?.endHour ?? 7,
      timezone: input.quietHours?.timezone ?? "UTC",
    },
    mutePeriods: [],
    language: input.language ?? "en",
    digest: input.digest ?? "none",
    optedIn: input.optedIn ?? true,
    organizationOverrides: input.organizationOverrides ?? {},
    parentControls: input.parentControls ?? { enabled: false, maxDailyNotifications: null },
    teacherControls: input.teacherControls ?? { enabled: false, classroomOnly: false },
    updatedAt: new Date().toISOString(),
  };
  storePreferences(prefs);
  log.info("preferences.created", { userId: input.userId });
  return prefs;
}

export function getPreferencesForUser(userId: string): UserNotificationPreferences | null {
  return getPreferences(userId);
}

export function listAllPreferences(): UserNotificationPreferences[] { return getAllPreferences(); }

export function updateChannelPreference(
  userId: string, channelId: DeliveryChannelId, updates: Partial<ChannelPreference>,
): UserNotificationPreferences | null {
  const prefs = getPreferences(userId);
  if (!prefs) return null;
  const ch = prefs.channels.find(c => c.channelId === channelId);
  if (!ch) {
    prefs.channels.push({ channelId, enabled: true, mutedCategories: [], minPriority: "informational", ...updates });
  } else {
    Object.assign(ch, updates);
  }
  prefs.updatedAt = new Date().toISOString();
  storePreferences(prefs);
  return prefs;
}

export function setQuietHours(userId: string, quietHours: QuietHours): UserNotificationPreferences | null {
  const prefs = getPreferences(userId);
  if (!prefs) return null;
  if (quietHours.startHour < 0 || quietHours.startHour > 23) return null;
  if (quietHours.endHour < 0 || quietHours.endHour > 23) return null;
  prefs.quietHours = quietHours;
  prefs.updatedAt = new Date().toISOString();
  storePreferences(prefs);
  return prefs;
}

export function addMutePeriod(userId: string, input: {
  reason: string;
  startsAt: string; endsAt: string;
  mutedCategories?: NotificationCategory[];
  mutedChannels?: DeliveryChannelId[];
}): UserNotificationPreferences | null {
  const prefs = getPreferences(userId);
  if (!prefs) return null;
  if (new Date(input.endsAt).getTime() <= new Date(input.startsAt).getTime()) return null;
  const mute: MutePeriod = {
    id: randomUUID(), reason: input.reason,
    startsAt: input.startsAt, endsAt: input.endsAt,
    mutedCategories: input.mutedCategories ?? [],
    mutedChannels: input.mutedChannels ?? [],
    active: true,
  };
  prefs.mutePeriods.push(mute);
  prefs.updatedAt = new Date().toISOString();
  storePreferences(prefs);
  return prefs;
}

export function removeMutePeriod(userId: string, muteId: string): UserNotificationPreferences | null {
  const prefs = getPreferences(userId);
  if (!prefs) return null;
  prefs.mutePeriods = prefs.mutePeriods.filter(m => m.id !== muteId);
  prefs.updatedAt = new Date().toISOString();
  storePreferences(prefs);
  return prefs;
}

export function setLanguagePreference(userId: string, language: string): UserNotificationPreferences | null {
  const prefs = getPreferences(userId);
  if (!prefs) return null;
  prefs.language = language;
  prefs.updatedAt = new Date().toISOString();
  storePreferences(prefs);
  return prefs;
}

export function setDigestPreference(userId: string, digest: DigestPreference): UserNotificationPreferences | null {
  const prefs = getPreferences(userId);
  if (!prefs) return null;
  prefs.digest = digest;
  prefs.updatedAt = new Date().toISOString();
  storePreferences(prefs);
  return prefs;
}

export function setOptIn(userId: string, optedIn: boolean): UserNotificationPreferences | null {
  const prefs = getPreferences(userId);
  if (!prefs) return null;
  prefs.optedIn = optedIn;
  prefs.updatedAt = new Date().toISOString();
  storePreferences(prefs);
  return prefs;
}

export function setOrganizationOverride(userId: string, organizationId: string, enabled: boolean): UserNotificationPreferences | null {
  const prefs = getPreferences(userId);
  if (!prefs) return null;
  prefs.organizationOverrides[organizationId] = enabled;
  prefs.updatedAt = new Date().toISOString();
  storePreferences(prefs);
  return prefs;
}

export function setParentControls(userId: string, enabled: boolean, maxDaily: number | null): UserNotificationPreferences | null {
  const prefs = getPreferences(userId);
  if (!prefs) return null;
  prefs.parentControls = { enabled, maxDailyNotifications: maxDaily };
  prefs.updatedAt = new Date().toISOString();
  storePreferences(prefs);
  return prefs;
}

export function setTeacherControls(userId: string, enabled: boolean, classroomOnly: boolean): UserNotificationPreferences | null {
  const prefs = getPreferences(userId);
  if (!prefs) return null;
  prefs.teacherControls = { enabled, classroomOnly };
  prefs.updatedAt = new Date().toISOString();
  storePreferences(prefs);
  return prefs;
}

export interface PreferenceCheckResult {
  deliverable: boolean;
  reasons: string[];
  effectiveChannels: DeliveryChannelId[];
}

export function checkDeliveryAllowed(userId: string, ctx: {
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: DeliveryChannelId[];
  deliveryHour: number;
}): PreferenceCheckResult {
  const prefs = getPreferences(userId);
  if (!prefs) return { deliverable: false, reasons: ["no_preferences"], effectiveChannels: [] };
  const reasons: string[] = [];
  if (!prefs.optedIn) reasons.push("opted_out");
  // Quiet hours
  if (prefs.quietHours.enabled && ctx.priority !== "critical") {
    const start = prefs.quietHours.startHour;
    const end = prefs.quietHours.endHour;
    let inQuiet = false;
    if (start <= end) {
      inQuiet = ctx.deliveryHour >= start && ctx.deliveryHour < end;
    } else {
      inQuiet = ctx.deliveryHour >= start || ctx.deliveryHour < end;
    }
    if (inQuiet) reasons.push("quiet_hours");
  }
  // Mute periods
  for (const mute of prefs.mutePeriods) {
    if (!mute.active) continue;
    if (mute.mutedCategories.includes(ctx.category)) reasons.push(`muted_category:${mute.id}`);
    if (mute.mutedChannels.some(ch => ctx.channels.includes(ch))) reasons.push(`muted_channels:${mute.id}`);
  }
  // Per-channel check
  const effectiveChannels: DeliveryChannelId[] = [];
  const priorityOrder: NotificationPriority[] = ["informational", "low", "medium", "high", "critical"];
  const priorityRank = priorityOrder.indexOf(ctx.priority);
  for (const ch of ctx.channels) {
    const pref = prefs.channels.find(c => c.channelId === ch);
    if (!pref) { effectiveChannels.push(ch); continue; }
    if (!pref.enabled) continue;
    if (pref.mutedCategories.includes(ctx.category)) continue;
    const minRank = priorityOrder.indexOf(pref.minPriority);
    if (priorityRank < minRank) continue;
    effectiveChannels.push(ch);
  }
  if (effectiveChannels.length === 0) reasons.push("no_effective_channels");
  return {
    deliverable: reasons.length === 0 && effectiveChannels.length > 0,
    reasons,
    effectiveChannels,
  };
}

export function supportsAllDigestPreferences(): DigestPreference[] {
  return ["none", "daily", "weekly", "monthly"];
}
