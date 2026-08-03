/**
 * EduBek — Live Quiz Matchmaking feature barrel export.
 */
export { findMatch } from "./service";
export {
  matchmakingBodySchema,
  type MatchmakingBody,
} from "./schema";
export type {
  MatchmakingStrategy,
  MatchResult,
  MatchmakingRequest,
} from "./types";
