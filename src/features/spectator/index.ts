/**
 * EduBek — Live Quiz Spectator feature barrel export.
 */
export {
  mintToken,
  verifyToken,
  getSessionView,
} from "./service";

export {
  createSpectatorTokenBodySchema,
  listSpectatorsQuerySchema,
  type CreateSpectatorTokenBody,
  type ListSpectatorsQuery,
} from "./schema";

export type {
  SpectatorTokenDto,
  SpectatorSessionView,
} from "./types";
