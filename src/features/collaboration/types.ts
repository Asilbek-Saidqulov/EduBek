/**
 * EduBek — Collaboration feature types.
 *
 * Phase 4F.4: Collaborative Learning — Study Groups, Discussions,
 * Collaborative Notes, Classroom Intelligence, Organization
 * Intelligence, Peer Recommendations, Team Challenges, AI Teacher
 * Assistant, Mentorship, Announcements, Interventions, and the
 * Learning Network Graph.
 *
 * All DTOs are JSON-serializable so they can flow through API routes
 * and the notification system.
 */

// ---------------------------------------------------------------------------
// Study Groups
// ---------------------------------------------------------------------------

export type StudyGroupVisibility = "public" | "private" | "invite_only";
export type StudyGroupStatus = "active" | "archived" | "frozen";
export type StudyGroupMemberRole = "member" | "moderator" | "admin";
export type StudyGroupMemberStatus = "active" | "banned" | "left";

export interface StudyGroupDto {
  id: string;
  name: string;
  description: string | null;
  visibility: StudyGroupVisibility;
  ownerId: string;
  classroomId: string | null;
  organizationId: string | null;
  subject: string | null;
  groupXp: number;
  maxMembers: number;
  status: StudyGroupStatus;
  memberCount?: number;
  myRole?: StudyGroupMemberRole;
  createdAt: string;
  updatedAt: string;
}

export interface StudyGroupMemberDto {
  id: string;
  groupId: string;
  userId: string;
  role: StudyGroupMemberRole;
  joinedAt: string;
  groupXp: number;
  status: StudyGroupMemberStatus;
}

