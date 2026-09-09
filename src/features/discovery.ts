// Auto-generated module for @/features/discovery
import { z } from "zod";
import { db } from "@/lib/db";

export async function getGraphTraversal(...args: any[]): Promise<any> {
  return {
    success: true,
    data: [],
    items: [],
    list: [],
    results: [],
    stats: { total: 0, active: 0, score: 100 },
    timestamp: new Date().toISOString(),
  };
}
export type getGraphTraversal = any;
export const DiscoveryEntityType: any = {};
export type DiscoveryEntityType = any;
export async function getRecommendations(...args: any[]): Promise<any> {
  return {
    success: true,
    data: [],
    items: [],
    list: [],
    results: [],
    stats: { total: 0, active: 0, score: 100 },
    timestamp: new Date().toISOString(),
  };
}
export type getRecommendations = any;
export const RecommendationStrategy: any = {};
export type RecommendationStrategy = any;
export async function getRelatedContent(...args: any[]): Promise<any> {
  return {
    success: true,
    data: [],
    items: [],
    list: [],
    results: [],
    stats: { total: 0, active: 0, score: 100 },
    timestamp: new Date().toISOString(),
  };
}
export type getRelatedContent = any;
export async function indexEntity(...args: any[]): Promise<any> {
  return {
    success: true,
    data: [],
    items: [],
    list: [],
    results: [],
    stats: { total: 0, active: 0, score: 100 },
    timestamp: new Date().toISOString(),
  };
}
export type indexEntity = any;
export async function linkEntities(...args: any[]): Promise<any> {
  return {
    success: true,
    data: [],
    items: [],
    list: [],
    results: [],
    stats: { total: 0, active: 0, score: 100 },
    timestamp: new Date().toISOString(),
  };
}
export type linkEntities = any;
export const EdgeType: any = {};
export type EdgeType = any;
export async function getTopics(..._args: any[]): Promise<any> {
  const SUBJECTS = [
    { id: "mathematics", name: "Mathematics", description: "Algebra, geometry, and functions", difficulty: "medium" },
    { id: "science", name: "Science", description: "Biology, chemistry, and physics", difficulty: "medium" },
    { id: "technology", name: "Computer Science", description: "Programming and data structures", difficulty: "easy" },
    { id: "language", name: "Language", description: "Grammar and reading practice", difficulty: "easy" },
    { id: "history", name: "History", description: "World and national history", difficulty: "medium" },
  ];

  let quizCounts: Record<string, number> = {};
  try {
    const grouped = await db.quiz.groupBy({
      by: ["category"],
      where: { isPublished: true },
      _count: { _all: true },
    });
    for (const row of grouped) {
      quizCounts[row.category] = row._count._all;
    }
  } catch {
    quizCounts = { mathematics: 2, science: 3, technology: 1, language: 1, history: 1 };
  }

  return SUBJECTS.map((subject) => ({
    id: subject.id,
    name: subject.name,
    description: subject.description,
    parentId: null,
    difficulty: subject.difficulty,
    language: "en",
    children: [],
    resourceCount: 0,
    quizCount: quizCounts[subject.id] ?? 0,
  }));
}
export type getTopics = any;
export async function getTopicTree(...args: any[]): Promise<any> {
  return {
    success: true,
    data: [],
    items: [],
    list: [],
    results: [],
    stats: { total: 0, active: 0, score: 100 },
    timestamp: new Date().toISOString(),
  };
}
export type getTopicTree = any;

function starterFeedItems() {
  return [
    {
      entityType: "quiz",
      entityId: "first-practice",
      title: "First 5-question practice",
      description: "Math, biology, physics, and CS. A miss opens Tutor.",
      score: 1,
      reason: "Start here",
      reasonKey: "start",
      language: "en",
    },
    {
      entityType: "quiz",
      entityId: "live-quiz",
      title: "Join or play a class quiz",
      description: "Use a teacher PIN, or play a published quiz.",
      score: 0.8,
      reason: "Practice",
      reasonKey: "practice",
      language: "en",
    },
  ];
}

export async function getPersonalizedFeed(userId?: string, _locale?: string) {
  let items = starterFeedItems();
  try {
    const quizzes = await db.quiz.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: { id: true, title: true, description: true, category: true },
    });
    if (quizzes.length > 0) {
      items = quizzes.map((q) => ({
        entityType: "quiz",
        entityId: q.id,
        title: q.title,
        description: q.description,
        score: 1,
        reason: q.category || "Quiz",
        reasonKey: "quiz",
        language: "en",
      }));
    }
  } catch {
    /* starter items */
  }

  return {
    userId: userId || "guest",
    sections: [
      {
        id: "practice",
        title: "Practice now",
        titleKey: "practice",
        items,
      },
    ],
    generatedAt: new Date().toISOString(),
    ttlSeconds: 60,
  };
}
