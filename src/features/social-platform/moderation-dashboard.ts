/** Systems 11, 12, 15, 16, 19, 20 — Privacy, Moderation, Teacher Controls,
 * Community Dashboard, Community Health, Developer Integration. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storePrivacySettings, getPrivacySettings,
  storeReport, getReport, getAllReports,
  storeAppeal, getAppeal, getAllAppeals,
  storeTeacherControls, getTeacherControls,
  storeCommunityHealth, getCommunityHealth, getAllCommunityHealth,
  getAllClubs, getClubMemberships, getAllProfiles,
  getAllChallenges,
} from "./repository";
import { getOnlineUsers, getPresenceCount } from "./presence-reputation";
import type {
  PrivacySettings, VisibilityLevel, TeacherControls, ParentControls, MinorProtections,
  CommunityReport, ReportSeverity, ReportStatus, ModerationAppeal,
  TeacherCommunityControls, TeacherActionAudit,
  CommunityDashboard, CommunityHealth,
  DeveloperIntegration, DeveloperAPIEndpoint, WebhookMeta, ExtensionHook, SDKMeta,
} from "./types";

const log = getLogger("social-platform.moderation");

// ===== System 11 — Social Privacy =====

export function setPrivacySettings(userId: string, settings: Partial<PrivacySettings>): PrivacySettings {
  const existing = getPrivacySettings(userId);
  const now = new Date().toISOString();
  const privacy: PrivacySettings = existing ?? {
    userId, profileVisibility: "public", presenceVisibility: "public",
    activityFeedVisibility: "friends", friendListVisibility: "friends",
    clubMembershipVisibility: "public", blockedUsers: [], mutedUsers: [],
    friendOnly: false, organizationOnly: false, clubOnly: false,
    teacherControls: { canViewProfile: true, canViewActivity: true, canRestrictClubs: false, canApproveFriends: false },
    parentControls: { canViewProfile: true, canViewActivity: true, canRestrictClubs: false, canApproveFriends: false, canSetPlayTime: false },
    minorProtections: { isMinor: false, restrictedVisibility: false, adultContentFiltered: true, messagingRestricted: false, friendRequestsRestricted: false },
  };
  Object.assign(privacy, settings);
  storePrivacySettings(privacy);
  return privacy;
}

export function getPrivacy(userId: string): PrivacySettings | null { return getPrivacySettings(userId); }

export function setProfileVisibility(userId: string, visibility: VisibilityLevel): boolean {
  const p = getPrivacySettings(userId);
  if (!p) return false;
  p.profileVisibility = visibility;
  storePrivacySettings(p);
  return true;
}

export function canViewProfile(viewerId: string, profileOwnerId: string): boolean {
  const privacy = getPrivacySettings(profileOwnerId);
  if (!privacy) return true; // Default to public
  if (privacy.blockedUsers.includes(viewerId)) return false;
  switch (privacy.profileVisibility) {
    case "public": return true;
    case "private": return viewerId === profileOwnerId;
    case "friends": return true; // Would check friend graph
    case "organization": return true; // Would check org membership
    case "club": return true; // Would check club membership
    default: return true;
  }
}

export function setMinorProtections(userId: string, isMinor: boolean): PrivacySettings | null {
  const p = getPrivacySettings(userId);
  if (!p) return null;
  p.minorProtections.isMinor = isMinor;
  p.minorProtections.restrictedVisibility = isMinor;
  p.minorProtections.adultContentFiltered = isMinor;
  p.minorProtections.messagingRestricted = isMinor;
  p.minorProtections.friendRequestsRestricted = isMinor;
  storePrivacySettings(p);
  return p;
}

// ===== System 12 — Community Moderation =====

export function fileReport(input: {
  reporterId: string; reportedId: string; reason: string; description: string;
  evidenceRefs?: string[]; severity: ReportSeverity;
}): CommunityReport {
  const report: CommunityReport = {
    id: randomUUID(), reporterId: input.reporterId, reportedId: input.reportedId,
    reason: input.reason, description: input.description,
    evidenceRefs: input.evidenceRefs ?? [], severity: input.severity,
    status: "pending", reviewedBy: null, reviewNote: null, recommendation: null,
    createdAt: new Date().toISOString(), reviewedAt: null,
  };
  storeReport(report);
  log.info("report.filed", { reportId: report.id, reportedId: input.reportedId });
  return report;
}

export function getReportById(id: string): CommunityReport | null { return getReport(id); }
export function listReports(status?: ReportStatus): CommunityReport[] {
  const all = getAllReports();
  return status ? all.filter(r => r.status === status) : all;
}

export function reviewReport(reportId: string, reviewerId: string, note: string, recommendation: string): CommunityReport | null {
  const r = getReport(reportId);
  if (!r || r.status !== "pending") return null;
  r.status = "resolved"; r.reviewedBy = reviewerId;
  r.reviewNote = note; r.recommendation = recommendation;
  r.reviewedAt = new Date().toISOString();
  storeReport(r);
  return r;
}

export function escalateReport(reportId: string): CommunityReport | null {
  const r = getReport(reportId);
  if (!r) return null;
  r.status = "escalated";
  storeReport(r);
  return r;
}

export function dismissReport(reportId: string): CommunityReport | null {
  const r = getReport(reportId);
  if (!r) return null;
  r.status = "dismissed";
  storeReport(r);
  return r;
}

export function fileAppeal(reportId: string, userId: string, reason: string): ModerationAppeal {
  const appeal: ModerationAppeal = {
    id: randomUUID(), reportId, userId, reason, status: "pending",
    reviewedBy: null, reviewedAt: null, createdAt: new Date().toISOString(),
  };
  storeAppeal(appeal);
  return appeal;
}

export function reviewAppeal(appealId: string, reviewerId: string, approved: boolean): ModerationAppeal | null {
  const a = getAppeal(appealId);
  if (!a || a.status !== "pending") return null;
  a.status = approved ? "approved" : "denied";
  a.reviewedBy = reviewerId;
  a.reviewedAt = new Date().toISOString();
  storeAppeal(a);
  return a;
}

export function listAppeals(): ModerationAppeal[] { return getAllAppeals(); }

// ===== System 15 — Teacher Community Controls =====

export function setTeacherControls(teacherId: string, controls: Partial<TeacherCommunityControls>): TeacherCommunityControls {
  const existing = getTeacherControls(teacherId);
  const now = new Date().toISOString();
  const tc: TeacherCommunityControls = existing ?? {
    teacherId, organizationId: null,
    canApproveClubs: true, canFreezeClubs: true, canLockCommunity: false,
    canDisableChallenges: true, canReviewReports: true, canModerate: true,
    auditLog: [],
  };
  Object.assign(tc, controls);
  storeTeacherControls(tc);
  return tc;
}

export function getTeacherControlRecord(teacherId: string): TeacherCommunityControls | null { return getTeacherControls(teacherId); }

export function logTeacherAction(teacherId: string, action: string, targetId: string | null, description: string): TeacherActionAudit {
  const tc = getTeacherControls(teacherId);
  const audit: TeacherActionAudit = { id: randomUUID(), action, targetId, description, timestamp: new Date().toISOString() };
  if (tc) { tc.auditLog.push(audit); storeTeacherControls(tc); }
  return audit;
}

// ===== System 16 — Community Dashboard =====

export function generateCommunityDashboard(userId?: string): CommunityDashboard {
  const presenceCounts = getPresenceCount();
  const allClubs = getAllClubs();
  const allChallenges = getAllChallenges();
  const allReports = getAllReports();
  const allAppeals = getAllAppeals();

  const clubHealth = allClubs.slice(0, 10).map(c => ({
    clubId: c.id, name: c.name,
    healthScore: c.status === "active" ? 80 : 50,
    memberCount: c.memberCount,
  }));

  return {
    friends: { total: 0, online: presenceCounts.online, recent: [] },
    presence: presenceCounts,
    clubHealth,
    challenges: {
      active: allChallenges.filter(c => c.status === "active").length,
      completed: allChallenges.filter(c => c.status === "completed").length,
      expired: allChallenges.filter(c => c.status === "expired").length,
    },
    reports: {
      pending: allReports.filter(r => r.status === "pending").length,
      resolved: allReports.filter(r => r.status === "resolved").length,
      escalated: allReports.filter(r => r.status === "escalated").length,
    },
    growth: { newFriends: 0, newClubMembers: 0, newActivities: 0 },
    moderation: {
      openReports: allReports.filter(r => r.status === "pending" || r.status === "reviewing").length,
      warnings: 0,
      appeals: allAppeals.filter(a => a.status === "pending").length,
    },
    engagement: { avgSessionLength: 0, activeUsers: presenceCounts.online, postsPerDay: 0 },
  };
}

// ===== System 19 — Community Health =====

export function computeClubHealth(clubId: string): CommunityHealth {
  const club = getAllClubs().find(c => c.id === clubId);
  const members = getClubMemberships(clubId);
  const memberCount = club?.memberCount ?? members.length;
  const now = new Date().toISOString();

  const activityScore = Math.min(100, memberCount * 5);
  const growthTrend = club && club.status === "active" ? (memberCount > 5 ? "growing" : "stable") : "declining";
  const memberRetention = club ? Math.min(1, memberCount / club.capacity) : 0;
  const participationScore = Math.min(100, memberCount * 3);
  const healthScore = Math.round((activityScore + participationScore) / 2);
  const status = healthScore >= 70 ? "healthy" : healthScore >= 40 ? "degraded" : "critical";

  const recommendations: string[] = [];
  if (healthScore < 70) recommendations.push("Increase club activity");
  if (memberCount < 5) recommendations.push("Recruit more members");
  if (club && club.status === "frozen") recommendations.push("Unfreeze the club to restore activity");

  const health: CommunityHealth = {
    clubId, activityScore, growthTrend, memberRetention,
    participationScore, healthScore, status, recommendations, updatedAt: now,
  };
  storeCommunityHealth(health);
  return health;
}

export function getClubHealth(clubId: string): CommunityHealth | null { return getCommunityHealth(clubId); }
export function getAllClubHealth(): CommunityHealth[] { return getAllCommunityHealth(); }

// ===== System 20 — Developer Integration =====

export function getDeveloperIntegration(): DeveloperIntegration {
  const apis: DeveloperAPIEndpoint[] = [
    { path: "/api/social/profiles", method: "GET", description: "Get social profiles", authRequired: true },
    { path: "/api/social/friends", method: "GET", description: "Get friend graph", authRequired: true },
    { path: "/api/social/presence", method: "GET", description: "Get user presence", authRequired: true },
    { path: "/api/social/clubs", method: "GET", description: "List clubs", authRequired: true },
    { path: "/api/social/teams", method: "GET", description: "List teams", authRequired: true },
    { path: "/api/social/activity", method: "GET", description: "Get activity feed", authRequired: true },
    { path: "/api/social/discovery", method: "GET", description: "Get discovery recommendations", authRequired: true },
  ];
  const eventContracts = [
    "FriendRequestSent", "FriendAccepted", "FriendRemoved",
    "ClubCreated", "ClubJoined", "ClubLeft", "ClubRoleChanged",
    "TeamCreated", "ChallengeCreated", "ChallengeCompleted",
    "PresenceChanged", "ReputationUpdated", "ProfileUpdated",
    "CommunityReported", "CommunityModerated",
  ];
  const webhooks: WebhookMeta[] = [];
  const hooks: ExtensionHook[] = [
    { id: "hook_friend_accepted", name: "On Friend Accepted", description: "Triggered when a friend request is accepted", triggerEvent: "FriendAccepted" },
    { id: "hook_club_joined", name: "On Club Joined", description: "Triggered when a user joins a club", triggerEvent: "ClubJoined" },
    { id: "hook_challenge_completed", name: "On Challenge Completed", description: "Triggered when a community challenge is completed", triggerEvent: "ChallengeCompleted" },
  ];
  const sdk: SDKMeta = {
    version: "1.0.0", language: "TypeScript",
    downloadUrl: "https://github.com/edubek/social-sdk",
    docsUrl: "https://docs.edubek.dev/social",
  };
  return {
    publicAPIs: apis, eventContracts, webhookMetadata: webhooks,
    extensionHooks: hooks, sdkMetadata: sdk,
    documentationUrl: "https://docs.edubek.dev/social",
  };
}
