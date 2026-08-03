/** In-memory repository for the Social Platform. All Maps can swap to Redis. */
import type {
  SocialProfile, Friendship, BlockRecord, MuteRecord,
  Presence, Club, ClubApplication, ClubInvitation, ClubMembership,
  Team, TeamInvitation, ReputationScore, CommunityChallenge,
  ActivityEntry, PrivacySettings, CommunityReport, ModerationAppeal,
  TeacherCommunityControls, CommunityHealth,
} from "./types";

const profiles = new Map<string, SocialProfile>();
const friendships = new Map<string, Friendship>();
const friendshipsByUser = new Map<string, Set<string>>();
const blocks = new Map<string, BlockRecord[]>();
const mutes = new Map<string, MuteRecord[]>();
const presences = new Map<string, Presence>();
const clubs = new Map<string, Club>();
const clubApps = new Map<string, ClubApplication[]>();
const clubInvites = new Map<string, ClubInvitation[]>();
const clubMembers = new Map<string, ClubMembership[]>();
const teams = new Map<string, Team>();
const teamInvites = new Map<string, TeamInvitation[]>();
const reputations = new Map<string, ReputationScore>();
const challenges = new Map<string, CommunityChallenge>();
const activities = new Map<string, ActivityEntry[]>();
const privacySettings = new Map<string, PrivacySettings>();
const reports = new Map<string, CommunityReport>();
const appeals = new Map<string, ModerationAppeal>();
const teacherControls = new Map<string, TeacherCommunityControls>();
const communityHealth = new Map<string, CommunityHealth>();

// Profile operations
export function storeProfile(p: SocialProfile) { profiles.set(p.userId, p); }
export function getProfile(userId: string) { return profiles.get(userId) ?? null; }
export function getAllProfiles() { return Array.from(profiles.values()); }

// Friendship operations
export function storeFriendship(f: Friendship) {
  friendships.set(f.id, f);
  const u1 = friendshipsByUser.get(f.userId) ?? new Set();
  u1.add(f.id); friendshipsByUser.set(f.userId, u1);
  const u2 = friendshipsByUser.get(f.friendId) ?? new Set();
  u2.add(f.id); friendshipsByUser.set(f.friendId, u2);
}
export function getFriendship(id: string) { return friendships.get(id) ?? null; }
export function getFriendshipsForUser(userId: string) {
  const ids = friendshipsByUser.get(userId);
  if (!ids) return [];
  return Array.from(ids).map(id => friendships.get(id)!).filter(Boolean);
}
export function getAllFriendships() { return Array.from(friendships.values()); }

// Block / Mute
export function storeBlock(b: BlockRecord) { const l = blocks.get(b.userId) ?? []; l.push(b); blocks.set(b.userId, l); }
export function getBlocks(userId: string) { return blocks.get(userId) ?? []; }
export function storeMute(m: MuteRecord) { const l = mutes.get(m.userId) ?? []; l.push(m); mutes.set(m.userId, l); }
export function getMutes(userId: string) { return mutes.get(userId) ?? []; }

// Presence
export function storePresence(p: Presence) { presences.set(p.userId, p); }
export function getPresence(userId: string) { return presences.get(userId) ?? null; }
export function getAllPresences() { return Array.from(presences.values()); }

// Clubs
export function storeClub(c: Club) { clubs.set(c.id, c); }
export function getClub(id: string) { return clubs.get(id) ?? null; }
export function getAllClubs() { return Array.from(clubs.values()); }
export function storeClubApp(a: ClubApplication) { const l = clubApps.get(a.clubId) ?? []; l.push(a); clubApps.set(a.clubId, l); }
export function getClubApps(clubId: string) { return clubApps.get(clubId) ?? []; }
export function storeClubInvite(i: ClubInvitation) { const l = clubInvites.get(i.clubId) ?? []; l.push(i); clubInvites.set(i.clubId, l); }
export function getClubInvites(clubId: string) { return clubInvites.get(clubId) ?? []; }
export function storeClubMembership(m: ClubMembership) { const l = clubMembers.get(m.clubId) ?? []; l.push(m); clubMembers.set(m.clubId, l); }
export function getClubMemberships(clubId: string) { return clubMembers.get(clubId) ?? []; }
export function getClubMembershipsForUser(userId: string) {
  const result: ClubMembership[] = [];
  for (const list of clubMembers.values()) {
    for (const m of list) if (m.userId === userId) result.push(m);
  }
  return result;
}

// Teams
export function storeTeam(t: Team) { teams.set(t.id, t); }
export function getTeam(id: string) { return teams.get(id) ?? null; }
export function getAllTeams() { return Array.from(teams.values()); }
export function storeTeamInvite(i: TeamInvitation) { const l = teamInvites.get(i.teamId) ?? []; l.push(i); teamInvites.set(i.teamId, l); }
export function getTeamInvites(teamId: string) { return teamInvites.get(teamId) ?? []; }

// Reputation
export function storeReputation(r: ReputationScore) { reputations.set(r.userId, r); }
export function getReputation(userId: string) { return reputations.get(userId) ?? null; }
export function getAllReputations() { return Array.from(reputations.values()); }

// Challenges
export function storeChallenge(c: CommunityChallenge) { challenges.set(c.id, c); }
export function getChallenge(id: string) { return challenges.get(id) ?? null; }
export function getAllChallenges() { return Array.from(challenges.values()); }

// Activities
export function storeActivity(a: ActivityEntry) { const l = activities.get(a.userId) ?? []; l.push(a); activities.set(a.userId, l); }
export function getActivities(userId: string, limit = 50) { return (activities.get(userId) ?? []).slice(-limit).reverse(); }
export function getAllActivities() {
  const all: ActivityEntry[] = [];
  for (const list of activities.values()) all.push(...list);
  return all;
}

// Privacy
export function storePrivacySettings(p: PrivacySettings) { privacySettings.set(p.userId, p); }
export function getPrivacySettings(userId: string) { return privacySettings.get(userId) ?? null; }

// Reports
export function storeReport(r: CommunityReport) { reports.set(r.id, r); }
export function getReport(id: string) { return reports.get(id) ?? null; }
export function getAllReports() { return Array.from(reports.values()); }

// Appeals
export function storeAppeal(a: ModerationAppeal) { appeals.set(a.id, a); }
export function getAppeal(id: string) { return appeals.get(id) ?? null; }
export function getAllAppeals() { return Array.from(appeals.values()); }

// Teacher controls
export function storeTeacherControls(t: TeacherCommunityControls) { teacherControls.set(t.teacherId, t); }
export function getTeacherControls(teacherId: string) { return teacherControls.get(teacherId) ?? null; }

// Community health
export function storeCommunityHealth(h: CommunityHealth) { communityHealth.set(h.clubId, h); }
export function getCommunityHealth(clubId: string) { return communityHealth.get(clubId) ?? null; }
export function getAllCommunityHealth() { return Array.from(communityHealth.values()); }

// Reset
export function _resetRepositoryForTesting(): void {
  profiles.clear(); friendships.clear(); friendshipsByUser.clear();
  blocks.clear(); mutes.clear(); presences.clear();
  clubs.clear(); clubApps.clear(); clubInvites.clear(); clubMembers.clear();
  teams.clear(); teamInvites.clear();
  reputations.clear(); challenges.clear(); activities.clear();
  privacySettings.clear(); reports.clear(); appeals.clear();
  teacherControls.clear(); communityHealth.clear();
}
