/** Social Gaming Platform barrel export. Phase 6G.9. */
export * from "./service";

export type {
  SocialProfile, ProfileHistoryEntry, VisibilityLevel,
  Friendship, FriendshipStatus, FriendCategory, RelationshipEvent, BlockRecord, MuteRecord,
  Presence, PresenceStatus, RichPresence,
  Club, ClubType, ClubStatus, ClubApplication, ClubInvitation,
  ClubRole, ClubMembership, RolePermission,
  Team, TeamType, TeamStatus, TeamMember, TeamInvitation,
  ReputationScore, ReputationCategory, ReputationEvent,
  CommunityChallenge, ChallengeScope, ChallengeStatus,
  ActivityEntry, ActivityKind,
  DiscoveryResult,
  SocialAnalytics,
  CommunityRanking, RankingType,
  PrivacySettings, TeacherControls, ParentControls, MinorProtections,
  CommunityReport, ReportSeverity, ReportStatus, ModerationAppeal,
  TeacherCommunityControls, TeacherActionAudit,
  CommunityDashboard, CommunityHealth,
  DeveloperIntegration, DeveloperAPIEndpoint, WebhookMeta, ExtensionHook, SDKMeta,
  SocialEventType,
} from "./types";
