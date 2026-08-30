import { db as prisma } from "@/lib/db";

export interface StudentMemoryProfile {
  userId: string;
  name?: string;
  locale: string;
  gradeLevel?: string;
  preferredDifficulty?: string;
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  masteredTopics: string[];
  weakTopics: string[];
  learningPreferences: string[];
  goals: string[];
  recentQuizMistakes: Array<{
    quizTitle: string;
    topic?: string;
    score: number;
    maxScore: number;
  }>;
  recentNotesCount: number;
  scoredMemories?: ScoredMemory[];
}

export type MemoryType =
  | "strength"
  | "weakness"
  | "misconception"
  | "mastered_topic"
  | "weak_topic"
  | "learning_style"
  | "goal"
  | "skill_level"
  | "behavioral_pattern";

export interface MemoryScoreBreakdown {
  topicScore: number; // 0 - 40 pts
  typeScore: number; // 0 - 25 pts
  confidenceScore: number; // 0 - 15 pts
  recencyScore: number; // 0 - 15 pts
  reinforcementScore: number; // 0 - 10 pts
  totalScore: number; // 0 - 100+ pts
}

export interface ScoredMemory {
  id?: string;
  userId: string;
  memoryType: string;
  content: string;
  confidence: number;
  createdAt: Date;
  expiresAt?: Date | null;
  score: number;
  breakdown: MemoryScoreBreakdown;
  matchReasons: string[];
}

export interface MemoryRetrievalContext {
  targetTopic?: string;
  currentMessage?: string;
  subject?: string;
  limit?: number;
  now?: Date;
}

// Common stopwords in Uzbek, English, and Russian to improve token matching precision
const STOPWORDS = new Set([
  // Uzbek
  "va", "bilan", "uchun", "ham", "yoki", "esa", "kerak", "bor", "yoq", "qanday", "nima", "qaysi", "bunda", "shuning",
  // English
  "the", "is", "at", "which", "on", "and", "a", "an", "in", "to", "for", "of", "with", "as", "by", "that", "this", "how", "what", "can", "you", "please", "help",
  // Russian
  "и", "в", "на", "с", "по", "для", "как", "что", "это", "или", "не", "к", "от", "из", "пожалуйста", "помоги",
]);

/**
 * Extract normalized keywords/tokens from text for semantic matching
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

/**
 * Memory Type Weight Table (0 - 25 points)
 * Pedagogical blockers (misconceptions and weaknesses) take the highest priority.
 */
const MEMORY_TYPE_WEIGHTS: Record<string, number> = {
  misconception: 25,
  weakness: 22,
  weak_topic: 22,
  behavioral_pattern: 16,
  goal: 15,
  learning_style: 15,
  strength: 12,
  mastered_topic: 12,
  skill_level: 10,
};

/**
 * Compute deterministic relevance score for an individual memory entry.
 *
 * Scoring breakdown:
 * 1. Topic Relevance (0 - 40 pts): Exact matches, token containment, keyword Jaccard overlap
 * 2. Memory Type (0 - 25 pts): Misconceptions > Weaknesses > Goals/Styles > Strengths
 * 3. Confidence (0 - 15 pts): Stored model/teacher confidence
 * 4. Recency (0 - 15 pts): Time-decay with floor to preserve important older memories
 * 5. Reinforcement (0 - 10 pts): Bonus for repeated occurrences or multiple detections
 */
