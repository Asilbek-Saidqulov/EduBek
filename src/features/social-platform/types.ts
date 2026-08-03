/**
 * EduBek — Social Gaming, Community, Clubs & Collaboration Platform types.
 * Phase 6G.9: The single source of truth for every long-term social
 * relationship across the EduBek Gaming Platform.
 *
 * Architecture:
 *   The Social Platform is a PASSIVE Event Bus consumer. It NEVER imports
 *   from Universal Game Engine, Competitive Platform, Progression Platform,
 *   Replay, or Analytics. Instead it subscribes through event-bus-bridge.ts.
 *
 *   Every social update is derived from events.
 *   Never direct service-to-service communication.
 *
 * Ownership:
 *   OWNS: Friend graph, Club graph, Team graph, Community graph, Presence,
 *         Social identity, Reputation, Community challenges, Social discovery,
 *         Activity streams.
 *   DOES NOT OWN: Gameplay, Scoring, XP, Achievements, Ratings, Matchmaking,
 *                 Notifications, Messaging, Video, Voice.
 *
 * Strict rules:
 *   - Universal Game Engine untouched
 *   - Game Modes untouched
 *   - Competitive Platform untouched
 *   - Progression Platform untouched
 *   - Replay, Analytics, Event Registry, Event Governance untouched
 *   - Event Bus is the ONLY communication mechanism
 *   - No gameplay ownership
 *   - No duplicated rankings/XP/ratings/achievements/analytics
 */

// ===========================================================================
// System 1 — Player Social Profile
// ===========================================================================

export type VisibilityLevel = "public" | "friends" | "organization" | "club" | "private";

export interface SocialProfile {
  userId: string;
  displayName: string;
  bio: string | null;
  country: string | null;
  languages: string[];
  school: string | null;
  organization: string | null;
  avatarRef: string | null;
  bannerRef: string | null;
  verified: boolean;
  visibility: VisibilityLevel;
  customTitles: string[];
  profileBadges: string[];
  statsRefs: Record<string, string>;
  profileHistory: ProfileHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileHistoryEntry {
  id: string;
  kind: string;
  description: string;
  timestamp: string;
}

// ===========================================================================
// System 2 — Friend Graph
// ===========================================================================

export type FriendshipStatus = "pending" | "accepted" | "rejected" | "cancelled" | "removed";
export type FriendCategory = "default" | "close" | "favorite" | "school" | "club" | "team";

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  category: FriendCategory;
  createdAt: string;
  acceptedAt: string | null;
  history: RelationshipEvent[];
}

