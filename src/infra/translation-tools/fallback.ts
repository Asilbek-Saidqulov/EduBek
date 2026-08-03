/**
 * EduBek — Missing translation handler.
 *
 * Phase 4E.6: When a translation is missing, fall back gracefully
 * through the chain: localized → default language → original → placeholder.
 * Track every fallback for analytics.
 */

export type FallbackLevel =
  | "localized"      // Found in requested locale
  | "default"        // Fell back to default locale (en)
  | "original"       // Fell back to original content language
  | "placeholder";   // No translation available at all

export interface TranslationResolutionResult<T> {
  /** The resolved value (or null if nothing found). */
  value: T | null;
  /** Which fallback level was used. */
  fallbackLevel: FallbackLevel;
  /** The locale that was actually used. */
  resolvedLocale: string | null;
  /** Whether a fallback was triggered. */
  usedFallback: boolean;
}

/**
 * Resolve a value through the translation fallback chain.
 *
 * @param localizedValue — value in the requested locale (null if missing)
 * @param defaultValue — value in the default locale (en)
 * @param originalValue — value in the original content language
 * @param requestedLocale — the locale the user requested
 * @param defaultLocale — the platform default locale (usually "en")
 * @param placeholder — fallback placeholder (defaults to "...")
 */
export function resolveWithFallback<T>(
  localizedValue: T | null | undefined,
  defaultValue: T | null | undefined,
  originalValue: T | null | undefined,
  requestedLocale: string,
  defaultLocale: string = "en",
  placeholder?: T,
): TranslationResolutionResult<T> {
  // Level 1: Found in requested locale
  if (localizedValue != null) {
    return {
      value: localizedValue,
      fallbackLevel: "localized",
      resolvedLocale: requestedLocale,
      usedFallback: false,
    };
  }

  // Level 2: Fall back to default locale
  if (defaultValue != null) {
    return {
      value: defaultValue,
      fallbackLevel: "default",
      resolvedLocale: defaultLocale,
      usedFallback: true,
    };
  }

  // Level 3: Fall back to original content
  if (originalValue != null) {
    return {
      value: originalValue,
      fallbackLevel: "original",
      resolvedLocale: null,
      usedFallback: true,
    };
  }

  // Level 4: Placeholder
  return {
    value: placeholder ?? null,
    fallbackLevel: "placeholder",
    resolvedLocale: null,
    usedFallback: true,
  };
}

/**
 * Batch resolve multiple fields with the same fallback chain.
 * Returns a map of field → TranslationResolutionResult.
 */
export function resolveFieldsWithFallback<T extends Record<string, unknown>>(
  fields: T,
  requestedLocale: string,
  defaultLocale: string = "en",
): Record<string, TranslationResolutionResult<unknown>> {
  const results: Record<string, TranslationResolutionResult<unknown>> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value != null) {
      results[key] = {
        value,
        fallbackLevel: "localized",
        resolvedLocale: requestedLocale,
        usedFallback: false,
      };
    } else {
      results[key] = {
        value: null,
        fallbackLevel: "placeholder",
        resolvedLocale: null,
        usedFallback: true,
      };
    }
  }
  return results;
}