export interface GroupInvitationDto {
  id: string;
  groupId: string;
  invitedBy: string;
  inviteeId: string | null;
  inviteeEmail: string | null;
  status: "pending" | "accepted" | "declined" | "expired" | "revoked";
  token: string;
  message: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface GroupLeaderboardEntry {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  groupXp: number;
  rank: number;
}

// ---------------------------------------------------------------------------
// Discussions
// ---------------------------------------------------------------------------

export interface DiscussionDto {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  authorId: string | null;
  status: "open" | "closed" | "archived" | "locked";
  pinned: boolean;
  aiSummary: string | null;
  aiSummaryAt: string | null;
  replyCount: number;
  viewCount: number;
  lastReplyAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionReplyDto {
  id: string;
  discussionId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  bodyHtml: string | null;
  status: "visible" | "hidden" | "deleted";
  isAcceptedAnswer: boolean;
  acceptedBy: string | null;
  acceptedAt: string | null;
  toxicityScore: number | null;
  duplicateOfId: string | null;
  editCount: number;
  lastEditedAt: string | null;
  reactions: Array<{ emoji: string; count: number; reactedByMe: boolean }>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Collaborative Notes
// ---------------------------------------------------------------------------

export interface CollaborativeNoteDto {
  id: string;
  title: string;
  entityType: string | null;
  entityId: string | null;
  content: string;
  contentHtml: string | null;
  ownerId: string;
  visibility: "private" | "shared" | "classroom" | "group" | "public";
  classroomId: string | null;
  groupId: string | null;
  lastEditedBy: string | null;
  lastEditedAt: string | null;
  aiSummary: string | null;
  aiSummaryAt: string | null;
  activeEditors: string[];
  wordCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollaborativeNoteVersionDto {
  id: string;
  noteId: string;
  version: number;
  content: string;
  editedBy: string;
  editSummary: string | null;
  diffSize: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Teacher Recommendations + Interventions + Announcements
// ---------------------------------------------------------------------------

export type TeacherRecommendationType =
  | "intervention"
  | "enrichment"
  | "remediation"
  | "announcement"
  | "assignment"
  | "study_plan";

export interface TeacherRecommendationDto {
  id: string;
  teacherId: string;
  classroomId: string | null;
  type: TeacherRecommendationType;
  title: string;
  description: string | null;
  targetUserIds: string[];
  resources: Record<string, unknown>;
  rationale: string | null;
  rationaleKey: string | null;
  confidence: number;
  status: "pending" | "accepted" | "dismissed" | "applied";
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterventionDto {
  id: string;
  teacherId: string;
  classroomId: string | null;
  studentIds: string[];
  reason: string;
  reasonKey: string | null;
  description: string;
  actionPlan: Record<string, unknown>;
  confidence: number;
  status: "pending" | "active" | "resolved" | "dismissed";
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementDto {
  id: string;
  authorId: string;
  classroomId: string | null;
  groupId: string | null;
  organizationId: string | null;
  title: string;
  body: string;
  bodyHtml: string | null;
  status: "draft" | "published" | "archived";
  pinned: boolean;
  aiSummary: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export type ChallengeType = "weekly" | "monthly" | "tournament" | "season" | "department";
export type ChallengeMetric = "xp" | "questions_correct" | "topics_mastered" | "streak_days" | "study_minutes";
export type ChallengeRewardType = "xp" | "badge" | "certificate" | "marketplace_reward" | "org_points";

export interface LearningChallengeDto {
  id: string;
  title: string;
  description: string | null;
  type: ChallengeType;
  metric: ChallengeMetric;
  targetValue: number;
  organizationId: string | null;
  classroomId: string | null;
  groupId: string | null;
  department: string | null;
  rewardType: ChallengeRewardType;
  rewardValue: number;
  secondRewardType: ChallengeRewardType | null;
  secondRewardValue: number | null;
  startsAt: string;
  endsAt: string;
  status: "active" | "completed" | "cancelled";
  participantCount?: number;
  myProgress?: number;
  myRank?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeParticipationDto {
  id: string;
  challengeId: string;
  userId: string | null;
  groupId: string | null;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  rank: number | null;
  rewardGranted: boolean;
  rewardGrantedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeLeaderboardEntry {
  userId: string | null;
  groupId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  progress: number;
  rank: number;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Peer Recommendations + Mentorship
// ---------------------------------------------------------------------------

export type PeerRecommendationType =
  | "study_partner"
  | "mentor"
  | "mentee"
  | "helper"
  | "discussion_participant"
  | "project_teammate";

export interface PeerRecommendationDto {
  id: string;
  userId: string;
  peerId: string;
  type: PeerRecommendationType;
  score: number;
  signals: {
    sharedInterests?: string[];
    masteryOverlap?: number;
    languageMatch?: boolean;
    timezoneMatch?: boolean;
    subjectOverlap?: string[];
  };
  reason: string;
  reasonKey: string | null;
  status: "pending" | "accepted" | "dismissed";
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipDto {
  id: string;
  mentorId: string;
  menteeId: string;
  subject: string | null;
  status: "pending" | "active" | "paused" | "completed" | "ended";
  goals: string[];
  sessionsCount: number;
  lastSessionAt: string | null;
  endedAt: string | null;
  endReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export interface AtRiskStudent {
  userId: string;
  riskScore: number; // 0-1
  reason: string;
  reasonKey: string;
}

export interface ClassInsightDto {
  classroomId: string;
  day: string;
  studentCount: number;
  avgMastery: number;
  weakTopics: Array<{ topic: string; mastery: number }>;
  strongTopics: Array<{ topic: string; mastery: number }>;
  avgVelocity: number;
  engagementRate: number;
  atRiskStudents: AtRiskStudent[];
  totalStudyTimeMs: number;
  assignmentCompletionRate: number;
}

export interface OrganizationInsightDto {
  organizationId: string;
  day: string;
  departmentAnalytics: Record<string, {
    studentCount: number;
    avgMastery: number;
    engagementRate: number;
  }>;
  teacherAnalytics: Array<{
    teacherId: string;
    name: string | null;
    classroomCount: number;
    studentCount: number;
    avgMastery: number;
  }>;
  resourceUsage: {
    totalResources: number;
    topResources: Array<{ id: string; title: string; usageCount: number }>;
    aiGenerated: number;
    marketplacePurchased: number;
  };
  aiUsage: {
    totalSessions: number;
    totalCreditsUsed: number;
    topModels: Array<{ model: string; count: number }>;
  };
  certificationProgress: {
    totalEnrolled: number;
    totalCompleted: number;
    avgScore: number;
  };
  classComparison: Array<{
    classroomId: string;
    name: string;
    avgMastery: number;
    avgEngagement: number;
  }>;
  totalMembers: number;
  activeMembers: number;
}

// ---------------------------------------------------------------------------
// Network Graph
// ---------------------------------------------------------------------------

export type CollaborationEdgeType =
  | "MENTORS"
  | "COLLABORATES_WITH"
  | "MEMBER_OF"
  | "TEACHES"
  | "STUDIES_WITH"
  | "RECOMMENDED_FOR"
  | "ASSIGNED_TO"
  | "REVIEWS"
  | "DISCUSSES"
  | "HELPS";

export interface NetworkNodeDto {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  description: string | null;
}

export interface NetworkEdgeDto {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType: CollaborationEdgeType;
  weight: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NetworkGraphDto {
  nodes: NetworkNodeDto[];
  edges: NetworkEdgeDto[];
  totalCount: number;
}