export function computeMemoryRelevanceScore(
  memory: {
    id?: string;
    userId: string;
    memoryType: string;
    content: string;
    confidence?: number;
    createdAt?: Date | string;
    expiresAt?: Date | string | null;
  },
  context: MemoryRetrievalContext = {}
): ScoredMemory {
  const matchReasons: string[] = [];
  const createdAt = memory.createdAt ? new Date(memory.createdAt) : new Date();
  const expiresAt = memory.expiresAt ? new Date(memory.expiresAt) : null;
  const now = context.now ? new Date(context.now) : new Date();
  const confidence = typeof memory.confidence === "number" ? Math.max(0, Math.min(1, memory.confidence)) : 0.5;

  const contentLower = (memory.content || "").toLowerCase();
  const memoryTokens = new Set(extractKeywords(contentLower));

  // Combine search context (targetTopic, currentMessage, subject)
  const contextParts: string[] = [];
  if (context.targetTopic) contextParts.push(context.targetTopic);
  if (context.subject) contextParts.push(context.subject);
  if (context.currentMessage) contextParts.push(context.currentMessage);

  const contextText = contextParts.join(" ").toLowerCase();
  const queryTokens = extractKeywords(contextText);

  // 1. Topic Relevance Score (0 - 40)
  let topicScore = 0;
  if (contextText.trim().length === 0) {
    // If no context is provided, give general preference to foundational styles/goals
    if (["learning_style", "goal"].includes(memory.memoryType)) {
      topicScore = 20;
      matchReasons.push("General student learning profile context");
    } else {
      topicScore = 10;
    }
  } else {
    // Check exact targetTopic inclusion
    if (context.targetTopic) {
      const topicLower = context.targetTopic.toLowerCase();
      if (contentLower.includes(topicLower)) {
        topicScore += 35;
        matchReasons.push(`Exact topic match: "${context.targetTopic}"`);
      }
    }

    // Check subject inclusion
    if (context.subject) {
      const subjectLower = context.subject.toLowerCase();
      if (contentLower.includes(subjectLower)) {
        topicScore += 15;
        matchReasons.push(`Subject domain match: "${context.subject}"`);
      }
    }

    // Token overlap match
    if (queryTokens.length > 0 && memoryTokens.size > 0) {
      let matchingTokens = 0;
      for (const token of queryTokens) {
        if (memoryTokens.has(token) || contentLower.includes(token)) {
          matchingTokens++;
        }
      }

      if (matchingTokens > 0) {
        const overlapRatio = matchingTokens / Math.max(1, Math.min(queryTokens.length, 6));
        const tokenScore = Math.min(30, Math.round(overlapRatio * 30));
        topicScore += tokenScore;
        matchReasons.push(`${matchingTokens} matching keyword(s)`);
      }
    }

    // Global preferences always maintain baseline relevance so they are not eliminated
    if (["learning_style", "goal"].includes(memory.memoryType) && topicScore < 12) {
      topicScore = 12;
      matchReasons.push("Global student goal/preference");
    }
  }

  topicScore = Math.min(40, Math.max(0, topicScore));

  // 2. Memory Type Score (0 - 25)
  const typeScore = MEMORY_TYPE_WEIGHTS[memory.memoryType] ?? 10;

  // 3. Confidence Score (0 - 15)
  const confidenceScore = Math.round(confidence * 15);

  // 4. Recency Score (0 - 15)
  // Time-decay formula with 14-day half-life and minimum floor of 3 pts
  const diffMs = Math.max(0, now.getTime() - createdAt.getTime());
  const daysAgo = diffMs / (1000 * 60 * 60 * 24);
  const recencyDecay = 15 / (1 + daysAgo / 14);
  const recencyScore = Math.max(3, Math.min(15, Math.round(recencyDecay * 10) / 10));

  // 5. Reinforcement Score (0 - 10)
  let reinforcementScore = 0;
  if (confidence > 0.85) {
    reinforcementScore += 5;
    matchReasons.push("High-confidence verified memory");
  }
  if (contentLower.includes("repeated") || contentLower.includes("frequent") || contentLower.includes("multiple")) {
    reinforcementScore += 5;
    matchReasons.push("Recurring learning pattern");
  }
  reinforcementScore = Math.min(10, reinforcementScore);

  const totalScore = Math.round((topicScore + typeScore + confidenceScore + recencyScore + reinforcementScore) * 10) / 10;

  return {
    id: memory.id,
    userId: memory.userId,
    memoryType: memory.memoryType,
    content: memory.content,
    confidence,
    createdAt,
    expiresAt,
    score: totalScore,
    breakdown: {
      topicScore,
      typeScore,
      confidenceScore,
      recencyScore,
      reinforcementScore,
      totalScore,
    },
    matchReasons,
  };
}

/**
 * Rank and filter a collection of candidate memories based on context relevance
 */
export function rankStudentMemories(
  memories: Array<{
    id?: string;
    userId: string;
    memoryType: string;
    content: string;
    confidence?: number;
    createdAt?: Date | string;
    expiresAt?: Date | string | null;
  }>,
  context: MemoryRetrievalContext = {}
): ScoredMemory[] {
  const now = context.now ? new Date(context.now) : new Date();
  const limit = context.limit ?? 8;

  // Filter out expired memories
  const activeMemories = memories.filter((m) => {
    if (!m.expiresAt) return true;
    const exp = new Date(m.expiresAt);
    return exp.getTime() > now.getTime();
  });

  // Score each memory
  const scored = activeMemories.map((m) => computeMemoryRelevanceScore(m, context));

  // Sort descending by relevance score, ties broken by createdAt desc
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return scored.slice(0, limit);
}

