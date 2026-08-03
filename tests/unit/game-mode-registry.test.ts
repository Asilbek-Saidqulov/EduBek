/**
 * EduBek — Test: Game mode registry.
 *
 * Phase 4D.7 — Testing infrastructure.
 * Verifies that all 5 official Game Modes are registered with the
 * correct display names and metadata.
 */
import { describe, it, expect } from "vitest";
import { getGameMode, listGameModes, isRegisteredMode } from "@/features/game-mode";

describe("Game mode registry", () => {
  it("should list all 5 official game modes", () => {
    const modes = listGameModes();
    expect(modes).toHaveLength(5);
    const ids = modes.map((m) => m.id);
    expect(ids).toEqual(expect.arrayContaining(["classic", "treasure", "empire", "royale", "battle"]));
  });

  it("should have correct display names", () => {
    const modes = listGameModes();
    const names = modes.map((m) => m.name);
    expect(names).toEqual(
      expect.arrayContaining(["Classic Quiz", "Treasure Heist", "Empire Builder", "Quiz Royale", "Battle Royale"]),
    );
  });

  it("should return the strategy for a registered mode", () => {
    const classic = getGameMode("classic");
    expect(classic.id).toBe("classic");
    expect(classic.name).toBe("Classic Quiz");
  });

  it("should throw for an unknown mode", () => {
    expect(() => getGameMode("nonexistent")).toThrow("Unknown Game Mode");
  });

  it("should report registered modes correctly", () => {
    expect(isRegisteredMode("classic")).toBe(true);
    expect(isRegisteredMode("nonexistent")).toBe(false);
  });

  it("should include metadata for each mode", () => {
    const modes = listGameModes();
    for (const mode of modes) {
      expect(mode.metadata).toBeDefined();
      expect(mode.metadata.difficulty).toBeDefined();
      expect(mode.metadata.recommendedPlayers).toBeGreaterThan(0);
      expect(mode.metadata.estimatedDurationSec).toBeGreaterThan(0);
      expect(mode.metadata.iconName).toBeTruthy();
      expect(mode.metadata.themeColor).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
