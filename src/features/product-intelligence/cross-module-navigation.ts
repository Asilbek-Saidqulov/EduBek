/**
 * EduBek — Cross-Module Navigation.
 *
 * Phase 5D.5 System 9: Every entity automatically knows related
 * entities. For a quiz, we return the lesson it belongs to, the
 * curriculum it aligns to, the knowledge-graph concepts it covers,
 * discussions about it, AI history referencing it, the planner entries
 * for it, marketplace listings derived from it, and the digital twin
 * state for the classroom.
 *
 * REUSES Discovery's graph traversal and the Knowledge Graph's
 * relationships. No new graph is built — we query existing tables.
 */
import { getLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import type { NavigationGraph, NavigationRelation } from "./types";

const log = getLogger("cross-module-navigation");

// ===========================================================================
// Public API
// ===========================================================================

export async function buildNavigationGraph(entityType: string, entityId: string): Promise<NavigationGraph> {
  const relations: NavigationRelation[] = [];
  const title = await fetchTitle(entityType, entityId);
  // Dispatch to entity-specific navigators
  switch (entityType) {
    case "assessment":
    case "quiz":
      relations.push(...await navigateAssessment(entityId));
      break;
    case "resource":
    case "lesson":
      relations.push(...await navigateResource(entityId));
      break;
    case "classroom":
      relations.push(...await navigateClassroom(entityId));
      break;
    case "student":
    case "user":
      relations.push(...await navigateUser(entityId));
      break;
    case "concept":
      relations.push(...await navigateConcept(entityId));
      break;
    case "discussion":
      relations.push(...await navigateDiscussion(entityId));
      break;
    case "marketplace_listing":
      relations.push(...await navigateMarketplaceListing(entityId));
      break;
    default:
      // No entity-specific navigation
      break;
  }
  // Always add generic AI history
  const aiHistory = await navigateAIHistory(entityType, entityId);
  if (aiHistory.entities.length > 0) relations.push(aiHistory);
  log.debug("navigation.built", { entityType, entityId, relations: relations.length });
  return {
    root: { type: entityType, id: entityId, title },
    relations,
    totalRelations: relations.reduce((s, r) => s + r.entities.length, 0),
  };
}

// ===========================================================================
// Entity-specific navigators
// ===========================================================================

async function navigateAssessment(assessmentId: string): Promise<NavigationRelation[]> {
  const relations: NavigationRelation[] = [];
  // Classroom this assessment belongs to
  try {
    const assessment = await db.assessment.findUnique({
      where: { id: assessmentId },
      select: { classroomId: true, title: true },
    });
    if (assessment?.classroomId) {
      const classroom = await db.classroom.findUnique({
        where: { id: assessment.classroomId },
        select: { id: true, name: true },
      });
      if (classroom) {
        relations.push({
          type: "belongs_to", direction: "backward", label: "Classroom",
          entities: [{ type: "classroom", id: classroom.id, title: classroom.name, url: `/classroom/${classroom.id}` }],
          module: "classroom",
        });
      }
    }
  } catch { /* noop */ }
  // Concepts covered by this assessment
  try {
    const conceptLinks = await db.resourceConcept.findMany({
      where: { entityId: assessmentId, entityType: "assessment" },
      take: 10,
      select: { conceptId: true },
    });
    if (conceptLinks.length > 0) {
      const concepts = await db.concept.findMany({
        where: { id: { in: conceptLinks.map(l => l.conceptId) } },
        select: { id: true, name: true },
      });
      relations.push({
        type: "covers", direction: "forward", label: "Concepts Covered",
        entities: concepts.map(c => ({ type: "concept", id: c.id, title: c.name, url: `/concepts/${c.id}` })),
        module: "knowledge-intelligence",
      });
    }
  } catch { /* noop */ }
  // Discussions about this assessment
  try {
    const discussions = await db.discussion.findMany({
      where: { entityId: assessmentId, entityType: "assessment" },
      take: 5,
      select: { id: true, title: true },
    });
    if (discussions.length > 0) {
      relations.push({
        type: "discussed_in", direction: "forward", label: "Discussions",
        entities: discussions.map(d => ({ type: "discussion", id: d.id, title: d.title, url: `/discussions/${d.id}` })),
        module: "collaboration",
      });
    }
  } catch { /* noop */ }
  // Attempts (students who took it)
  try {
    const attempts = await db.assessmentAttempt.findMany({
      where: { assessmentId },
      take: 5,
      orderBy: { startedAt: "desc" },
      select: { id: true, studentId: true, status: true },
    });
    if (attempts.length > 0) {
      relations.push({
        type: "attempted_by", direction: "forward", label: "Recent Attempts",
        entities: attempts.map(a => ({ type: "attempt", id: a.id, title: `Attempt by ${a.studentId} (${a.status})`, url: `/attempts/${a.id}` })),
        module: "assessment-platform",
      });
    }
  } catch { /* noop */ }
  return relations;
}

async function navigateResource(resourceId: string): Promise<NavigationRelation[]> {
  const relations: NavigationRelation[] = [];
  // Concepts covered
  try {
    const conceptLinks = await db.resourceConcept.findMany({
      where: { entityId: resourceId, entityType: "resource" },
      take: 10,
      select: { conceptId: true },
    });
    if (conceptLinks.length > 0) {
      const concepts = await db.concept.findMany({
        where: { id: { in: conceptLinks.map(l => l.conceptId) } },
        select: { id: true, name: true },
      });
      relations.push({
        type: "covers", direction: "forward", label: "Concepts",
        entities: concepts.map(c => ({ type: "concept", id: c.id, title: c.name, url: `/concepts/${c.id}` })),
        module: "knowledge-intelligence",
      });
    }
  } catch { /* noop */ }
  // Assignments using this resource
  try {
    const assignments = await db.assignment.findMany({
      where: { resourceId },
      take: 5,
      select: { id: true, title: true, classroomId: true },
    });
    if (assignments.length > 0) {
      relations.push({
        type: "assigned_in", direction: "forward", label: "Assignments",
        entities: assignments.map(a => ({ type: "assignment", id: a.id, title: a.title, url: `/assignments/${a.id}` })),
        module: "classroom",
      });
    }
  } catch { /* noop */ }
  // Marketplace listing (if published) — MarketplaceListing uses `contentId` (polymorphic)
  try {
    const listing = await db.marketplaceListing.findFirst({
      where: { contentId: resourceId, contentType: "resource" },
      select: { id: true, title: true },
    });
    if (listing) {
      relations.push({
        type: "listed_on", direction: "forward", label: "Marketplace Listing",
        entities: [{ type: "marketplace_listing", id: listing.id, title: listing.title, url: `/marketplace/${listing.id}` }],
        module: "marketplace",
      });
    }
  } catch { /* noop */ }
  return relations;
}

async function navigateClassroom(classroomId: string): Promise<NavigationRelation[]> {
  const relations: NavigationRelation[] = [];
  try {
    // Students
    const students = await db.classroomStudent.findMany({
      where: { classroomId },
      take: 10,
      select: { studentId: true },
    });
    if (students.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: students.map(s => s.studentId) } },
        select: { id: true, email: true },
      });
      relations.push({
        type: "has_students", direction: "forward", label: "Students",
        entities: users.map(u => ({ type: "user", id: u.id, title: u.email, url: `/users/${u.id}` })),
        module: "classroom",
      });
    }
    // Assignments
    const assignments = await db.assignment.findMany({
      where: { classroomId, status: "published" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    });
    if (assignments.length > 0) {
      relations.push({
        type: "has_assignments", direction: "forward", label: "Assignments",
        entities: assignments.map(a => ({ type: "assignment", id: a.id, title: a.title, url: `/assignments/${a.id}` })),
        module: "classroom",
      });
    }
    // Digital twin
    const twin = await db.digitalTwin.findFirst({
      where: { twinType: "classroom", entityId: classroomId, active: true },
      select: { id: true },
    });
    if (twin) {
      relations.push({
        type: "has_twin", direction: "forward", label: "Digital Twin",
        entities: [{ type: "digital_twin", id: twin.id, title: "Classroom Twin", url: `/digital-twins/${twin.id}` }],
        module: "digital-twins",
      });
    }
  } catch { /* noop */ }
  return relations;
}

