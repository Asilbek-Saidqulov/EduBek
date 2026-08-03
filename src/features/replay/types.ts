/**
 * EduBek — Live Quiz Replay module types.
 *
 * A Replay is the complete, immutable history of a Quiz Session. It is
 * event-sourced: the Quiz Session service appends events to the Replay
 * as they occur (round_started, answer_submitted, round_finished,
 * leaderboard_updated, player_eliminated, host_migrated, etc.). At
 * Quiz Session end, the Replay is finalized with a snapshot of the
 * final state + per-question analytics.
 *
 * Replays are useful for:
 *   • Teachers reviewing how their class performed
 *   • Participants reviewing their own gameplay
 *   • Dispute resolution (the Replay is the source of truth)
 *   • AI analysis (the Replay is a clean training signal)
 *   • Spectator mode for tournaments
 */

export type ReplayVisibility =
  | "session_participants"
  | "classroom"
  | "org"
  | "public";

export interface ReplayEvent {
  type: string;
  timestamp: string;
  actorId?: string;
  payload: Record<string, unknown>;
}

/**
 * Phase 4C.1: timeline marker for replay scrubbing. Each marker is a
 * notable moment the frontend can jump to or highlight during playback.
 */
export interface ReplayTimelineMarker {
  /** Marker type — drives the icon/label shown in the UI. */
  type:
    | "round_start"
    | "round_end"
    | "winner_crowned"
    | "perfect_streak"
    | "elimination"
    | "disconnect"
    | "reconnect"
    | "host_action"
    | "leaderboard_change"
    | "session_start"
    | "session_end";
  /** Offset from session start in milliseconds. */
  offsetMs: number;
  /** Absolute timestamp (ISO) — for cross-replay alignment. */
  timestamp: string;
  /** Human-readable label for the marker tooltip (English fallback). */
  label: string;
  /**
   * Phase 4E.3: Translation key for the label (e.g. "backend.replay.roundStart").
   * The frontend resolves this to a localized string using the user's locale.
   */
  labelKey?: string;
  /** Interpolation params for `labelKey` (e.g. { round: 1 }). */
  labelParams?: Record<string, unknown>;
  /** Round number this marker belongs to (if applicable). */
  roundNumber?: number;
  /** Participant ID this marker is about (if applicable). */
  playerId?: string;
  /** Actor (host) who triggered a host-action marker (if applicable). */
  actorId?: string;
  /** Additional marker-specific data (e.g. streak count, action name). */
  metadata?: Record<string, unknown>;
}

export interface ReplayDto {
  id: string;
  sessionId: string;
  events: ReplayEvent[];
  finalSnapshot: Record<string, unknown>;
  durationMs: number;
  visibility: ReplayVisibility;
  analyticsSummary: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  // ---- Phase 4C.1 additive ----
  /** Notable moments the frontend can scrub to / highlight. */
  timelineMarkers?: ReplayTimelineMarker[];
}

export interface ReplaySummaryDto {
  totalSessions: number;
  totalDurationMs: number;
  averageScore: number;
  mostFrequentMode: string | null;
  winRate: number;
}
