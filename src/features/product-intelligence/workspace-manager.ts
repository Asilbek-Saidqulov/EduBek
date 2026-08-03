/**
 * EduBek — Workspace Manager.
 *
 * Phase 5D.5 System 3: Persistent workspaces. If a teacher closes the
 * browser while creating a lesson, everything restores. Supports
 * drafts, tabs, history, undo, and resume.
 *
 * Workspaces are stored in the `ProductWorkspace` table and are
 * identified by user + kind. The draft payload is kind-specific JSON
 * — the workspace manager is agnostic to the shape.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { WorkspaceState, WorkspaceTab, WorkspaceHistoryEntry, WorkspaceUndoEntry } from "./types";

const log = getLogger("workspace-manager");

// ===========================================================================
// Public API
// ===========================================================================

export async function createWorkspace(input: {
  userId: string; kind: string; title: string;
  draft?: Record<string, unknown>; tabs?: WorkspaceTab[];
}): Promise<WorkspaceState> {
  const row = await repo.createWorkspace({
    userId: input.userId, kind: input.kind, title: input.title,
    tabs: input.tabs ?? [], history: [], undoStack: [],
    draft: input.draft ?? {}, active: true,
  });
  log.info("workspace.created", { id: row.id, kind: input.kind, userId: input.userId });
  return mapWorkspace(row);
}

export async function getWorkspace(id: string): Promise<WorkspaceState | null> {
  const row = await repo.findWorkspace(id);
  return row ? mapWorkspace(row) : null;
}

export async function getActiveWorkspace(userId: string): Promise<WorkspaceState | null> {
  const row = await repo.findActiveWorkspace(userId);
  return row ? mapWorkspace(row) : null;
}

export async function listWorkspaces(userId: string, kind?: string): Promise<WorkspaceState[]> {
  const rows = await repo.listWorkspaces(userId, kind);
  return rows.map(mapWorkspace);
}

export async function saveDraft(id: string, draft: Record<string, unknown>, autosave = true): Promise<WorkspaceState | null> {
  const row = await repo.updateWorkspace(id, {
    draft,
    autosavedAt: autosave ? new Date() : null,
  });
  log.debug("workspace.draft_saved", { id, autosave });
  return row ? mapWorkspace(row) : null;
}

export async function setTabs(id: string, tabs: WorkspaceTab[]): Promise<WorkspaceState | null> {
  const row = await repo.updateWorkspace(id, { tabs });
  return row ? mapWorkspace(row) : null;
}

export async function addTab(id: string, tab: Omit<WorkspaceTab, "id" | "order">): Promise<WorkspaceState | null> {
  const ws = await getWorkspace(id);
  if (!ws) return null;
  const newTab: WorkspaceTab = { ...tab, id: randomUUID(), order: ws.tabs.length };
  const tabs = [...ws.tabs, newTab];
  return setTabs(id, tabs);
}

export async function closeTab(id: string, tabId: string): Promise<WorkspaceState | null> {
  const ws = await getWorkspace(id);
  if (!ws) return null;
  const tabs = ws.tabs.filter(t => t.id !== tabId).map((t, i) => ({ ...t, order: i }));
  return setTabs(id, tabs);
}

export async function recordHistory(id: string, entry: Omit<WorkspaceHistoryEntry, "timestamp">): Promise<WorkspaceState | null> {
  const ws = await getWorkspace(id);
  if (!ws) return null;
  const history: WorkspaceHistoryEntry[] = [
    ...ws.history,
    { ...entry, timestamp: new Date().toISOString() },
  ].slice(-100); // cap history at 100 entries
  const row = await repo.updateWorkspace(id, { history });
  return row ? mapWorkspace(row) : null;
}

export async function pushUndo(id: string, entry: Omit<WorkspaceUndoEntry, "timestamp">): Promise<WorkspaceState | null> {
  const ws = await getWorkspace(id);
  if (!ws) return null;
  const undoStack: WorkspaceUndoEntry[] = [
    { ...entry, timestamp: new Date().toISOString() },
    ...ws.undoStack,
  ].slice(0, 50); // cap undo stack at 50 entries
  const row = await repo.updateWorkspace(id, { undoStack });
  return row ? mapWorkspace(row) : null;
}

export async function popUndo(id: string): Promise<{ entry: WorkspaceUndoEntry | null; workspace: WorkspaceState | null }> {
  const ws = await getWorkspace(id);
  if (!ws || ws.undoStack.length === 0) return { entry: null, workspace: ws };
  const [entry, ...rest] = ws.undoStack;
  const row = await repo.updateWorkspace(id, { undoStack: rest });
  return { entry, workspace: row ? mapWorkspace(row) : null };
}

export async function resumeWorkspace(id: string): Promise<WorkspaceState | null> {
  // Deactivate other workspaces for the same user, then activate this one
  const ws = await getWorkspace(id);
  if (!ws) return null;
  // SQLite doesn't support updateMany with a join — we deactivate all
  // active workspaces for this user first.
  const userWorkspaces = await repo.listWorkspaces(ws.userId);
  for (const w of userWorkspaces) {
    if (w.active && w.id !== id) {
      await repo.updateWorkspace(w.id, { active: false });
    }
  }
  const row = await repo.updateWorkspace(id, { active: true });
  log.info("workspace.resumed", { id, userId: ws.userId });
  return row ? mapWorkspace(row) : null;
}

export async function closeWorkspace(id: string): Promise<void> {
  await repo.updateWorkspace(id, { active: false });
  log.info("workspace.closed", { id });
}

export async function deleteWorkspace(id: string): Promise<void> {
  await repo.deleteWorkspace(id);
  log.info("workspace.deleted", { id });
}

export async function autosave(id: string, draft: Record<string, unknown>): Promise<void> {
  await repo.updateWorkspace(id, { draft, autosavedAt: new Date() });
  log.debug("workspace.autosaved", { id });
}

// ===========================================================================
// Helpers
// ===========================================================================

function mapWorkspace(row: Awaited<ReturnType<typeof repo.findWorkspace>>): WorkspaceState {
  if (!row) throw new Error("Cannot map null workspace row");
  return {
    id: row.id,
    userId: row.userId,
    kind: row.kind,
    title: row.title,
    tabs: repo.safeParse<WorkspaceTab[]>(row.tabs, []),
    history: repo.safeParse<WorkspaceHistoryEntry[]>(row.history, []),
    undoStack: repo.safeParse<WorkspaceUndoEntry[]>(row.undoStack, []),
    draft: repo.safeParse<Record<string, unknown>>(row.draft, {}),
    active: row.active,
    autosavedAt: row.autosavedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
