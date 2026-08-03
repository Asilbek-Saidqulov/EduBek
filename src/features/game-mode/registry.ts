/**
 * EduBek — Game Mode Registry.
 *
 * The registry maps a stable string identifier (stored on
 * `LiveSession.gameMode`) to the corresponding `GameModeStrategy`
 * implementation.
 *
 * The engine calls `getGameMode(mode)` and gets back a strategy — it
 * never switches on the Game Mode string. Adding a new Game Mode is a
 * one-line registration change; the engine code is untouched.
 *
 * To register a new Game Mode:
 *   1. Implement `GameModeStrategy` in `modes/<your-mode>.ts`.
 *   2. Import it below and add it to `REGISTRY`.
 *   3. Done.
 */
import type { GameModeStrategy } from "./types";
import { DEFAULT_GAME_MODE_METADATA } from "./types";
import { classicMode } from "./modes/classic";
import { treasureMode } from "./modes/treasure";
import { empireMode } from "./modes/empire";
import { royaleMode } from "./modes/royale";
import { battleMode } from "./modes/battle";

const REGISTRY: Record<string, GameModeStrategy> = {
  [classicMode.id]: classicMode,
  [treasureMode.id]: treasureMode,
  [empireMode.id]: empireMode,
  [royaleMode.id]: royaleMode,
  [battleMode.id]: battleMode,
};

export function getGameMode(mode: string): GameModeStrategy {
  const strategy = REGISTRY[mode];
  if (!strategy) {
    throw new Error(
      `Unknown Game Mode: "${mode}". Registered Game Modes: ${Object.keys(REGISTRY).join(", ")}`,
    );
  }
  return strategy;
}

export function listGameModes(): Array<{
  id: string;
  name: string;
  description: string;
  metadata: import("./types").GameModeMetadata;
}> {
  return Object.values(REGISTRY).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    metadata: { ...DEFAULT_GAME_MODE_METADATA, ...(s.metadata ?? {}) },
  }));
}

export function isRegisteredMode(mode: string): boolean {
  return mode in REGISTRY;
}
