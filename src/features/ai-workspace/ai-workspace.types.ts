/**
 * EduBek — AI Workspace DTOs.
 *
 * Phase 4E.4: All DTOs now expose translation-ready fields alongside
 * the existing English text (which remains as backward-compatible fallback).
 *
 * Fields added:
 *   - AiSessionDto: titleKey, titleParams
 *   - AiMessageDto: contentKey, contentParams
 *   - GenerateResultDto: messageKey, messageParams
 *   - AiSuggestionDto: labelKey, descriptionKey
 */

export interface AiSessionDto {
  id: string;
  ownerId: string;
  orgId: string | null;
  title: string;
  currentResourceId: string | null;
  currentModel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  /** Phase 4E.4: Translation key for the session title. */
  titleKey?: string | null;
  /** Phase 4E.4: Interpolation params for titleKey. */
  titleParams?: Record<string, unknown> | null;
}

export interface AiMessageDto {
  id: string;
  role: string;
  content: string;
  model: string | null;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number | null;
  createdAt: string;
  /** Phase 4E.4: Translation key for system-generated assistant messages. */
  contentKey?: string | null;
  /** Phase 4E.4: Interpolation params for contentKey. */
  contentParams?: Record<string, unknown> | null;
}

export interface GenerateResultDto {
  sessionId: string;
  resourceId: string;
  resourceType: string;
  title: string;
  message: string;
  model: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  /** Phase 4E.4: Translation key for the message. */
  messageKey?: string | null;
  /** Phase 4E.4: Interpolation params for messageKey. */
  messageParams?: Record<string, unknown> | null;
}

export interface AiSuggestionDto {
  type: string;
  label: string;
  description: string;
  generationType: string;
  variables: Record<string, string>;
  /** Phase 4E.4: Translation key for the label. */
  labelKey?: string;
  /** Phase 4E.4: Translation key for the description. */
  descriptionKey?: string;
}
