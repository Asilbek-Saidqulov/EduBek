/** Systems 4, 5, 6, 8 — Club Platform, Club Roles, Teams, Community Challenges. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeClub, getClub, getAllClubs,
  storeClubApp, getClubApps, storeClubInvite, getClubInvites,
  storeClubMembership, getClubMemberships, getClubMembershipsForUser,
  storeTeam, getTeam, getAllTeams, storeTeamInvite, getTeamInvites,
  storeChallenge, getChallenge, getAllChallenges,
} from "./repository";
import type {
  Club, ClubType, ClubStatus, ClubApplication, ClubInvitation,
  ClubRole, ClubMembership, RolePermission,
  Team, TeamType, TeamStatus, TeamMember, TeamInvitation,
  CommunityChallenge, ChallengeScope, ChallengeStatus, VisibilityLevel,
} from "./types";

const log = getLogger("social-platform.clubs");

// ===== System 4 — Club Platform =====

export function createClub(input: {
  name: string; description: string; type: ClubType; ownerId: string;
  organizationId?: string | null; schoolId?: string | null; universityId?: string | null;
  capacity?: number; visibility?: VisibilityLevel;
}): Club {
  const now = new Date().toISOString();
  const club: Club = {
    id: randomUUID(), name: input.name, description: input.description,
    type: input.type, ownerId: input.ownerId,
    organizationId: input.organizationId ?? null, schoolId: input.schoolId ?? null,
    universityId: input.universityId ?? null, status: "active",
    memberCount: 1, capacity: input.capacity ?? 50, visibility: input.visibility ?? "public",
    verified: false, createdAt: now, updatedAt: now,
  };
  storeClub(club);
  // Owner is automatically a member with owner role
  storeClubMembership({
    id: randomUUID(), clubId: club.id, userId: input.ownerId, role: "owner",
    permissions: ROLE_PERMISSIONS.owner.permissions, joinedAt: now, roleAssignedAt: now, delegatedBy: null,
  });
  log.info("club.created", { clubId: club.id, name: input.name });
  return club;
}

export function getClubById(id: string): Club | null { return getClub(id); }
export function listClubs(type?: ClubType): Club[] {
  const all = getAllClubs();
  return type ? all.filter(c => c.type === type) : all;
}

export function joinClub(clubId: string, userId: string): ClubMembership | null {
  const club = getClub(clubId);
  if (!club || club.status !== "active") return null;
  if (club.memberCount >= club.capacity) return null;
  const existing = getClubMemberships(clubId).find(m => m.userId === userId);
  if (existing) return null;
  const now = new Date().toISOString();
  const membership: ClubMembership = {
    id: randomUUID(), clubId, userId, role: "member",
    permissions: ROLE_PERMISSIONS.member.permissions, joinedAt: now, roleAssignedAt: now, delegatedBy: null,
  };
  storeClubMembership(membership);
  club.memberCount++; club.updatedAt = now; storeClub(club);
  return membership;
}

export function leaveClub(clubId: string, userId: string): boolean {
  const club = getClub(clubId);
  if (!club) return false;
  const members = getClubMemberships(clubId);
  const member = members.find(m => m.userId === userId);
  if (!member) return false;
  if (member.role === "owner") return false; // Owner can't leave — must transfer
  club.memberCount = Math.max(0, club.memberCount - 1);
  club.updatedAt = new Date().toISOString();
  storeClub(club);
  return true;
}

export function applyToClub(clubId: string, userId: string, message?: string): ClubApplication | null {
  const club = getClub(clubId);
  if (!club) return null;
  const app: ClubApplication = {
    id: randomUUID(), clubId, userId, status: "pending",
    message: message ?? null, createdAt: new Date().toISOString(),
    reviewedAt: null, reviewedBy: null,
  };
  storeClubApp(app);
  return app;
}

export function inviteToClub(clubId: string, inviterId: string, inviteeId: string): ClubInvitation | null {
  const club = getClub(clubId);
  if (!club) return null;
  const now = new Date().toISOString();
  const invite: ClubInvitation = {
    id: randomUUID(), clubId, inviterId, inviteeId, status: "pending",
    createdAt: now, expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  };
  storeClubInvite(invite);
  return invite;
}

export function getClubApplications(clubId: string): ClubApplication[] { return getClubApps(clubId); }
export function getClubInvitations(clubId: string): ClubInvitation[] { return getClubInvites(clubId); }
export function getClubMembers(clubId: string): ClubMembership[] { return getClubMemberships(clubId); }
export function getUserClubs(userId: string): ClubMembership[] { return getClubMembershipsForUser(userId); }

export function freezeClub(clubId: string): boolean {
  const club = getClub(clubId);
  if (!club) return false;
  club.status = "frozen"; club.updatedAt = new Date().toISOString(); storeClub(club);
  return true;
}

export function lockClub(clubId: string): boolean {
  const club = getClub(clubId);
  if (!club) return false;
  club.status = "locked"; club.updatedAt = new Date().toISOString(); storeClub(club);
  return true;
}

export function verifyClub(clubId: string): boolean {
  const club = getClub(clubId);
  if (!club) return false;
  club.verified = true; club.updatedAt = new Date().toISOString(); storeClub(club);
  return true;
}

// ===== System 5 — Club Roles =====

export const ROLE_PERMISSIONS: Record<ClubRole, RolePermission> = {
  owner: { role: "owner", permissions: ["all"], inheritsFrom: null },
  admin: { role: "admin", permissions: ["manage_members", "manage_roles", "edit_club", "create_events"], inheritsFrom: "owner" },
  moderator: { role: "moderator", permissions: ["manage_members", "create_events", "moderate_chat"], inheritsFrom: "admin" },
  teacher: { role: "teacher", permissions: ["create_events", "view_analytics", "manage_students"], inheritsFrom: "moderator" },
  coach: { role: "coach", permissions: ["create_events", "manage_team"], inheritsFrom: "moderator" },
  member: { role: "member", permissions: ["view_club", "participate"], inheritsFrom: null },
  guest: { role: "guest", permissions: ["view_club"], inheritsFrom: null },
};

export function assignRole(clubId: string, userId: string, role: ClubRole, delegatedBy: string): ClubMembership | null {
  const members = getClubMemberships(clubId);
  const member = members.find(m => m.userId === userId);
  if (!member) return null;
  const now = new Date().toISOString();
  member.role = role;
  member.permissions = ROLE_PERMISSIONS[role].permissions;
  member.roleAssignedAt = now;
  member.delegatedBy = delegatedBy;
  return member;
}

export function getRole(clubId: string, userId: string): ClubRole | null {
  const member = getClubMemberships(clubId).find(m => m.userId === userId);
  return member?.role ?? null;
}

export function hasPermission(clubId: string, userId: string, permission: string): boolean {
  const member = getClubMemberships(clubId).find(m => m.userId === userId);
  if (!member) return false;
  if (member.permissions.includes("all")) return true;
  return member.permissions.includes(permission);
}

// ===== System 6 — Teams =====

export function createTeam(input: {
  name: string; type: TeamType; captainId: string;
  organizationId?: string | null; clubId?: string | null;
}): Team {
  const now = new Date().toISOString();
  const team: Team = {
    id: randomUUID(), name: input.name, type: input.type,
    captainId: input.captainId, organizationId: input.organizationId ?? null,
    clubId: input.clubId ?? null, status: "active",
    roster: [{ userId: input.captainId, role: "captain", joinedAt: now }],
    tournamentRefs: [], createdAt: now, updatedAt: now,
  };
  storeTeam(team);
  log.info("team.created", { teamId: team.id, name: input.name });
  return team;
}

export function getTeamById(id: string): Team | null { return getTeam(id); }
export function listTeams(): Team[] { return getAllTeams(); }

export function addTeamMember(teamId: string, userId: string): TeamMember | null {
  const team = getTeam(teamId);
  if (!team || team.status !== "active") return null;
  if (team.roster.some(m => m.userId === userId)) return null;
  const member: TeamMember = { userId, role: "member", joinedAt: new Date().toISOString() };
  team.roster.push(member);
  team.updatedAt = new Date().toISOString();
  storeTeam(team);
  return member;
}

export function removeTeamMember(teamId: string, userId: string): boolean {
  const team = getTeam(teamId);
  if (!team) return false;
  if (userId === team.captainId) return false;
  const before = team.roster.length;
  team.roster = team.roster.filter(m => m.userId !== userId);
  if (team.roster.length < before) {
    team.updatedAt = new Date().toISOString();
    storeTeam(team);
    return true;
  }
  return false;
}

export function transferCaptain(teamId: string, newCaptainId: string): Team | null {
  const team = getTeam(teamId);
  if (!team) return null;
  if (!team.roster.some(m => m.userId === newCaptainId)) return null;
  const oldCaptain = team.roster.find(m => m.userId === team.captainId);
  if (oldCaptain) oldCaptain.role = "member";
  const newCaptain = team.roster.find(m => m.userId === newCaptainId);
  if (newCaptain) newCaptain.role = "captain";
  team.captainId = newCaptainId;
  team.updatedAt = new Date().toISOString();
  storeTeam(team);
  return team;
}

export function inviteToTeam(teamId: string, inviterId: string, inviteeId: string): TeamInvitation | null {
  const team = getTeam(teamId);
  if (!team) return null;
  const invite: TeamInvitation = {
    id: randomUUID(), teamId, inviterId, inviteeId, status: "pending",
    createdAt: new Date().toISOString(),
  };
  storeTeamInvite(invite);
  return invite;
}

export function getTeamInvitations(teamId: string): TeamInvitation[] { return getTeamInvites(teamId); }

export function addTournamentRef(teamId: string, tournamentId: string): boolean {
  const team = getTeam(teamId);
  if (!team) return false;
  if (!team.tournamentRefs.includes(tournamentId)) {
    team.tournamentRefs.push(tournamentId);
    team.updatedAt = new Date().toISOString();
    storeTeam(team);
  }
  return true;
}

export function disbandTeam(teamId: string): boolean {
  const team = getTeam(teamId);
  if (!team) return false;
  team.status = "disbanded";
  team.updatedAt = new Date().toISOString();
  storeTeam(team);
  return true;
}

// ===== System 8 — Community Challenges =====

export function createChallenge(input: {
  name: string; description: string; scope: ChallengeScope; scopeRef?: string | null;
  target: number; metric: string; xpReward?: number;
  startDate: string; endDate: string;
}): CommunityChallenge {
  const challenge: CommunityChallenge = {
    id: randomUUID(), name: input.name, description: input.description,
    scope: input.scope, scopeRef: input.scopeRef ?? null,
    target: input.target, metric: input.metric, xpReward: input.xpReward ?? 50,
    startDate: input.startDate, endDate: input.endDate, status: "active",
    participants: [], progress: {}, createdAt: new Date().toISOString(),
  };
  storeChallenge(challenge);
  log.info("challenge.created", { challengeId: challenge.id, name: input.name });
  return challenge;
}

export function getChallengeById(id: string): CommunityChallenge | null { return getChallenge(id); }
export function listChallenges(scope?: ChallengeScope): CommunityChallenge[] {
  const all = getAllChallenges();
  return scope ? all.filter(c => c.scope === scope) : all;
}

export function joinChallenge(challengeId: string, userId: string): boolean {
  const c = getChallenge(challengeId);
  if (!c || c.status !== "active") return false;
  if (!c.participants.includes(userId)) {
    c.participants.push(userId);
    c.progress[userId] = 0;
    storeChallenge(c);
  }
  return true;
}

export function updateChallengeProgress(challengeId: string, userId: string, progress: number): CommunityChallenge | null {
  const c = getChallenge(challengeId);
  if (!c || c.status !== "active") return null;
  c.progress[userId] = Math.max(c.progress[userId] ?? 0, progress);
  if (c.progress[userId] >= c.target) {
    c.status = "completed";
  }
  storeChallenge(c);
  return c;
}

export function cancelChallenge(challengeId: string): boolean {
  const c = getChallenge(challengeId);
  if (!c) return false;
  c.status = "cancelled";
  storeChallenge(c);
  return true;
}
