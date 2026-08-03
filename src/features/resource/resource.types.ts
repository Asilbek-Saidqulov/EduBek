/** Resource feature — domain types (DTOs). */

import type { MultilingualMetadata } from "@/features/content-translation/types";

export type ResourceType =
  | 'quiz' | 'worksheet' | 'lesson_plan' | 'presentation'
  | 'flashcards' | 'notes' | 'exam' | 'homework' | 'practice_material'

export type ResourceVisibility = 'private' | 'organization' | 'public' | 'marketplace'
export type ResourceStatus = 'draft' | 'ready' | 'archived'

export interface ResourceDto {
  id: string; ownerId: string; orgId: string | null; resourceType: string
  title: string; description: string | null; content: string
  subject: string | null; grade: string | null; language: string
  visibility: string; status: string; duplicatedFromId: string | null
  tags: string[]; isFavorited: boolean
  createdAt: string; updatedAt: string
  /** Phase 4E.5: Multilingual metadata (additive, optional). */
  multilingual?: MultilingualMetadata
}

export interface ResourceListItemDto {
  id: string; ownerId: string; orgId: string | null; resourceType: string
  title: string; description: string | null; subject: string | null; grade: string | null
  language: string; visibility: string; status: string
  tags: string[]; createdAt: string; updatedAt: string
  /** Phase 4E.5: Available languages for this resource (additive). */
  availableLanguages?: string[]
  /** Phase 4E.5: Translation status (additive). */
  translationStatus?: string
}

export interface ResourceListResult { resources: ResourceListItemDto[]; total: number }

export interface ResourceVersionDetailDto {
  id: string; version: number; snapshot: string; changelog: string | null
  createdById: string | null; createdAt: string
}

export interface ResourceExportDto {
  format: string; resourceType: string; title: string; description: string | null
  content: string; subject: string | null; grade: string | null; language: string
  tags: string[]; versions: ResourceVersionDetailDto[]
}

export interface ResourceStatsDto {
  viewCount: number; duplicateCount: number; favoriteCount: number
  lastOpenedAt: string | null; lastEditedAt: string | null
}

export interface BulkOperationResultDto {
  operation: string; succeeded: string[]; failed: Array<{ id: string; error: string }>
}
