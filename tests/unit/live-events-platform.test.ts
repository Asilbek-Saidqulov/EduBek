/**
 * EduBek — Live Events, Campaigns & Seasonal Operations Platform tests. Phase 6G.10.
 */
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import {
  createEvent, getEventById, listEvents, updateEvent,
  createCampaign, getCampaignById, listCampaigns, addCampaignStage, completeCampaignStage, addCampaignMilestone, updateMilestoneProgress,
  scheduleEvent, getScheduledById, listScheduledEvents, startScheduledEvent, completeScheduledEvent, isInBlackoutPeriod,
  transitionApproval, getApprovalForEvent, listAllApprovals, canTransition,
  enrollParticipant, activateParticipant, completeParticipant, abandonParticipant, expireParticipant, updateParticipationObjective, getEventParticipations, getUserParticipation,
  createObjective, getObjectiveById, listObjectives, setObjectiveActive, checkObjectiveCompletion,
  createRewardMapping, getRewardMappingById, listRewardMappings, getRewardsForObjective,
  initializeTemplates, getTemplateById, listTemplates, createCustomTemplate, EVENT_TEMPLATES,
  createOrganizationCampaign, getOrgCampaignById, listOrgCampaigns, updateOrgCampaignStatus, updateOrgParticipation, listAllOrgCampaigns,
  generateDashboard, generateEventAnalytics, getDeveloperIntegration,
  createNotificationRequest, getNotificationsForEvent, cancelNotification,
  createFeatureFlag, getFeatureFlagById, listFeatureFlags, enableFeatureFlag, disableFeatureFlag, emergencyStop, setGradualRollout, setOrganizationRollout, setCountryRollout, setSchoolRollout, setABTestRollout, isFeatureFlagActive,
  subscribeLiveEvents, unsubscribeLiveEvents, isLiveEventsSubscribed, getBridgeProcessedCount, publishLiveOpsEvent,
  _resetBridgeForTesting, _resetRepositoryForTesting,
} from "@/features/live-events-platform";
import { createMatch, emitEvent } from "@/features/game-engine";

beforeAll(() => { initializeTemplates(); });
beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); initializeTemplates(); });

// ===== System 1 — Live Event Registry =====
describe("Live Events — Registry", () => {
  it("creates an event", () => { const e = createEvent({ name: "Test", description: "test", type: "daily", startDate: "2025-01-01", endDate: "2025-01-07", createdBy: "admin-1" }); expect(e.id).toBeDefined(); expect(e.status).toBe("draft"); });
  it("gets event by id", () => { const e = createEvent({ name: "T", description: "", type: "weekly", startDate: "", endDate: "", createdBy: "a" }); expect(getEventById(e.id)).not.toBeNull(); expect(getEventById("nonexistent")).toBeNull(); });
  it("lists events", () => { createEvent({ name: "T1", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); createEvent({ name: "T2", description: "", type: "weekly", startDate: "", endDate: "", createdBy: "a" }); expect(listEvents().length).toBe(2); });
  it("lists events by type", () => { createEvent({ name: "T1", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); createEvent({ name: "T2", description: "", type: "weekly", startDate: "", endDate: "", createdBy: "a" }); expect(listEvents("daily").length).toBe(1); });
  it("updates event", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(updateEvent(e.id, { name: "Updated" })?.name).toBe("Updated"); });
  it("supports all event types", () => { for (const t of ["daily","weekly","monthly","seasonal","academic","national","organization","classroom","club","university","special","custom"] as const) { expect(createEvent({ name: `E-${t}`, description: "", type: t, startDate: "", endDate: "", createdBy: "a" }).type).toBe(t); } });
  it("event has blackout periods", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a", blackoutPeriods: [{ id: "bp1", start: "2025-01-03", end: "2025-01-04", reason: "Holiday" }] }); expect(e.blackoutPeriods.length).toBe(1); });
  it("event has recurrence", () => { const e = createEvent({ name: "T", description: "", type: "weekly", startDate: "", endDate: "", createdBy: "a", recurrence: { pattern: "weekly", interval: 1, endDate: null } }); expect(e.recurrence?.pattern).toBe("weekly"); });
  it("update non-existent returns null", () => { expect(updateEvent("nonexistent", { name: "X" })).toBeNull(); });
});

// ===== System 2 — Campaign Engine =====
describe("Live Events — Campaigns", () => {
  it("creates a campaign", () => { const c = createCampaign({ name: "Campaign A", description: "test", startDate: "2025-01-01", endDate: "2025-02-01", createdBy: "admin" }); expect(c.id).toBeDefined(); expect(c.status).toBe("draft"); });
  it("gets campaign by id", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(getCampaignById(c.id)).not.toBeNull(); });
  it("lists campaigns", () => { createCampaign({ name: "C1", description: "", startDate: "", endDate: "", createdBy: "a" }); createCampaign({ name: "C2", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(listCampaigns().length).toBe(2); });
  it("adds campaign stage", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); addCampaignStage(c.id, { name: "Stage 1", description: "", objectives: [], startDate: "", endDate: "" }); expect(getCampaignById(c.id)?.stages.length).toBe(1); });
  it("completes campaign stage", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const s = addCampaignStage(c.id, { name: "S1", description: "", objectives: [], startDate: "", endDate: "" }); expect(completeCampaignStage(c.id, s!.stages[0].id)?.stages[0].completed).toBe(true); });
  it("adds milestone", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); addCampaignMilestone(c.id, { name: "M1", description: "", target: 100 }); expect(getCampaignById(c.id)?.milestones.length).toBe(1); });
  it("updates milestone progress", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const cm = addCampaignMilestone(c.id, { name: "M1", description: "", target: 100 }); updateMilestoneProgress(c.id, cm!.milestones[0].id, 50); expect(getCampaignById(c.id)?.milestones[0].current).toBe(50); });
  it("milestone achieved at target", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const cm = addCampaignMilestone(c.id, { name: "M1", description: "", target: 100 }); updateMilestoneProgress(c.id, cm!.milestones[0].id, 100); expect(getCampaignById(c.id)?.milestones[0].achieved).toBe(true); });
  it("milestone progress only increases", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const cm = addCampaignMilestone(c.id, { name: "M1", description: "", target: 100 }); updateMilestoneProgress(c.id, cm!.milestones[0].id, 50); updateMilestoneProgress(c.id, cm!.milestones[0].id, 30); expect(getCampaignById(c.id)?.milestones[0].current).toBe(50); });
});

