/** Systems 4, 5, 6 — Event Participation, Objective Engine, Reward Mapping. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeParticipation, getParticipations, getParticipationForUser,
  storeObjective, getObjective, getAllObjectives,
  storeRewardMapping, getRewardMapping, getAllRewardMappings,
  getEvent, storeEvent,
} from "./repository";
import type {
  EventParticipation, ParticipationStatus,
  ObjectiveDefinition, ObjectiveType,
  RewardMapping, RewardMappingKind,
} from "./types";

const log = getLogger("live-events.participation");

// ===== System 4 — Event Participation =====
export function enrollParticipant(eventId: string, userId: string): EventParticipation | null {
  const event = getEvent(eventId);
  if (!event || event.status !== "running") return null;
  if (event.enrolledCount >= event.maxParticipants) return null;
  if (getParticipationForUser(eventId, userId)) return null;
  const now = new Date().toISOString();
  const participation: EventParticipation = {
    id: randomUUID(), eventId, userId, status: "enrolled",
    enrolledAt: now, completedAt: null, abandonedAt: null,
    objectivesProgress: {}, metadata: {},
  };
  storeParticipation(participation);
  event.enrolledCount++; event.activeCount++; event.updatedAt = now;
  storeEvent(event);
  log.info("participation.enrolled", { eventId, userId });
  return participation;
}

export function activateParticipant(eventId: string, userId: string): EventParticipation | null {
  const p = getParticipationForUser(eventId, userId);
  if (!p || p.status !== "enrolled") return null;
  p.status = "active";
  return p;
}

export function completeParticipant(eventId: string, userId: string): EventParticipation | null {
  const p = getParticipationForUser(eventId, userId);
  if (!p || (p.status !== "enrolled" && p.status !== "active")) return null;
  p.status = "completed";
  p.completedAt = new Date().toISOString();
  const event = getEvent(eventId);
  if (event) { event.completedCount++; event.activeCount = Math.max(0, event.activeCount - 1); event.updatedAt = p.completedAt; storeEvent(event); }
  return p;
}

export function abandonParticipant(eventId: string, userId: string): EventParticipation | null {
  const p = getParticipationForUser(eventId, userId);
  if (!p || (p.status !== "enrolled" && p.status !== "active")) return null;
  p.status = "abandoned";
  p.abandonedAt = new Date().toISOString();
  const event = getEvent(eventId);
  if (event) { event.abandonedCount++; event.activeCount = Math.max(0, event.activeCount - 1); event.updatedAt = p.abandonedAt; storeEvent(event); }
  return p;
}

export function expireParticipant(eventId: string, userId: string): EventParticipation | null {
  const p = getParticipationForUser(eventId, userId);
  if (!p || p.status === "completed" || p.status === "abandoned") return null;
  p.status = "expired";
  const event = getEvent(eventId);
  if (event) { event.expiredCount++; event.activeCount = Math.max(0, event.activeCount - 1); event.updatedAt = new Date().toISOString(); storeEvent(event); }
  return p;
}

export function updateParticipationObjective(eventId: string, userId: string, objectiveId: string, progress: number): EventParticipation | null {
  const p = getParticipationForUser(eventId, userId);
  if (!p) return null;
  p.objectivesProgress[objectiveId] = Math.max(p.objectivesProgress[objectiveId] ?? 0, progress);
  return p;
}

export function getEventParticipations(eventId: string): EventParticipation[] { return getParticipations(eventId); }
export function getUserParticipation(eventId: string, userId: string): EventParticipation | null { return getParticipationForUser(eventId, userId); }

// ===== System 5 — Objective Engine =====
export function createObjective(input: {
  name: string; description: string; type: ObjectiveType;
  target: number; metric: string; rewardMappingId?: string | null;
  campaignId?: string | null; eventId?: string | null; active?: boolean;
}): ObjectiveDefinition {
  const objective: ObjectiveDefinition = {
    id: randomUUID(), name: input.name, description: input.description,
    type: input.type, target: input.target, metric: input.metric,
    rewardMappingId: input.rewardMappingId ?? null, campaignId: input.campaignId ?? null,
    eventId: input.eventId ?? null, active: input.active ?? true,
  };
  storeObjective(objective);
  log.info("objective.created", { objectiveId: objective.id, type: input.type });
  return objective;
}

export function getObjectiveById(id: string): ObjectiveDefinition | null { return getObjective(id); }
export function listObjectives(eventId?: string): ObjectiveDefinition[] {
  const all = getAllObjectives();
  return eventId ? all.filter(o => o.eventId === eventId) : all;
}

export function setObjectiveActive(id: string, active: boolean): ObjectiveDefinition | null {
  const o = getObjective(id);
  if (!o) return null;
  o.active = active;
  return o;
}

export function checkObjectiveCompletion(objectiveId: string, currentValue: number): boolean {
  const o = getObjective(objectiveId);
  if (!o) return false;
  return currentValue >= o.target;
}

// ===== System 6 — Reward Mapping =====
export function createRewardMapping(input: {
  name: string; description: string; kind: RewardMappingKind;
  rewardRef: string; amount?: number; eventId?: string | null; objectiveId?: string | null;
  conditions?: Record<string, unknown>;
}): RewardMapping {
  const mapping: RewardMapping = {
    id: randomUUID(), name: input.name, description: input.description,
    kind: input.kind, rewardRef: input.rewardRef, amount: input.amount ?? 1,
    eventId: input.eventId ?? null, objectiveId: input.objectiveId ?? null,
    conditions: input.conditions ?? {},
  };
  storeRewardMapping(mapping);
  log.info("reward_mapping.created", { mappingId: mapping.id, kind: input.kind });
  return mapping;
}

export function getRewardMappingById(id: string): RewardMapping | null { return getRewardMapping(id); }
export function listRewardMappings(eventId?: string): RewardMapping[] {
  const all = getAllRewardMappings();
  return eventId ? all.filter(r => r.eventId === eventId) : all;
}

export function getRewardsForObjective(objectiveId: string): RewardMapping[] {
  return getAllRewardMappings().filter(r => r.objectiveId === objectiveId);
}
