/** In-memory repository for Broadcast Platform. */
import type { Spectator, ObserverSlot, BroadcastController, ProductionStageState, Overlay, PresenterState, Camera, ReplayQueueItem, ReplayBroadcastState, Highlight, StreamIntegration, TournamentProduction, AudienceReaction, CommentaryData } from "./types";

const spectators = new Map<string, Spectator[]>();
const observerSlots = new Map<string, ObserverSlot[]>();
const broadcasts = new Map<string, BroadcastController>();
const stageStates = new Map<string, ProductionStageState>();
const overlays = new Map<string, Overlay[]>();
const presenterStates = new Map<string, PresenterState>();
const cameras = new Map<string, Camera[]>();
const replayQueues = new Map<string, ReplayQueueItem[]>();
const replayStates = new Map<string, ReplayBroadcastState>();
const highlights = new Map<string, Highlight[]>();
const streams = new Map<string, StreamIntegration[]>();
const tournamentProductions = new Map<string, TournamentProduction>();
const audienceReactions = new Map<string, AudienceReaction[]>();
const commentaryData = new Map<string, CommentaryData>();

export const storeSpectator = (s: Spectator) => { const l = spectators.get(s.matchId) ?? []; const idx = l.findIndex(x => x.id === s.id); if (idx >= 0) l[idx] = s; else l.push(s); spectators.set(s.matchId, l); };
export const getSpectators = (matchId: string) => spectators.get(matchId) ?? [];
export const storeObserver = (o: ObserverSlot) => { const l = observerSlots.get(o.matchId) ?? []; const idx = l.findIndex(x => x.id === o.id); if (idx >= 0) l[idx] = o; else l.push(o); observerSlots.set(o.matchId, l); };
export const getObservers = (matchId: string) => observerSlots.get(matchId) ?? [];
export const storeBroadcast = (b: BroadcastController) => broadcasts.set(b.matchId, b);
export const getBroadcast = (matchId: string) => broadcasts.get(matchId) ?? null;
export const storeStageState = (s: ProductionStageState) => stageStates.set(s.matchId, s);
export const getStageState = (matchId: string) => stageStates.get(matchId) ?? null;
export const storeOverlay = (o: Overlay) => { const key = o.matchId ?? "global"; const l = overlays.get(key) ?? []; const idx = l.findIndex(x => x.id === o.id); if (idx >= 0) l[idx] = o; else l.push(o); overlays.set(key, l); };
export const getOverlays = (matchId: string) => overlays.get(matchId) ?? [];
export const storePresenter = (p: PresenterState) => presenterStates.set(`${p.matchId}:${p.userId}`, p);
export const getPresenter = (matchId: string, userId: string) => presenterStates.get(`${matchId}:${userId}`) ?? null;
export const storeCamera = (c: Camera) => { const l = cameras.get(c.matchId) ?? []; const idx = l.findIndex(x => x.id === c.id); if (idx >= 0) l[idx] = c; else l.push(c); cameras.set(c.matchId, l); };
export const getCameras = (matchId: string) => cameras.get(matchId) ?? [];
export const storeReplayItem = (r: ReplayQueueItem) => { const l = replayQueues.get(r.matchId) ?? []; l.push(r); replayQueues.set(r.matchId, l); };
export const getReplayQueue = (matchId: string) => replayQueues.get(matchId) ?? [];
export const storeReplayState = (s: ReplayBroadcastState) => replayStates.set(s.currentItemId ?? "default", s);
export const getReplayState = (id: string) => replayStates.get(id) ?? null;
export const storeHighlight = (h: Highlight) => { const l = highlights.get(h.matchId) ?? []; l.push(h); highlights.set(h.matchId, l); };
export const getHighlights = (matchId: string) => highlights.get(matchId) ?? [];
export const storeStream = (s: StreamIntegration) => { const l = streams.get(s.matchId ?? "global") ?? []; l.push(s); streams.set(s.matchId ?? "global", l); };
export const getStreams = (matchId: string) => streams.get(matchId) ?? [];
export const storeTournamentProduction = (t: TournamentProduction) => tournamentProductions.set(t.tournamentId, t);
export const getTournamentProduction = (tournamentId: string) => tournamentProductions.get(tournamentId) ?? null;
export const storeReaction = (r: AudienceReaction) => { const l = audienceReactions.get(r.matchId) ?? []; l.push(r); audienceReactions.set(r.matchId, l); };
export const getReactions = (matchId: string) => audienceReactions.get(matchId) ?? [];
export const storeCommentary = (c: CommentaryData) => commentaryData.set(c.matchId, c);
export const getCommentary = (matchId: string) => commentaryData.get(matchId) ?? null;

export function _resetRepositoryForTesting() {
  spectators.clear(); observerSlots.clear(); broadcasts.clear(); stageStates.clear();
  overlays.clear(); presenterStates.clear(); cameras.clear(); replayQueues.clear();
  replayStates.clear(); highlights.clear(); streams.clear(); tournamentProductions.clear();
  audienceReactions.clear(); commentaryData.clear();
}