export interface RelationshipEvent {
  id: string;
  kind: "request_sent" | "accepted" | "rejected" | "cancelled" | "removed" | "blocked" | "unblocked" | "muted" | "unmuted" | "category_changed";
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface BlockRecord {
  id: string;
  userId: string;
  blockedId: string;
  createdAt: string;
}

export interface MuteRecord {
  id: string;
  userId: string;
  mutedId: string;
  createdAt: string;
}

// ===========================================================================
// System 3 — Presence Platform
// ===========================================================================

export type PresenceStatus =
  | "online" | "offline" | "away" | "busy"
  | "studying" | "playing" | "in_match" | "watching" | "invisible";

export interface Presence {
  userId: string;
  status: PresenceStatus;
  richPresence: RichPresence | null;
  lastSeen: string;
  sessionRef: string | null;
  updatedAt: string;
}

export interface RichPresence {
  activity: string;
  details: string | null;
  matchId: string | null;
  gameMode: string | null;
  clubId: string | null;
  startedAt: string;
}

// ===========================================================================
// System 4 — Club Platform
// ===========================================================================

export type ClubType = "organization" | "school" | "university" | "public" | "private";
export type ClubStatus = "active" | "frozen" | "locked" | "disbanded";

export interface Club {
  id: string;
  name: string;
  description: string;
  type: ClubType;
  ownerId: string;
  organizationId: string | null;
  schoolId: string | null;
  universityId: string | null;
  status: ClubStatus;
  memberCount: number;
  capacity: number;
  visibility: VisibilityLevel;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClubApplication {
  id: string;
  clubId: string;
  userId: string;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface ClubInvitation {
  id: string;
  clubId: string;
  inviterId: string;
  inviteeId: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
  expiresAt: string;
}

// ===========================================================================
// System 5 — Club Roles
// ===========================================================================

export type ClubRole = "owner" | "admin" | "moderator" | "teacher" | "coach" | "member" | "guest";

export interface ClubMembership {
  id: string;
  clubId: string;
  userId: string;
  role: ClubRole;
  permissions: string[];
  joinedAt: string;
  roleAssignedAt: string;
  delegatedBy: string | null;
}

export interface RolePermission {
  role: ClubRole;
  permissions: string[];
  inheritsFrom: ClubRole | null;
}

// ===========================================================================
// System 6 — Teams
// ===========================================================================

export type TeamType = "persistent" | "temporary";
export type TeamStatus = "active" | "disbanded" | "suspended";

export interface Team {
  id: string;
  name: string;
  type: TeamType;
  captainId: string;
  organizationId: string | null;
  clubId: string | null;
  status: TeamStatus;
  roster: TeamMember[];
  tournamentRefs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  userId: string;
  role: "captain" | "member";
  joinedAt: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  inviterId: string;
  inviteeId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

// ===========================================================================
// System 7 — Community Reputation
// ===========================================================================

export type ReputationCategory =
  | "sportsmanship" | "mentor" | "teacher_recognition"
  | "helpful" | "community_contributor" | "fair_play";

export interface ReputationScore {
  userId: string;
  scores: Record<ReputationCategory, number>;
  totalScore: number;
  reports: number;
  warnings: number;
  history: ReputationEvent[];
  updatedAt: string;
}

export interface ReputationEvent {
  id: string;
  category: ReputationCategory;
  delta: number;
  reason: string;
  awardedBy: string | null;
  timestamp: string;
}

// ===========================================================================
// System 8 — Community Challenges
// ===========================================================================

export type ChallengeScope = "friend" | "club" | "school" | "university" | "organization" | "regional" | "national" | "seasonal";
export type ChallengeStatus = "active" | "completed" | "expired" | "cancelled";

export interface CommunityChallenge {
  id: string;
  name: string;
  description: string;
  scope: ChallengeScope;
  scopeRef: string | null;
  target: number;
  metric: string;
  xpReward: number;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  participants: string[];
  progress: Record<string, number>;
  createdAt: string;
}

// ===========================================================================
// System 9 — Activity Feed
// ===========================================================================

export type ActivityKind =
  | "won_match" | "reached_level" | "unlocked_achievement"
  | "joined_club" | "left_club" | "won_tournament"
  | "new_record" | "challenge_completed" | "friend_accepted"
  | "club_created" | "team_created" | "rating_changed"
  | "season_completed" | "profile_updated";

export interface ActivityEntry {
  id: string;
  userId: string;
  kind: ActivityKind;
  title: string;
  description: string;
  timestamp: string;
  replayRef: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 10 — Community Discovery
// ===========================================================================

export interface DiscoveryResult {
  suggestedFriends: Array<{ userId: string; displayName: string; reason: string; mutualFriends: number }>;
  suggestedClubs: Array<{ clubId: string; name: string; reason: string; memberCount: number }>;
  suggestedTeams: Array<{ teamId: string; name: string; reason: string }>;
  trendingCommunities: Array<{ id: string; name: string; type: string; growth: number }>;
  popularSchools: Array<{ schoolId: string; name: string; memberCount: number }>;
  popularUniversities: Array<{ universityId: string; name: string; memberCount: number }>;
  popularOrganizations: Array<{ organizationId: string; name: string; memberCount: number }>;
}

// ===========================================================================
// System 11 — Social Privacy
// ===========================================================================

export interface PrivacySettings {
  userId: string;
  profileVisibility: VisibilityLevel;
  presenceVisibility: VisibilityLevel;
  activityFeedVisibility: VisibilityLevel;
  friendListVisibility: VisibilityLevel;
  clubMembershipVisibility: VisibilityLevel;
  blockedUsers: string[];
  mutedUsers: string[];
  friendOnly: boolean;
  organizationOnly: boolean;
  clubOnly: boolean;
  teacherControls: TeacherControls;
  parentControls: ParentControls;
  minorProtections: MinorProtections;
}

export interface TeacherControls {
  canViewProfile: boolean;
  canViewActivity: boolean;
  canRestrictClubs: boolean;
  canApproveFriends: boolean;
}

export interface ParentControls {
  canViewProfile: boolean;
  canViewActivity: boolean;
  canRestrictClubs: boolean;
  canApproveFriends: boolean;
  canSetPlayTime: boolean;
}

export interface MinorProtections {
  isMinor: boolean;
  restrictedVisibility: boolean;
  adultContentFiltered: boolean;
  messagingRestricted: boolean;
  friendRequestsRestricted: boolean;
}

// ===========================================================================
// System 12 — Community Moderation
// ===========================================================================

export type ReportSeverity = "low" | "medium" | "high" | "critical";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed" | "escalated";

export interface CommunityReport {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  description: string;
  evidenceRefs: string[];
  severity: ReportSeverity;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  recommendation: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface ModerationAppeal {
  id: string;
  reportId: string;
  userId: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

// ===========================================================================
// System 13 — Social Analytics
// ===========================================================================

export interface SocialAnalytics {
  totalUsers: number;
  totalFriendships: number;
  totalClubs: number;
  totalTeams: number;
  friendGraphGrowth: number;
  clubGrowth: number;
  activityRate: number;
  participationRate: number;
  challengeEngagement: number;
  communityHealthScore: number;
  retentionRate: number;
}

// ===========================================================================
// System 14 — Community Rankings
// ===========================================================================

export type RankingType =
  | "top_clubs" | "top_schools" | "top_universities"
  | "top_organizations" | "top_teams"
  | "most_active" | "most_helpful" | "most_competitive";

export interface CommunityRanking {
  type: RankingType;
  entries: Array<{ id: string; name: string; rank: number; score: number; metadata: Record<string, unknown> }>;
  updatedAt: string;
}

// ===========================================================================
// System 15 — Teacher Community Controls
// ===========================================================================

export interface TeacherCommunityControls {
  teacherId: string;
  organizationId: string | null;
  canApproveClubs: boolean;
  canFreezeClubs: boolean;
  canLockCommunity: boolean;
  canDisableChallenges: boolean;
  canReviewReports: boolean;
  canModerate: boolean;
  auditLog: TeacherActionAudit[];
}

export interface TeacherActionAudit {
  id: string;
  action: string;
  targetId: string | null;
  description: string;
  timestamp: string;
}

// ===========================================================================
// System 16 — Community Dashboard
// ===========================================================================

export interface CommunityDashboard {
  friends: { total: number; online: number; recent: string[] };
  presence: { online: number; away: number; busy: number; playing: number };
  clubHealth: Array<{ clubId: string; name: string; healthScore: number; memberCount: number }>;
  challenges: { active: number; completed: number; expired: number };
  reports: { pending: number; resolved: number; escalated: number };
  growth: { newFriends: number; newClubMembers: number; newActivities: number };
  moderation: { openReports: number; warnings: number; appeals: number };
  engagement: { avgSessionLength: number; activeUsers: number; postsPerDay: number };
}

// ===========================================================================
// System 17 — Community Event Bridge
// ===========================================================================

export interface BridgeSubscription {
  eventType: string;
  handler: (event: unknown) => void;
}

// ===========================================================================
// System 18 — Social Event Ownership
// ===========================================================================

export type SocialEventType =
  | "FriendRequestSent" | "FriendAccepted" | "FriendRemoved"
  | "ClubCreated" | "ClubJoined" | "ClubLeft" | "ClubRoleChanged"
  | "TeamCreated" | "ChallengeCreated" | "ChallengeCompleted"
  | "PresenceChanged" | "ReputationUpdated" | "ProfileUpdated"
  | "CommunityReported" | "CommunityModerated";

// ===========================================================================
// System 19 — Community Health
// ===========================================================================

export interface CommunityHealth {
  clubId: string;
  activityScore: number;
  growthTrend: "growing" | "stable" | "declining";
  memberRetention: number;
  participationScore: number;
  healthScore: number;
  status: "healthy" | "degraded" | "critical";
  recommendations: string[];
  updatedAt: string;
}

// ===========================================================================
// System 20 — Developer Integration
// ===========================================================================

export interface DeveloperIntegration {
  publicAPIs: DeveloperAPIEndpoint[];
  eventContracts: string[];
  webhookMetadata: WebhookMeta[];
  extensionHooks: ExtensionHook[];
  sdkMetadata: SDKMeta;
  documentationUrl: string;
}

export interface DeveloperAPIEndpoint {
  path: string;
  method: string;
  description: string;
  authRequired: boolean;
}

export interface WebhookMeta {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

export interface ExtensionHook {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
}

export interface SDKMeta {
  version: string;
  language: string;
  downloadUrl: string;
  docsUrl: string;
}