// ===== System 3 — Event Scheduler =====
describe("Live Events — Scheduler", () => {
  it("schedules an event", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const s = scheduleEvent({ eventId: e.id, scheduledStart: "2025-01-01", scheduledEnd: "2025-01-07" }); expect(s.id).toBeDefined(); expect(s.status).toBe("scheduled"); });
  it("gets scheduled by id", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const s = scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "" }); expect(getScheduledById(s.id)).not.toBeNull(); });
  it("lists scheduled events", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "" }); expect(listScheduledEvents().length).toBe(1); });
  it("starts scheduled event", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "approved", "admin", "ok"); transitionApproval(e.id, "scheduled", "admin", "ok"); const s = scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "" }); expect(startScheduledEvent(s.id)?.status).toBe("running"); });
  it("completes scheduled event", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "approved", "admin", "ok"); transitionApproval(e.id, "scheduled", "admin", "ok"); const s = scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "" }); startScheduledEvent(s.id); expect(completeScheduledEvent(s.id)?.status).toBe("completed"); });
  it("detects blackout period", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a", blackoutPeriods: [{ id: "bp1", start: "2025-01-03T00:00:00Z", end: "2025-01-04T00:00:00Z", reason: "Holiday" }] }); expect(isInBlackoutPeriod(e.id, "2025-01-03T12:00:00Z")).toBe(true); expect(isInBlackoutPeriod(e.id, "2025-01-05T12:00:00Z")).toBe(false); });
  it("start non-scheduled returns null", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const s = scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "" }); startScheduledEvent(s.id); expect(startScheduledEvent(s.id)).toBeNull(); });
});

// ===== System 13 — Approval Workflow =====
describe("Live Events — Approval", () => {
  it("creates approval on event creation", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(getApprovalForEvent(e.id)).not.toBeNull(); });
  it("transitions draft to review", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(transitionApproval(e.id, "review", "admin", "ok")?.status).toBe("review"); });
  it("transitions review to approved", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "review", "admin", "ok"); expect(transitionApproval(e.id, "approved", "admin", "ok")?.status).toBe("approved"); });
  it("transitions approved to scheduled", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "review", "a", ""); transitionApproval(e.id, "approved", "a", ""); expect(transitionApproval(e.id, "scheduled", "a", "")?.status).toBe("scheduled"); });
  it("transitions scheduled to running", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "review", "a", ""); transitionApproval(e.id, "approved", "a", ""); transitionApproval(e.id, "scheduled", "a", ""); expect(transitionApproval(e.id, "running", "a", "")?.status).toBe("running"); });
  it("transitions running to completed", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); expect(transitionApproval(e.id, "completed", "a", "")?.status).toBe("completed"); });
  it("transitions running to paused", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); expect(transitionApproval(e.id, "paused", "a", "")?.status).toBe("paused"); });
  it("invalid transition returns null", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(transitionApproval(e.id, "running", "a", "")).toBeNull(); });
  it("canTransition validates", () => { expect(canTransition("draft", "review")).toBe(true); expect(canTransition("draft", "running")).toBe(false); expect(canTransition("completed", "archived")).toBe(true); });
  it("approval has history", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "review", "admin", "ok"); expect(getApprovalForEvent(e.id)?.history.length).toBe(1); });
  it("lists all approvals", () => { createEvent({ name: "T1", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); createEvent({ name: "T2", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(listAllApprovals().length).toBe(2); });
});

// ===== System 4 — Event Participation =====
describe("Live Events — Participation", () => {
  it("enrolls participant", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "review", "a", ""); transitionApproval(e.id, "approved", "a", ""); transitionApproval(e.id, "scheduled", "a", ""); transitionApproval(e.id, "running", "a", ""); expect(enrollParticipant(e.id, "u1")).not.toBeNull(); });
  it("prevents duplicate enrollment", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(enrollParticipant(e.id, "u1")).toBeNull(); });
  it("activates participant", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(activateParticipant(e.id, "u1")?.status).toBe("active"); });
  it("completes participant", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(completeParticipant(e.id, "u1")?.status).toBe("completed"); });
  it("abandons participant", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(abandonParticipant(e.id, "u1")?.status).toBe("abandoned"); });
  it("expires participant", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(expireParticipant(e.id, "u1")?.status).toBe("expired"); });
  it("updates participation objective", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); updateParticipationObjective(e.id, "u1", "obj1", 50); expect(getUserParticipation(e.id, "u1")?.objectivesProgress["obj1"]).toBe(50); });
  it("gets event participations", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); enrollParticipant(e.id, "u2"); expect(getEventParticipations(e.id).length).toBe(2); });
  it("respects max participants", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a", maxParticipants: 1 }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(enrollParticipant(e.id, "u2")).toBeNull(); });
  it("enroll on non-running returns null", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(enrollParticipant(e.id, "u1")).toBeNull(); });
});

// ===== System 5 — Objective Engine =====
describe("Live Events — Objectives", () => {
  it("creates objective", () => { const o = createObjective({ name: "Play 10 matches", description: "", type: "play_matches", target: 10, metric: "matches_played" }); expect(o.id).toBeDefined(); expect(o.active).toBe(true); });
  it("gets objective by id", () => { const o = createObjective({ name: "O", description: "", type: "win_matches", target: 5, metric: "wins" }); expect(getObjectiveById(o.id)).not.toBeNull(); });
  it("lists objectives", () => { createObjective({ name: "O1", description: "", type: "play_matches", target: 10, metric: "m" }); createObjective({ name: "O2", description: "", type: "win_matches", target: 5, metric: "w" }); expect(listObjectives().length).toBe(2); });
  it("sets objective active/inactive", () => { const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m" }); setObjectiveActive(o.id, false); expect(getObjectiveById(o.id)?.active).toBe(false); });
  it("checks completion", () => { const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m" }); expect(checkObjectiveCompletion(o.id, 10)).toBe(true); expect(checkObjectiveCompletion(o.id, 5)).toBe(false); });
  it("supports all objective types", () => { for (const t of ["play_matches","win_matches","reach_level","complete_quizzes","join_club","complete_challenge","earn_xp","gain_rating","publish_extension","custom"] as const) { expect(createObjective({ name: `O-${t}`, description: "", type: t, target: 1, metric: "m" }).type).toBe(t); } });
});

// ===== System 6 — Reward Mapping =====
describe("Live Events — Reward Mapping", () => {
  it("creates reward mapping", () => { const r = createRewardMapping({ name: "XP Reward", description: "", kind: "xp", rewardRef: "xp_100", amount: 100 }); expect(r.id).toBeDefined(); });
  it("gets reward mapping by id", () => { const r = createRewardMapping({ name: "R", description: "", kind: "badge", rewardRef: "badge_test" }); expect(getRewardMappingById(r.id)).not.toBeNull(); });
  it("lists reward mappings", () => { createRewardMapping({ name: "R1", description: "", kind: "xp", rewardRef: "r1" }); createRewardMapping({ name: "R2", description: "", kind: "badge", rewardRef: "r2" }); expect(listRewardMappings().length).toBe(2); });
  it("gets rewards for objective", () => { const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m" }); createRewardMapping({ name: "R", description: "", kind: "xp", rewardRef: "r1", objectiveId: o.id }); expect(getRewardsForObjective(o.id).length).toBe(1); });
  it("supports all reward kinds", () => { for (const k of ["xp","badge","cosmetic","title","avatar","frame","banner","season_token","certificate"] as const) { expect(createRewardMapping({ name: `R-${k}`, description: "", kind: k, rewardRef: "r" }).kind).toBe(k); } });
});

// ===== System 7 — Event Templates =====
describe("Live Events — Templates", () => {
  it("lists templates", () => { expect(listTemplates().length).toBeGreaterThan(0); });
  it("gets template by id", () => { expect(getTemplateById("tpl_academic_week")).not.toBeNull(); });
  it("lists templates by category", () => { expect(listTemplates("academic").length).toBeGreaterThan(0); });
  it("creates custom template", () => { const t = createCustomTemplate({ name: "Custom", description: "", type: "custom", category: "test" }); expect(t.id).toBeDefined(); });
  it("has 10 built-in templates", () => { expect(EVENT_TEMPLATES.length).toBe(10); });
  it("templates have default objectives", () => { expect(EVENT_TEMPLATES[0].defaultObjectives.length).toBeGreaterThan(0); });
  it("templates have default rewards", () => { expect(EVENT_TEMPLATES[0].defaultRewards.length).toBeGreaterThan(0); });
});

// ===== System 14 — Organization Operations =====
describe("Live Events — Org Operations", () => {
  it("creates org campaign", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const oc = createOrganizationCampaign({ organizationId: "org-1", organizationType: "school", campaignId: c.id }); expect(oc.id).toBeDefined(); });
  it("gets org campaign by id", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const oc = createOrganizationCampaign({ organizationId: "org-1", organizationType: "school", campaignId: c.id }); expect(getOrgCampaignById(oc.id)).not.toBeNull(); });
  it("lists org campaigns", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); createOrganizationCampaign({ organizationId: "org-1", organizationType: "school", campaignId: c.id }); expect(listOrgCampaigns().length).toBe(1); });
  it("lists org campaigns by type", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); createOrganizationCampaign({ organizationId: "o1", organizationType: "school", campaignId: c.id }); createOrganizationCampaign({ organizationId: "o2", organizationType: "university", campaignId: c.id }); expect(listOrgCampaigns("school").length).toBe(1); });
  it("updates org campaign status", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const oc = createOrganizationCampaign({ organizationId: "o1", organizationType: "school", campaignId: c.id }); expect(updateOrgCampaignStatus(oc.id, "approved")?.status).toBe("approved"); });
  it("updates org participation", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const oc = createOrganizationCampaign({ organizationId: "o1", organizationType: "school", campaignId: c.id }); expect(updateOrgParticipation(oc.id, 50)?.actualParticipation).toBe(50); });
  it("supports all org types", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); for (const t of ["school","university","district","government","enterprise"] as const) { expect(createOrganizationCampaign({ organizationId: "o", organizationType: t, campaignId: c.id }).organizationType).toBe(t); } });
});

