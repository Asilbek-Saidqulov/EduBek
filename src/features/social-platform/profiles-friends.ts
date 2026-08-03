/** Systems 1 + 2 — Player Social Profile + Friend Graph. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeProfile, getProfile, getAllProfiles,
  storeFriendship, getFriendship, getFriendshipsForUser, getAllFriendships,
  storeBlock, getBlocks, storeMute, getMutes,
} from "./repository";
import type {
  SocialProfile, ProfileHistoryEntry, VisibilityLevel,
  Friendship, FriendshipStatus, FriendCategory, RelationshipEvent,
  BlockRecord, MuteRecord,
} from "./types";

const log = getLogger("social-platform.profiles");

// ===== System 1 — Player Social Profile =====

export function createProfile(input: {
  userId: string; displayName: string; bio?: string | null;
  country?: string | null; languages?: string[];
  school?: string | null; organization?: string | null;
  avatarRef?: string | null; bannerRef?: string | null;
  visibility?: VisibilityLevel;
}): SocialProfile {
  const existing = getProfile(input.userId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const profile: SocialProfile = {
    userId: input.userId, displayName: input.displayName,
    bio: input.bio ?? null, country: input.country ?? null,
    languages: input.languages ?? [], school: input.school ?? null,
    organization: input.organization ?? null, avatarRef: input.avatarRef ?? null,
    bannerRef: input.bannerRef ?? null, verified: false,
    visibility: input.visibility ?? "public", customTitles: [], profileBadges: [],
    statsRefs: {}, profileHistory: [{ id: randomUUID(), kind: "profile_created", description: "Profile created", timestamp: now }],
    createdAt: now, updatedAt: now,
  };
  storeProfile(profile);
  log.info("profile.created", { userId: input.userId });
  return profile;
}

export function getSocialProfile(userId: string): SocialProfile | null { return getProfile(userId); }
export function listAllProfiles(): SocialProfile[] { return getAllProfiles(); }

export function updateProfile(userId: string, updates: Partial<Pick<SocialProfile, "bio" | "country" | "languages" | "school" | "organization" | "avatarRef" | "bannerRef" | "visibility" | "customTitles" | "profileBadges">>): SocialProfile | null {
  const p = getProfile(userId);
  if (!p) return null;
  const now = new Date().toISOString();
  const historyEntry: ProfileHistoryEntry = { id: randomUUID(), kind: "profile_updated", description: "Profile updated", timestamp: now };
  const updated = { ...p, ...updates, profileHistory: [...p.profileHistory, historyEntry], updatedAt: now };
  storeProfile(updated);
  return updated;
}

export function verifyProfile(userId: string): boolean {
  const p = getProfile(userId);
  if (!p) return false;
  p.verified = true; p.updatedAt = new Date().toISOString();
  storeProfile(p);
  return true;
}

// ===== System 2 — Friend Graph =====

export function sendFriendRequest(userId: string, friendId: string): Friendship | null {
  if (userId === friendId) return null;
  const existing = getFriendshipsForUser(userId).find(f => f.friendId === friendId || f.userId === friendId);
  if (existing && existing.status === "accepted") return null;
  const now = new Date().toISOString();
  const friendship: Friendship = {
    id: randomUUID(), userId, friendId, status: "pending",
    category: "default", createdAt: now, acceptedAt: null,
    history: [{ id: randomUUID(), kind: "request_sent", timestamp: now, metadata: {} }],
  };
  storeFriendship(friendship);
  log.info("friend.request_sent", { userId, friendId });
  return friendship;
}

export function acceptFriendRequest(friendshipId: string): Friendship | null {
  const f = getFriendship(friendshipId);
  if (!f || f.status !== "pending") return null;
  const now = new Date().toISOString();
  f.status = "accepted"; f.acceptedAt = now;
  f.history.push({ id: randomUUID(), kind: "accepted", timestamp: now, metadata: {} });
  storeFriendship(f);
  return f;
}

export function rejectFriendRequest(friendshipId: string): Friendship | null {
  const f = getFriendship(friendshipId);
  if (!f || f.status !== "pending") return null;
  f.status = "rejected";
  f.history.push({ id: randomUUID(), kind: "rejected", timestamp: new Date().toISOString(), metadata: {} });
  storeFriendship(f);
  return f;
}

export function cancelFriendRequest(friendshipId: string): Friendship | null {
  const f = getFriendship(friendshipId);
  if (!f || f.status !== "pending") return null;
  f.status = "cancelled";
  f.history.push({ id: randomUUID(), kind: "cancelled", timestamp: new Date().toISOString(), metadata: {} });
  storeFriendship(f);
  return f;
}

export function removeFriend(friendshipId: string): Friendship | null {
  const f = getFriendship(friendshipId);
  if (!f || f.status !== "accepted") return null;
  f.status = "removed";
  f.history.push({ id: randomUUID(), kind: "removed", timestamp: new Date().toISOString(), metadata: {} });
  storeFriendship(f);
  return f;
}

export function setFriendCategory(friendshipId: string, category: FriendCategory): Friendship | null {
  const f = getFriendship(friendshipId);
  if (!f || f.status !== "accepted") return null;
  const oldCategory = f.category;
  f.category = category;
  f.history.push({ id: randomUUID(), kind: "category_changed", timestamp: new Date().toISOString(), metadata: { from: oldCategory, to: category } });
  storeFriendship(f);
  return f;
}

export function getFriends(userId: string, category?: FriendCategory): Friendship[] {
  const friendships = getFriendshipsForUser(userId).filter(f => f.status === "accepted");
  return category ? friendships.filter(f => f.category === category) : friendships;
}

export function getPendingRequests(userId: string): Friendship[] {
  return getFriendshipsForUser(userId).filter(f => f.status === "pending" && f.friendId === userId);
}

export function getSentRequests(userId: string): Friendship[] {
  return getFriendshipsForUser(userId).filter(f => f.status === "pending" && f.userId === userId);
}

export function getMutualFriends(userId1: string, userId2: string): string[] {
  const friends1 = new Set(getFriends(userId1).map(f => f.userId === userId1 ? f.friendId : f.userId));
  const friends2 = new Set(getFriends(userId2).map(f => f.userId === userId2 ? f.friendId : f.userId));
  return Array.from(friends1).filter(id => friends2.has(id));
}

export function blockUser(userId: string, blockedId: string): BlockRecord | null {
  if (userId === blockedId) return null;
  const block: BlockRecord = { id: randomUUID(), userId, blockedId, createdAt: new Date().toISOString() };
  storeBlock(block);
  return block;
}

export function muteUser(userId: string, mutedId: string): MuteRecord | null {
  if (userId === mutedId) return null;
  const mute: MuteRecord = { id: randomUUID(), userId, mutedId, createdAt: new Date().toISOString() };
  storeMute(mute);
  return mute;
}

export function getBlockedUsers(userId: string): BlockRecord[] { return getBlocks(userId); }
export function getMutedUsers(userId: string): MuteRecord[] { return getMutes(userId); }
export function isBlocked(userId: string, blockedId: string): boolean {
  return getBlocks(userId).some(b => b.blockedId === blockedId);
}
export function isMuted(userId: string, mutedId: string): boolean {
  return getMutes(userId).some(m => m.mutedId === mutedId);
}

export function getFriendshipById(id: string): Friendship | null { return getFriendship(id); }
export function listAllFriendships(): Friendship[] { return getAllFriendships(); }