/**
 * Retrieve personalized, relevance-scored student learning memory for a tutor session
 */
export async function getStudentMemory(
  userId: string,
  contextOrTopic?: string | MemoryRetrievalContext
): Promise<StudentMemoryProfile> {
  const context: MemoryRetrievalContext =
    typeof contextOrTopic === "string"
      ? { targetTopic: contextOrTopic }
      : contextOrTopic || {};

  const profile: StudentMemoryProfile = {
    userId,
    locale: "uz",
    strengths: [],
    weaknesses: [],
    misconceptions: [],
    masteredTopics: [],
    weakTopics: [],
    learningPreferences: [],
    goals: [],
    recentQuizMistakes: [],
    recentNotesCount: 0,
    scoredMemories: [],
  };

  if (!userId) return profile;

  try {
    const now = context.now || new Date();

    // 1. Fetch User Profile & Preferences (Strictly isolated by userId)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        locale: true,
        profile: {
          select: {
            bio: true,
          },
        },
        preferences: {
          select: {
            preferredDifficulty: true,
            preferredLanguage: true,
            preferredCategories: true,
          },
        },
      },
    });

    if (user) {
      profile.name = user.name || undefined;
      profile.locale = user.preferences?.preferredLanguage || user.locale || "uz";
      profile.preferredDifficulty = user.preferences?.preferredDifficulty || "medium";
    }

    // 2. Fetch Candidate Memory Pool from Database (top 50 active memories)
    const candidateMemories = await prisma.aiContextMemory.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // 3. Rank memories using deterministic relevance scoring
    const topScored = rankStudentMemories(candidateMemories, {
      ...context,
      limit: context.limit || 8,
      now,
    });

    profile.scoredMemories = topScored;

    // 4. Distribute top relevant memories into categorized profile fields
    for (const item of topScored) {
      switch (item.memoryType) {
        case "misconception":
          if (!profile.misconceptions.includes(item.content)) {
            profile.misconceptions.push(item.content);
          }
          break;
        case "weakness":
          if (!profile.weaknesses.includes(item.content)) {
            profile.weaknesses.push(item.content);
          }
          break;
        case "weak_topic":
          if (!profile.weakTopics.includes(item.content)) {
            profile.weakTopics.push(item.content);
          }
          break;
        case "mastered_topic":
          if (!profile.masteredTopics.includes(item.content)) {
            profile.masteredTopics.push(item.content);
          }
          break;
        case "strength":
          if (!profile.strengths.includes(item.content)) {
            profile.strengths.push(item.content);
          }
          break;
        case "learning_style":
          if (!profile.learningPreferences.includes(item.content)) {
            profile.learningPreferences.push(item.content);
          }
          break;
        case "goal":
          if (!profile.goals.includes(item.content)) {
            profile.goals.push(item.content);
          }
          break;
        default:
          if (!profile.weaknesses.includes(item.content)) {
            profile.weaknesses.push(item.content);
          }
          break;
      }
    }

    // 5. Fetch Topic-Relevant Concept Mastery Records
    try {
      const masteries = await prisma.conceptMastery.findMany({
        where: { userId },
        include: {
          concept: {
            select: { name: true, domain: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 15,
      });

      const topicKeywords = context.targetTopic ? extractKeywords(context.targetTopic) : [];

      for (const m of masteries) {
        const conceptName = m.concept?.name || "Concept";
        const domain = m.concept?.domain || "";

        // If targetTopic is provided, prioritize matching concepts
        let isTopicRelevant = true;
        if (topicKeywords.length > 0) {
          const cTokens = extractKeywords(`${conceptName} ${domain}`);
          isTopicRelevant = topicKeywords.some((k) => cTokens.includes(k));
        }

        if (isTopicRelevant) {
          if (m.mastery >= 0.8 && !profile.masteredTopics.includes(conceptName)) {
            profile.masteredTopics.push(conceptName);
          } else if (m.mastery < 0.5 && m.practiceCount > 0 && !profile.weakTopics.includes(conceptName)) {
            profile.weakTopics.push(conceptName);
          }
        }
      }
    } catch {
      // Graceful fallback if conceptMastery is not populated
    }

    // 6. Fetch Recent Quiz Attempts & Mistakes
    try {
      const attempts = await prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 3,
        select: {
          score: true,
          maxScore: true,
          quiz: {
            select: {
              title: true,
            },
          },
        },
      });

      profile.recentQuizMistakes = attempts.map((a) => ({
        quizTitle: a.quiz?.title || "Quiz",
        score: a.score,
        maxScore: a.maxScore,
      }));
    } catch {
      // Graceful fallback
    }

    // 7. Fetch Note Count
    try {
      const noteCount = await prisma.resource.count({
        where: { ownerId: userId, ownerType: "user" },
      });
      profile.recentNotesCount = noteCount;
    } catch {
      // Graceful fallback
    }
  } catch (err) {
    console.warn("[getStudentMemory error]", err);
  }

  return profile;
}