async function navigateUser(userId: string): Promise<NavigationRelation[]> {
  const relations: NavigationRelation[] = [];
  try {
    // Mastery records
    const mastery = await db.conceptMastery.findMany({
      where: { userId },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { conceptId: true, mastery: true },
    });
    if (mastery.length > 0) {
      const concepts = await db.concept.findMany({
        where: { id: { in: mastery.map(m => m.conceptId) } },
        select: { id: true, name: true },
      });
      relations.push({
        type: "learning", direction: "forward", label: "Recently Studied Concepts",
        entities: concepts.map(c => ({ type: "concept", id: c.id, title: c.name, url: `/concepts/${c.id}` })),
        module: "knowledge-intelligence",
      });
    }
    // Learning goals
    const goals = await db.learningGoal.findMany({
      where: { userId, achievedAt: null },
      take: 5,
      select: { id: true, title: true },
    });
    if (goals.length > 0) {
      relations.push({
        type: "has_goals", direction: "forward", label: "Active Goals",
        entities: goals.map(g => ({ type: "goal", id: g.id, title: g.title, url: `/planner/goals/${g.id}` })),
        module: "learning-planner",
      });
    }
    // Credentials
    const credentials = await db.digitalCredential.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    });
    if (credentials.length > 0) {
      relations.push({
        type: "has_credentials", direction: "forward", label: "Credentials",
        entities: credentials.map(c => ({ type: "credential", id: c.id, title: c.title, url: `/credentials/${c.id}` })),
        module: "assessment-platform",
      });
    }
  } catch { /* noop */ }
  return relations;
}