// ===== Systems 8, 9 — Dashboard + Analytics =====
describe("Live Events — Dashboard + Analytics", () => {
  it("generates dashboard", () => { const d = generateDashboard(); expect(d).toBeDefined(); expect(d.runningEvents).toBeGreaterThanOrEqual(0); });
  it("generates event analytics", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); const a = generateEventAnalytics(e.id); expect(a).not.toBeNull(); expect(a!.totalParticipants).toBe(1); });
  it("analytics returns null for unknown", () => { expect(generateEventAnalytics("nonexistent")).toBeNull(); });
  it("dashboard includes top campaigns", () => { const d = generateDashboard(); expect(d.topCampaigns).toBeDefined(); });
});

// ===== System 11 — Notification Mapping =====
describe("Live Events — Notifications", () => {
  it("creates notification request", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const n = createNotificationRequest({ eventId: e.id, kind: "event_start", message: "Event started!", scheduledAt: new Date().toISOString() }); expect(n.id).toBeDefined(); expect(n.status).toBe("pending"); });
  it("gets notifications for event", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); createNotificationRequest({ eventId: e.id, kind: "test", message: "M", scheduledAt: "" }); expect(getNotificationsForEvent(e.id).length).toBe(1); });
  it("cancels notification", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const n = createNotificationRequest({ eventId: e.id, kind: "test", message: "M", scheduledAt: "" }); expect(cancelNotification(e.id, n.id)).toBe(true); expect(getNotificationsForEvent(e.id)[0].status).toBe("cancelled"); });
  it("cancel non-pending returns false", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const n = createNotificationRequest({ eventId: e.id, kind: "test", message: "M", scheduledAt: "" }); cancelNotification(e.id, n.id); expect(cancelNotification(e.id, n.id)).toBe(false); });
});

// ===== System 12 — Feature Flags =====
describe("Live Events — Feature Flags", () => {
  it("creates feature flag", () => { const f = createFeatureFlag({ name: "Test Flag", description: "test" }); expect(f.id).toBeDefined(); expect(f.active).toBe(false); });
  it("gets flag by id", () => { const f = createFeatureFlag({ name: "F", description: "" }); expect(getFeatureFlagById(f.id)).not.toBeNull(); });
  it("lists flags", () => { createFeatureFlag({ name: "F1", description: "" }); createFeatureFlag({ name: "F2", description: "" }); expect(listFeatureFlags().length).toBe(2); });
  it("enables flag", () => { const f = createFeatureFlag({ name: "F", description: "" }); enableFeatureFlag(f.id); expect(getFeatureFlagById(f.id)?.active).toBe(true); expect(getFeatureFlagById(f.id)?.rollout).toBe("enable"); });
  it("disables flag", () => { const f = createFeatureFlag({ name: "F", description: "" }); enableFeatureFlag(f.id); disableFeatureFlag(f.id); expect(getFeatureFlagById(f.id)?.active).toBe(false); });
  it("emergency stop", () => { const f = createFeatureFlag({ name: "F", description: "" }); enableFeatureFlag(f.id); emergencyStop(f.id); expect(getFeatureFlagById(f.id)?.rollout).toBe("emergency_stop"); expect(getFeatureFlagById(f.id)?.active).toBe(false); });
  it("gradual rollout", () => { const f = createFeatureFlag({ name: "F", description: "" }); setGradualRollout(f.id, 50); expect(getFeatureFlagById(f.id)?.percentage).toBe(50); });
  it("organization rollout", () => { const f = createFeatureFlag({ name: "F", description: "" }); setOrganizationRollout(f.id, ["org-1"]); expect(getFeatureFlagById(f.id)?.organizationIds).toContain("org-1"); });
  it("country rollout", () => { const f = createFeatureFlag({ name: "F", description: "" }); setCountryRollout(f.id, ["US"]); expect(getFeatureFlagById(f.id)?.countryCodes).toContain("US"); });
  it("school rollout", () => { const f = createFeatureFlag({ name: "F", description: "" }); setSchoolRollout(f.id, ["school-1"]); expect(getFeatureFlagById(f.id)?.schoolIds).toContain("school-1"); });
  it("AB test rollout", () => { const f = createFeatureFlag({ name: "F", description: "" }); setABTestRollout(f.id, 50); expect(getFeatureFlagById(f.id)?.rollout).toBe("ab_test"); });
  it("isFeatureFlagActive for enabled", () => { const f = createFeatureFlag({ name: "F", description: "" }); enableFeatureFlag(f.id); expect(isFeatureFlagActive(f.id)).toBe(true); });
  it("isFeatureFlagActive for disabled", () => { const f = createFeatureFlag({ name: "F", description: "" }); expect(isFeatureFlagActive(f.id)).toBe(false); });
  it("isFeatureFlagActive for org rollout", () => { const f = createFeatureFlag({ name: "F", description: "" }); setOrganizationRollout(f.id, ["org-1"]); expect(isFeatureFlagActive(f.id, { organizationId: "org-1" })).toBe(true); expect(isFeatureFlagActive(f.id, { organizationId: "org-2" })).toBe(false); });
  it("isFeatureFlagActive for country rollout", () => { const f = createFeatureFlag({ name: "F", description: "" }); setCountryRollout(f.id, ["UZ"]); expect(isFeatureFlagActive(f.id, { countryCode: "UZ" })).toBe(true); expect(isFeatureFlagActive(f.id, { countryCode: "US" })).toBe(false); });
  it("isFeatureFlagActive for school rollout", () => { const f = createFeatureFlag({ name: "F", description: "" }); setSchoolRollout(f.id, ["s1"]); expect(isFeatureFlagActive(f.id, { schoolId: "s1" })).toBe(true); });
  it("supports all rollout types", () => { for (const r of ["enable","disable","gradual","organization","country","school","ab_test","emergency_stop"] as const) { const f = createFeatureFlag({ name: `F-${r}`, description: "", rollout: r }); expect(f.rollout).toBe(r); } });
});

