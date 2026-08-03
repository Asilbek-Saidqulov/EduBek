/**
 * EduBek — Collaboration repository.
 *
 * Direct Prisma access for all Phase 4F.4 models:
 *   StudyGroup, StudyGroupMember, GroupInvitation, Discussion,
 *   DiscussionReply, DiscussionReaction, CollaborativeNote,
 *   CollaborativeNoteVersion, TeacherRecommendation, Intervention,
 *   Announcement, LearningChallenge, ChallengeParticipation,
 *   PeerRecommendation, Mentorship, ClassInsight, OrganizationInsight.
 *
 * No business logic — pure data access.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Study Groups
// ---------------------------------------------------------------------------

export async function createStudyGroup(input: {
  name: string;
  description?: string;
  visibility?: string;
  ownerId: string;
  classroomId?: string;
  organizationId?: string;
  subject?: string;
  maxMembers?: number;
}) {
  return db.studyGroup.create({ data: input });
}

export async function findStudyGroup(id: string) {
  return db.studyGroup.findUnique({ where: { id } });
}

export async function findStudyGroups(input: {
  userId?: string;
  organizationId?: string;
  subject?: string;
  visibility?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.status) where.status = input.status;
  if (input.organizationId) where.organizationId = input.organizationId;
  if (input.subject) where.subject = input.subject;
  if (input.visibility) where.visibility = input.visibility;
  if (input.userId) where.members = { some: { userId: input.userId, status: "active" } };

  return db.studyGroup.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 50,
    skip: input.offset ?? 0,
  });
}

export async function updateStudyGroup(id: string, data: Record<string, unknown>) {
  return db.studyGroup.update({ where: { id }, data });
}

export async function findStudyGroupMember(groupId: string, userId: string) {
  return db.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function createStudyGroupMember(input: {
  groupId: string;
  userId: string;
  role?: string;
}) {
  return db.studyGroupMember.create({ data: input });
}

export async function updateStudyGroupMember(groupId: string, userId: string, data: Record<string, unknown>) {
  return db.studyGroupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data,
  });
}

export async function findStudyGroupMembers(groupId: string) {
  return db.studyGroupMember.findMany({
    where: { groupId, status: "active" },
    orderBy: { groupXp: "desc" },
  });
}

export async function countStudyGroupMembers(groupId: string) {
  return db.studyGroupMember.count({ where: { groupId, status: "active" } });
}

// ---------------------------------------------------------------------------
// Group Invitations
// ---------------------------------------------------------------------------

export async function createGroupInvitation(input: {
  groupId: string;
  invitedBy: string;
  inviteeId?: string;
  inviteeEmail?: string;
  message?: string;
  expiresAt?: Date;
}) {
  return db.groupInvitation.create({ data: input });
}

export async function findGroupInvitation(id: string) {
  return db.groupInvitation.findUnique({ where: { id } });
}

export async function findGroupInvitationByToken(token: string) {
  return db.groupInvitation.findUnique({ where: { token } });
}

export async function findGroupInvitations(input: {
  groupId?: string;
  inviteeId?: string;
  status?: string;
}) {
  return db.groupInvitation.findMany({
    where: input,
    orderBy: { createdAt: "desc" },
  });
}

export async function updateGroupInvitation(id: string, data: Record<string, unknown>) {
  return db.groupInvitation.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Discussions
// ---------------------------------------------------------------------------

export async function createDiscussion(input: {
  entityType: string;
  entityId: string;
  title: string;
  authorId?: string;
  pinned?: boolean;
}) {
  return db.discussion.create({ data: input });
}

export async function findDiscussion(id: string) {
  return db.discussion.findUnique({ where: { id } });
}

export async function findDiscussions(input: {
  entityType?: string;
  entityId?: string;
  authorId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return db.discussion.findMany({
    where: input,
    orderBy: [{ pinned: "desc" }, { lastReplyAt: "desc" }, { createdAt: "desc" }],
    take: input.limit ?? 50,
    skip: input.offset ?? 0,
  });
}

export async function updateDiscussion(id: string, data: Record<string, unknown>) {
  return db.discussion.update({ where: { id }, data });
}

export async function createDiscussionReply(input: {
  discussionId: string;
  authorId: string;
  parentId?: string;
  body: string;
  bodyHtml?: string;
}) {
  return db.discussionReply.create({ data: input });
}

export async function findDiscussionReply(id: string) {
  return db.discussionReply.findUnique({ where: { id } });
}

export async function findDiscussionReplies(discussionId: string, limit = 100) {
  return db.discussionReply.findMany({
    where: { discussionId, status: "visible" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function updateDiscussionReply(id: string, data: Record<string, unknown>) {
  return db.discussionReply.update({ where: { id }, data });
}

export async function createDiscussionReaction(input: {
  replyId: string;
  userId: string;
  emoji: string;
}) {
  return db.discussionReaction.create({ data: input });
}

export async function deleteDiscussionReaction(replyId: string, userId: string, emoji: string) {
  return db.discussionReaction.deleteMany({
    where: { replyId, userId, emoji },
  });
}

export async function findDiscussionReactions(replyId: string) {
  return db.discussionReaction.findMany({ where: { replyId } });
}

// ---------------------------------------------------------------------------
// Collaborative Notes
// ---------------------------------------------------------------------------

export async function createNote(input: {
  title: string;
  entityType?: string;
  entityId?: string;
  ownerId: string;
  visibility?: string;
  classroomId?: string;
  groupId?: string;
  content?: string;
  wordCount?: number;
}) {
  return db.collaborativeNote.create({ data: input });
}

export async function findNote(id: string) {
  return db.collaborativeNote.findUnique({ where: { id } });
}

export async function findNotes(input: {
  ownerId?: string;
  classroomId?: string;
  groupId?: string;
  entityType?: string;
  entityId?: string;
  visibility?: string;
  limit?: number;
}) {
  return db.collaborativeNote.findMany({
    where: input,
    orderBy: { updatedAt: "desc" },
    take: input.limit ?? 50,
  });
}

export async function updateNote(id: string, data: Record<string, unknown>) {
  return db.collaborativeNote.update({ where: { id }, data });
}

export async function createNoteVersion(input: {
  noteId: string;
  version: number;
  content: string;
  editedBy: string;
  editSummary?: string;
  diffSize?: number;
}) {
  return db.collaborativeNoteVersion.create({ data: input });
}

export async function findNoteVersions(noteId: string, limit = 50) {
  return db.collaborativeNoteVersion.findMany({
    where: { noteId },
    orderBy: { version: "desc" },
    take: limit,
  });
}

export async function findNoteVersion(noteId: string, version: number) {
  return db.collaborativeNoteVersion.findUnique({
    where: { noteId_version: { noteId, version } },
  });
}

// ---------------------------------------------------------------------------
// Teacher Recommendations
// ---------------------------------------------------------------------------

export async function createTeacherRecommendation(input: {
  teacherId: string;
  classroomId?: string;
  type: string;
  title: string;
  description?: string;
  targetUserIds?: string;
  resources?: string;
  rationale?: string;
  rationaleKey?: string;
  confidence?: number;
}) {
  return db.teacherRecommendation.create({ data: input });
}

export async function findTeacherRecommendations(input: {
  teacherId?: string;
  classroomId?: string;
  type?: string;
  status?: string;
  limit?: number;
}) {
  return db.teacherRecommendation.findMany({
    where: input,
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 50,
  });
}

export async function findTeacherRecommendation(id: string) {
  return db.teacherRecommendation.findUnique({ where: { id } });
}

export async function updateTeacherRecommendation(id: string, data: Record<string, unknown>) {
  return db.teacherRecommendation.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Interventions
// ---------------------------------------------------------------------------

export async function createIntervention(input: {
  teacherId: string;
  classroomId?: string;
  studentIds?: string;
  reason: string;
  reasonKey?: string;
  description: string;
  actionPlan?: string;
  confidence?: number;
}) {
  return db.intervention.create({ data: input });
}

export async function findInterventions(input: {
  teacherId?: string;
  classroomId?: string;
  reason?: string;
  status?: string;
  limit?: number;
}) {
  return db.intervention.findMany({
    where: input,
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 50,
  });
}

export async function findIntervention(id: string) {
  return db.intervention.findUnique({ where: { id } });
}

export async function updateIntervention(id: string, data: Record<string, unknown>) {
  return db.intervention.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export async function createAnnouncement(input: {
  authorId: string;
  classroomId?: string;
  groupId?: string;
  organizationId?: string;
  title: string;
  body: string;
  bodyHtml?: string;
  pinned?: boolean;
  publishedAt?: Date;
  status?: string;
}) {
  return db.announcement.create({ data: input });
}

export async function findAnnouncement(id: string) {
  return db.announcement.findUnique({ where: { id } });
}

export async function findAnnouncements(input: {
  authorId?: string;
  classroomId?: string;
  groupId?: string;
  organizationId?: string;
  status?: string;
  limit?: number;
}) {
  return db.announcement.findMany({
    where: input,
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: input.limit ?? 50,
  });
}

export async function updateAnnouncement(id: string, data: Record<string, unknown>) {
  return db.announcement.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Challenges + Participation
// ---------------------------------------------------------------------------

export async function createChallenge(input: {
  title: string;
  description?: string;
  type: string;
  metric: string;
  targetValue: number;
  organizationId?: string;
  classroomId?: string;
  groupId?: string;
  department?: string;
  rewardType?: string;
  rewardValue?: number;
  secondRewardType?: string;
  secondRewardValue?: number;
  startsAt: Date;
  endsAt: Date;
}) {
  return db.learningChallenge.create({ data: input });
}

export async function findChallenge(id: string) {
  return db.learningChallenge.findUnique({ where: { id } });
}

export async function findChallenges(input: {
  organizationId?: string;
  classroomId?: string;
  groupId?: string;
  type?: string;
  status?: string;
  limit?: number;
}) {
  return db.learningChallenge.findMany({
    where: input,
    orderBy: { startsAt: "desc" },
    take: input.limit ?? 50,
  });
}

export async function updateChallenge(id: string, data: Record<string, unknown>) {
  return db.learningChallenge.update({ where: { id }, data });
}

export async function findChallengeParticipation(challengeId: string, userId: string) {
  return db.challengeParticipation.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
  });
}

export async function findGroupChallengeParticipation(challengeId: string, groupId: string) {
  return db.challengeParticipation.findUnique({
    where: { challengeId_groupId: { challengeId, groupId } },
  });
}

export async function upsertChallengeParticipation(input: {
  challengeId: string;
  userId?: string;
  groupId?: string;
  progress?: number;
  completed?: boolean;
  completedAt?: Date;
  rank?: number;
}) {
  // Upsert key depends on whether userId or groupId is provided.
  if (input.userId) {
    return db.challengeParticipation.upsert({
      where: { challengeId_userId: { challengeId: input.challengeId, userId: input.userId } },
      create: input as any,
      update: input as any,
    });
  }
  if (input.groupId) {
    return db.challengeParticipation.upsert({
      where: { challengeId_groupId: { challengeId: input.challengeId, groupId: input.groupId } },
      create: input as any,
      update: input as any,
    });
  }
  throw new Error("Either userId or groupId is required for challenge participation");
}

export async function findChallengeLeaderboard(challengeId: string, limit = 50) {
  return db.challengeParticipation.findMany({
    where: { challengeId },
    orderBy: [{ completed: "desc" }, { progress: "desc" }],
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Peer Recommendations + Mentorship
// ---------------------------------------------------------------------------

export async function createPeerRecommendation(input: {
  userId: string;
  peerId: string;
  type: string;
  score: number;
  signals?: string;
  reason: string;
  reasonKey?: string;
}) {
  return db.peerRecommendation.upsert({
    where: {
      userId_peerId_type: {
        userId: input.userId,
        peerId: input.peerId,
        type: input.type,
      },
    },
    create: input,
    update: {
      score: input.score,
      signals: input.signals,
      reason: input.reason,
      reasonKey: input.reasonKey,
    },
  });
}

export async function findPeerRecommendations(input: {
  userId?: string;
  type?: string;
  status?: string;
  limit?: number;
}) {
  return db.peerRecommendation.findMany({
    where: input,
    orderBy: { score: "desc" },
    take: input.limit ?? 20,
  });
}

export async function updatePeerRecommendation(id: string, data: Record<string, unknown>) {
  return db.peerRecommendation.update({ where: { id }, data });
}

export async function createMentorship(input: {
  mentorId: string;
  menteeId: string;
  subject?: string;
  goals?: string;
}) {
  return db.mentorship.create({ data: input });
}

export async function findMentorship(id: string) {
  return db.mentorship.findUnique({ where: { id } });
}

export async function findMentorships(input: {
  mentorId?: string;
  menteeId?: string;
  subject?: string;
  status?: string;
  limit?: number;
}) {
  return db.mentorship.findMany({
    where: input,
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 50,
  });
}

export async function updateMentorship(id: string, data: Record<string, unknown>) {
  return db.mentorship.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export async function upsertClassInsight(input: {
  classroomId: string;
  day: Date;
  studentCount?: number;
  avgMastery?: number;
  weakTopics?: string;
  strongTopics?: string;
  avgVelocity?: number;
  engagementRate?: number;
  atRiskStudents?: string;
  totalStudyTimeMs?: number;
  assignmentCompletionRate?: number;
}) {
  return db.classInsight.upsert({
    where: {
      classroomId_day: { classroomId: input.classroomId, day: input.day },
    },
    create: input,
    update: input,
  });
}

export async function findClassInsight(classroomId: string, day?: Date) {
  if (day) {
    return db.classInsight.findUnique({
      where: { classroomId_day: { classroomId, day } },
    });
  }
  // Latest
  return db.classInsight.findFirst({
    where: { classroomId },
    orderBy: { day: "desc" },
  });
}

export async function findClassInsightsRange(classroomId: string, from: Date, to: Date) {
  return db.classInsight.findMany({
    where: { classroomId, day: { gte: from, lte: to } },
    orderBy: { day: "asc" },
  });
}

export async function upsertOrganizationInsight(input: {
  organizationId: string;
  day: Date;
  departmentAnalytics?: string;
  teacherAnalytics?: string;
  resourceUsage?: string;
  aiUsage?: string;
  certificationProgress?: string;
  classComparison?: string;
  totalMembers?: number;
  activeMembers?: number;
}) {
  return db.organizationInsight.upsert({
    where: {
      organizationId_day: { organizationId: input.organizationId, day: input.day },
    },
    create: input,
    update: input,
  });
}

export async function findOrganizationInsight(organizationId: string, day?: Date) {
  if (day) {
    return db.organizationInsight.findUnique({
      where: { organizationId_day: { organizationId, day } },
    });
  }
  return db.organizationInsight.findFirst({
    where: { organizationId },
    orderBy: { day: "desc" },
  });
}
