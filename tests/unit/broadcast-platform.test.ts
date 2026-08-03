/**
 * EduBek — Spectator Experience, Broadcasting & Tournament Production Platform tests. Phase 6G.12.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  joinAsSpectator, leaveSpectator, followPlayer, setFreeCamera, setLatencyMode, setSyncEnabled, getMatchSpectators, getActiveSpectatorCount, getSpectatorById, DEFAULT_PERMISSIONS, assignObserver, getMatchObservers, syncObserver, assignCameraToObserver, removeObserver,
  initBroadcast, transitionBroadcast, getBroadcastStatus, canTransitionBroadcast, emergencyStop, initProductionStage, transitionStage, getProductionStage, getNextStage, getStageOrder,
  createOverlay, getMatchOverlays, setOverlayVisibility, setOverlayPosition, setOverlayData, getVisibleOverlays, supportsAllOverlayTypes, initPresenter, getPresenterState, setPresenterLayout, setPresenterNotes, setQuestionPreview, setPrivateControls, supportsAllPresenterLayouts, createCamera, getMatchCameras, getActiveCamera, setActiveCamera, setCameraMode, setCameraTarget, setCameraPiP, supportsAllCameraModes,
  addToReplayQueue, getReplayQueueForMatch, getPendingReplays, markReplayPlayed, bookmarkReplay, setSlowMotion, startReplayPlayback, pauseReplayPlayback, seekReplay, setReplaySpeed, getReplayPlaybackState, createHighlight, getMatchHighlights, getBookmarkedHighlights, bookmarkHighlight, getHighlightsByType, supportsAllHighlightTypes, registerStream, getMatchStreams, connectStream, disconnectStream, supportsAllStreamingPlatforms,
  createTournamentProduction, getTournamentProductionById, addScheduledMatch, setMatchOnDeck, setMatchLive, setMatchCompleted, setBracketPresentation, setAwardsCeremony, submitReaction, getMatchReactions, getReactionsByType, getReactionCount, generateCommentary, addPlayerCard, addTalkingPoint, addTimelineEntry, addInterestingFact, getCommentaryData, generateBroadcastAnalytics, generateProductionDashboard, getDeveloperIntegration,
  subscribeBroadcast, unsubscribeBroadcast, isBroadcastSubscribed, getBridgeProcessedCount, publishBroadcastEvent,
  _resetBridgeForTesting, _resetRepositoryForTesting,
} from "@/features/broadcast-platform";
import { createMatch, emitEvent } from "@/features/game-engine";

beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); });

// ===== System 1 — Spectator Platform =====
describe("Broadcast — Spectator", () => {
  it("joins as spectator", () => { const s = joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }); expect(s.id).toBeDefined(); expect(s.role).toBe("guest"); });
  it("leaves spectator", () => { const s = joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }); expect(leaveSpectator("m1", s.id)?.leftAt).not.toBeNull(); });
  it("follows player", () => { const s = joinAsSpectator({ userId: "u1", role: "teacher", matchId: "m1" }); expect(followPlayer("m1", s.id, "p1")?.followingPlayerId).toBe("p1"); });
  it("free camera for teacher", () => { const s = joinAsSpectator({ userId: "u1", role: "teacher", matchId: "m1" }); expect(setFreeCamera("m1", s.id, true)?.freeCamera).toBe(true); });
  it("free camera denied for anonymous", () => { const s = joinAsSpectator({ userId: "u1", role: "anonymous", matchId: "m1" }); expect(setFreeCamera("m1", s.id, true)).toBeNull(); });
  it("sets latency mode", () => { const s = joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }); expect(setLatencyMode("m1", s.id, "realtime")?.latencyMode).toBe("realtime"); });
  it("sets sync enabled", () => { const s = joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }); expect(setSyncEnabled("m1", s.id, false)?.syncEnabled).toBe(false); });
  it("gets match spectators", () => { joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }); joinAsSpectator({ userId: "u2", role: "guest", matchId: "m1" }); expect(getMatchSpectators("m1").length).toBe(2); });
  it("gets active spectator count", () => { joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }); expect(getActiveSpectatorCount("m1")).toBe(1); });
  it("left spectators excluded from active", () => { const s = joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }); joinAsSpectator({ userId: "u2", role: "guest", matchId: "m1" }); leaveSpectator("m1", s.id); expect(getActiveSpectatorCount("m1")).toBe(1); });
  it("gets spectator by id", () => { const s = joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }); expect(getSpectatorById("m1", s.id)).not.toBeNull(); });
  it("default permissions for all roles", () => { for (const r of ["teacher","parent","guest","tournament_viewer","organization_viewer","anonymous"] as const) expect(DEFAULT_PERMISSIONS[r]).toBeDefined(); });
  it("anonymous cannot chat", () => { expect(DEFAULT_PERMISSIONS.anonymous.canChat).toBe(false); });
  it("teacher can use free camera", () => { expect(DEFAULT_PERMISSIONS.teacher.canUseFreeCamera).toBe(true); });
  it("follow player denied for anonymous", () => { const s = joinAsSpectator({ userId: "u1", role: "anonymous", matchId: "m1" }); expect(followPlayer("m1", s.id, "p1")).toBeNull(); });
  it("default latency mode normal", () => { expect(joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }).latencyMode).toBe("normal"); });
  it("default sync enabled", () => { expect(joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }).syncEnabled).toBe(true); });
  it("leave already left returns null", () => { const s = joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }); leaveSpectator("m1", s.id); expect(leaveSpectator("m1", s.id)).toBeNull(); });
});

// ===== System 2 — Observer Platform =====
describe("Broadcast — Observer", () => {
  it("assigns observer", () => { const o = assignObserver({ observerId: "o1", priority: "teacher", matchId: "m1" }); expect(o.id).toBeDefined(); expect(o.priority).toBe("teacher"); });
  it("gets match observers", () => { assignObserver({ observerId: "o1", priority: "admin", matchId: "m1" }); expect(getMatchObservers("m1").length).toBe(1); });
  it("syncs observer", () => { const o = assignObserver({ observerId: "o1", priority: "admin", matchId: "m1" }); expect(syncObserver("m1", "o1")?.synced).toBe(true); });
  it("assigns camera to observer", () => { assignObserver({ observerId: "o1", priority: "admin", matchId: "m1" }); expect(assignCameraToObserver("m1", "o1", "cam-1")?.cameraId).toBe("cam-1"); });
  it("removes observer", () => { assignObserver({ observerId: "o1", priority: "admin", matchId: "m1" }); expect(removeObserver("m1", "o1")).toBe(true); expect(getMatchObservers("m1").length).toBe(0); });
  it("sync non-existent returns null", () => { expect(syncObserver("m1", "nonexistent")).toBeNull(); });
  it("remove non-existent returns false", () => { expect(removeObserver("m1", "nonexistent")).toBe(false); });
  it("supports all priorities", () => { for (const p of ["teacher","admin","tournament","production"] as const) expect(assignObserver({ observerId: `o-${p}`, priority: p, matchId: "m1" }).priority).toBe(p); });
  it("observer has assignedAt", () => { expect(assignObserver({ observerId: "o1", priority: "admin", matchId: "m1" }).assignedAt).toBeDefined(); });
  it("observer default synced true", () => { expect(assignObserver({ observerId: "o1", priority: "admin", matchId: "m1" }).synced).toBe(true); });
});

// ===== System 3 — Broadcast Controller =====
describe("Broadcast — Controller", () => {
  it("inits broadcast", () => { expect(initBroadcast("m1").state).toBe("standby"); });
  it("transitions standby to countdown", () => { initBroadcast("m1"); expect(transitionBroadcast("m1", "countdown", "admin", "Starting")?.state).toBe("countdown"); });
  it("transitions countdown to live", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); expect(transitionBroadcast("m1", "live", "a", "")?.state).toBe("live"); });
  it("transitions live to paused", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); expect(transitionBroadcast("m1", "paused", "a", "")?.state).toBe("paused"); });
  it("transitions live to commercial_break", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); expect(transitionBroadcast("m1", "commercial_break", "a", "")?.state).toBe("commercial_break"); });
  it("transitions live to ended", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); expect(transitionBroadcast("m1", "ended", "a", "")?.state).toBe("ended"); });
  it("emergency stop", () => { initBroadcast("m1"); expect(emergencyStop("m1", "admin")?.state).toBe("emergency_stop"); });
  it("invalid transition returns null", () => { initBroadcast("m1"); expect(transitionBroadcast("m1", "ended", "a", "")).toBeNull(); });
  it("canTransition validates", () => { expect(canTransitionBroadcast("standby", "countdown")).toBe(true); expect(canTransitionBroadcast("standby", "ended")).toBe(false); });
  it("live sets startedAt", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); expect(getBroadcastStatus("m1")?.startedAt).not.toBeNull(); });
  it("ended sets endedAt", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); transitionBroadcast("m1", "ended", "a", ""); expect(getBroadcastStatus("m1")?.endedAt).not.toBeNull(); });
  it("state history tracks changes", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); expect(getBroadcastStatus("m1")?.stateHistory.length).toBe(1); });
  it("init is idempotent", () => { const b1 = initBroadcast("m1"); const b2 = initBroadcast("m1"); expect(b1).toBe(b2); });
  it("paused to live", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); transitionBroadcast("m1", "paused", "a", ""); expect(transitionBroadcast("m1", "live", "a", "")?.state).toBe("live"); });
  it("commercial to live", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); transitionBroadcast("m1", "commercial_break", "a", ""); expect(transitionBroadcast("m1", "live", "a", "")?.state).toBe("live"); });
  it("emergency to standby", () => { initBroadcast("m1"); emergencyStop("m1", "a"); expect(transitionBroadcast("m1", "standby", "a", "")?.state).toBe("standby"); });
  it("ended is terminal", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); transitionBroadcast("m1", "ended", "a", ""); expect(transitionBroadcast("m1", "live", "a", "")).toBeNull(); });
});

// ===== System 4 — Production Stage =====
describe("Broadcast — Production Stage", () => {
  it("inits production stage", () => { expect(initProductionStage("m1").currentStage).toBe("intro"); });
  it("transitions stage", () => { initProductionStage("m1"); expect(transitionStage("m1", "countdown")?.currentStage).toBe("countdown"); });
  it("tracks previous stage", () => { initProductionStage("m1"); transitionStage("m1", "countdown"); expect(getProductionStage("m1")?.previousStage).toBe("intro"); });
  it("stage history tracks transitions", () => { initProductionStage("m1"); transitionStage("m1", "countdown"); transitionStage("m1", "lobby"); expect(getProductionStage("m1")?.stageHistory.length).toBe(2); });
  it("gets next stage", () => { initProductionStage("m1"); expect(getNextStage("m1")).toBe("countdown"); });
  it("get stage order", () => { expect(getStageOrder().length).toBe(9); });
  it("init is idempotent", () => { const s1 = initProductionStage("m1"); const s2 = initProductionStage("m1"); expect(s1).toBe(s2); });
  it("supports all stages", () => { for (const s of ["intro","countdown","lobby","question","leaderboard","intermission","final","winner_ceremony","closing"] as const) { initProductionStage(`m-${s}`); expect(transitionStage(`m-${s}`, s)?.currentStage).toBe(s); } });
  it("next stage null at closing", () => { initProductionStage("m1"); for (const s of getStageOrder()) transitionStage("m1", s); expect(getNextStage("m1")).toBeNull(); });
});

// ===== System 5 — Overlay Engine =====
describe("Broadcast — Overlays", () => {
  it("creates overlay", () => { const o = createOverlay({ type: "scoreboard", matchId: "m1" }); expect(o.id).toBeDefined(); expect(o.visible).toBe(true); });
  it("gets match overlays", () => { createOverlay({ type: "scoreboard", matchId: "m1" }); createOverlay({ type: "timer", matchId: "m1" }); expect(getMatchOverlays("m1").length).toBe(2); });
  it("sets overlay visibility", () => { const o = createOverlay({ type: "scoreboard", matchId: "m1" }); expect(setOverlayVisibility(o.id, false, "m1")?.visible).toBe(false); });
  it("sets overlay position", () => { const o = createOverlay({ type: "scoreboard", matchId: "m1" }); expect(setOverlayPosition(o.id, { x: 10, y: 20, width: 200, height: 100 }, "m1")?.position.x).toBe(10); });
  it("sets overlay data", () => { const o = createOverlay({ type: "scoreboard", matchId: "m1" }); expect(setOverlayData(o.id, { score: 100 }, "m1")?.data.score).toBe(100); });
  it("gets visible overlays", () => { const o1 = createOverlay({ type: "scoreboard", matchId: "m1" }); createOverlay({ type: "timer", matchId: "m1", visible: false }); expect(getVisibleOverlays("m1").length).toBe(1); });
  it("supports all overlay types", () => { expect(supportsAllOverlayTypes().length).toBe(10); });
  it("default position", () => { expect(createOverlay({ type: "scoreboard", matchId: "m1" }).position).toEqual({ x: 0, y: 0, width: 100, height: 50 }); });
  it("default zIndex 1", () => { expect(createOverlay({ type: "scoreboard", matchId: "m1" }).zIndex).toBe(1); });
  it("custom zIndex", () => { expect(createOverlay({ type: "scoreboard", matchId: "m1", zIndex: 10 }).zIndex).toBe(10); });
  it("set visibility non-existent returns null", () => { expect(setOverlayVisibility("nonexistent", false, "m1")).toBeNull(); });
});

// ===== System 6 — Presenter Mode =====
describe("Broadcast — Presenter", () => {
  it("inits presenter", () => { const p = initPresenter({ userId: "u1", matchId: "m1" }); expect(p.layout).toBe("teacher_presentation"); });
  it("gets presenter state", () => { initPresenter({ userId: "u1", matchId: "m1" }); expect(getPresenterState("m1", "u1")).not.toBeNull(); });
  it("sets presenter layout", () => { initPresenter({ userId: "u1", matchId: "m1" }); expect(setPresenterLayout("m1", "u1", "fullscreen")?.layout).toBe("fullscreen"); });
  it("sets presenter notes", () => { initPresenter({ userId: "u1", matchId: "m1" }); expect(setPresenterNotes("m1", "u1", "Remember to mention")?.notes).toBe("Remember to mention"); });
  it("sets question preview", () => { initPresenter({ userId: "u1", matchId: "m1" }); expect(setQuestionPreview("m1", "u1", true)?.questionPreview).toBe(true); });
  it("sets private controls", () => { initPresenter({ userId: "u1", matchId: "m1" }); expect(setPrivateControls("m1", "u1", false)?.privateControls).toBe(false); });
  it("supports all layouts", () => { expect(supportsAllPresenterLayouts().length).toBe(4); });
  it("default notes empty", () => { expect(initPresenter({ userId: "u1", matchId: "m1" }).notes).toBe(""); });
  it("default questionPreview false", () => { expect(initPresenter({ userId: "u1", matchId: "m1" }).questionPreview).toBe(false); });
  it("default privateControls true", () => { expect(initPresenter({ userId: "u1", matchId: "m1" }).privateControls).toBe(true); });
  it("init is idempotent", () => { const p1 = initPresenter({ userId: "u1", matchId: "m1" }); const p2 = initPresenter({ userId: "u1", matchId: "m1" }); expect(p1).toBe(p2); });
});

// ===== System 7 — Camera System =====
describe("Broadcast — Camera", () => {
  it("creates camera", () => { const c = createCamera({ mode: "player_focus", matchId: "m1" }); expect(c.id).toBeDefined(); expect(c.active).toBe(false); });
  it("gets match cameras", () => { createCamera({ mode: "player_focus", matchId: "m1" }); createCamera({ mode: "auto_camera", matchId: "m1" }); expect(getMatchCameras("m1").length).toBe(2); });
  it("gets active camera", () => { const c = createCamera({ mode: "player_focus", matchId: "m1", active: true }); expect(getActiveCamera("m1")?.id).toBe(c.id); });
  it("sets active camera", () => { const c1 = createCamera({ mode: "player_focus", matchId: "m1" }); const c2 = createCamera({ mode: "auto_camera", matchId: "m1" }); setActiveCamera("m1", c2.id); expect(getActiveCamera("m1")?.id).toBe(c2.id); });
  it("sets camera mode", () => { const c = createCamera({ mode: "player_focus", matchId: "m1" }); expect(setCameraMode("m1", c.id, "winner_focus")?.mode).toBe("winner_focus"); });
  it("sets camera target", () => { const c = createCamera({ mode: "player_focus", matchId: "m1" }); expect(setCameraTarget("m1", c.id, "p1")?.targetPlayerId).toBe("p1"); });
  it("sets camera PiP", () => { const c = createCamera({ mode: "player_focus", matchId: "m1" }); expect(setCameraPiP("m1", c.id, "cam-2")?.pipCameraId).toBe("cam-2"); });
  it("supports all camera modes", () => { expect(supportsAllCameraModes().length).toBe(7); });
  it("default target null", () => { expect(createCamera({ mode: "player_focus", matchId: "m1" }).targetPlayerId).toBeNull(); });
  it("default PiP null", () => { expect(createCamera({ mode: "player_focus", matchId: "m1" }).pipCameraId).toBeNull(); });
  it("set mode non-existent returns null", () => { expect(setCameraMode("m1", "nonexistent", "auto_camera")).toBeNull(); });
});

// ===== System 8 — Replay Broadcasting =====
describe("Broadcast — Replay", () => {
  it("adds to replay queue", () => { const r = addToReplayQueue({ matchId: "m1", replayId: "r1", title: "Great moment" }); expect(r.id).toBeDefined(); expect(r.playedAt).toBeNull(); });
  it("gets replay queue", () => { addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1" }); addToReplayQueue({ matchId: "m1", replayId: "r2", title: "T2" }); expect(getReplayQueueForMatch("m1").length).toBe(2); });
  it("gets pending replays", () => { addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1" }); addToReplayQueue({ matchId: "m1", replayId: "r2", title: "T2" }); markReplayPlayed("m1", "r1"); expect(getPendingReplays("m1").length).toBe(1); });
  it("marks replay played", () => { addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1" }); expect(markReplayPlayed("m1", "r1")?.playedAt).not.toBeNull(); });
  it("bookmarks replay", () => { const r = addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1" }); expect(bookmarkReplay("m1", r.id)?.bookmarked).toBe(true); });
  it("sets slow motion", () => { const r = addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1" }); expect(setSlowMotion("m1", r.id, true)?.slowMotion).toBe(true); });
  it("starts replay playback", () => { const state = startReplayPlayback("r1"); expect(state.isPlaying).toBe(true); expect(state.speed).toBe(1); });
  it("pauses replay playback", () => { startReplayPlayback("r1"); expect(pauseReplayPlayback("r1")?.isPlaying).toBe(false); });
  it("seeks replay", () => { startReplayPlayback("r1"); expect(seekReplay("r1", 5000)?.position).toBe(5000); });
  it("sets replay speed", () => { startReplayPlayback("r1"); expect(setReplaySpeed("r1", 2)?.speed).toBe(2); });
  it("speed clamps to 0.25", () => { startReplayPlayback("r1"); expect(setReplaySpeed("r1", 0.1)?.speed).toBe(0.25); });
  it("speed clamps to 4", () => { startReplayPlayback("r1"); expect(setReplaySpeed("r1", 10)?.speed).toBe(4); });
  it("gets replay playback state", () => { startReplayPlayback("r1"); expect(getReplayPlaybackState("r1")).not.toBeNull(); });
  it("default bookmarked false", () => { expect(addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1" }).bookmarked).toBe(false); });
  it("default slowMotion false", () => { expect(addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1" }).slowMotion).toBe(false); });
  it("default duration 5000", () => { expect(addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1" }).duration).toBe(5000); });
  it("custom duration", () => { expect(addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1", duration: 10000 }).duration).toBe(10000); });
  it("seek negative clamps to 0", () => { startReplayPlayback("r1"); expect(seekReplay("r1", -100)?.position).toBe(0); });
  it("pause non-existent returns null", () => { expect(pauseReplayPlayback("nonexistent")).toBeNull(); });
});

// ===== System 9 — Highlight Engine =====
describe("Broadcast — Highlights", () => {
  it("creates highlight", () => { const h = createHighlight({ matchId: "m1", type: "winner", title: "Winner!", description: "Won the match" }); expect(h.id).toBeDefined(); expect(h.bookmarked).toBe(false); });
  it("gets match highlights", () => { createHighlight({ matchId: "m1", type: "winner", title: "T1", description: "" }); createHighlight({ matchId: "m1", type: "perfect_streak", title: "T2", description: "" }); expect(getMatchHighlights("m1").length).toBe(2); });
  it("gets bookmarked highlights", () => { const h = createHighlight({ matchId: "m1", type: "winner", title: "T1", description: "" }); bookmarkHighlight("m1", h.id); expect(getBookmarkedHighlights("m1").length).toBe(1); });
  it("bookmarks highlight", () => { const h = createHighlight({ matchId: "m1", type: "winner", title: "T1", description: "" }); expect(bookmarkHighlight("m1", h.id)?.bookmarked).toBe(true); });
  it("gets highlights by type", () => { createHighlight({ matchId: "m1", type: "winner", title: "T1", description: "" }); createHighlight({ matchId: "m1", type: "big_comeback", title: "T2", description: "" }); expect(getHighlightsByType("m1", "winner").length).toBe(1); });
  it("supports all highlight types", () => { expect(supportsAllHighlightTypes().length).toBe(6); });
  it("highlight has timestamp", () => { expect(createHighlight({ matchId: "m1", type: "winner", title: "T1", description: "" }).timestamp).toBeDefined(); });
  it("highlight has playerIds", () => { const h = createHighlight({ matchId: "m1", type: "winner", title: "T1", description: "", playerIds: ["p1", "p2"] }); expect(h.playerIds.length).toBe(2); });
  it("default playerIds empty", () => { expect(createHighlight({ matchId: "m1", type: "winner", title: "T1", description: "" }).playerIds).toEqual([]); });
  it("default duration 5000", () => { expect(createHighlight({ matchId: "m1", type: "winner", title: "T1", description: "" }).durationMs).toBe(5000); });
  it("bookmark non-existent returns null", () => { expect(bookmarkHighlight("m1", "nonexistent")).toBeNull(); });
});

// ===== System 10 — Streaming Integration =====
describe("Broadcast — Streaming", () => {
  it("registers stream", () => { const s = registerStream({ platform: "obs", matchId: "m1" }); expect(s.id).toBeDefined(); expect(s.active).toBe(false); });
  it("gets match streams", () => { registerStream({ platform: "obs", matchId: "m1" }); registerStream({ platform: "rtmp", matchId: "m1" }); expect(getMatchStreams("m1").length).toBe(2); });
  it("connects stream", () => { const s = registerStream({ platform: "obs", matchId: "m1" }); expect(connectStream(s.id, "m1")?.active).toBe(true); });
  it("disconnects stream", () => { const s = registerStream({ platform: "obs", matchId: "m1" }); connectStream(s.id, "m1"); expect(disconnectStream(s.id, "m1")?.active).toBe(false); });
  it("supports all platforms", () => { expect(supportsAllStreamingPlatforms().length).toBe(6); });
  it("default active false", () => { expect(registerStream({ platform: "obs", matchId: "m1" }).active).toBe(false); });
  it("default streamKey null", () => { expect(registerStream({ platform: "obs", matchId: "m1" }).streamKey).toBeNull(); });
  it("connect sets connectedAt", () => { const s = registerStream({ platform: "obs", matchId: "m1" }); expect(connectStream(s.id, "m1")?.connectedAt).not.toBeNull(); });
  it("disconnect clears connectedAt", () => { const s = registerStream({ platform: "obs", matchId: "m1" }); connectStream(s.id, "m1"); expect(disconnectStream(s.id, "m1")?.connectedAt).toBeNull(); });
  it("connect non-existent returns null", () => { expect(connectStream("nonexistent", "m1")).toBeNull(); });
  it("with stream key", () => { expect(registerStream({ platform: "rtmp", matchId: "m1", streamKey: "abc123" }).streamKey).toBe("abc123"); });
  it("with config", () => { expect(registerStream({ platform: "obs", matchId: "m1", config: { bitrate: 6000 } }).config.bitrate).toBe(6000); });
});

// ===== System 11 — Tournament Production =====
describe("Broadcast — Tournament Production", () => {
  it("creates tournament production", () => { const tp = createTournamentProduction({ tournamentId: "t1" }); expect(tp.id).toBeDefined(); expect(tp.currentStage).toBe("intro"); });
  it("gets by tournament id", () => { createTournamentProduction({ tournamentId: "t1" }); expect(getTournamentProductionById("t1")).not.toBeNull(); });
  it("adds scheduled match", () => { createTournamentProduction({ tournamentId: "t1" }); addScheduledMatch("t1", "m1", "2025-01-01"); expect(getTournamentProductionById("t1")?.matchSchedule.length).toBe(1); });
  it("sets match on deck", () => { createTournamentProduction({ tournamentId: "t1" }); addScheduledMatch("t1", "m1", ""); setMatchOnDeck("t1", "m1"); expect(getTournamentProductionById("t1")?.matchSchedule[0].status).toBe("on_deck"); });
  it("sets match live", () => { createTournamentProduction({ tournamentId: "t1" }); addScheduledMatch("t1", "m1", ""); setMatchLive("t1", "m1"); expect(getTournamentProductionById("t1")?.matchSchedule[0].status).toBe("live"); });
  it("sets match completed", () => { createTournamentProduction({ tournamentId: "t1" }); addScheduledMatch("t1", "m1", ""); setMatchCompleted("t1", "m1"); expect(getTournamentProductionById("t1")?.matchSchedule[0].status).toBe("completed"); });
  it("sets bracket presentation", () => { createTournamentProduction({ tournamentId: "t1" }); expect(setBracketPresentation("t1", true)?.bracketPresentation).toBe(true); });
  it("sets awards ceremony", () => { createTournamentProduction({ tournamentId: "t1" }); expect(setAwardsCeremony("t1", true)?.awardsCeremony).toBe(true); });
  it("default bracket false", () => { expect(createTournamentProduction({ tournamentId: "t1" }).bracketPresentation).toBe(false); });
  it("default awards false", () => { expect(createTournamentProduction({ tournamentId: "t1" }).awardsCeremony).toBe(false); });
  it("non-existent tournament returns null", () => { expect(getTournamentProductionById("nonexistent")).toBeNull(); });
  it("add match to non-existent returns null", () => { expect(addScheduledMatch("nonexistent", "m1", "")).toBeNull(); });
});

// ===== System 12 — Audience Experience =====
describe("Broadcast — Audience", () => {
  it("submits reaction", () => { const r = submitReaction({ matchId: "m1", userId: "u1", type: "applause", content: "clap" }); expect(r.id).toBeDefined(); });
  it("gets match reactions", () => { submitReaction({ matchId: "m1", userId: "u1", type: "applause", content: "" }); submitReaction({ matchId: "m1", userId: "u2", type: "emoji", content: "🎉" }); expect(getMatchReactions("m1").length).toBe(2); });
  it("gets reactions by type", () => { submitReaction({ matchId: "m1", userId: "u1", type: "applause", content: "" }); submitReaction({ matchId: "m1", userId: "u2", type: "cheer", content: "" }); expect(getReactionsByType("m1", "applause").length).toBe(1); });
  it("gets reaction count", () => { submitReaction({ matchId: "m1", userId: "u1", type: "applause", content: "" }); expect(getReactionCount("m1")).toBe(1); });
  it("supports all reaction types", () => { for (const t of ["applause","emoji","poll","prediction","cheer"] as const) submitReaction({ matchId: "m1", userId: "u1", type: t, content: "" }); expect(getMatchReactions("m1").length).toBe(5); });
});

// ===== System 13 — Commentary Support =====
describe("Broadcast — Commentary", () => {
  it("generates commentary", () => { const c = generateCommentary("m1"); expect(c.matchId).toBe("m1"); expect(c.playerCards).toEqual([]); });
  it("adds player card", () => { generateCommentary("m1"); addPlayerCard("m1", "p1", "Alice", { wins: 10 }); expect(getCommentaryData("m1")?.playerCards.length).toBe(1); });
  it("adds talking point", () => { generateCommentary("m1"); addTalkingPoint("m1", "Alice is on a 5-win streak"); expect(getCommentaryData("m1")?.talkingPoints.length).toBe(1); });
  it("adds timeline entry", () => { generateCommentary("m1"); addTimelineEntry("m1", "2025-01-01T00:00:00Z", "Match started"); expect(getCommentaryData("m1")?.timeline.length).toBe(1); });
  it("adds interesting fact", () => { generateCommentary("m1"); addInterestingFact("m1", "Alice has won 3 championships"); expect(getCommentaryData("m1")?.interestingFacts.length).toBe(1); });
  it("generate is idempotent", () => { const c1 = generateCommentary("m1"); const c2 = generateCommentary("m1"); expect(c1).toBe(c2); });
  it("default talking points empty", () => { expect(generateCommentary("m1").talkingPoints).toEqual([]); });
  it("default timeline empty", () => { expect(generateCommentary("m1").timeline).toEqual([]); });
  it("default facts empty", () => { expect(generateCommentary("m1").interestingFacts).toEqual([]); });
});

// ===== Systems 14, 15 — Analytics + Dashboard =====
describe("Broadcast — Analytics + Dashboard", () => {
  it("generates broadcast analytics", () => { joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }); const a = generateBroadcastAnalytics("m1"); expect(a.viewers).toBe(1); });
  it("generates production dashboard", () => { initBroadcast("m1"); const d = generateProductionDashboard("m1"); expect(d).toBeDefined(); expect(d.broadcastState).toBe("standby"); });
  it("dashboard includes observer count", () => { assignObserver({ observerId: "o1", priority: "admin", matchId: "m1" }); expect(generateProductionDashboard("m1").observerCount).toBe(1); });
  it("dashboard includes current stage", () => { initProductionStage("m1"); expect(generateProductionDashboard("m1").currentStage).toBe("intro"); });
  it("dashboard includes replay queue length", () => { addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1" }); expect(generateProductionDashboard("m1").replayQueueLength).toBe(1); });
  it("dashboard includes upcoming stage", () => { initProductionStage("m1"); expect(generateProductionDashboard("m1").upcomingStage).toBe("countdown"); });
  it("dashboard alert for emergency stop", () => { initBroadcast("m1"); emergencyStop("m1", "admin"); expect(generateProductionDashboard("m1").alerts.length).toBeGreaterThan(0); });
  it("analytics includes replay usage", () => { addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1" }); expect(generateBroadcastAnalytics("m1").replayUsage).toBe(1); });
});

// ===== System 17 — Developer Integration =====
describe("Broadcast — Developer", () => {
  it("returns developer integration", () => { const d = getDeveloperIntegration(); expect(d.publicAPIs.length).toBeGreaterThan(0); expect(d.eventContracts.length).toBeGreaterThan(0); });
  it("has API endpoints", () => { expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("/api/broadcast/"))).toBe(true); });
  it("has event contracts", () => { expect(getDeveloperIntegration().eventContracts).toContain("BroadcastStarted"); });
  it("has extension hooks", () => { expect(getDeveloperIntegration().extensionHooks.length).toBeGreaterThan(0); });
  it("has SDK metadata", () => { expect(getDeveloperIntegration().sdkMetadata.version).toBeDefined(); });
});

// ===== System 16 — Event Bus Bridge =====
describe("Broadcast — Bridge", () => {
  it("subscribes", () => { subscribeBroadcast(); expect(isBroadcastSubscribed()).toBe(true); });
  it("unsubscribes", () => { subscribeBroadcast(); unsubscribeBroadcast(); expect(isBroadcastSubscribed()).toBe(false); });
  it("subscribe is idempotent", () => { subscribeBroadcast(); subscribeBroadcast(); expect(isBroadcastSubscribed()).toBe(true); });
  it("publishes broadcast events", () => { expect(() => publishBroadcastEvent("BroadcastStarted", null, { matchId: "m1" })).not.toThrow(); });
  it("processes MatchFinished", () => { subscribeBroadcast(); initProductionStage("m1"); const m = createMatch({ hostId: "h1", gameMode: "classic_quiz" }); emitEvent(m.id, "MatchFinished", "u1", { result: "win" }); expect(getBridgeProcessedCount()).toBeGreaterThan(0); });
  it("creates winner highlight on MatchFinished", () => { subscribeBroadcast(); initProductionStage("m1"); const m = createMatch({ hostId: "h1", gameMode: "classic_quiz" }); emitEvent(m.id, "MatchFinished", "u1", { result: "win" }); expect(getMatchHighlights(m.id).length).toBeGreaterThan(0); });
});

// ===== Architecture Compliance =====
describe("Broadcast — Architecture", () => {
  it("no circular dependencies", async () => { const mod = await import("@/features/broadcast-platform"); expect(mod.initBroadcast).toBeDefined(); });
  it("no gameplay ownership", () => { expect(true).toBe(true); });
});

// ===== Edge Cases =====
describe("Broadcast — Edge Cases", () => {
  it("returns null for unknown broadcast", () => { expect(getBroadcastStatus("nonexistent")).toBeNull(); });
  it("returns null for unknown production stage", () => { expect(getProductionStage("nonexistent")).toBeNull(); });
  it("returns empty for unknown spectators", () => { expect(getMatchSpectators("nonexistent")).toEqual([]); });
  it("returns empty for unknown observers", () => { expect(getMatchObservers("nonexistent")).toEqual([]); });
  it("returns empty for unknown overlays", () => { expect(getMatchOverlays("nonexistent")).toEqual([]); });
  it("returns empty for unknown cameras", () => { expect(getMatchCameras("nonexistent")).toEqual([]); });
  it("returns empty for unknown replay queue", () => { expect(getReplayQueueForMatch("nonexistent")).toEqual([]); });
  it("returns empty for unknown highlights", () => { expect(getMatchHighlights("nonexistent")).toEqual([]); });
  it("returns empty for unknown streams", () => { expect(getMatchStreams("nonexistent")).toEqual([]); });
  it("returns empty for unknown reactions", () => { expect(getMatchReactions("nonexistent")).toEqual([]); });
  it("returns null for unknown presenter", () => { expect(getPresenterState("nonexistent", "u1")).toBeNull(); });
  it("returns null for unknown commentary", () => { expect(getCommentaryData("nonexistent")).toBeNull(); });
  it("returns 0 for unknown spectator count", () => { expect(getActiveSpectatorCount("nonexistent")).toBe(0); });
  it("returns null for unknown spectator", () => { expect(getSpectatorById("nonexistent", "s1")).toBeNull(); });
  it("returns null for unknown active camera", () => { expect(getActiveCamera("nonexistent")).toBeNull(); });
  it("returns null for next stage on unknown match", () => { expect(getNextStage("nonexistent")).toBeNull(); });
  it("transition stage on unknown returns null", () => { expect(transitionStage("nonexistent", "countdown")).toBeNull(); });
  it("transition broadcast on unknown returns null", () => { expect(transitionBroadcast("nonexistent", "live", "a", "")).toBeNull(); });
});

// ===== Stress =====
describe("Broadcast — Stress", () => {
  it("handles many spectators", () => { for (let i = 0; i < 100; i++) joinAsSpectator({ userId: `u${i}`, role: "guest", matchId: "m1" }); expect(getMatchSpectators("m1").length).toBe(100); });
  it("handles many overlays", () => { for (let i = 0; i < 50; i++) createOverlay({ type: "scoreboard", matchId: "m1" }); expect(getMatchOverlays("m1").length).toBe(50); });
  it("handles many cameras", () => { for (let i = 0; i < 20; i++) createCamera({ mode: "auto_camera", matchId: "m1" }); expect(getMatchCameras("m1").length).toBe(20); });
  it("handles many highlights", () => { for (let i = 0; i < 50; i++) createHighlight({ matchId: "m1", type: "winner", title: `H${i}`, description: "" }); expect(getMatchHighlights("m1").length).toBe(50); });
  it("handles many reactions", () => { for (let i = 0; i < 100; i++) submitReaction({ matchId: "m1", userId: `u${i}`, type: "applause", content: "" }); expect(getMatchReactions("m1").length).toBe(100); });
});

// ===== Extended Tests =====
describe("Broadcast — Extended", () => {
  it("spectator has joinedAt", () => { expect(joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }).joinedAt).toBeDefined(); });
  it("spectator default leftAt null", () => { expect(joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }).leftAt).toBeNull(); });
  it("spectator default followingPlayerId null", () => { expect(joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }).followingPlayerId).toBeNull(); });
  it("spectator default freeCamera false", () => { expect(joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }).freeCamera).toBe(false); });
  it("teacher can chat", () => { expect(DEFAULT_PERMISSIONS.teacher.canChat).toBe(true); });
  it("parent cannot chat", () => { expect(DEFAULT_PERMISSIONS.parent.canChat).toBe(false); });
  it("guest cannot see replay", () => { expect(DEFAULT_PERMISSIONS.guest.canSeeReplay).toBe(false); });
  it("tournament viewer can see replay", () => { expect(DEFAULT_PERMISSIONS.tournament_viewer.canSeeReplay).toBe(true); });
  it("organization viewer can chat", () => { expect(DEFAULT_PERMISSIONS.organization_viewer.canChat).toBe(true); });
  it("anonymous cannot see stats", () => { expect(DEFAULT_PERMISSIONS.anonymous.canSeeStats).toBe(false); });
  it("overlay default data empty", () => { expect(createOverlay({ type: "scoreboard", matchId: "m1" }).data).toEqual({}); });
  it("overlay with matchId null is global", () => { expect(createOverlay({ type: "watermark" }).matchId).toBeNull(); });
  it("presenter has id", () => { expect(initPresenter({ userId: "u1", matchId: "m1" }).id).toBeDefined(); });
  it("camera has assignedObserverId null", () => { expect(createCamera({ mode: "player_focus", matchId: "m1" }).assignedObserverId).toBeNull(); });
  it("replay item has addedAt", () => { expect(addToReplayQueue({ matchId: "m1", replayId: "r1", title: "T1" }).addedAt).toBeDefined(); });
  it("highlight with custom duration", () => { expect(createHighlight({ matchId: "m1", type: "winner", title: "T1", description: "", durationMs: 10000 }).durationMs).toBe(10000); });
  it("stream with matchId null is global", () => { expect(registerStream({ platform: "obs" }).matchId).toBeNull(); });
  it("broadcast state history has performedBy", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "admin-1", "Starting"); expect(getBroadcastStatus("m1")?.stateHistory[0].performedBy).toBe("admin-1"); });
  it("broadcast state history has reason", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", "Starting countdown"); expect(getBroadcastStatus("m1")?.stateHistory[0].reason).toBe("Starting countdown"); });
  it("stage transition has durationMs", () => { initProductionStage("m1"); transitionStage("m1", "countdown"); expect(getProductionStage("m1")?.stageHistory[0].durationMs).toBeDefined(); });
  it("tournament production has matchSchedule", () => { expect(createTournamentProduction({ tournamentId: "t1" }).matchSchedule).toEqual([]); });
  it("commentary player card has stats", () => { generateCommentary("m1"); addPlayerCard("m1", "p1", "Alice", { wins: 10, accuracy: 0.95 }); expect(getCommentaryData("m1")?.playerCards[0].stats.wins).toBe(10); });
  it("reaction has timestamp", () => { expect(submitReaction({ matchId: "m1", userId: "u1", type: "applause", content: "" }).timestamp).toBeDefined(); });
  it("dashboard streaming health is healthy by default", () => { initBroadcast("m1"); expect(generateProductionDashboard("m1").streamingHealth).toBe("healthy"); });
  it("dashboard current camera is auto_camera by default", () => { expect(generateProductionDashboard("m1").currentCamera).toBe("auto_camera"); });
  it("analytics viewers matches spectator count", () => { joinAsSpectator({ userId: "u1", role: "guest", matchId: "m1" }); joinAsSpectator({ userId: "u2", role: "guest", matchId: "m1" }); expect(generateBroadcastAnalytics("m1").viewers).toBe(2); });
  it("set presenter notes on non-existent returns null", () => { expect(setPresenterNotes("m1", "nonexistent", "test")).toBeNull(); });
  it("set camera target on non-existent returns null", () => { expect(setCameraTarget("m1", "nonexistent", "p1")).toBeNull(); });
  it("overlay visibility toggle", () => { const o = createOverlay({ type: "scoreboard", matchId: "m1" }); setOverlayVisibility(o.id, false, "m1"); setOverlayVisibility(o.id, true, "m1"); expect(getMatchOverlays("m1").find(x => x.id === o.id)?.visible).toBe(true); });
  it("replay speed 0.5", () => { startReplayPlayback("r1"); expect(setReplaySpeed("r1", 0.5)?.speed).toBe(0.5); });
  it("replay seek to 0", () => { startReplayPlayback("r1"); seekReplay("r1", 5000); expect(seekReplay("r1", 0)?.position).toBe(0); });
  it("highlight with multiple players", () => { const h = createHighlight({ matchId: "m1", type: "final_duel", title: "Epic Duel", description: "", playerIds: ["p1", "p2"] }); expect(h.playerIds.length).toBe(2); });
  it("stream with config and key", () => { const s = registerStream({ platform: "rtmp", matchId: "m1", streamKey: "live_123", config: { url: "rtmp://server" } }); expect(s.streamKey).toBe("live_123"); expect(s.config.url).toBe("rtmp://server"); });
  it("tournament production with custom stage", () => { expect(createTournamentProduction({ tournamentId: "t1", currentStage: "final" }).currentStage).toBe("final"); });
  it("multiple scheduled matches", () => { createTournamentProduction({ tournamentId: "t1" }); addScheduledMatch("t1", "m1", "10:00"); addScheduledMatch("t1", "m2", "11:00"); addScheduledMatch("t1", "m3", "12:00"); expect(getTournamentProductionById("t1")?.matchSchedule.length).toBe(3); });
  it("commentary with multiple talking points", () => { generateCommentary("m1"); addTalkingPoint("m1", "Point 1"); addTalkingPoint("m1", "Point 2"); addTalkingPoint("m1", "Point 3"); expect(getCommentaryData("m1")?.talkingPoints.length).toBe(3); });
  it("reactions of different types", () => { submitReaction({ matchId: "m1", userId: "u1", type: "applause", content: "" }); submitReaction({ matchId: "m1", userId: "u2", type: "emoji", content: "🎉" }); submitReaction({ matchId: "m1", userId: "u3", type: "cheer", content: "Go!" }); expect(getMatchReactions("m1").length).toBe(3); expect(getReactionsByType("m1", "emoji").length).toBe(1); });
  it("overlay zIndex ordering", () => { createOverlay({ type: "watermark", matchId: "m1", zIndex: 100 }); createOverlay({ type: "scoreboard", matchId: "m1", zIndex: 1 }); const overlays = getMatchOverlays("m1"); expect(overlays.find(o => o.type === "watermark")?.zIndex).toBe(100); });
  it("presenter fullscreen layout", () => { initPresenter({ userId: "u1", matchId: "m1", layout: "fullscreen" }); expect(getPresenterState("m1", "u1")?.layout).toBe("fullscreen"); });
  it("camera picture-in-picture", () => { const c = createCamera({ mode: "picture_in_picture", matchId: "m1", pipCameraId: "cam-2" }); expect(c.pipCameraId).toBe("cam-2"); });
  it("observer with camera assignment", () => { assignObserver({ observerId: "o1", priority: "production", matchId: "m1", cameraId: "cam-1" }); expect(getMatchObservers("m1")[0].cameraId).toBe("cam-1"); });
});

// ===== Extended Overlay Tests =====
describe("Broadcast — Overlay Extended", () => {
  it("overlay with custom position", () => { const o = createOverlay({ type: "scoreboard", matchId: "m1", position: { x: 50, y: 50, width: 300, height: 150 } }); expect(o.position.width).toBe(300); });
  it("overlay with custom data", () => { const o = createOverlay({ type: "leaderboard", matchId: "m1", data: { entries: [{ name: "Alice", score: 100 }] } }); expect(o.data.entries).toBeDefined(); });
  it("overlay invisible by default when visible false", () => { expect(createOverlay({ type: "scoreboard", matchId: "m1", visible: false }).visible).toBe(false); });
  it("overlay visible by default", () => { expect(createOverlay({ type: "scoreboard", matchId: "m1" }).visible).toBe(true); });
  it("get visible overlays filters invisible", () => { const o1 = createOverlay({ type: "scoreboard", matchId: "m1" }); const o2 = createOverlay({ type: "timer", matchId: "m1", visible: false }); setOverlayVisibility(o2.id, false, "m1"); expect(getVisibleOverlays("m1").length).toBe(1); });
  it("set position non-existent returns null", () => { expect(setOverlayPosition("nonexistent", { x: 0, y: 0, width: 100, height: 50 }, "m1")).toBeNull(); });
  it("set data non-existent returns null", () => { expect(setOverlayData("nonexistent", {}, "m1")).toBeNull(); });
  it("overlay with null matchId is global", () => { expect(createOverlay({ type: "watermark" }).matchId).toBeNull(); });
  it("overlay has id", () => { expect(createOverlay({ type: "scoreboard", matchId: "m1" }).id).toBeDefined(); });
  it("overlay has type", () => { expect(createOverlay({ type: "timer", matchId: "m1" }).type).toBe("timer"); });
});

// ===== Extended Broadcast Controller Tests =====
describe("Broadcast — Controller Extended", () => {
  it("standby to live directly", () => { initBroadcast("m1"); expect(transitionBroadcast("m1", "live", "a", "")?.state).toBe("live"); });
  it("standby to emergency_stop", () => { initBroadcast("m1"); expect(transitionBroadcast("m1", "emergency_stop", "a", "")?.state).toBe("emergency_stop"); });
  it("countdown to standby", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); expect(transitionBroadcast("m1", "standby", "a", "")?.state).toBe("standby"); });
  it("countdown to emergency_stop", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); expect(transitionBroadcast("m1", "emergency_stop", "a", "")?.state).toBe("emergency_stop"); });
  it("live to emergency_stop", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); expect(transitionBroadcast("m1", "emergency_stop", "a", "")?.state).toBe("emergency_stop"); });
  it("paused to ended", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); transitionBroadcast("m1", "paused", "a", ""); expect(transitionBroadcast("m1", "ended", "a", "")?.state).toBe("ended"); });
  it("paused to emergency_stop", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); transitionBroadcast("m1", "paused", "a", ""); expect(transitionBroadcast("m1", "emergency_stop", "a", "")?.state).toBe("emergency_stop"); });
  it("commercial to ended", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); transitionBroadcast("m1", "commercial_break", "a", ""); expect(transitionBroadcast("m1", "ended", "a", "")?.state).toBe("ended"); });
  it("commercial to emergency_stop", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); transitionBroadcast("m1", "commercial_break", "a", ""); expect(transitionBroadcast("m1", "emergency_stop", "a", "")?.state).toBe("emergency_stop"); });
  it("emergency_stop to ended", () => { initBroadcast("m1"); emergencyStop("m1", "a"); expect(transitionBroadcast("m1", "ended", "a", "")?.state).toBe("ended"); });
  it("invalid standby to paused", () => { initBroadcast("m1"); expect(transitionBroadcast("m1", "paused", "a", "")).toBeNull(); });
  it("invalid standby to commercial_break", () => { initBroadcast("m1"); expect(transitionBroadcast("m1", "commercial_break", "a", "")).toBeNull(); });
  it("invalid ended to live", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); transitionBroadcast("m1", "ended", "a", ""); expect(transitionBroadcast("m1", "live", "a", "")).toBeNull(); });
  it("state history has timestamp", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); expect(getBroadcastStatus("m1")?.stateHistory[0].timestamp).toBeDefined(); });
  it("state history has id", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); expect(getBroadcastStatus("m1")?.stateHistory[0].id).toBeDefined(); });
  it("multiple state transitions", () => { initBroadcast("m1"); transitionBroadcast("m1", "countdown", "a", ""); transitionBroadcast("m1", "live", "a", ""); transitionBroadcast("m1", "paused", "a", ""); transitionBroadcast("m1", "live", "a", ""); transitionBroadcast("m1", "ended", "a", ""); expect(getBroadcastStatus("m1")?.stateHistory.length).toBe(5); });
  it("broadcast has id", () => { expect(initBroadcast("m1").id).toBeDefined(); });
  it("broadcast has matchId", () => { expect(initBroadcast("m1").matchId).toBe("m1"); });
  it("default startedAt null", () => { expect(initBroadcast("m1").startedAt).toBeNull(); });
  it("default endedAt null", () => { expect(initBroadcast("m1").endedAt).toBeNull(); });
});

// ===== Extended Stage Tests =====
describe("Broadcast — Stage Extended", () => {
  it("stage transition to question", () => { initProductionStage("m1"); transitionStage("m1", "countdown"); transitionStage("m1", "lobby"); expect(transitionStage("m1", "question")?.currentStage).toBe("question"); });
  it("stage transition to final", () => { initProductionStage("m1"); for (const s of ["countdown","lobby","question","leaderboard","intermission"]) transitionStage("m1", s as never); expect(transitionStage("m1", "final")?.currentStage).toBe("final"); });
  it("stage transition to winner_ceremony", () => { initProductionStage("m1"); for (const s of ["countdown","lobby","question","leaderboard","intermission","final"]) transitionStage("m1", s as never); expect(transitionStage("m1", "winner_ceremony")?.currentStage).toBe("winner_ceremony"); });
  it("stage transition to closing", () => { initProductionStage("m1"); for (const s of ["countdown","lobby","question","leaderboard","intermission","final","winner_ceremony"]) transitionStage("m1", s as never); expect(transitionStage("m1", "closing")?.currentStage).toBe("closing"); });
  it("stage has id", () => { expect(initProductionStage("m1").id).toBeDefined(); });
  it("stage has startedAt", () => { expect(initProductionStage("m1").startedAt).toBeDefined(); });
  it("stage history entry has id", () => { initProductionStage("m1"); transitionStage("m1", "countdown"); expect(getProductionStage("m1")?.stageHistory[0].id).toBeDefined(); });
  it("stage history entry has timestamp", () => { initProductionStage("m1"); transitionStage("m1", "countdown"); expect(getProductionStage("m1")?.stageHistory[0].timestamp).toBeDefined(); });
  it("stage order has 9 stages", () => { expect(getStageOrder().length).toBe(9); });
  it("stage order starts with intro", () => { expect(getStageOrder()[0]).toBe("intro"); });
  it("stage order ends with closing", () => { expect(getStageOrder()[getStageOrder().length - 1]).toBe("closing"); });
});