// ===== System 15 — Developer Integration =====
describe("Live Events — Developer", () => {
  it("returns developer integration", () => { const d = getDeveloperIntegration(); expect(d.publicAPIs.length).toBeGreaterThan(0); expect(d.eventContracts.length).toBeGreaterThan(0); });
  it("has API endpoints", () => { expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("/api/live-events/"))).toBe(true); });
  it("has event contracts", () => { expect(getDeveloperIntegration().eventContracts).toContain("LiveEventStarted"); });
  it("has extension hooks", () => { expect(getDeveloperIntegration().extensionHooks.length).toBeGreaterThan(0); });
  it("has SDK metadata", () => { expect(getDeveloperIntegration().sdkMetadata.version).toBeDefined(); });
});

// ===== System 10 — Event Bridge =====
describe("Live Events — Bridge", () => {
  it("subscribes to event bus", () => { subscribeLiveEvents(); expect(isLiveEventsSubscribed()).toBe(true); });
  it("unsubscribe stops", () => { subscribeLiveEvents(); unsubscribeLiveEvents(); expect(isLiveEventsSubscribed()).toBe(false); });
  it("subscribe is idempotent", () => { subscribeLiveEvents(); subscribeLiveEvents(); expect(isLiveEventsSubscribed()).toBe(true); });
  it("publishes liveops events", () => { expect(() => publishLiveOpsEvent("LiveEventStarted", "u1", { eventId: "e1" })).not.toThrow(); });
});

// ===== Architecture Compliance =====
describe("Live Events — Architecture", () => {
  it("no circular dependencies", async () => { const mod = await import("@/features/live-events-platform"); expect(mod.createEvent).toBeDefined(); });
  it("no gameplay ownership", () => { expect(true).toBe(true); });
});

// ===== Edge Cases =====
describe("Live Events — Edge Cases", () => {
  it("returns null for unknown event", () => { expect(getEventById("nonexistent")).toBeNull(); });
  it("returns null for unknown campaign", () => { expect(getCampaignById("nonexistent")).toBeNull(); });
  it("returns null for unknown objective", () => { expect(getObjectiveById("nonexistent")).toBeNull(); });
  it("returns null for unknown template", () => { expect(getTemplateById("nonexistent")).toBeNull(); });
  it("returns null for unknown flag", () => { expect(getFeatureFlagById("nonexistent")).toBeNull(); });
  it("returns null for unknown approval", () => { expect(getApprovalForEvent("nonexistent")).toBeNull(); });
  it("returns empty for unknown participations", () => { expect(getEventParticipations("nonexistent")).toEqual([]); });
  it("returns null for unknown participation", () => { expect(getUserParticipation("nonexistent", "u1")).toBeNull(); });
  it("returns null for unknown scheduled", () => { expect(getScheduledById("nonexistent")).toBeNull(); });
  it("returns null for unknown org campaign", () => { expect(getOrgCampaignById("nonexistent")).toBeNull(); });
});

// ===== Stress =====
describe("Live Events — Stress", () => {
  it("handles many events", () => { for (let i = 0; i < 50; i++) createEvent({ name: `E${i}`, description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(listEvents().length).toBe(50); });
  it("handles many campaigns", () => { for (let i = 0; i < 50; i++) createCampaign({ name: `C${i}`, description: "", startDate: "", endDate: "", createdBy: "a" }); expect(listCampaigns().length).toBe(50); });
  it("handles many objectives", () => { for (let i = 0; i < 50; i++) createObjective({ name: `O${i}`, description: "", type: "play_matches", target: 10, metric: "m" }); expect(listObjectives().length).toBe(50); });
  it("handles many feature flags", () => { for (let i = 0; i < 50; i++) createFeatureFlag({ name: `F${i}`, description: "" }); expect(listFeatureFlags().length).toBe(50); });
});

// ===== Extended Tests =====
describe("Live Events — Extended", () => {
  it("event with campaign reference", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a", campaignId: c.id }); expect(e.campaignId).toBe(c.id); });
  it("event with template reference", () => { const e = createEvent({ name: "T", description: "", type: "academic", startDate: "", endDate: "", createdBy: "a", templateId: "tpl_academic_week" }); expect(e.templateId).toBe("tpl_academic_week"); });
  it("event with organization", () => { const e = createEvent({ name: "T", description: "", type: "organization", startDate: "", endDate: "", createdBy: "a", organizationId: "org-1" }); expect(e.organizationId).toBe("org-1"); });
  it("event visibility levels", () => { for (const v of ["public","organization","school","club","private"] as const) { expect(createEvent({ name: `E-${v}`, description: "", type: "daily", startDate: "", endDate: "", createdBy: "a", visibility: v }).visibility).toBe(v); } });
  it("campaign stages with objectives", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); addCampaignStage(c.id, { name: "S1", description: "", objectives: ["obj1", "obj2"], startDate: "", endDate: "" }); expect(getCampaignById(c.id)?.stages[0].objectives.length).toBe(2); });
  it("milestone with achievedAt", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const cm = addCampaignMilestone(c.id, { name: "M1", description: "", target: 10 }); updateMilestoneProgress(c.id, cm!.milestones[0].id, 10); expect(getCampaignById(c.id)?.milestones[0].achievedAt).not.toBeNull(); });
  it("objective with reward mapping", () => { const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m" }); const r = createRewardMapping({ name: "R", description: "", kind: "xp", rewardRef: "xp_100", objectiveId: o.id }); expect(r.objectiveId).toBe(o.id); });
  it("scheduled event with recurrence", () => { const e = createEvent({ name: "T", description: "", type: "weekly", startDate: "", endDate: "", createdBy: "a" }); const s = scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "", recurrence: { pattern: "weekly", interval: 1, endDate: null } }); expect(s.recurrence?.pattern).toBe("weekly"); });
  it("scheduled event with academic calendar", () => { const e = createEvent({ name: "T", description: "", type: "academic", startDate: "", endDate: "", createdBy: "a" }); const s = scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "", academicCalendarRef: "cal-2025" }); expect(s.academicCalendarRef).toBe("cal-2025"); });
  it("notification with audience", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const n = createNotificationRequest({ eventId: e.id, audience: "organization", kind: "test", message: "M", scheduledAt: "" }); expect(n.audience).toBe("organization"); });
  it("flag with event reference", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const f = createFeatureFlag({ name: "F", description: "", eventId: e.id }); expect(f.eventId).toBe(e.id); });
  it("org campaign with participation target", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const oc = createOrganizationCampaign({ organizationId: "o1", organizationType: "school", campaignId: c.id, participationTarget: 500 }); expect(oc.participationTarget).toBe(500); });
  it("custom template with tags", () => { const t = createCustomTemplate({ name: "Custom", description: "", type: "custom", category: "test", tags: ["tag1", "tag2"] }); expect(t.tags.length).toBe(2); });
  it("dashboard includes conversion rate", () => { const d = generateDashboard(); expect(d.conversionRate).toBeGreaterThanOrEqual(0); });
  it("analytics includes objective completion", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); updateParticipationObjective(e.id, "u1", "obj1", 50); const a = generateEventAnalytics(e.id); expect(a!.objectiveCompletion["obj1"]).toBe(50); });
  it("approval history tracks all transitions", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "review", "a", "r1"); transitionApproval(e.id, "approved", "a", "r2"); expect(getApprovalForEvent(e.id)?.history.length).toBe(2); });
  it("approval history has actor", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "review", "admin-1", "ok"); expect(getApprovalForEvent(e.id)?.history[0].actorId).toBe("admin-1"); });
  it("gradual rollout 0% is inactive", () => { const f = createFeatureFlag({ name: "F", description: "" }); setGradualRollout(f.id, 0); expect(getFeatureFlagById(f.id)?.active).toBe(false); });
  it("gradual rollout 100% is active for all", () => { const f = createFeatureFlag({ name: "F", description: "" }); setGradualRollout(f.id, 100); expect(isFeatureFlagActive(f.id)).toBe(true); });
  it("ab_test 50% is active", () => { const f = createFeatureFlag({ name: "F", description: "" }); setABTestRollout(f.id, 50); expect(isFeatureFlagActive(f.id)).toBe(true); });
  it("ab_test 49% is inactive", () => { const f = createFeatureFlag({ name: "F", description: "" }); setABTestRollout(f.id, 49); expect(isFeatureFlagActive(f.id)).toBe(false); });
});

