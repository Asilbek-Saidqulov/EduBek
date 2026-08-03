/**
 * EduBek — Live Events, Campaigns & Seasonal Operations Platform types.
 * Phase 6G.10: Single source of truth for every temporary event, campaign,
 * seasonal operation, academic celebration, limited-time activity and live
 * educational operation across the entire platform.
 *
 * Architecture:
 *   Passive Event Bus consumer + producer.
 *   Never calls Progression, Competitive, Social, or Game Modes directly.
 *   Everything goes through Event Bus.
 *   No duplicated business logic.
 */
import type { EventProducer } from "@/features/game-engine/events";

// System 1 — Live Event Registry
export type LiveEventType = "daily" | "weekly" | "monthly" | "seasonal" | "academic" | "national" | "organization" | "classroom" | "club" | "university" | "special" | "custom";
export type EventApprovalStatus = "draft" | "review" | "approved" | "scheduled" | "running" | "paused" | "completed" | "cancelled" | "archived";

export interface LiveEvent {
  id: string; name: string; description: string; type: LiveEventType;
  status: EventApprovalStatus; startDate: string; endDate: string;
  timezone: string; organizationId: string | null; createdBy: string;
  visibility: "public" | "organization" | "school" | "club" | "private";
  maxParticipants: number; enrolledCount: number; activeCount: number;
  completedCount: number; abandonedCount: number; expiredCount: number;
  campaignId: string | null; templateId: string | null;
  blackoutPeriods: BlackoutPeriod[]; recurrence: RecurrenceConfig | null;
  createdAt: string; updatedAt: string;
}

export interface BlackoutPeriod { id: string; start: string; end: string; reason: string; }
export interface RecurrenceConfig { pattern: "daily" | "weekly" | "monthly" | "none"; interval: number; endDate: string | null; }

// System 2 — Campaign Engine
export interface Campaign {
  id: string; name: string; description: string; stages: CampaignStage[];
  milestones: CampaignMilestone[]; objectives: string[];
  schedule: CampaignSchedule; visibility: "public" | "organization" | "private";
  status: EventApprovalStatus; expirationDate: string | null;
  createdBy: string; organizationId: string | null;
  createdAt: string; updatedAt: string;
}
export interface CampaignStage { id: string; name: string; description: string; objectives: string[]; startDate: string; endDate: string; completed: boolean; }
export interface CampaignMilestone { id: string; name: string; description: string; target: number; current: number; achieved: boolean; achievedAt: string | null; }
export interface CampaignSchedule { startDate: string; endDate: string; timezone: string; }

// System 3 — Event Scheduler
export interface ScheduledEvent {
  id: string; eventId: string; scheduledStart: string; scheduledEnd: string;
  timezone: string; recurrence: RecurrenceConfig | null; holidayAware: boolean;
  blackoutAware: boolean; academicCalendarRef: string | null; status: "scheduled" | "running" | "completed" | "cancelled";
}

// System 4 — Event Participation
export type ParticipationStatus = "enrolled" | "active" | "completed" | "abandoned" | "expired";
export interface EventParticipation {
  id: string; eventId: string; userId: string; status: ParticipationStatus;
  enrolledAt: string; completedAt: string | null; abandonedAt: string | null;
  objectivesProgress: Record<string, number>; metadata: Record<string, unknown>;
}

// System 5 — Objective Engine
export type ObjectiveType = "play_matches" | "win_matches" | "reach_level" | "complete_quizzes" | "join_club" | "complete_challenge" | "earn_xp" | "gain_rating" | "publish_extension" | "custom";
export interface ObjectiveDefinition {
  id: string; name: string; description: string; type: ObjectiveType;
  target: number; metric: string; rewardMappingId: string | null;
  campaignId: string | null; eventId: string | null; active: boolean;
}

// System 6 — Reward Mapping
export type RewardMappingKind = "xp" | "badge" | "cosmetic" | "title" | "avatar" | "frame" | "banner" | "season_token" | "certificate";
export interface RewardMapping {
  id: string; name: string; description: string; kind: RewardMappingKind;
  rewardRef: string; amount: number; eventId: string | null; objectiveId: string | null;
  conditions: Record<string, unknown>;
}

// System 7 — Event Templates
export interface EventTemplate {
  id: string; name: string; description: string; type: LiveEventType;
  defaultObjectives: string[]; defaultRewards: string[]; defaultSchedule: CampaignSchedule | null;
  category: string; tags: string[];
}

// System 8 — Live Operations Dashboard
export interface LiveOpsDashboard {
  runningEvents: number; upcomingEvents: number; completedEvents: number;
  totalParticipants: number; completionRate: number; conversionRate: number;
  dropoutRate: number; topCampaigns: Array<{ campaignId: string; name: string; participation: number }>;
  teacherAdoption: number; organizationAdoption: number; updatedAt: string;
}

// System 9 — Event Analytics
export interface EventAnalytics {
  eventId: string; totalParticipants: number; completionRate: number;
  averageCompletionTime: number; dropoutRate: number; peakParticipation: number;
  participationByDay: Array<{ date: string; count: number }>;
  objectiveCompletion: Record<string, number>;
}

// System 11 — Notification Mapping
export interface NotificationRequest {
  id: string; eventId: string; userId: string | null; audience: "all" | "participants" | "organization" | "custom";
  kind: string; message: string; scheduledAt: string; status: "pending" | "sent" | "cancelled";
}

// System 12 — Feature Flag Support
export type FeatureFlagRollout = "enable" | "disable" | "gradual" | "organization" | "country" | "school" | "ab_test" | "emergency_stop";
export interface FeatureFlag {
  id: string; name: string; description: string; rollout: FeatureFlagRollout;
  percentage: number; organizationIds: string[]; countryCodes: string[]; schoolIds: string[];
  active: boolean; eventId: string | null; createdAt: string; updatedAt: string;
}

// System 13 — Approval Workflow
export interface ApprovalWorkflow {
  id: string; eventId: string; status: EventApprovalStatus; submittedBy: string;
  reviewedBy: string | null; reviewNote: string | null;
  history: ApprovalHistoryEntry[]; createdAt: string; updatedAt: string;
}
export interface ApprovalHistoryEntry { id: string; fromStatus: EventApprovalStatus; toStatus: EventApprovalStatus; actorId: string; note: string; timestamp: string; }

// System 14 — Organization Operations
export type OrganizationType = "school" | "university" | "district" | "government" | "enterprise";
export interface OrganizationCampaign {
  id: string; organizationId: string; organizationType: OrganizationType;
  campaignId: string; eventId: string | null; status: EventApprovalStatus;
  participationTarget: number; actualParticipation: number; createdAt: string;
}

// System 15 — Developer Integration
export interface LiveOpsDeveloperIntegration {
  publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean }>;
  eventContracts: string[]; extensionHooks: Array<{ id: string; name: string; triggerEvent: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string };
}

// System 10 — Event Bridge
export type LiveOpsEventType = "LiveEventStarted" | "LiveEventEnded" | "CampaignStageCompleted" | "ObjectiveCompleted" | "ParticipationEnrolled" | "ParticipationCompleted" | "FeatureFlagChanged";