/**
 * Record a persistent student memory entry into the database
 */
export async function recordStudentMemory(
  userId: string,
  memory: {
    memoryType: MemoryType;
    content: string;
    confidence?: number;
    sourceMessageId?: string;
    expiresAt?: Date | null;
  }
): Promise<void> {
  if (!userId || !memory.content?.trim()) return;

  try {
    // Deduplicate recent identical memories
    const existing = await prisma.aiContextMemory.findFirst({
      where: {
        userId,
        memoryType: memory.memoryType,
        content: memory.content.trim(),
      },
    });

    if (!existing) {
      await prisma.aiContextMemory.create({
        data: {
          userId,
          memoryType: memory.memoryType,
          content: memory.content.trim(),
          confidence: memory.confidence ?? 0.8,
          sourceMessageId: memory.sourceMessageId,
          expiresAt: memory.expiresAt,
        },
      });
    } else if (memory.confidence && memory.confidence > existing.confidence) {
      // Update confidence if a higher-confidence reinforcement is observed
      await prisma.aiContextMemory.update({
        where: { id: existing.id },
        data: {
          confidence: memory.confidence,
          createdAt: new Date(), // Refresh recency
        },
      });
    }
  } catch (err) {
    console.warn("[recordStudentMemory error]", err);
  }
}

/**
 * Format the retrieved student memory profile into a concise, token-efficient system instruction block
 */