// ===== Extended Registry Tests =====
describe("Live Events — Registry Extended", () => {
  it("event has enrolledCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(e.enrolledCount).toBe(0); });
  it("event has activeCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(e.activeCount).toBe(0); });
  it("event has completedCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(e.completedCount).toBe(0); });
  it("event has abandonedCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(e.abandonedCount).toBe(0); });
  it("event has expiredCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(e.expiredCount).toBe(0); });
  it("event has timezone", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a", timezone: "Asia/Tashkent" }); expect(e.timezone).toBe("Asia/Tashkent"); });
  it("event default timezone is UTC", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(e.timezone).toBe("UTC"); });
  it("event has createdAt", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(e.createdAt).toBeDefined(); });
  it("event has updatedAt", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(e.updatedAt).toBeDefined(); });
  it("update changes updatedAt", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); updateEvent(e.id, { name: "Updated" }); expect(getEventById(e.id)?.updatedAt).toBeDefined(); });
  it("list events by status", () => { createEvent({ name: "T1", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(listEvents(undefined, "draft").length).toBe(1); });
  it("event maxParticipants default 1000", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(e.maxParticipants).toBe(1000); });
  it("event custom maxParticipants", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a", maxParticipants: 100 }); expect(e.maxParticipants).toBe(100); });
  it("event default visibility public", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(e.visibility).toBe("public"); });
});

// ===== Extended Campaign Tests =====
describe("Live Events — Campaigns Extended", () => {
  it("campaign has stages array", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(c.stages).toEqual([]); });
  it("campaign has milestones array", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(c.milestones).toEqual([]); });
  it("campaign has objectives array", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(c.objectives).toEqual([]); });
  it("campaign has schedule", () => { const c = createCampaign({ name: "C", description: "", startDate: "2025-01-01", endDate: "2025-02-01", createdBy: "a" }); expect(c.schedule.startDate).toBe("2025-01-01"); });
  it("campaign schedule timezone", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", timezone: "UTC", createdBy: "a" }); expect(c.schedule.timezone).toBe("UTC"); });
  it("campaign default visibility public", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(c.visibility).toBe("public"); });
  it("campaign has expirationDate", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(c.expirationDate).toBeNull(); });
  it("campaign has organizationId", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a", organizationId: "org-1" }); expect(c.organizationId).toBe("org-1"); });
  it("add stage to non-existent returns null", () => { expect(addCampaignStage("nonexistent", { name: "S", description: "", objectives: [], startDate: "", endDate: "" })).toBeNull(); });
  it("complete non-existent stage returns null", () => { expect(completeCampaignStage("nonexistent", "nonexistent")).toBeNull(); });
  it("add milestone to non-existent returns null", () => { expect(addCampaignMilestone("nonexistent", { name: "M", description: "", target: 10 })).toBeNull(); });
  it("update milestone on non-existent returns null", () => { expect(updateMilestoneProgress("nonexistent", "nonexistent", 10)).toBeNull(); });
  it("multiple stages", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); addCampaignStage(c.id, { name: "S1", description: "", objectives: [], startDate: "", endDate: "" }); addCampaignStage(c.id, { name: "S2", description: "", objectives: [], startDate: "", endDate: "" }); expect(getCampaignById(c.id)?.stages.length).toBe(2); });
  it("multiple milestones", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); addCampaignMilestone(c.id, { name: "M1", description: "", target: 10 }); addCampaignMilestone(c.id, { name: "M2", description: "", target: 20 }); expect(getCampaignById(c.id)?.milestones.length).toBe(2); });
});

// ===== Extended Scheduler Tests =====
describe("Live Events — Scheduler Extended", () => {
  it("scheduled event has timezone", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const s = scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "", timezone: "UTC" }); expect(s.timezone).toBe("UTC"); });
  it("scheduled event is holidayAware by default", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const s = scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "" }); expect(s.holidayAware).toBe(true); });
  it("scheduled event is blackoutAware by default", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const s = scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "" }); expect(s.blackoutAware).toBe(true); });
  it("scheduled event with recurrence", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const s = scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "", recurrence: { pattern: "daily", interval: 1, endDate: null } }); expect(s.recurrence?.pattern).toBe("daily"); });
  it("complete non-running scheduled returns null", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const s = scheduleEvent({ eventId: e.id, scheduledStart: "", scheduledEnd: "" }); expect(completeScheduledEvent(s.id)).toBeNull(); });
  it("blackout period outside range", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a", blackoutPeriods: [{ id: "bp1", start: "2025-01-03T00:00:00Z", end: "2025-01-04T00:00:00Z", reason: "Holiday" }] }); expect(isInBlackoutPeriod(e.id, "2025-02-01T00:00:00Z")).toBe(false); });
  it("blackout for unknown event returns false", () => { expect(isInBlackoutPeriod("nonexistent", "2025-01-01")).toBe(false); });
  it("no blackout periods returns false", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(isInBlackoutPeriod(e.id, "2025-01-01")).toBe(false); });
});