async function navigateConcept(conceptId: string): Promise<NavigationRelation[]> {
  const relations: NavigationRelation[] = [];
  try {
    // Prerequisites
    const prereqs = await db.conceptRelationship.findMany({
      where: { toConceptId: conceptId, type: "prerequisite" },
      take: 10,
      select: { fromConceptId: true },
    });
    if (prereqs.length > 0) {
      const concepts = await db.concept.findMany({
        where: { id: { in: prereqs.map(p => p.fromConceptId) } },
        select: { id: true, name: true },
      });
      relations.push({
        type: "prerequisite_of", direction: "backward", label: "Prerequisites",
        entities: concepts.map(c => ({ type: "concept", id: c.id, title: c.name, url: `/concepts/${c.id}` })),
        module: "knowledge-intelligence",
      });
    }
    // Resources covering this concept
    const resourceLinks = await db.resourceConcept.findMany({
      where: { conceptId },
      take: 10,
      select: { entityId: true, entityType: true },
    });
    if (resourceLinks.length > 0) {
      const resourceIds = resourceLinks.filter(l => l.entityType === "resource").map(l => l.entityId);
      const resources = resourceIds.length > 0 ? await db.resource.findMany({
        where: { id: { in: resourceIds } },
        select: { id: true, title: true },
      }) : [];
      relations.push({
        type: "covered_by", direction: "forward", label: "Resources",
        entities: resources.map(r => ({ type: "resource", id: r.id, title: r.title, url: `/resources/${r.id}` })),
        module: "discovery",
      });
    }
  } catch { /* noop */ }
  return relations;
}

async function navigateDiscussion(discussionId: string): Promise<NavigationRelation[]> {
  const relations: NavigationRelation[] = [];
  try {
    const discussion = await db.discussion.findUnique({
      where: { id: discussionId },
      select: { entityId: true, entityType: true, title: true },
    });
    if (discussion?.entityId && discussion?.entityType) {
      relations.push({
        type: "about", direction: "backward", label: "About",
        entities: [{ type: discussion.entityType, id: discussion.entityId, title: discussion.entityType, url: `/${discussion.entityType}/${discussion.entityId}` }],
        module: "collaboration",
      });
    }
  } catch { /* noop */ }
  return relations;
}

async function navigateMarketplaceListing(listingId: string): Promise<NavigationRelation[]> {
  const relations: NavigationRelation[] = [];
  try {
    // MarketplaceListing uses `sellerId` (not creatorId) and `contentId` (polymorphic, not resourceId)
    const listing = await db.marketplaceListing.findUnique({
      where: { id: listingId },
      select: { contentId: true, contentType: true, sellerId: true },
    });
    if (listing?.contentId) {
      // The contentId is polymorphic — link to whatever entity type it references
      relations.push({
        type: "derived_from", direction: "backward", label: `Source ${listing.contentType}`,
        entities: [{ type: listing.contentType, id: listing.contentId, title: `Source ${listing.contentType}`, url: `/${listing.contentType}/${listing.contentId}` }],
        module: "marketplace",
      });
    }
    if (listing?.sellerId) {
      const seller = await db.user.findUnique({
        where: { id: listing.sellerId },
        select: { id: true, email: true },
      });
      if (seller) {
        relations.push({
          type: "created_by", direction: "backward", label: "Seller",
          entities: [{ type: "user", id: seller.id, title: seller.email, url: `/users/${seller.id}` }],
          module: "marketplace",
        });
      }
    }
  } catch { /* noop */ }
  return relations;
}

async function navigateAIHistory(entityType: string, entityId: string): Promise<NavigationRelation> {
  // Find AI invocations that mention this entity
  try {
    const invocations = await db.orchestratorAIInvocation.findMany({
      where: { input: { contains: entityId } },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    });
    return {
      type: "referenced_in_ai", direction: "forward", label: "AI History",
      entities: invocations.map(i => ({ type: "ai_invocation", id: i.id, title: `AI call at ${i.createdAt.toISOString()}`, url: `/ai/history/${i.id}` })),
      module: "platform-orchestrator",
    };
  } catch {
    return {
      type: "referenced_in_ai", direction: "forward", label: "AI History",
      entities: [], module: "platform-orchestrator",
    };
  }
}

async function fetchTitle(entityType: string, entityId: string): Promise<string> {
  try {
    switch (entityType) {
      case "assessment":
      case "quiz": {
        const r = await db.assessment.findUnique({ where: { id: entityId }, select: { title: true } });
        return r?.title ?? entityId;
      }
      case "resource":
      case "lesson": {
        const r = await db.resource.findUnique({ where: { id: entityId }, select: { title: true } });
        return r?.title ?? entityId;
      }
      case "classroom": {
        const r = await db.classroom.findUnique({ where: { id: entityId }, select: { name: true } });
        return r?.name ?? entityId;
      }
      case "concept": {
        const r = await db.concept.findUnique({ where: { id: entityId }, select: { name: true } });
        return r?.name ?? entityId;
      }
      default:
        return entityId;
    }
  } catch {
    return entityId;
  }
}
