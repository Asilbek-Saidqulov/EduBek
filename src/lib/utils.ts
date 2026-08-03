import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * EduBek — shared utilities.
 *
 * Pure, dependency-light helpers used across the entire codebase. Anything
 * that requires business logic, IO, or feature flags belongs elsewhere —
 * keep this file small and side-effect free.
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract up to two uppercase initials from a display name, e.g.
 *   "John Doe"      -> "JD"
 *   "john"          -> "J"
 *   ""              -> ""
 *   " 🌟 Aurora "   -> "A"
 *
 * Initials are useful for avatar fallbacks, mentions, and audit logs where a
 * full name would be too verbose.
 */
export function avatarInitials(name: string | null | undefined): string {
  if (!name) return "";
  // Split on whitespace and filter out tokens that contain no word characters
  // (handles emoji-only fragments, multiple spaces, etc.).
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter((token) => /[A-Za-z0-9]/.test(token));
  if (tokens.length === 0) return "";
  if (tokens.length === 1) {
    return tokens[0].charAt(0).toUpperCase();
  }
  return (
    tokens[0].charAt(0).toUpperCase() + tokens[1].charAt(0).toUpperCase()
  );
}

/**
 * Clamp a numeric value to an inclusive range. Returns `min` when value < min,
 * `max` when value > max, otherwise the value itself.
 *
 * NaN inputs return `min` — clamping is a defensive operation and NaN would
 * silently propagate otherwise.
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Parse a JSON string into a typed value, returning `null` on any failure
 * (malformed JSON, throw on access, etc.). Use this whenever untrusted JSON
 * comes back from the database, an HTTP body, or a cookie.
 *
 * The type parameter is purely advisory — the helper does not validate the
 * shape. Use Zod schemas for runtime validation; use this helper only when
 * you trust the producer or are willing to handle a `null` gracefully.
 */
export function safeJsonParse<T>(raw: string | null | undefined): T | null {
  if (raw === null || raw === undefined || raw === "") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