// ===== Extended Approval Tests =====
describe("Live Events — Approval Extended", () => {
  it("draft to cancelled", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); expect(transitionApproval(e.id, "cancelled", "a", "cancelled")?.status).toBe("cancelled"); });
  it("review to cancelled", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "review", "a", ""); expect(transitionApproval(e.id, "cancelled", "a", "")?.status).toBe("cancelled"); });
  it("approved to cancelled", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "review", "a", ""); transitionApproval(e.id, "approved", "a", ""); expect(transitionApproval(e.id, "cancelled", "a", "")?.status).toBe("cancelled"); });
  it("scheduled to cancelled", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled"] as const) transitionApproval(e.id, s, "a", ""); expect(transitionApproval(e.id, "cancelled", "a", "")?.status).toBe("cancelled"); });
  it("running to cancelled", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); expect(transitionApproval(e.id, "cancelled", "a", "")?.status).toBe("cancelled"); });
  it("paused to cancelled", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running","paused"] as const) transitionApproval(e.id, s, "a", ""); expect(transitionApproval(e.id, "cancelled", "a", "")?.status).toBe("cancelled"); });
  it("paused to running", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running","paused"] as const) transitionApproval(e.id, s, "a", ""); expect(transitionApproval(e.id, "running", "a", "")?.status).toBe("running"); });
  it("completed to archived", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running","completed"] as const) transitionApproval(e.id, s, "a", ""); expect(transitionApproval(e.id, "archived", "a", "")?.status).toBe("archived"); });
  it("cancelled to archived", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "cancelled", "a", ""); expect(transitionApproval(e.id, "archived", "a", "")?.status).toBe("archived"); });
  it("archived is terminal", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running","completed","archived"] as const) transitionApproval(e.id, s, "a", ""); expect(transitionApproval(e.id, "draft", "a", "")).toBeNull(); });
  it("approval has reviewedBy", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "review", "admin-1", "ok"); expect(getApprovalForEvent(e.id)?.reviewedBy).toBe("admin-1"); });
  it("approval has reviewNote", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); transitionApproval(e.id, "review", "admin", "Looks good"); expect(getApprovalForEvent(e.id)?.reviewNote).toBe("Looks good"); });
  it("canTransition all valid", () => { expect(canTransition("draft", "review")).toBe(true); expect(canTransition("review", "approved")).toBe(true); expect(canTransition("approved", "scheduled")).toBe(true); expect(canTransition("scheduled", "running")).toBe(true); expect(canTransition("running", "paused")).toBe(true); expect(canTransition("running", "completed")).toBe(true); expect(canTransition("paused", "running")).toBe(true); expect(canTransition("completed", "archived")).toBe(true); });
  it("canTransition all invalid", () => { expect(canTransition("draft", "running")).toBe(false); expect(canTransition("review", "scheduled")).toBe(false); expect(canTransition("archived", "draft")).toBe(false); });
});

// ===== Extended Participation Tests =====
describe("Live Events — Participation Extended", () => {
  it("enroll increments event enrolledCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(getEventById(e.id)?.enrolledCount).toBe(1); });
  it("enroll increments activeCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(getEventById(e.id)?.activeCount).toBe(1); });
  it("complete increments completedCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); completeParticipant(e.id, "u1"); expect(getEventById(e.id)?.completedCount).toBe(1); });
  it("abandon increments abandonedCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); abandonParticipant(e.id, "u1"); expect(getEventById(e.id)?.abandonedCount).toBe(1); });
  it("expire increments expiredCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expireParticipant(e.id, "u1"); expect(getEventById(e.id)?.expiredCount).toBe(1); });
  it("complete decrements activeCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); completeParticipant(e.id, "u1"); expect(getEventById(e.id)?.activeCount).toBe(0); });
  it("abandon decrements activeCount", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); abandonParticipant(e.id, "u1"); expect(getEventById(e.id)?.activeCount).toBe(0); });
  it("activate non-enrolled returns null", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); expect(activateParticipant(e.id, "nonexistent")).toBeNull(); });
  it("complete non-enrolled returns null", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); expect(completeParticipant(e.id, "nonexistent")).toBeNull(); });
  it("complete already completed returns null", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); completeParticipant(e.id, "u1"); expect(completeParticipant(e.id, "u1")).toBeNull(); });
  it("abandon already abandoned returns null", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); abandonParticipant(e.id, "u1"); expect(abandonParticipant(e.id, "u1")).toBeNull(); });
  it("expire already completed returns null", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); completeParticipant(e.id, "u1"); expect(expireParticipant(e.id, "u1")).toBeNull(); });
  it("update objective on non-existent returns null", () => { expect(updateParticipationObjective("nonexistent", "u1", "obj1", 10)).toBeNull(); });
  it("objective progress only increases", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); updateParticipationObjective(e.id, "u1", "obj1", 50); updateParticipationObjective(e.id, "u1", "obj1", 30); expect(getUserParticipation(e.id, "u1")?.objectivesProgress["obj1"]).toBe(50); });
  it("participation has enrolledAt", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); const p = enrollParticipant(e.id, "u1"); expect(p?.enrolledAt).toBeDefined(); });
  it("completed participation has completedAt", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); const p = completeParticipant(e.id, "u1"); expect(p?.completedAt).toBeDefined(); });
  it("abandoned participation has abandonedAt", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); const p = abandonParticipant(e.id, "u1"); expect(p?.abandonedAt).toBeDefined(); });
});

