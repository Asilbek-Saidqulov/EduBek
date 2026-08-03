/**
 * EduBek — Game Mode feature barrel export.
 */
export { getGameMode, listGameModes, isRegisteredMode } from "./registry";
export { classicMode } from "./modes/classic";
export { treasureMode } from "./modes/treasure";
export { empireMode } from "./modes/empire";
export { royaleMode } from "./modes/royale";
export { battleMode } from "./modes/battle";

export {
  GAME_MODE_DISPLAY_NAMES,
  getGameModeDisplayName,
} from "./display-names";

export {
  gameModeIdSchema,
  gameModeConfigSchema,
  type GameModeConfigInput,
} from "./schema";

export {
  DEFAULT_GAME_MODE_CONFIG,
  DEFAULT_GAME_MODE_METADATA,
} from "./types";

export type {
  GameModeStrategy,
  GameModeConfig,
  GameModeMetadata,
  PlayerModeState,
  RoundContext,
  AnswerInput,
  RoundResult,
  LeaderboardEntry,
  RewardSpec,
} from "./types";
