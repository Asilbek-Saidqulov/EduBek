/**
 * EduBek — Game Mode display names.
 *
 * Product hierarchy:
 *
 *   EduBek (platform)
 *     └── Live Quiz (feature)
 *           └── Game Modes
 *                 • Classic Quiz
 *                 • Treasure Heist
 *                 • Empire Builder
 *                 • Quiz Royale
 *                 • Battle Royale
 *
 * The internal `id` of each Game Mode (stored on `LiveSession.gameMode`,
 * `Tournament.gameMode`, etc.) is a stable lowercase string that never
 * changes — it's what the strategy registry dispatches on and what
 * the audit log records. Internal ids are NEVER shown to end users.
 *
 * The *display name* is the human-friendly label shown in UIs, API
 * responses, analytics, replays, and tournament brackets. The five
 * official Game Modes use these display names:
 *
 *   classic  → Classic Quiz
 *   treasure → Treasure Heist
 *   empire   → Empire Builder
 *   royale   → Quiz Royale
 *   battle   → Battle Royale
 *
 * Use `getGameModeDisplayName(id)` whenever a DTO needs to expose the
 * label to a consumer. Fall back to the id itself for unknown Game
 * Modes (e.g. future custom Game Modes that haven't registered a
 * display name).
 */
export const GAME_MODE_DISPLAY_NAMES: Record<string, string> = {
  classic: "Classic Quiz",
  treasure: "Treasure Heist",
  empire: "Empire Builder",
  royale: "Quiz Royale",
  battle: "Battle Royale",
};

export function getGameModeDisplayName(id: string): string {
  return GAME_MODE_DISPLAY_NAMES[id] ?? id;
}