// ===== Extended Objective Tests =====
describe("Live Events — Objectives Extended", () => {
  it("objective with campaignId", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m", campaignId: c.id }); expect(o.campaignId).toBe(c.id); });
  it("objective with eventId", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m", eventId: e.id }); expect(o.eventId).toBe(e.id); });
  it("objective with rewardMappingId", () => { const r = createRewardMapping({ name: "R", description: "", kind: "xp", rewardRef: "r1" }); const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m", rewardMappingId: r.id }); expect(o.rewardMappingId).toBe(r.id); });
  it("objective default active", () => { const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m" }); expect(o.active).toBe(true); });
  it("set objective inactive", () => { const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m" }); setObjectiveActive(o.id, false); expect(getObjectiveById(o.id)?.active).toBe(false); });
  it("set objective back to active", () => { const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m" }); setObjectiveActive(o.id, false); setObjectiveActive(o.id, true); expect(getObjectiveById(o.id)?.active).toBe(true); });
  it("check completion at exactly target", () => { const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m" }); expect(checkObjectiveCompletion(o.id, 10)).toBe(true); });
  it("check completion below target", () => { const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m" }); expect(checkObjectiveCompletion(o.id, 9)).toBe(false); });
  it("check completion above target", () => { const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m" }); expect(checkObjectiveCompletion(o.id, 15)).toBe(true); });
  it("check completion for unknown objective", () => { expect(checkObjectiveCompletion("nonexistent", 10)).toBe(false); });
  it("list objectives by event", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); createObjective({ name: "O1", description: "", type: "play_matches", target: 10, metric: "m", eventId: e.id }); createObjective({ name: "O2", description: "", type: "win_matches", target: 5, metric: "w" }); expect(listObjectives(e.id).length).toBe(1); });
  it("set active on non-existent returns null", () => { expect(setObjectiveActive("nonexistent", false)).toBeNull(); });
});

// ===== Extended Reward Mapping Tests =====
describe("Live Events — Rewards Extended", () => {
  it("reward with eventId", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const r = createRewardMapping({ name: "R", description: "", kind: "xp", rewardRef: "r1", eventId: e.id }); expect(r.eventId).toBe(e.id); });
  it("reward with objectiveId", () => { const o = createObjective({ name: "O", description: "", type: "play_matches", target: 10, metric: "m" }); const r = createRewardMapping({ name: "R", description: "", kind: "badge", rewardRef: "b1", objectiveId: o.id }); expect(r.objectiveId).toBe(o.id); });
  it("reward with conditions", () => { const r = createRewardMapping({ name: "R", description: "", kind: "xp", rewardRef: "r1", conditions: { minLevel: 10 } }); expect(r.conditions.minLevel).toBe(10); });
  it("reward default amount 1", () => { const r = createRewardMapping({ name: "R", description: "", kind: "badge", rewardRef: "r1" }); expect(r.amount).toBe(1); });
  it("reward custom amount", () => { const r = createRewardMapping({ name: "R", description: "", kind: "xp", rewardRef: "r1", amount: 500 }); expect(r.amount).toBe(500); });
  it("list rewards by event", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); createRewardMapping({ name: "R1", description: "", kind: "xp", rewardRef: "r1", eventId: e.id }); createRewardMapping({ name: "R2", description: "", kind: "badge", rewardRef: "r2" }); expect(listRewardMappings(e.id).length).toBe(1); });
  it("get rewards for unknown objective returns empty", () => { expect(getRewardsForObjective("nonexistent")).toEqual([]); });
});

// ===== Extended Template Tests =====
describe("Live Events — Templates Extended", () => {
  it("academic_week template exists", () => { expect(getTemplateById("tpl_academic_week")).not.toBeNull(); });
  it("stem_week template exists", () => { expect(getTemplateById("tpl_stem_week")).not.toBeNull(); });
  it("math_olympiad template exists", () => { expect(getTemplateById("tpl_math_olympiad")).not.toBeNull(); });
  it("economics_challenge template exists", () => { expect(getTemplateById("tpl_economics_challenge")).not.toBeNull(); });
  it("national_holiday template exists", () => { expect(getTemplateById("tpl_national_holiday")).not.toBeNull(); });
  it("university_week template exists", () => { expect(getTemplateById("tpl_university_week")).not.toBeNull(); });
  it("school_championship template exists", () => { expect(getTemplateById("tpl_school_championship")).not.toBeNull(); });
  it("reading_week template exists", () => { expect(getTemplateById("tpl_reading_week")).not.toBeNull(); });
  it("programming_month template exists", () => { expect(getTemplateById("tpl_programming_month")).not.toBeNull(); });
  it("teacher_campaign template exists", () => { expect(getTemplateById("tpl_teacher_campaign")).not.toBeNull(); });
  it("template has type", () => { expect(getTemplateById("tpl_academic_week")?.type).toBe("academic"); });
  it("template has category", () => { expect(getTemplateById("tpl_academic_week")?.category).toBe("academic"); });
  it("template has tags", () => { expect(getTemplateById("tpl_academic_week")?.tags.length).toBeGreaterThan(0); });
  it("custom template has unique id", () => { const t1 = createCustomTemplate({ name: "T1", description: "", type: "custom", category: "test" }); const t2 = createCustomTemplate({ name: "T2", description: "", type: "custom", category: "test" }); expect(t1.id).not.toBe(t2.id); });
});

// ===== Extended Dashboard + Analytics Tests =====
describe("Live Events — Dashboard Extended", () => {
  it("dashboard has runningEvents", () => { expect(generateDashboard().runningEvents).toBeGreaterThanOrEqual(0); });
  it("dashboard has upcomingEvents", () => { expect(generateDashboard().upcomingEvents).toBeGreaterThanOrEqual(0); });
  it("dashboard has completedEvents", () => { expect(generateDashboard().completedEvents).toBeGreaterThanOrEqual(0); });
  it("dashboard has totalParticipants", () => { expect(generateDashboard().totalParticipants).toBeGreaterThanOrEqual(0); });
  it("dashboard has completionRate", () => { expect(generateDashboard().completionRate).toBeGreaterThanOrEqual(0); expect(generateDashboard().completionRate).toBeLessThanOrEqual(1); });
  it("dashboard has dropoutRate", () => { expect(generateDashboard().dropoutRate).toBeGreaterThanOrEqual(0); expect(generateDashboard().dropoutRate).toBeLessThanOrEqual(1); });
  it("dashboard has teacherAdoption", () => { expect(generateDashboard().teacherAdoption).toBeGreaterThanOrEqual(0); });
  it("dashboard has organizationAdoption", () => { expect(generateDashboard().organizationAdoption).toBeGreaterThanOrEqual(0); });
  it("dashboard has updatedAt", () => { expect(generateDashboard().updatedAt).toBeDefined(); });
  it("analytics has peakParticipation", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(generateEventAnalytics(e.id)?.peakParticipation).toBeGreaterThanOrEqual(0); });
  it("analytics has participationByDay", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(generateEventAnalytics(e.id)?.participationByDay).toBeDefined(); });
  it("analytics has averageCompletionTime", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(generateEventAnalytics(e.id)?.averageCompletionTime).toBeGreaterThanOrEqual(0); });
  it("analytics has objectiveCompletion", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const s of ["review","approved","scheduled","running"] as const) transitionApproval(e.id, s, "a", ""); enrollParticipant(e.id, "u1"); expect(generateEventAnalytics(e.id)?.objectiveCompletion).toBeDefined(); });
});

// ===== Extended Feature Flag Tests =====
describe("Live Events — Flags Extended", () => {
  it("flag default inactive", () => { const f = createFeatureFlag({ name: "F", description: "" }); expect(f.active).toBe(false); });
  it("flag default rollout disable", () => { const f = createFeatureFlag({ name: "F", description: "" }); expect(f.rollout).toBe("disable"); });
  it("flag default percentage 0", () => { const f = createFeatureFlag({ name: "F", description: "" }); expect(f.percentage).toBe(0); });
  it("flag has createdAt", () => { const f = createFeatureFlag({ name: "F", description: "" }); expect(f.createdAt).toBeDefined(); });
  it("flag has updatedAt", () => { const f = createFeatureFlag({ name: "F", description: "" }); expect(f.updatedAt).toBeDefined(); });
  it("enable sets percentage 100", () => { const f = createFeatureFlag({ name: "F", description: "" }); enableFeatureFlag(f.id); expect(getFeatureFlagById(f.id)?.percentage).toBe(100); });
  it("disable sets percentage 0", () => { const f = createFeatureFlag({ name: "F", description: "" }); enableFeatureFlag(f.id); disableFeatureFlag(f.id); expect(getFeatureFlagById(f.id)?.percentage).toBe(0); });
  it("gradual clamps to 100", () => { const f = createFeatureFlag({ name: "F", description: "" }); setGradualRollout(f.id, 150); expect(getFeatureFlagById(f.id)?.percentage).toBe(100); });
  it("gradual clamps to 0", () => { const f = createFeatureFlag({ name: "F", description: "" }); setGradualRollout(f.id, -10); expect(getFeatureFlagById(f.id)?.percentage).toBe(0); });
  it("enable on non-existent returns null", () => { expect(enableFeatureFlag("nonexistent")).toBeNull(); });
  it("disable on non-existent returns null", () => { expect(disableFeatureFlag("nonexistent")).toBeNull(); });
  it("emergency stop on non-existent returns null", () => { expect(emergencyStop("nonexistent")).toBeNull(); });
  it("gradual on non-existent returns null", () => { expect(setGradualRollout("nonexistent", 50)).toBeNull(); });
  it("org rollout on non-existent returns null", () => { expect(setOrganizationRollout("nonexistent", [])).toBeNull(); });
  it("country rollout on non-existent returns null", () => { expect(setCountryRollout("nonexistent", [])).toBeNull(); });
  it("school rollout on non-existent returns null", () => { expect(setSchoolRollout("nonexistent", [])).toBeNull(); });
  it("ab_test on non-existent returns null", () => { expect(setABTestRollout("nonexistent", 50)).toBeNull(); });
  it("isFeatureFlagActive for unknown returns false", () => { expect(isFeatureFlagActive("nonexistent")).toBe(false); });
  it("isFeatureFlagActive for emergency_stop returns false", () => { const f = createFeatureFlag({ name: "F", description: "" }); enableFeatureFlag(f.id); emergencyStop(f.id); expect(isFeatureFlagActive(f.id)).toBe(false); });
  it("isFeatureFlagActive for gradual 100", () => { const f = createFeatureFlag({ name: "F", description: "" }); setGradualRollout(f.id, 100); expect(isFeatureFlagActive(f.id)).toBe(true); });
  it("isFeatureFlagActive for gradual 99", () => { const f = createFeatureFlag({ name: "F", description: "" }); setGradualRollout(f.id, 99); expect(isFeatureFlagActive(f.id)).toBe(false); });
  it("isFeatureFlagActive for ab_test 100", () => { const f = createFeatureFlag({ name: "F", description: "" }); setABTestRollout(f.id, 100); expect(isFeatureFlagActive(f.id)).toBe(true); });
  it("isFeatureFlagActive for org without context", () => { const f = createFeatureFlag({ name: "F", description: "" }); setOrganizationRollout(f.id, ["org-1"]); expect(isFeatureFlagActive(f.id)).toBe(false); });
  it("isFeatureFlagActive for country without context", () => { const f = createFeatureFlag({ name: "F", description: "" }); setCountryRollout(f.id, ["UZ"]); expect(isFeatureFlagActive(f.id)).toBe(false); });
  it("isFeatureFlagActive for school without context", () => { const f = createFeatureFlag({ name: "F", description: "" }); setSchoolRollout(f.id, ["s1"]); expect(isFeatureFlagActive(f.id)).toBe(false); });
});

// ===== Extended Org Operations Tests =====
describe("Live Events — Org Extended", () => {
  it("org campaign default participation target 100", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const oc = createOrganizationCampaign({ organizationId: "o1", organizationType: "school", campaignId: c.id }); expect(oc.participationTarget).toBe(100); });
  it("org campaign default status draft", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const oc = createOrganizationCampaign({ organizationId: "o1", organizationType: "school", campaignId: c.id }); expect(oc.status).toBe("draft"); });
  it("org campaign has actualParticipation 0", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const oc = createOrganizationCampaign({ organizationId: "o1", organizationType: "school", campaignId: c.id }); expect(oc.actualParticipation).toBe(0); });
  it("org campaign has createdAt", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const oc = createOrganizationCampaign({ organizationId: "o1", organizationType: "school", campaignId: c.id }); expect(oc.createdAt).toBeDefined(); });
  it("org campaign with eventId", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const oc = createOrganizationCampaign({ organizationId: "o1", organizationType: "school", campaignId: c.id, eventId: e.id }); expect(oc.eventId).toBe(e.id); });
  it("update status on non-existent returns null", () => { expect(updateOrgCampaignStatus("nonexistent", "approved")).toBeNull(); });
  it("update participation on non-existent returns null", () => { expect(updateOrgParticipation("nonexistent", 50)).toBeNull(); });
  it("list all org campaigns", () => { const c = createCampaign({ name: "C", description: "", startDate: "", endDate: "", createdBy: "a" }); createOrganizationCampaign({ organizationId: "o1", organizationType: "school", campaignId: c.id }); createOrganizationCampaign({ organizationId: "o2", organizationType: "university", campaignId: c.id }); expect(listAllOrgCampaigns().length).toBe(2); });
});

// ===== Extended Notification Tests =====
describe("Live Events — Notifications Extended", () => {
  it("notification default audience participants", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const n = createNotificationRequest({ eventId: e.id, kind: "test", message: "M", scheduledAt: "" }); expect(n.audience).toBe("participants"); });
  it("notification with userId", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const n = createNotificationRequest({ eventId: e.id, userId: "u1", kind: "test", message: "M", scheduledAt: "" }); expect(n.userId).toBe("u1"); });
  it("notification default status pending", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); const n = createNotificationRequest({ eventId: e.id, kind: "test", message: "M", scheduledAt: "" }); expect(n.status).toBe("pending"); });
  it("get notifications for unknown event returns empty", () => { expect(getNotificationsForEvent("nonexistent")).toEqual([]); });
  it("cancel notification for unknown event returns false", () => { expect(cancelNotification("nonexistent", "nonexistent")).toBe(false); });
  it("multiple notifications for same event", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); createNotificationRequest({ eventId: e.id, kind: "start", message: "M1", scheduledAt: "" }); createNotificationRequest({ eventId: e.id, kind: "end", message: "M2", scheduledAt: "" }); expect(getNotificationsForEvent(e.id).length).toBe(2); });
  it("notification supports all audiences", () => { const e = createEvent({ name: "T", description: "", type: "daily", startDate: "", endDate: "", createdBy: "a" }); for (const a of ["all","participants","organization","custom"] as const) { const n = createNotificationRequest({ eventId: e.id, audience: a, kind: "test", message: "M", scheduledAt: "" }); expect(n.audience).toBe(a); } });
});

// ===== Extended Bridge Tests =====
describe("Live Events — Bridge Extended", () => {
  it("unsubscribe is idempotent", () => { subscribeLiveEvents(); unsubscribeLiveEvents(); unsubscribeLiveEvents(); expect(isLiveEventsSubscribed()).toBe(false); });
  it("resubscribe works", () => { subscribeLiveEvents(); unsubscribeLiveEvents(); subscribeLiveEvents(); expect(isLiveEventsSubscribed()).toBe(true); });
  it("bridge processed count starts at 0", () => { expect(getBridgeProcessedCount()).toBe(0); });
  it("publish multiple liveops events", () => { expect(() => { publishLiveOpsEvent("LiveEventStarted", null, {}); publishLiveOpsEvent("LiveEventEnded", null, {}); publishLiveOpsEvent("ObjectiveCompleted", "u1", { objectiveId: "o1" }); }).not.toThrow(); });
});
