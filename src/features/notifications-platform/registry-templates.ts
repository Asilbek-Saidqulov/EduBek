/** Systems 1, 2 — Notification Registry + Templates. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeRegistryEntry, getRegistryEntry, getRegistryEntryByKey, getAllRegistryEntries,
  storeTemplate, getTemplate, getTemplateByKey, getAllTemplates,
} from "./repository";
import type {
  NotificationRegistryEntry, NotificationCategory, NotificationPriority, NotificationRegistryStatus,
  NotificationTemplate, TemplateVariable, TemplateAction, TemplateLocaleContent,
} from "./types";

const log = getLogger("notifications.registry");

// ===== System 1 — Notification Registry =====

export function createRegistryEntry(input: {
  key: string; category: NotificationCategory;
  priority: NotificationPriority;
  defaultChannels: string[];
  templateId: string;
  description?: string;
  tags?: string[];
  status?: NotificationRegistryStatus;
  metadata?: Record<string, unknown>;
}): NotificationRegistryEntry {
  if (getRegistryEntryByKey(input.key)) throw new Error(`Registry key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const entry: NotificationRegistryEntry = {
    id: randomUUID(), key: input.key, category: input.category,
    priority: input.priority,
    defaultChannels: input.defaultChannels as never,
    templateId: input.templateId,
    status: input.status ?? "draft",
    tags: input.tags ?? [],
    description: input.description ?? "",
    version: 1,
    createdAt: now, updatedAt: now,
    deprecatedAt: null,
    metadata: input.metadata ?? {},
  };
  storeRegistryEntry(entry);
  log.info("registry.created", { id: entry.id, key: entry.key });
  return entry;
}

export function getRegistryEntryById(id: string): NotificationRegistryEntry | null { return getRegistryEntry(id); }
export function getRegistryByKey(key: string): NotificationRegistryEntry | null { return getRegistryEntryByKey(key); }
export function listRegistryEntries(category?: NotificationCategory, status?: NotificationRegistryStatus): NotificationRegistryEntry[] {
  let all = getAllRegistryEntries();
  if (category) all = all.filter(e => e.category === category);
  if (status) all = all.filter(e => e.status === status);
  return all;
}

const VALID_REGISTRY_TRANSITIONS: Record<NotificationRegistryStatus, NotificationRegistryStatus[]> = {
  draft: ["active", "deprecated", "retired"],
  active: ["deprecated", "retired"],
  deprecated: ["retired", "active"],
  retired: [],
};

export function canTransitionRegistry(from: NotificationRegistryStatus, to: NotificationRegistryStatus): boolean {
  return VALID_REGISTRY_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionRegistryStatus(id: string, to: NotificationRegistryStatus): NotificationRegistryEntry | null {
  const e = getRegistryEntry(id);
  if (!e) return null;
  if (!canTransitionRegistry(e.status, to)) return null;
  const now = new Date().toISOString();
  e.status = to; e.updatedAt = now; e.version += 1;
  if (to === "deprecated" && !e.deprecatedAt) e.deprecatedAt = now;
  storeRegistryEntry(e);
  return e;
}

export function activateRegistryEntry(id: string): NotificationRegistryEntry | null {
  return transitionRegistryStatus(id, "active");
}
export function deprecateRegistryEntry(id: string): NotificationRegistryEntry | null {
  return transitionRegistryStatus(id, "deprecated");
}
export function retireRegistryEntry(id: string): NotificationRegistryEntry | null {
  return transitionRegistryStatus(id, "retired");
}

export function supportsAllCategories(): NotificationCategory[] {
  return ["system", "social", "competitive", "progression", "commerce", "liveops", "administration", "achievement", "maintenance", "emergency", "tournament", "campaign", "season", "reminder", "digest"];
}
export function supportsAllPriorities(): NotificationPriority[] {
  return ["critical", "high", "medium", "low", "informational"];
}
export function supportsAllRegistryStatuses(): NotificationRegistryStatus[] {
  return ["active", "draft", "deprecated", "retired"];
}

// ===== System 2 — Notification Templates =====

export function createTemplate(input: {
  key: string;
  locales: Record<string, TemplateLocaleContent>;
  variables?: TemplateVariable[];
  actions?: TemplateAction[];
  defaultDeepLink?: string | null;
  expirationSeconds?: number | null;
  category: NotificationCategory;
  priority: NotificationPriority;
  active?: boolean;
  metadata?: Record<string, unknown>;
}): NotificationTemplate {
  if (getTemplateByKey(input.key)) throw new Error(`Template key already exists: ${input.key}`);
  if (Object.keys(input.locales).length === 0) throw new Error("Template must have at least one locale");
  if (input.expirationSeconds !== null && input.expirationSeconds !== undefined && input.expirationSeconds < 0) {
    throw new Error("expirationSeconds must be non-negative");
  }
  const now = new Date().toISOString();
  const template: NotificationTemplate = {
    id: randomUUID(), key: input.key,
    locales: input.locales,
    variables: input.variables ?? [],
    actions: input.actions ?? [],
    defaultDeepLink: input.defaultDeepLink ?? null,
    expirationSeconds: input.expirationSeconds ?? null,
    category: input.category,
    priority: input.priority,
    version: 1,
    createdAt: now, updatedAt: now,
    active: input.active ?? true,
    metadata: input.metadata ?? {},
  };
  storeTemplate(template);
  log.info("template.created", { id: template.id, key: template.key });
  return template;
}

export function getTemplateById(id: string): NotificationTemplate | null { return getTemplate(id); }
export function getTemplateByReference(key: string): NotificationTemplate | null { return getTemplateByKey(key); }
export function listTemplates(category?: NotificationCategory, active?: boolean): NotificationTemplate[] {
  let all = getAllTemplates();
  if (category) all = all.filter(t => t.category === category);
  if (active !== undefined) all = all.filter(t => t.active === active);
  return all;
}

export function deactivateTemplate(id: string): NotificationTemplate | null {
  const t = getTemplate(id);
  if (!t) return null;
  t.active = false; t.updatedAt = new Date().toISOString(); t.version += 1;
  storeTemplate(t);
  return t;
}

export function addTemplateLocale(id: string, locale: string, content: TemplateLocaleContent): NotificationTemplate | null {
  const t = getTemplate(id);
  if (!t) return null;
  t.locales[locale] = content;
  t.updatedAt = new Date().toISOString(); t.version += 1;
  storeTemplate(t);
  return t;
}

export function addTemplateVariable(id: string, variable: TemplateVariable): NotificationTemplate | null {
  const t = getTemplate(id);
  if (!t) return null;
  if (t.variables.find(v => v.key === variable.key)) return null;
  t.variables.push(variable);
  t.updatedAt = new Date().toISOString(); t.version += 1;
  storeTemplate(t);
  return t;
}

export function addTemplateAction(id: string, action: TemplateAction): NotificationTemplate | null {
  const t = getTemplate(id);
  if (!t) return null;
  if (t.actions.find(a => a.id === action.id)) return null;
  t.actions.push(action);
  t.updatedAt = new Date().toISOString(); t.version += 1;
  storeTemplate(t);
  return t;
}

/**
 * Renders a template with variables. Pure function, no LLM, deterministic.
 */
export function renderTemplate(templateId: string, locale: string, variables: Record<string, unknown>):
  { title: string; body: string; summary: string | null; iconKey: string | null; errors: string[] } | null {
  const t = getTemplate(templateId);
  if (!t) return null;
  const content = t.locales[locale] ?? t.locales["en"] ?? null;
  if (!content) return null;
  const errors: string[] = [];
  // Validate required variables
  for (const v of t.variables) {
    if (v.required && !(v.key in variables)) {
      errors.push(`missing_required:${v.key}`);
    }
  }
  // Simple {var} substitution
  let title = content.title;
  let body = content.body;
  for (const [k, v] of Object.entries(variables)) {
    const placeholder = `{${k}}`;
    title = title.split(placeholder).join(String(v));
    body = body.split(placeholder).join(String(v));
  }
  return {
    title, body,
    summary: content.summary,
    iconKey: content.iconKey,
    errors,
  };
}

export function supportsAllTemplateVariableTypes() {
  return ["string", "number", "boolean", "date", "user", "organization", "match", "tournament"];
}
