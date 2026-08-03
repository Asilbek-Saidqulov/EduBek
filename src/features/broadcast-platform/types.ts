/**
 * EduBek — Spectator Experience, Broadcasting & Tournament Production Platform types.
 * Phase 6G.12: Owns how matches are presented to viewers, never how matches are played.
 *
 * Architecture: Passive Event Bus consumer. Never owns gameplay, scoring, timers,
 * progression, ratings, matchmaking, rewards, inventory, or social relationships.
 */

// System 1 — Spectator Platform
export type SpectatorRole = "teacher" | "parent" | "guest" | "tournament_viewer" | "organization_viewer" | "anonymous";
export type LatencyMode = "realtime" | "low_latency" | "normal" | "high_latency";

export interface Spectator {
  id: string; userId: string; role: SpectatorRole; matchId: string;
  joinedAt: string; leftAt: string | null; followingPlayerId: string | null;
  freeCamera: boolean; syncEnabled: boolean; latencyMode: LatencyMode;
  permissions: SpectatorPermissions;
}
export interface SpectatorPermissions { canChat: boolean; canReact: boolean; canSeeReplay: boolean; canSeeStats: boolean; canFollowPlayer: boolean; canUseFreeCamera: boolean; }

// System 2 — Observer Platform
export type ObserverPriority = "teacher" | "admin" | "tournament" | "production";
export interface ObserverSlot { id: string; observerId: string; priority: ObserverPriority; cameraId: string | null; synced: boolean; matchId: string; assignedAt: string; }

// System 3 — Broadcast Controller
export type BroadcastState = "live" | "paused" | "commercial_break" | "countdown" | "standby" | "ended" | "emergency_stop";
export interface BroadcastController { id: string; matchId: string; state: BroadcastState; startedAt: string | null; endedAt: string | null; stateHistory: BroadcastStateChange[]; }
export interface BroadcastStateChange { id: string; fromState: BroadcastState; toState: BroadcastState; timestamp: string; performedBy: string; reason: string; }

// System 4 — Production Stage Manager
export type ProductionStage = "intro" | "countdown" | "lobby" | "question" | "leaderboard" | "intermission" | "final" | "winner_ceremony" | "closing";
export interface ProductionStageState { id: string; matchId: string; currentStage: ProductionStage; previousStage: ProductionStage | null; stageHistory: StageTransition[]; startedAt: string; }
export interface StageTransition { id: string; fromStage: ProductionStage | null; toStage: ProductionStage; timestamp: string; durationMs: number; }

// System 5 — Overlay Engine
export type OverlayType = "scoreboard" | "timer" | "question" | "leaderboard" | "player_cards" | "top_performers" | "tournament_bracket" | "sponsor_banner" | "watermark" | "event_banner";
export interface Overlay { id: string; type: OverlayType; visible: boolean; position: OverlayPosition; zIndex: number; data: Record<string, unknown>; matchId: string | null; }
export interface OverlayPosition { x: number; y: number; width: number; height: number; }

// System 6 — Presenter Mode
export type PresenterLayout = "teacher_presentation" | "fullscreen" | "minimal" | "confidence_monitor";
export interface PresenterState { id: string; userId: string; matchId: string; layout: PresenterLayout; notes: string; questionPreview: boolean; privateControls: boolean; }

// System 7 — Camera System
export type CameraMode = "player_focus" | "winner_focus" | "leaderboard_focus" | "auto_camera" | "teacher_camera" | "free_camera" | "picture_in_picture";
export interface Camera { id: string; mode: CameraMode; targetPlayerId: string | null; pipCameraId: string | null; matchId: string; active: boolean; assignedObserverId: string | null; }

// System 8 — Replay Broadcasting
export interface ReplayQueueItem { id: string; matchId: string; replayId: string; title: string; addedAt: string; playedAt: string | null; bookmarked: boolean; slowMotion: boolean; duration: number; }
export interface ReplayBroadcastState { currentItemId: string | null; isPlaying: boolean; position: number; speed: number; }

// System 9 — Highlight Engine
export type HighlightType = "winner" | "perfect_streak" | "big_comeback" | "final_duel" | "championship" | "world_record";
export interface Highlight { id: string; matchId: string; type: HighlightType; title: string; description: string; timestamp: string; durationMs: number; playerIds: string[]; bookmarked: boolean; }

// System 10 — Streaming Integration
export type StreamingPlatform = "obs" | "rtmp" | "ndi" | "virtual_camera" | "browser_source" | "websocket_overlay";
export interface StreamIntegration { id: string; platform: StreamingPlatform; config: Record<string, unknown>; active: boolean; streamKey: string | null; connectedAt: string | null; matchId: string | null; }

// System 11 — Tournament Production
export interface TournamentProduction { id: string; tournamentId: string; currentStage: ProductionStage; matchSchedule: Array<{ matchId: string; scheduledTime: string; status: "scheduled" | "on_deck" | "live" | "completed" }>; bracketPresentation: boolean; awardsCeremony: boolean; }

// System 12 — Audience Experience
export type ReactionType = "applause" | "emoji" | "poll" | "prediction" | "cheer";
export interface AudienceReaction { id: string; matchId: string; userId: string; type: ReactionType; content: string; timestamp: string; }

// System 13 — Commentary Support
export interface CommentaryData { matchId: string; playerCards: Array<{ userId: string; displayName: string; stats: Record<string, unknown> }>; talkingPoints: string[]; timeline: Array<{ timestamp: string; event: string }>; interestingFacts: string[]; }

// System 14 — Broadcast Analytics
export interface BroadcastAnalytics { matchId: string; viewers: number; peakViewers: number; watchTimeMs: number; overlayUsage: Record<string, number>; replayUsage: number; dropOffs: number; avgLatencyMs: number; }

// System 15 — Production Dashboard
export interface ProductionDashboard { matchId: string; broadcastState: BroadcastState; currentStage: ProductionStage; observerCount: number; currentCamera: CameraMode; streamingHealth: "healthy" | "warning" | "critical"; replayQueueLength: number; upcomingStage: ProductionStage | null; alerts: Array<{ id: string; severity: string; message: string }>; }

// System 17 — Developer Integration
export interface BroadcastDeveloperIntegration { publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean }>; eventContracts: string[]; extensionHooks: Array<{ id: string; name: string; triggerEvent: string }>; sdkMetadata: { version: string; language: string; docsUrl: string }; }

// Event types
export type BroadcastEventType = "BroadcastStarted" | "BroadcastEnded" | "HighlightPublished" | "ObserverJoined" | "ProductionStageChanged";
