/**
 * EduBek — Product Memory.
 *
 * Phase 5D.5 System 11: Remember user preferences — favorite views,
 * dashboard layout, hidden widgets, preferred AI style, workspace
 * history — without storing sensitive information.
 *
 * Memory entries are keyed by `userId + key` and categorized. The
 * memory report aggregates common keys into a single snapshot consumed
 * by the unified context engine.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { ProductMemoryEntry, ProductMemoryReport } from "./types";

const log = getLogger("product-memory");

// ===========================================================================
// Well-known memory keys
// ===========================================================================

export const MEMORY_KEYS = {
  favoriteViews: "favorite_views",
  hiddenWidgets: "hidden_widgets",
  dashboardLayout: "dashboard_layout",
  preferredAIStyle: "preferred_ai_style",
  lastVisitedPages: "last_visited_pages",
  workspaceHistory: "workspace_history",
} as const;

// ===========================================================================
// Public API
// ===========================================================================

export async function setMemory(userId: string, key: string, value: unknown, category: ProductMemoryEntry["category"]): Promise<void> {
  await repo.upsertMemoryEntry({ userId, key, value, category });
  log.debug("memory.set", { userId, key, category });
}

export async function getMemory<T>(userId: string, key: string, fallback: T): Promise<T> {
  const entry = await repo.findMemoryEntry(userId, key);
  if (!entry) return fallback;
  return repo.safeParse<T>(entry.value, fallback);
}

export async function deleteMemory(userId: string, key: string): Promise<void> {
  await repo.deleteMemoryEntry(userId, key);
  log.debug("memory.deleted", { userId, key });
}

export async function listMemory(userId: string, category?: string): Promise<ProductMemoryEntry[]> {
  const rows = await repo.listMemoryEntries(userId, category);
  return rows.map(r => ({
    id: r.id, userId: r.userId, key: r.key,
    value: repo.safeParse(r.value, null),
    category: r.category as ProductMemoryEntry["category"],
    createdAt: r.createdAt.toISOString(),
    lastAccessedAt: r.lastAccessedAt.toISOString(),
  }));
}

export async function getMemoryReport(userId: string): Promise<ProductMemoryReport> {
  const [favoriteViews, hiddenWidgets, dashboardLayout, preferredAIStyle, lastVisitedPages, allEntries] = await Promise.all([
    getMemory<string[]>(userId, MEMORY_KEYS.favoriteViews, []),
    getMemory<string[]>(userId, MEMORY_KEYS.hiddenWidgets, []),
    getMemory<Record<string, unknown>>(userId, MEMORY_KEYS.dashboardLayout, {}),
    getMemory<string>(userId, MEMORY_KEYS.preferredAIStyle, "balanced"),
    getMemory<string[]>(userId, MEMORY_KEYS.lastVisitedPages, []),
    repo.listMemoryEntries(userId),
  ]);
  return {
    favoriteViews,
    hiddenWidgets,
    dashboardLayout,
    preferredAIStyle,
    lastVisitedPages,
    totalEntries: allEntries.length,
  };
}

// ===========================================================================
// Convenience methods for common memory operations
// ===========================================================================

export async function addFavoriteView(userId: string, viewId: string): Promise<void> {
  const current = await getMemory<string[]>(userId, MEMORY_KEYS.favoriteViews, []);
  if (!current.includes(viewId)) {
    await setMemory(userId, MEMORY_KEYS.favoriteViews, [...current, viewId], "preference");
  }
}

export async function removeFavoriteView(userId: string, viewId: string): Promise<void> {
  const current = await getMemory<string[]>(userId, MEMORY_KEYS.favoriteViews, []);
  await setMemory(userId, MEMORY_KEYS.favoriteViews, current.filter(v => v !== viewId), "preference");
}

export async function hideWidget(userId: string, widgetId: string): Promise<void> {
  const current = await getMemory<string[]>(userId, MEMORY_KEYS.hiddenWidgets, []);
  if (!current.includes(widgetId)) {
    await setMemory(userId, MEMORY_KEYS.hiddenWidgets, [...current, widgetId], "layout");
  }
}

export async function showWidget(userId: string, widgetId: string): Promise<void> {
  const current = await getMemory<string[]>(userId, MEMORY_KEYS.hiddenWidgets, []);
  await setMemory(userId, MEMORY_KEYS.hiddenWidgets, current.filter(w => w !== widgetId), "layout");
}

export async function setDashboardLayout(userId: string, layout: Record<string, unknown>): Promise<void> {
  await setMemory(userId, MEMORY_KEYS.dashboardLayout, layout, "layout");
}

export async function setPreferredAIStyle(userId: string, style: string): Promise<void> {
  await setMemory(userId, MEMORY_KEYS.preferredAIStyle, style, "ai_style");
}

export async function recordVisitedPage(userId: string, page: string): Promise<void> {
  const current = await getMemory<string[]>(userId, MEMORY_KEYS.lastVisitedPages, []);
  // Keep most recent 20 pages, no duplicates
  const updated = [page, ...current.filter(p => p !== page)].slice(0, 20);
  await setMemory(userId, MEMORY_KEYS.lastVisitedPages, updated, "history");
}
