/**
 * EduBek — Study Groups service.
 *
 * Phase 4F.4: Public / private / invite-only study groups with roles,
 * XP-based leaderboards, invitations, and integration with the
 * Learning Network Graph (MEMBER_OF edges).
 *
 * Reuses:
 *   • NotificationService for invite notifications
 *   • Knowledge Graph for MEMBER_OF / COLLABORATES_WITH edges
 *   • Recommendation Engine for group recommendations
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { notificationService } from "@/infra/notifications";
import * as repo from "./repository";
import { addCollaborationEdge, removeCollaborationEdge } from "./network-graph";
import type {
  GroupInvitationDto,
  GroupLeaderboardEntry,
  StudyGroupDto,
  StudyGroupMemberDto,
} from "./types";

const log = getLogger("study-groups");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mapGroup(g: any, memberCount?: number, myRole?: string): StudyGroupDto {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    visibility: g.visibility,
    ownerId: g.ownerId,
    classroomId: g.classroomId,
    organizationId: g.organizationId,
    subject: g.subject,
    groupXp: g.groupXp,
    maxMembers: g.maxMembers,
    status: g.status,
    memberCount,
    myRole: myRole as StudyGroupDto["myRole"],
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

function mapMember(m: any): StudyGroupMemberDto {
  return {
    id: m.id,
    groupId: m.groupId,
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    groupXp: m.groupXp,
    status: m.status,
  };
}

function mapInvitation(i: any): GroupInvitationDto {
  return {
    id: i.id,
    groupId: i.groupId,
    invitedBy: i.invitedBy,
    inviteeId: i.inviteeId,
    inviteeEmail: i.inviteeEmail,
    status: i.status,
    token: i.token,
    message: i.message,
    expiresAt: i.expiresAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createStudyGroup(input: {
  ownerId: string;
  name: string;
  description?: string;
  visibility?: "public" | "private" | "invite_only";
  classroomId?: string;
  organizationId?: string;
  subject?: string;
  maxMembers?: number;
}): Promise<StudyGroupDto> {
  const group = await repo.createStudyGroup({
    name: input.name,
    description: input.description,
    visibility: input.visibility ?? "public",
    ownerId: input.ownerId,
    classroomId: input.classroomId,
    organizationId: input.organizationId,
    subject: input.subject,
    maxMembers: input.maxMembers ?? 50,
  });

  // Owner becomes an admin member
  await repo.createStudyGroupMember({
    groupId: group.id,
    userId: input.ownerId,
    role: "admin",
  });

  // Add MEMBER_OF edge to the network graph
  await addCollaborationEdge({
    fromEntityType: "user",
    fromEntityId: input.ownerId,
    fromTitle: "User",
    toEntityType: "study_group",
    toEntityId: group.id,
    toTitle: group.name,
    edgeType: "MEMBER_OF",
    weight: 1.5, // admin membership is a stronger tie
    metadata: { role: "admin" },
  });

  log.info("study_group.created", { groupId: group.id, ownerId: input.ownerId });

  return mapGroup(group, 1, "admin");
}

export async function getStudyGroup(id: string, userId?: string): Promise<StudyGroupDto | null> {
  const group = await repo.findStudyGroup(id);
  if (!group) return null;
  const memberCount = await repo.countStudyGroupMembers(id);
  let myRole: string | undefined;
  if (userId) {
    const myMembership = await repo.findStudyGroupMember(id, userId);
    myRole = myMembership?.role;
  }
  return mapGroup(group, memberCount, myRole);
}

export async function listStudyGroups(input: {
  userId?: string;
  organizationId?: string;
  subject?: string;
  visibility?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ groups: StudyGroupDto[]; total: number }> {
  const groups = await repo.findStudyGroups(input);
  const result: StudyGroupDto[] = [];
  for (const g of groups) {
    const memberCount = await repo.countStudyGroupMembers(g.id);
    let myRole: string | undefined;
    if (input.userId) {
      const m = await repo.findStudyGroupMember(g.id, input.userId);
      myRole = m?.role;
    }
    result.push(mapGroup(g, memberCount, myRole));
  }
  return { groups: result, total: result.length };
}

export async function updateStudyGroup(id: string, input: {
  name?: string;
  description?: string;
  visibility?: "public" | "private" | "invite_only";
  maxMembers?: number;
  status?: "active" | "archived" | "frozen";
  ownerId?: string;
}): Promise<StudyGroupDto> {
  const group = await repo.updateStudyGroup(id, input);
  return mapGroup(group);
}

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------

export async function joinStudyGroup(groupId: string, userId: string): Promise<StudyGroupMemberDto> {
  const group = await repo.findStudyGroup(groupId);
  if (!group) throw new Error("Group not found");
  if (group.status !== "active") throw new Error("Group is not active");
  if (group.visibility === "invite_only") {
    throw new Error("This group is invite-only — request an invitation");
  }

  const existing = await repo.findStudyGroupMember(groupId, userId);
  if (existing) {
    if (existing.status === "active") throw new Error("Already a member");
    // Reactivate
    const reactivated = await repo.updateStudyGroupMember(groupId, userId, { status: "active" });
    return mapMember(reactivated);
  }

  const memberCount = await repo.countStudyGroupMembers(groupId);
  if (memberCount >= group.maxMembers) {
    throw new Error("Group is at capacity");
  }

  const member = await repo.createStudyGroupMember({ groupId, userId, role: "member" });

  // Add MEMBER_OF edge
  await addCollaborationEdge({
    fromEntityType: "user",
    fromEntityId: userId,
    fromTitle: "User",
    toEntityType: "study_group",
    toEntityId: groupId,
    toTitle: group.name,
    edgeType: "MEMBER_OF",
    weight: 1,
    metadata: { role: "member" },
  });

  log.info("study_group.joined", { groupId, userId });
  return mapMember(member);
}

export async function leaveStudyGroup(groupId: string, userId: string): Promise<void> {
  const membership = await repo.findStudyGroupMember(groupId, userId);
  if (!membership) return;
  if (membership.role === "admin") {
    // Don't let the last admin leave without transferring ownership
    const otherAdmins = await db.studyGroupMember.count({
      where: { groupId, role: "admin", status: "active", userId: { not: userId } },
    });
    if (otherAdmins === 0) {
      throw new Error("Cannot leave — you are the only admin. Transfer ownership first.");
    }
  }

  await repo.updateStudyGroupMember(groupId, userId, { status: "left" });

  // Remove MEMBER_OF edge
  await removeCollaborationEdge({
    fromEntityType: "user",
    fromEntityId: userId,
    toEntityType: "study_group",
    toEntityId: groupId,
    edgeType: "MEMBER_OF",
  });

  log.info("study_group.left", { groupId, userId });
}

export async function listStudyGroupMembers(groupId: string): Promise<StudyGroupMemberDto[]> {
  const members = await repo.findStudyGroupMembers(groupId);
  return members.map(mapMember);
}

export async function updateMemberRole(
  groupId: string,
  userId: string,
  role: "member" | "moderator" | "admin",
  actingUserId: string,
): Promise<StudyGroupMemberDto> {
  const actor = await repo.findStudyGroupMember(groupId, actingUserId);
  if (!actor || actor.role !== "admin") {
    throw new Error("Only admins can change member roles");
  }
  const updated = await repo.updateStudyGroupMember(groupId, userId, { role });
  return mapMember(updated);
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export async function inviteUser(input: {
  groupId: string;
  invitedBy: string;
  inviteeId?: string;
  inviteeEmail?: string;
  message?: string;
  expiresInDays?: number;
}): Promise<GroupInvitationDto> {
  const group = await repo.findStudyGroup(input.groupId);
  if (!group) throw new Error("Group not found");

  // Verify inviter is an admin or moderator
  const inviter = await repo.findStudyGroupMember(input.groupId, input.invitedBy);
  if (!inviter || !["admin", "moderator"].includes(inviter.role)) {
    throw new Error("Only admins and moderators can send invitations");
  }

  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days

  const invitation = await repo.createGroupInvitation({
    groupId: input.groupId,
    invitedBy: input.invitedBy,
    inviteeId: input.inviteeId,
    inviteeEmail: input.inviteeEmail,
    message: input.message,
    expiresAt,
  });

  // Notify invitee
  if (input.inviteeId) {
    await notificationService.send({
      userId: input.inviteeId,
      type: "study_group.invitation_received",
      title: `You've been invited to "${group.name}"`,
      body: input.message ?? "You have a new study group invitation.",
      data: { groupId: input.groupId, invitationId: invitation.id, token: invitation.token },
    }).catch(() => undefined);
  }

  log.info("study_group.invitation_sent", {
    groupId: input.groupId,
    inviteeId: input.inviteeId,
    inviteeEmail: input.inviteeEmail,
  });

  return mapInvitation(invitation);
}

export async function acceptInvitation(token: string, userId: string): Promise<StudyGroupMemberDto> {
  const invitation = await repo.findGroupInvitationByToken(token);
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.status !== "pending") throw new Error(`Invitation already ${invitation.status}`);
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    await repo.updateGroupInvitation(invitation.id, { status: "expired" });
    throw new Error("Invitation has expired");
  }
  if (invitation.inviteeId && invitation.inviteeId !== userId) {
    throw new Error("This invitation is for a different user");
  }

  // Mark accepted
  await repo.updateGroupInvitation(invitation.id, { status: "accepted" });

  // Add user to group
  return joinStudyGroup(invitation.groupId, userId);
}

export async function declineInvitation(token: string): Promise<void> {
  const invitation = await repo.findGroupInvitationByToken(token);
  if (!invitation) throw new Error("Invitation not found");
  await repo.updateGroupInvitation(invitation.id, { status: "declined" });
}

export async function listInvitations(input: {
  groupId?: string;
  inviteeId?: string;
  status?: string;
}): Promise<GroupInvitationDto[]> {
  const invitations = await repo.findGroupInvitations(input);
  return invitations.map(mapInvitation);
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export async function getGroupLeaderboard(groupId: string, limit = 50): Promise<GroupLeaderboardEntry[]> {
  const members = await repo.findStudyGroupMembers(groupId);
  const userIds = members.map((m) => m.userId);
  if (userIds.length === 0) return [];

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, username: true, avatarUrl: true },
  });

  const ranked = members
    .map((m) => {
      const user = users.find((u) => u.id === m.userId);
      return {
        userId: m.userId,
        displayName: user?.name ?? user?.username ?? null,
        avatarUrl: user?.avatarUrl ?? null,
        groupXp: m.groupXp,
        rank: 0, // assigned below
      };
    })
    .sort((a, b) => b.groupXp - a.groupXp);

  ranked.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return ranked.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Group XP
// ---------------------------------------------------------------------------

export async function awardGroupXp(groupId: string, userId: string, xp: number): Promise<void> {
  await db.studyGroupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { groupXp: { increment: xp } },
  });
  await db.studyGroup.update({
    where: { id: groupId },
    data: { groupXp: { increment: xp } },
  });
  log.info("study_group.xp_awarded", { groupId, userId, xp });
}
