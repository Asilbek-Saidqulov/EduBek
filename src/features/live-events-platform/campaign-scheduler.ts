/** Systems 1, 2, 3, 13 — Live Event Registry, Campaign Engine, Scheduler, Approval Workflow. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeEvent, getEvent, getAllEvents,
  storeCampaign, getCampaign, getAllCampaigns,
  storeScheduledEvent, getScheduledEvent, getAllScheduledEvents,
  storeApproval, getApproval, getAllApprovals,
} from "./repository";
import type {
  LiveEvent, LiveEventType, EventApprovalStatus,
  Campaign, CampaignStage, CampaignMilestone,
  ScheduledEvent, RecurrenceConfig, BlackoutPeriod,
  ApprovalWorkflow, ApprovalHistoryEntry,
} from "./types";

const log = getLogger("live-events.campaign");

// ===== System 1 — Live Event Registry =====
export function createEvent(input: {
  name: string; description: string; type: LiveEventType;
  startDate: string; endDate: string; timezone?: string;
  organizationId?: string | null; createdBy: string;
  visibility?: "public" | "organization" | "school" | "club" | "private";
  maxParticipants?: number; campaignId?: string | null; templateId?: string | null;
  blackoutPeriods?: BlackoutPeriod[]; recurrence?: RecurrenceConfig | null;
}): LiveEvent {
  const now = new Date().toISOString();
  const event: LiveEvent = {
    id: randomUUID(), name: input.name, description: input.description, type: input.type,
    status: "draft", startDate: input.startDate, endDate: input.endDate,
    timezone: input.timezone ?? "UTC", organizationId: input.organizationId ?? null,
    createdBy: input.createdBy, visibility: input.visibility ?? "public",
    maxParticipants: input.maxParticipants ?? 1000, enrolledCount: 0, activeCount: 0,
    completedCount: 0, abandonedCount: 0, expiredCount: 0,
    campaignId: input.campaignId ?? null, templateId: input.templateId ?? null,
    blackoutPeriods: input.blackoutPeriods ?? [], recurrence: input.recurrence ?? null,
    createdAt: now, updatedAt: now,
  };
  storeEvent(event);
  // Auto-create approval workflow
  const approval: ApprovalWorkflow = {
    id: randomUUID(), eventId: event.id, status: "draft", submittedBy: input.createdBy,
    reviewedBy: null, reviewNote: null, history: [], createdAt: now, updatedAt: now,
  };
  storeApproval(approval);
  log.info("event.created", { eventId: event.id, name: input.name, type: input.type });
  return event;
}

export function getEventById(id: string): LiveEvent | null { return getEvent(id); }
export function listEvents(type?: LiveEventType, status?: EventApprovalStatus): LiveEvent[] {
  let all = getAllEvents();
  if (type) all = all.filter(e => e.type === type);
  if (status) all = all.filter(e => e.status === status);
  return all;
}
export function updateEvent(id: string, updates: Partial<LiveEvent>): LiveEvent | null {
  const e = getEvent(id);
  if (!e) return null;
  Object.assign(e, updates, { updatedAt: new Date().toISOString() });
  storeEvent(e);
  return e;
}

// ===== System 2 — Campaign Engine =====
export function createCampaign(input: {
  name: string; description: string; startDate: string; endDate: string;
  timezone?: string; visibility?: "public" | "organization" | "private";
  createdBy: string; organizationId?: string | null;
}): Campaign {
  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: randomUUID(), name: input.name, description: input.description,
    stages: [], milestones: [], objectives: [],
    schedule: { startDate: input.startDate, endDate: input.endDate, timezone: input.timezone ?? "UTC" },
    visibility: input.visibility ?? "public", status: "draft",
    expirationDate: null, createdBy: input.createdBy, organizationId: input.organizationId ?? null,
    createdAt: now, updatedAt: now,
  };
  storeCampaign(campaign);
  log.info("campaign.created", { campaignId: campaign.id, name: input.name });
  return campaign;
}

export function getCampaignById(id: string): Campaign | null { return getCampaign(id); }
export function listCampaigns(): Campaign[] { return getAllCampaigns(); }

export function addCampaignStage(campaignId: string, stage: Omit<CampaignStage, "id" | "completed">): Campaign | null {
  const c = getCampaign(campaignId);
  if (!c) return null;
  const newStage: CampaignStage = { ...stage, id: randomUUID(), completed: false };
  c.stages.push(newStage);
  c.updatedAt = new Date().toISOString();
  storeCampaign(c);
  return c;
}

export function completeCampaignStage(campaignId: string, stageId: string): Campaign | null {
  const c = getCampaign(campaignId);
  if (!c) return null;
  const stage = c.stages.find(s => s.id === stageId);
  if (!stage) return null;
  stage.completed = true;
  c.updatedAt = new Date().toISOString();
  storeCampaign(c);
  return c;
}

export function addCampaignMilestone(campaignId: string, milestone: Omit<CampaignMilestone, "id" | "current" | "achieved" | "achievedAt">): Campaign | null {
  const c = getCampaign(campaignId);
  if (!c) return null;
  const m: CampaignMilestone = { ...milestone, id: randomUUID(), current: 0, achieved: false, achievedAt: null };
  c.milestones.push(m);
  c.updatedAt = new Date().toISOString();
  storeCampaign(c);
  return c;
}

export function updateMilestoneProgress(campaignId: string, milestoneId: string, current: number): Campaign | null {
  const c = getCampaign(campaignId);
  if (!c) return null;
  const m = c.milestones.find(ms => ms.id === milestoneId);
  if (!m) return null;
  m.current = Math.max(m.current, current);
  if (m.current >= m.target && !m.achieved) {
    m.achieved = true;
    m.achievedAt = new Date().toISOString();
  }
  c.updatedAt = new Date().toISOString();
  storeCampaign(c);
  return c;
}

// ===== System 3 — Event Scheduler =====
export function scheduleEvent(input: {
  eventId: string; scheduledStart: string; scheduledEnd: string;
  timezone?: string; recurrence?: RecurrenceConfig | null;
  holidayAware?: boolean; blackoutAware?: boolean; academicCalendarRef?: string | null;
}): ScheduledEvent {
  const scheduled: ScheduledEvent = {
    id: randomUUID(), eventId: input.eventId,
    scheduledStart: input.scheduledStart, scheduledEnd: input.scheduledEnd,
    timezone: input.timezone ?? "UTC", recurrence: input.recurrence ?? null,
    holidayAware: input.holidayAware ?? true, blackoutAware: input.blackoutAware ?? true,
    academicCalendarRef: input.academicCalendarRef ?? null, status: "scheduled",
  };
  storeScheduledEvent(scheduled);
  return scheduled;
}

export function getScheduledById(id: string): ScheduledEvent | null { return getScheduledEvent(id); }
export function listScheduledEvents(): ScheduledEvent[] { return getAllScheduledEvents(); }

export function startScheduledEvent(scheduledId: string): ScheduledEvent | null {
  const s = getScheduledEvent(scheduledId);
  if (!s || s.status !== "scheduled") return null;
  s.status = "running";
  storeScheduledEvent(s);
  // Also update the live event status
  const event = getEvent(s.eventId);
  if (event) { event.status = "running"; event.updatedAt = new Date().toISOString(); storeEvent(event); }
  return s;
}

export function completeScheduledEvent(scheduledId: string): ScheduledEvent | null {
  const s = getScheduledEvent(scheduledId);
  if (!s || s.status !== "running") return null;
  s.status = "completed";
  storeScheduledEvent(s);
  const event = getEvent(s.eventId);
  if (event) { event.status = "completed"; event.updatedAt = new Date().toISOString(); storeEvent(event); }
  return s;
}

export function isInBlackoutPeriod(eventId: string, timestamp: string): boolean {
  const event = getEvent(eventId);
  if (!event) return false;
  const ts = new Date(timestamp).getTime();
  for (const bp of event.blackoutPeriods) {
    if (ts >= new Date(bp.start).getTime() && ts <= new Date(bp.end).getTime()) return true;
  }
  return false;
}

// ===== System 13 — Approval Workflow =====
const VALID_TRANSITIONS: Record<EventApprovalStatus, EventApprovalStatus[]> = {
  draft: ["review", "cancelled"],
  review: ["approved", "cancelled"],
  approved: ["scheduled", "cancelled"],
  scheduled: ["running", "cancelled"],
  running: ["paused", "completed", "cancelled"],
  paused: ["running", "cancelled"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

export function transitionApproval(eventId: string, toStatus: EventApprovalStatus, actorId: string, note: string): ApprovalWorkflow | null {
  const approval = getAllApprovals().find(a => a.eventId === eventId);
  if (!approval) return null;
  if (!VALID_TRANSITIONS[approval.status]?.includes(toStatus)) return null;
  const now = new Date().toISOString();
  const entry: ApprovalHistoryEntry = { id: randomUUID(), fromStatus: approval.status, toStatus, actorId, note, timestamp: now };
  approval.history.push(entry);
  approval.status = toStatus;
  approval.reviewedBy = actorId;
  approval.reviewNote = note;
  approval.updatedAt = now;
  storeApproval(approval);
  // Sync event status
  const event = getEvent(eventId);
  if (event) { event.status = toStatus; event.updatedAt = now; storeEvent(event); }
  log.info("approval.transition", { eventId, toStatus, actorId });
  return approval;
}

export function getApprovalForEvent(eventId: string): ApprovalWorkflow | null {
  return getAllApprovals().find(a => a.eventId === eventId) ?? null;
}
export function listAllApprovals(): ApprovalWorkflow[] { return getAllApprovals(); }
export function canTransition(from: EventApprovalStatus, to: EventApprovalStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
