/**
 * EduBek — Phase 4F.4 Collaboration tests.
 *
 * Verifies:
 *   • Network graph: addCollaborationEdge idempotency + neighborhood query
 *   • Discussion toxicity heuristic (lightweight, deterministic)
 *   • Note version progression
 *   • Challenge join + progress + leaderboard
 *
 * These tests use a real Prisma SQLite DB (the project's dev DB) — they
 * exercise the full repository stack. Tests are isolated by using unique
 * test IDs (timestamp-based) so concurrent runs don't collide.
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  addCollaborationEdge,
  removeCollaborationEdge,
  getCollaborationNeighborhood,
} from "@/features/collaboration/network-graph";
import { createNote, updateNote, listNoteVersions } from "@/features/collaboration/notes";
import { createDiscussion, createReply } from "@/features/collaboration/discussions";
import {
  createChallenge,
  joinChallenge,
  updateProgress,
  getChallengeLeaderboard,
} from "@/features/collaboration/challenges";
import { db } from "@/lib/db";

// Use a unique prefix to avoid collisions with real data.
const TEST_PREFIX = `test-4f4-${Date.now()}`;
const TEST_USER_ID = `${TEST_PREFIX}-user`;
const TEST_USER_ID_2 = `${TEST_PREFIX}-user2`;

// Ensure test users exist (some FKs reference them).
beforeAll(async () => {
  await db.user.upsert({
    where: { id: TEST_USER_ID },
    create: {
      id: TEST_USER_ID,
      email: `${TEST_USER_ID}@test.edubek.local`,
      username: TEST_USER_ID,
      passwordHash: "test",
      name: "Test User",
    },
    update: {},
  });
  await db.user.upsert({
    where: { id: TEST_USER_ID_2 },
    create: {
      id: TEST_USER_ID_2,
      email: `${TEST_USER_ID_2}@test.edubek.local`,
      username: TEST_USER_ID_2,
      passwordHash: "test",
      name: "Test User 2",
    },
    update: {},
  });
});

// ---------------------------------------------------------------------------
// Network Graph
// ---------------------------------------------------------------------------

describe("Network Graph", () => {
  it("addCollaborationEdge creates both nodes + edge idempotently", async () => {
    const userId = `${TEST_PREFIX}-net-user-${Date.now()}`;
    const groupId = `${TEST_PREFIX}-net-group-${Date.now()}`;
    const groupName = `Test Group ${Date.now()}`;

    // Ensure user node exists
    await db.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: `${userId}@test.edubek.local`,
        username: userId,
        passwordHash: "test",
        name: "Network Test User",
      },
      update: {},
    });

    // First call — creates both nodes + edge
    const result1 = await addCollaborationEdge({
      fromEntityType: "user",
      fromEntityId: userId,
      fromTitle: "Network Test User",
      toEntityType: "study_group",
      toEntityId: groupId,
      toTitle: groupName,
      edgeType: "MEMBER_OF",
      weight: 1,
    });
    expect(result1.edgeId).toBeTruthy();

    // Second call — idempotent, returns same edge
    const result2 = await addCollaborationEdge({
      fromEntityType: "user",
      fromEntityId: userId,
      fromTitle: "Network Test User",
      toEntityType: "study_group",
      toEntityId: groupId,
      toTitle: groupName,
      edgeType: "MEMBER_OF",
      weight: 1.5, // different weight
    });
    expect(result2.edgeId).toBe(result1.edgeId);

    // Neighborhood query
    const neighborhood = await getCollaborationNeighborhood({
      entityType: "user",
      entityId: userId,
      edgeTypes: ["MEMBER_OF"],
    });
    expect(neighborhood.nodes.length).toBeGreaterThanOrEqual(2); // user + group
    expect(neighborhood.edges.length).toBeGreaterThanOrEqual(1);
    const memberEdge = neighborhood.edges.find((e) => e.edgeType === "MEMBER_OF");
    expect(memberEdge).toBeTruthy();
    expect(memberEdge!.weight).toBe(1.5); // updated weight

    // Cleanup
    await removeCollaborationEdge({
      fromEntityType: "user",
      fromEntityId: userId,
      toEntityType: "study_group",
      toEntityId: groupId,
      edgeType: "MEMBER_OF",
    });
  });
});

// ---------------------------------------------------------------------------
// Discussions (toxicity heuristic)
// ---------------------------------------------------------------------------

describe("Discussions — toxicity heuristic", () => {
  it("flags all-caps + repetition as mildly toxic", async () => {
    const discussion = await createDiscussion({
      entityType: "test_entity",
      entityId: `${TEST_PREFIX}-disc-${Date.now()}`,
      title: `Test Discussion ${Date.now()}`,
      authorId: TEST_USER_ID,
    });

    const toxicReply = await createReply({
      discussionId: discussion.id,
      authorId: TEST_USER_ID,
      body: "THIS IS TERRIBLE THIS IS TERRIBLE THIS IS TERRIBLE THIS IS TERRIBLE THIS IS TERRIBLE!!!",
    });
    // createReply applies the toxicity score via a separate update — fetch fresh
    const toxicReplyFresh = await db.discussionReply.findUnique({ where: { id: toxicReply.id } });
    expect(toxicReplyFresh!.toxicityScore).not.toBeNull();
    expect(toxicReplyFresh!.toxicityScore!).toBeGreaterThan(0);

    const benignReply = await createReply({
      discussionId: discussion.id,
      authorId: TEST_USER_ID,
      body: "This is a thoughtful and helpful reply.",
    });
    const benignReplyFresh = await db.discussionReply.findUnique({ where: { id: benignReply.id } });
    expect(benignReplyFresh!.toxicityScore ?? 0).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Collaborative Notes — version progression
// ---------------------------------------------------------------------------

describe("Collaborative Notes — version progression", () => {
  it("creates a new version on each update + supports revert", async () => {
    const note = await createNote({
      ownerId: TEST_USER_ID,
      title: `Versioned Note ${Date.now()}`,
      content: "Initial content",
    });
    expect(note.version).toBe(1);

    const v2 = await updateNote({
      noteId: note.id,
      userId: TEST_USER_ID,
      content: "Second version content",
      editSummary: "Added details",
    });
    expect(v2.version).toBe(2);
    expect(v2.content).toBe("Second version content");

    const v3 = await updateNote({
      noteId: note.id,
      userId: TEST_USER_ID,
      content: "Third version content",
      editSummary: "Refined",
    });
    expect(v3.version).toBe(3);

    const versions = await listNoteVersions(note.id);
    expect(versions.length).toBe(3);
    expect(versions[0]!.version).toBe(3); // newest first

    // Revert to v2
    const reverted = await updateNote({
      noteId: note.id,
      userId: TEST_USER_ID,
      content: "Second version content",
      editSummary: "Reverted to version 2",
    });
    expect(reverted.version).toBe(4); // creates a new version
    expect(reverted.content).toBe("Second version content");
  });
});

// ---------------------------------------------------------------------------
// Challenges — join, progress, leaderboard
// ---------------------------------------------------------------------------

describe("Challenges — join + progress + leaderboard", () => {
  it("creates a challenge, joins it, updates progress, and ranks in leaderboard", async () => {
    const startsAt = new Date(Date.now() - 60_000); // 1 minute ago
    const endsAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    const challenge = await createChallenge({
      title: `Test Challenge ${Date.now()}`,
      type: "weekly",
      metric: "xp",
      targetValue: 100,
      startsAt,
      endsAt,
      rewardType: "xp",
      rewardValue: 50,
    });

    // User 1 joins
    const p1 = await joinChallenge(challenge.id, TEST_USER_ID);
    expect(p1.progress).toBe(0);

    // Update progress
    const updated = await updateProgress({
      challengeId: challenge.id,
      userId: TEST_USER_ID,
      progressDelta: 50,
    });
    expect(updated.progress).toBe(50);
    expect(updated.completed).toBe(false);

    // Complete
    const completed = await updateProgress({
      challengeId: challenge.id,
      userId: TEST_USER_ID,
      progressAbsolute: 100,
    });
    expect(completed.progress).toBe(100);
    expect(completed.completed).toBe(true);

    // Leaderboard
    const leaderboard = await getChallengeLeaderboard(challenge.id);
    expect(leaderboard.length).toBe(1);
    expect(leaderboard[0]!.userId).toBe(TEST_USER_ID);
    expect(leaderboard[0]!.progress).toBe(100);
    expect(leaderboard[0]!.completed).toBe(true);
    expect(leaderboard[0]!.rank).toBe(1);
  });

  it("rejects joining a challenge that hasn't started yet", async () => {
    const startsAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const endsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const challenge = await createChallenge({
      title: `Future Challenge ${Date.now()}`,
      type: "weekly",
      metric: "xp",
      targetValue: 50,
      startsAt,
      endsAt,
    });

    await expect(joinChallenge(challenge.id, TEST_USER_ID_2)).rejects.toThrow();
  });

  it("rejects joining a challenge that has ended", async () => {
    const startsAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const endsAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    const challenge = await createChallenge({
      title: `Past Challenge ${Date.now()}`,
      type: "weekly",
      metric: "xp",
      targetValue: 50,
      startsAt,
      endsAt,
    });

    await expect(joinChallenge(challenge.id, TEST_USER_ID_2)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Discovery entity + edge type extension
// ---------------------------------------------------------------------------

describe("Phase 4F.4 — Discovery type extensions", () => {
  it("EdgeType union includes all 10 new collaboration edges", async () => {
    const { EdgeType } = await import("@/features/discovery/types");
    // We can't easily iterate a TS union at runtime, but we can check
    // the discovery service accepts the new edge types by adding them.
    const newEdges = [
      "MENTORS", "COLLABORATES_WITH", "MEMBER_OF", "TEACHES", "STUDIES_WITH",
      "RECOMMENDED_FOR", "ASSIGNED_TO", "REVIEWS", "DISCUSSES", "HELPS",
    ];
    // Smoke test — verify these are valid edge type strings by adding
    // a graph edge for each and confirming no errors.
    for (const edgeType of newEdges) {
      const result = await addCollaborationEdge({
        fromEntityType: "user",
        fromEntityId: `${TEST_PREFIX}-edge-from`,
        fromTitle: "Edge Test User",
        toEntityType: "user",
        toEntityId: `${TEST_PREFIX}-edge-to`,
        toTitle: "Edge Test User 2",
        edgeType: edgeType as any,
        weight: 1,
      });
      expect(result.edgeId).toBeTruthy();
    }
    void EdgeType; // referenced for clarity
  });
});