export function formatStudentMemoryForPrompt(
  profile: StudentMemoryProfile,
  locale: string = "uz"
): string {
  const sections: string[] = [];

  const headers: Record<
    string,
    {
      title: string;
      weakness: string;
      strength: string;
      style: string;
      goal: string;
      mistakes: string;
      instruction: string;
    }
  > = {
    uz: {
      title: "O'QUVCHINING XOTIRASI VA MOSLASHUVCHAN PEDAGOGIKA (STUDENT MEMORY)",
      weakness: "Zaif tomonlar va tushunmovchiliklar",
      strength: "O'zlashtirilgan mavzular va kuchli tomonlar",
      style: "O'rganish uslubi va afzalliklari",
      goal: "O'quv maqsadlari",
      mistakes: "Oxirgi test natijalari / xatolar",
      instruction: "PEDAGOGIK KO'RSATMA (PEDAGOGICAL INSTRUCTION): Ushbu xotiradan kelib chiqib tushuntirishlarni moslashtiring. O'quvchining zaifliklarini sabr bilan bartaraf eting, tushunilgan mavzularni ortiqcha takrorlamang.",
    },
    en: {
      title: "PERSISTENT STUDENT RELEVANT MEMORY & LEARNING PROFILE (STUDENT MEMORY)",
      weakness: "Known Weaknesses & Misconceptions",
      strength: "Mastered Topics & Strengths",
      style: "Learning Style & Preferences",
      goal: "Learning Goals",
      mistakes: "Recent Quiz Performance / Mistakes",
      instruction: "PEDAGOGICAL INSTRUCTION: Adapt your tutoring strategy to this profile. Address active misconceptions patiently, skip redundant basic explanations on mastered topics, and use Socratic dialogue.",
    },
    ru: {
      title: "АКТУАЛЬНАЯ ПАМЯТЬ И ПРОФИЛЬ УЧЕНИКА (STUDENT MEMORY)",
      weakness: "Слабые стороны и заблуждения",
      strength: "Освоенные темы и сильные стороны",
      style: "Стиль обучения и предпочтения",
      goal: "Учебные цели",
      mistakes: "Недавние ошибки и тесты",
      instruction: "ПЕДАГОГИЧЕСКАЯ ИНСТРУКЦИЯ (PEDAGOGICAL INSTRUCTION): Адаптируйте объяснения под ученика. Терпеливо устраняйте выявленные ошибки и заблуждения, не тратьте время на повтор уже освоенного материала.",
    },
  };

  const h = headers[locale] || headers.en;

  sections.push(`--- ${h.title} ---`);
  if (profile.name) {
    sections.push(`Student Name: ${profile.name}`);
  }
  if (profile.preferredDifficulty) {
    sections.push(`Target Difficulty: ${profile.preferredDifficulty}`);
  }

  // 1. High-Priority Misconceptions & Weaknesses First (Max 4 items)
  const allWeaknesses = [
    ...new Set([...profile.misconceptions, ...profile.weaknesses, ...profile.weakTopics]),
  ].slice(0, 4);

  if (allWeaknesses.length > 0) {
    sections.push(`• ${h.weakness}:\n  - ${allWeaknesses.join("\n  - ")}`);
  }

  // 2. Mastered Topics & Strengths (Max 3 items)
  const allStrengths = [
    ...new Set([...profile.masteredTopics, ...profile.strengths]),
  ].slice(0, 3);

  if (allStrengths.length > 0) {
    sections.push(`• ${h.strength}:\n  - ${allStrengths.join("\n  - ")}`);
  }

  // 3. Learning Preferences (Max 2 items)
  if (profile.learningPreferences.length > 0) {
    sections.push(`• ${h.style}:\n  - ${profile.learningPreferences.slice(0, 2).join("\n  - ")}`);
  }

  // 4. Goals (Max 2 items)
  if (profile.goals.length > 0) {
    sections.push(`• ${h.goal}:\n  - ${profile.goals.slice(0, 2).join("\n  - ")}`);
  }

  // 5. Recent Mistakes (Max 2 items)
  if (profile.recentQuizMistakes.length > 0) {
    const mistakeSummaries = profile.recentQuizMistakes
      .slice(0, 2)
      .map((m) => `${m.quizTitle} (${m.score}/${m.maxScore} pts)`)
      .join(", ");
    sections.push(`• ${h.mistakes}: ${mistakeSummaries}`);
  }

  sections.push(h.instruction);
  sections.push("-------------------------------------------------");

  return sections.join("\n");
}

/**
 * Asynchronously extract learning observations from tutor conversation and persist them
 */
export async function extractAndPersistConversationMemories(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  currentTopic?: string
): Promise<void> {
  if (!userId || messages.length < 2) return;

  try {
    const lastUserMessages = messages
      .filter((m) => m.role === "user")
      .slice(-3)
      .map((m) => m.content.toLowerCase());

    const combinedText = lastUserMessages.join(" ");

    // Detect confusion / misconception patterns in Uzbek, English, and Russian
    const confusionPatterns = [
      /tushunmadim|qiyin|adashdim|xato qildim|tushunmayapman|qanday qilib/i,
      /don't understand|confused|stuck|made a mistake|hard to get/i,
      /не понимаю|сложно|запутался|ошибся|не могу понять/i,
    ];

    const hasConfusion = confusionPatterns.some((pattern) => pattern.test(combinedText));
    if (hasConfusion && currentTopic) {
      await recordStudentMemory(userId, {
        memoryType: "weak_topic",
        content: `Requires additional practice in: ${currentTopic}`,
        confidence: 0.75,
      });
    }

    // Detect mastery / clarity patterns
    const masteryPatterns = [
      /tushundim|endi tushunarli|rahmat|oson ekan|aniq bo'ldi/i,
      /i understand|got it|makes sense now|thank you|clear now/i,
      /понял|теперь понятно|спасибо|все ясно/i,
    ];

    const hasMastery = masteryPatterns.some((pattern) => pattern.test(combinedText));
    if (hasMastery && currentTopic) {
      await recordStudentMemory(userId, {
        memoryType: "mastered_topic",
        content: `Demonstrated understanding of: ${currentTopic}`,
        confidence: 0.85,
      });
    }
  } catch (err) {
    console.warn("[extractAndPersistConversationMemories error]", err);
  }
}

