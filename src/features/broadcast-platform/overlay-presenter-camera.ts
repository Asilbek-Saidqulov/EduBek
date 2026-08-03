/** Systems 5, 6, 7 — Overlay Engine + Presenter Mode + Camera System. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeOverlay, getOverlays, storePresenter, getPresenter, storeCamera, getCameras } from "./repository";
import type { Overlay, OverlayType, OverlayPosition, PresenterState, PresenterLayout, Camera, CameraMode } from "./types";

const log = getLogger("broadcast.overlay");

// ===== System 5 — Overlay Engine =====
export function createOverlay(input: { type: OverlayType; matchId?: string | null; position?: Partial<OverlayPosition>; data?: Record<string, unknown>; visible?: boolean; zIndex?: number }): Overlay {
  const overlay: Overlay = {
    id: randomUUID(), type: input.type, visible: input.visible ?? true,
    position: { x: input.position?.x ?? 0, y: input.position?.y ?? 0, width: input.position?.width ?? 100, height: input.position?.height ?? 50 },
    zIndex: input.zIndex ?? 1, data: input.data ?? {}, matchId: input.matchId ?? null,
  };
  storeOverlay(overlay);
  return overlay;
}

export function getMatchOverlays(matchId: string): Overlay[] { return getOverlays(matchId); }
export function setOverlayVisibility(overlayId: string, visible: boolean, matchId: string): Overlay | null {
  const list = getOverlays(matchId);
  const o = list.find(x => x.id === overlayId);
  if (!o) return null;
  o.visible = visible;
  storeOverlay(o);
  return o;
}
export function setOverlayPosition(overlayId: string, position: OverlayPosition, matchId: string): Overlay | null {
  const list = getOverlays(matchId);
  const o = list.find(x => x.id === overlayId);
  if (!o) return null;
  o.position = position;
  storeOverlay(o);
  return o;
}
export function setOverlayData(overlayId: string, data: Record<string, unknown>, matchId: string): Overlay | null {
  const list = getOverlays(matchId);
  const o = list.find(x => x.id === overlayId);
  if (!o) return null;
  o.data = data;
  storeOverlay(o);
  return o;
}
export function getVisibleOverlays(matchId: string): Overlay[] { return getOverlays(matchId).filter(o => o.visible); }
export function supportsAllOverlayTypes(): OverlayType[] { return ["scoreboard", "timer", "question", "leaderboard", "player_cards", "top_performers", "tournament_bracket", "sponsor_banner", "watermark", "event_banner"]; }

// ===== System 6 — Presenter Mode =====
export function initPresenter(input: { userId: string; matchId: string; layout?: PresenterLayout }): PresenterState {
  const existing = getPresenter(input.matchId, input.userId);
  if (existing) return existing;
  const ps: PresenterState = {
    id: randomUUID(), userId: input.userId, matchId: input.matchId,
    layout: input.layout ?? "teacher_presentation", notes: "", questionPreview: false, privateControls: true,
  };
  storePresenter(ps);
  return ps;
}

export function getPresenterState(matchId: string, userId: string): PresenterState | null { return getPresenter(matchId, userId); }
export function setPresenterLayout(matchId: string, userId: string, layout: PresenterLayout): PresenterState | null {
  const ps = getPresenter(matchId, userId);
  if (!ps) return null;
  ps.layout = layout;
  storePresenter(ps);
  return ps;
}
export function setPresenterNotes(matchId: string, userId: string, notes: string): PresenterState | null {
  const ps = getPresenter(matchId, userId);
  if (!ps) return null;
  ps.notes = notes;
  storePresenter(ps);
  return ps;
}
export function setQuestionPreview(matchId: string, userId: string, enabled: boolean): PresenterState | null {
  const ps = getPresenter(matchId, userId);
  if (!ps) return null;
  ps.questionPreview = enabled;
  storePresenter(ps);
  return ps;
}
export function setPrivateControls(matchId: string, userId: string, enabled: boolean): PresenterState | null {
  const ps = getPresenter(matchId, userId);
  if (!ps) return null;
  ps.privateControls = enabled;
  storePresenter(ps);
  return ps;
}
export function supportsAllPresenterLayouts(): PresenterLayout[] { return ["teacher_presentation", "fullscreen", "minimal", "confidence_monitor"]; }

// ===== System 7 — Camera System =====
export function createCamera(input: { mode: CameraMode; matchId: string; targetPlayerId?: string | null; pipCameraId?: string | null; active?: boolean }): Camera {
  const camera: Camera = {
    id: randomUUID(), mode: input.mode, targetPlayerId: input.targetPlayerId ?? null,
    pipCameraId: input.pipCameraId ?? null, matchId: input.matchId,
    active: input.active ?? false, assignedObserverId: null,
  };
  storeCamera(camera);
  return camera;
}

export function getMatchCameras(matchId: string): Camera[] { return getCameras(matchId); }
export function getActiveCamera(matchId: string): Camera | null { return getCameras(matchId).find(c => c.active) ?? null; }
export function setActiveCamera(matchId: string, cameraId: string): Camera | null {
  const list = getCameras(matchId);
  for (const c of list) c.active = c.id === cameraId;
  return list.find(c => c.id === cameraId) ?? null;
}
export function setCameraMode(matchId: string, cameraId: string, mode: CameraMode): Camera | null {
  const list = getCameras(matchId);
  const c = list.find(x => x.id === cameraId);
  if (!c) return null;
  c.mode = mode;
  storeCamera(c);
  return c;
}
export function setCameraTarget(matchId: string, cameraId: string, playerId: string): Camera | null {
  const list = getCameras(matchId);
  const c = list.find(x => x.id === cameraId);
  if (!c) return null;
  c.targetPlayerId = playerId;
  storeCamera(c);
  return c;
}
export function setCameraPiP(matchId: string, cameraId: string, pipCameraId: string | null): Camera | null {
  const list = getCameras(matchId);
  const c = list.find(x => x.id === cameraId);
  if (!c) return null;
  c.pipCameraId = pipCameraId;
  storeCamera(c);
  return c;
}
export function supportsAllCameraModes(): CameraMode[] { return ["player_focus", "winner_focus", "leaderboard_focus", "auto_camera", "teacher_camera", "free_camera", "picture_in_picture"]; }
