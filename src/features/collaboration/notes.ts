/**
 * EduBek — Collaborative Notes service.
 *
 * Phase 4F.4: Multi-user notes with version history, AI summary hook,
 * active-editors tracking, word count, and visibility scoping
 * (private / shared / classroom / group / public).
 *
 * Every save creates a new CollaborativeNoteVersion row, enabling
 * time-travel and "diff vs previous" features. The latest version is
 * denormalized onto the CollaborativeNote row for fast reads.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { CollaborativeNoteDto, CollaborativeNoteVersionDto } from "./types";

const log = getLogger("notes");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mapNote(n: any): CollaborativeNoteDto {
  return {
    id: n.id,
    title: n.title,
    entityType: n.entityType,
    entityId: n.entityId,
    content: n.content,
    contentHtml: n.contentHtml,
    ownerId: n.ownerId,
    visibility: n.visibility,
    classroomId: n.classroomId,
    groupId: n.groupId,
    lastEditedBy: n.lastEditedBy,
    lastEditedAt: n.lastEditedAt?.toISOString() ?? null,
    aiSummary: n.aiSummary,
    aiSummaryAt: n.aiSummaryAt?.toISOString() ?? null,
    activeEditors: safeParse<string[]>(n.activeEditors, []),
    wordCount: n.wordCount,
    version: n.version,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

function mapVersion(v: any): CollaborativeNoteVersionDto {
  return {
    id: v.id,
    noteId: v.noteId,
    version: v.version,
    content: v.content,
    editedBy: v.editedBy,
    editSummary: v.editSummary,
    diffSize: v.diffSize,
    createdAt: v.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createNote(input: {
  ownerId: string;
  title: string;
  entityType?: string;
  entityId?: string;
  visibility?: "private" | "shared" | "classroom" | "group" | "public";
  classroomId?: string;
  groupId?: string;
  content?: string;
}): Promise<CollaborativeNoteDto> {
  const content = input.content ?? "";
  const note = await repo.createNote({
    title: input.title,
    entityType: input.entityType,
    entityId: input.entityId,
    ownerId: input.ownerId,
    visibility: input.visibility ?? "private",
    classroomId: input.classroomId,
    groupId: input.groupId,
    content,
    wordCount: countWords(content),
  });

  // Create initial version
  await repo.createNoteVersion({
    noteId: note.id,
    version: 1,
    content,
    editedBy: input.ownerId,
    editSummary: "Initial version",
    diffSize: content.length,
  });

  log.info("note.created", { noteId: note.id, ownerId: input.ownerId });
  return mapNote(note);
}

export async function getNote(id: string, viewerUserId?: string): Promise<CollaborativeNoteDto | null> {
  const note = await repo.findNote(id);
  if (!note) return null;
  // Ownership / visibility check:
  // - The owner can always read.
  // - If the note is `private`, only the owner can read.
  // - If the note is `shared`/`classroom`/`group`/`public`, anyone with the
  //   link can read.
  // If `viewerUserId` is provided, enforce the ownership check for private notes.
  if (viewerUserId && note.visibility === "private" && note.ownerId !== viewerUserId) {
    return null; // not found — do not leak existence
  }
  return mapNote(note);
}

export async function listNotes(input: {
  ownerId?: string;
  classroomId?: string;
  groupId?: string;
  entityType?: string;
  entityId?: string;
  visibility?: string;
  limit?: number;
}): Promise<CollaborativeNoteDto[]> {
  const notes = await repo.findNotes(input);
  return notes.map(mapNote);
}

export async function updateNote(input: {
  noteId: string;
  userId: string;
  content?: string;
  title?: string;
  editSummary?: string;
  visibility?: "private" | "shared" | "classroom" | "group" | "public";
}): Promise<CollaborativeNoteDto> {
  const existing = await repo.findNote(input.noteId);
  if (!existing) throw new Error("Note not found");

  // OWNERSHIP CHECK — prevents IDOR. Only the note's owner can edit it.
  if (existing.ownerId !== input.userId) {
    throw new Error("Forbidden: only the note's owner can edit it");
  }

  // Compute new version number
  const newVersion = existing.version + 1;
  const newContent = input.content ?? existing.content;

  // Diff size (rough char count delta)
  const diffSize = Math.abs(newContent.length - existing.content.length);

  // Create version snapshot
  await repo.createNoteVersion({
    noteId: input.noteId,
    version: newVersion,
    content: newContent,
    editedBy: input.userId,
    editSummary: input.editSummary,
    diffSize,
  });

  // Update the note row
  const updateData: Record<string, unknown> = {
    version: newVersion,
    lastEditedBy: input.userId,
    lastEditedAt: new Date(),
    content: newContent,
    wordCount: countWords(newContent),
  };
  if (input.title !== undefined) updateData.title = input.title;
  if (input.visibility !== undefined) updateData.visibility = input.visibility;

  const updated = await repo.updateNote(input.noteId, updateData);

  log.info("note.updated", {
    noteId: input.noteId,
    userId: input.userId,
    version: newVersion,
    diffSize,
  });

  return mapNote(updated);
}

// ---------------------------------------------------------------------------
// Version history
// ---------------------------------------------------------------------------

export async function listNoteVersions(noteId: string): Promise<CollaborativeNoteVersionDto[]> {
  const versions = await repo.findNoteVersions(noteId);
  return versions.map(mapVersion);
}

export async function getNoteVersion(noteId: string, version: number): Promise<CollaborativeNoteVersionDto | null> {
  const v = await repo.findNoteVersion(noteId, version);
  return v ? mapVersion(v) : null;
}

export async function revertToVersion(noteId: string, version: number, userId: string): Promise<CollaborativeNoteDto> {
  const targetVersion = await repo.findNoteVersion(noteId, version);
  if (!targetVersion) throw new Error("Version not found");

  return updateNote({
    noteId,
    userId,
    content: targetVersion.content,
    editSummary: `Reverted to version ${version}`,
  });
}

// ---------------------------------------------------------------------------
// AI summary (deterministic fallback)
// ---------------------------------------------------------------------------

export async function generateNoteSummary(noteId: string): Promise<string> {
  const note = await repo.findNote(noteId);
  if (!note) throw new Error("Note not found");

  // Deterministic fallback: first 200 chars + word count
  const preview = note.content.slice(0, 200);
  const summary = `This note has ${countWords(note.content)} words across ${note.version} versions. Preview: ${preview}${note.content.length > 200 ? "…" : ""}`;

  await repo.updateNote(noteId, {
    aiSummary: summary,
    aiSummaryAt: new Date(),
  });

  log.info("note.summary_generated", { noteId, version: note.version });
  return summary;
}

// ---------------------------------------------------------------------------
// Active editors (for real-time presence)
// ---------------------------------------------------------------------------

export async function addActiveEditor(noteId: string, userId: string): Promise<void> {
  const note = await repo.findNote(noteId);
  if (!note) return;
  const editors = safeParse<string[]>(note.activeEditors, []);
  if (!editors.includes(userId)) {
    editors.push(userId);
    await repo.updateNote(noteId, { activeEditors: JSON.stringify(editors) });
  }
}

export async function removeActiveEditor(noteId: string, userId: string): Promise<void> {
  const note = await repo.findNote(noteId);
  if (!note) return;
  const editors = safeParse<string[]>(note.activeEditors, []);
  const filtered = editors.filter((e) => e !== userId);
  await repo.updateNote(noteId, { activeEditors: JSON.stringify(filtered) });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}
