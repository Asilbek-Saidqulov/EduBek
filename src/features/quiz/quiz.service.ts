import { db } from "@/lib/db";
import { badRequest, forbidden, notFound, conflict } from "@/lib/errors";
import type {
  CreateQuizInput,
  UpdateQuizInput,
  QuestionInput,
  UpdateQuestionInput,
  ListQuizzesQuery,
  SubmitAttemptInput,
} from "./quiz.schema";

export interface QuestionPublicView {
  id: string;
  type: string;
  question: string;
  options: string[];
  points: number;
  difficulty: string;
  orderNum: number;
  mediaUrl?: string | null;
}

export interface QuestionCreatorView extends QuestionPublicView {
  correctIndex: number;
  explanation?: string | null;
  tags?: string[];
}

/**
 * Parses options stored as JSON string in Question model
 */
function parseOptions(optionsRaw: string): string[] {
  try {
    const parsed = JSON.parse(optionsRaw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Parses tags stored as JSON string in Question model
 */
function parseTags(tagsRaw?: string | null): string[] {
  if (!tagsRaw) return [];
  try {
    const parsed = JSON.parse(tagsRaw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class QuizService {
  /**
   * Create a new quiz with optional initial questions
   */
  async createQuiz(userId: string, data: CreateQuizInput) {
    // Validate question indexes against options length
    if (data.questions && data.questions.length > 0) {
      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
          throw badRequest(
            `Question ${i + 1} has an invalid correctIndex (${q.correctIndex}) for options count (${q.options.length})`
          );
        }
      }
    }

    return await db.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          title: data.title,
          description: data.description || null,
          category: data.category || "general",
          difficulty: data.difficulty || "medium",
          mode: data.mode || "classic",
          language: data.language || "uz",
          teacherId: userId,
          isPublished: false,
          questions: {
            create: (data.questions || []).map((q, idx) => ({
              type: q.type || "multiple_choice",
              question: q.question,
              options: JSON.stringify(q.options),
              correctIndex: q.correctIndex,
              explanation: q.explanation || null,
              difficulty: q.difficulty || data.difficulty || "medium",
              points: q.points || 1,
              tags: q.tags && q.tags.length > 0 ? JSON.stringify(q.tags) : null,
              orderNum: q.orderNum !== undefined ? q.orderNum : idx,
              mediaUrl: q.mediaUrl || null,
            })),
          },
        },
        include: {
          questions: {
            orderBy: { orderNum: "asc" },
          },
        },
      });

      // Update creator profile statistics
      await tx.profile.upsert({
        where: { userId },
        create: {
          userId,
          gamesCreated: 1,
        },
        update: {
          gamesCreated: { increment: 1 },
        },
      });

      return {
        ...quiz,
        questions: quiz.questions.map((q) => ({
          ...q,
          options: parseOptions(q.options),
          tags: parseTags(q.tags),
        })),
      };
    });
  }

  /**
   * Get a quiz by ID.
   * If requester is the creator, returns full questions with answers.
   * If requester is another user / student, returns masked questions without correct answers.
   */
  async getQuizById(quizId: string, currentUserId?: string | null) {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        questions: {
          orderBy: { orderNum: "asc" },
        },
        _count: {
          select: {
            attempts: true,
            questions: true,
          },
        },
      },
    });

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    const isCreator = currentUserId === quiz.teacherId;

    if (!quiz.isPublished && !isCreator) {
      throw forbidden("This quiz is currently a private draft");
    }

    const formattedQuestions = quiz.questions.map((q) => {
      const options = parseOptions(q.options);
      const tags = parseTags(q.tags);

      if (isCreator) {
        return {
          id: q.id,
          type: q.type,
          question: q.question,
          options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          difficulty: q.difficulty,
          points: q.points,
          tags,
          orderNum: q.orderNum,
          mediaUrl: q.mediaUrl,
        } as QuestionCreatorView;
      }

      // Public / Player view (NO answers/explanations exposed)
      return {
        id: q.id,
        type: q.type,
        question: q.question,
        options,
        points: q.points,
        difficulty: q.difficulty,
        orderNum: q.orderNum,
        mediaUrl: q.mediaUrl,
      } as QuestionPublicView;
    });

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      mode: quiz.mode,
      language: quiz.language,
      isPublished: quiz.isPublished,
      publishedAt: quiz.publishedAt,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      teacher: quiz.teacher,
      isOwner: isCreator,
      questionCount: quiz._count.questions,
      totalAttempts: quiz._count.attempts,
      questions: formattedQuestions,
    };
  }

  /**
   * List quizzes with search, category/difficulty filtering, or list user's own quizzes
   */
  async listQuizzes(query: ListQuizzesQuery, currentUserId?: string | null) {
    const { category, difficulty, search, mine, limit = 20, offset = 0 } = query;

    const whereClause: any = {};

    if (mine === "true") {
      if (!currentUserId) {
        throw forbidden("Authentication required to view your own quizzes");
      }
      whereClause.teacherId = currentUserId;
    } else {
      whereClause.isPublished = true;
      whereClause.moderationStatus = "clean";
    }

    if (category) {
      whereClause.category = { equals: category, mode: "insensitive" };
    }

    if (difficulty) {
      whereClause.difficulty = difficulty;
    }

    if (search && search.trim().length > 0) {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [quizzes, total] = await Promise.all([
      db.quiz.findMany({
        where: whereClause,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          mode: true,
          language: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
          teacher: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      }),
      db.quiz.count({ where: whereClause }),
    ]);

    return {
      quizzes: quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        difficulty: q.difficulty,
        mode: q.mode,
        language: q.language,
        isPublished: q.isPublished,
        publishedAt: q.publishedAt,
        createdAt: q.createdAt,
        teacher: q.teacher,
        questionCount: q._count.questions,
        totalAttempts: q._count.attempts,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Update quiz metadata (Owner only)
   */
  async updateQuiz(quizId: string, userId: string, data: UpdateQuizInput) {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, teacherId: true },
    });

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    if (quiz.teacherId !== userId) {
      throw forbidden("You are not authorized to edit this quiz");
    }

    const updated = await db.quiz.update({
      where: { id: quizId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.difficulty && { difficulty: data.difficulty }),
        ...(data.mode && { mode: data.mode }),
        ...(data.language && { language: data.language }),
      },
    });

    return updated;
  }

  /**
   * Add a question to an existing quiz (Owner only)
   */
  async addQuestion(quizId: string, userId: string, input: QuestionInput) {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, teacherId: true },
    });

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    if (quiz.teacherId !== userId) {
      throw forbidden("You are not authorized to add questions to this quiz");
    }

    if (input.correctIndex < 0 || input.correctIndex >= input.options.length) {
      throw badRequest(
        `Invalid correctIndex (${input.correctIndex}) for options count (${input.options.length})`
      );
    }

    const question = await db.question.create({
      data: {
        quizId,
        type: input.type || "multiple_choice",
        question: input.question,
        options: JSON.stringify(input.options),
        correctIndex: input.correctIndex,
        explanation: input.explanation || null,
        difficulty: input.difficulty || "medium",
        points: input.points || 1,
        tags: input.tags && input.tags.length > 0 ? JSON.stringify(input.tags) : null,
        orderNum: input.orderNum || 0,
        mediaUrl: input.mediaUrl || null,
      },
    });

    return {
      ...question,
      options: parseOptions(question.options),
      tags: parseTags(question.tags),
    };
  }

  /**
   * Update an existing question (Owner only)
   */
  async updateQuestion(quizId: string, questionId: string, userId: string, input: UpdateQuestionInput) {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, teacherId: true },
    });

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    if (quiz.teacherId !== userId) {
      throw forbidden("You are not authorized to edit questions on this quiz");
    }

    const existingQuestion = await db.question.findUnique({
      where: { id: questionId },
    });

    if (!existingQuestion || existingQuestion.quizId !== quizId) {
      throw notFound("Question not found in this quiz");
    }

    const options = input.options ? input.options : parseOptions(existingQuestion.options);
    const correctIndex = input.correctIndex !== undefined ? input.correctIndex : existingQuestion.correctIndex;

    if (correctIndex < 0 || correctIndex >= options.length) {
      throw badRequest(`Invalid correctIndex (${correctIndex}) for options length (${options.length})`);
    }

    const updated = await db.question.update({
      where: { id: questionId },
      data: {
        ...(input.type && { type: input.type }),
        ...(input.question && { question: input.question }),
        ...(input.options && { options: JSON.stringify(input.options) }),
        ...(input.correctIndex !== undefined && { correctIndex: input.correctIndex }),
        ...(input.explanation !== undefined && { explanation: input.explanation }),
        ...(input.difficulty && { difficulty: input.difficulty }),
        ...(input.points !== undefined && { points: input.points }),
        ...(input.tags !== undefined && { tags: JSON.stringify(input.tags) }),
        ...(input.orderNum !== undefined && { orderNum: input.orderNum }),
        ...(input.mediaUrl !== undefined && { mediaUrl: input.mediaUrl }),
      },
    });

    return {
      ...updated,
      options: parseOptions(updated.options),
      tags: parseTags(updated.tags),
    };
  }

  /**
   * Delete a question from a quiz (Owner only)
   */
  async deleteQuestion(quizId: string, questionId: string, userId: string) {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, teacherId: true },
    });

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    if (quiz.teacherId !== userId) {
      throw forbidden("You are not authorized to delete questions from this quiz");
    }

    const existingQuestion = await db.question.findUnique({
      where: { id: questionId },
    });

    if (!existingQuestion || existingQuestion.quizId !== quizId) {
      throw notFound("Question not found in this quiz");
    }

    await db.question.delete({
      where: { id: questionId },
    });

    return { success: true };
  }

  /**
   * Publish a quiz (must have at least 1 question)
   */
  async publishQuiz(quizId: string, userId: string) {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    if (quiz.teacherId !== userId) {
      throw forbidden("You are not authorized to publish this quiz");
    }

    if (quiz._count.questions === 0) {
      throw badRequest("Cannot publish a quiz with zero questions. Add at least one question first.");
    }

    const updated = await db.quiz.update({
      where: { id: quizId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      isPublished: updated.isPublished,
      publishedAt: updated.publishedAt,
    };
  }

  /**
   * Unpublish a quiz
   */
  async unpublishQuiz(quizId: string, userId: string) {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, teacherId: true },
    });

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    if (quiz.teacherId !== userId) {
      throw forbidden("You are not authorized to unpublish this quiz");
    }

    const updated = await db.quiz.update({
      where: { id: quizId },
      data: {
        isPublished: false,
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      isPublished: updated.isPublished,
    };
  }

  /**
   * Start an authenticated quiz attempt
   */
  async startAttempt(quizId: string, userId: string) {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { orderNum: "asc" },
        },
      },
    });

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    const isOwner = quiz.teacherId === userId;
    if (!quiz.isPublished && !isOwner) {
      throw forbidden("Cannot start an attempt on an unpublished quiz");
    }

    if (quiz.questions.length === 0) {
      throw badRequest("This quiz has no questions available to play");
    }

    // Count previous attempts for this user and quiz
    const previousAttemptsCount = await db.quizAttempt.count({
      where: {
        quizId,
        userId,
      },
    });

    const maxScore = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);

    const attempt = await db.quizAttempt.create({
      data: {
        quizId,
        userId,
        startedAt: new Date(),
        attemptNumber: previousAttemptsCount + 1,
        maxScore,
        score: 0,
      },
    });

    // Strip answers from questions returned to client for security
    const sanitizedQuestions: QuestionPublicView[] = quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: parseOptions(q.options),
      points: q.points,
      difficulty: q.difficulty,
      orderNum: q.orderNum,
      mediaUrl: q.mediaUrl,
    }));

    return {
      attemptId: attempt.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      category: quiz.category,
      difficulty: quiz.difficulty,
      mode: quiz.mode,
      attemptNumber: attempt.attemptNumber,
      startedAt: attempt.startedAt,
      maxScore,
      questions: sanitizedQuestions,
    };
  }

  /**
   * Submit answers for an attempt — 100% Server-Side Grading, Anti-Cheat, and Atomic Persistence
   */
  async submitAttempt(attemptId: string, userId: string, input: SubmitAttemptInput) {
    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { orderNum: "asc" },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw notFound("Quiz attempt not found");
    }

    // IDOR Protection: attempt must belong to authenticated user
    if (attempt.userId !== userId) {
      throw forbidden("You cannot submit another user's quiz attempt");
    }

    // Duplicate submission prevention: cannot submit already finalized attempt
    if (attempt.finishedAt !== null) {
      throw conflict("This quiz attempt has already been submitted and graded");
    }

    const authoritativeQuestions = attempt.quiz.questions;
    const submittedAnswersMap = new Map<string, SubmitAttemptInput["answers"][0]>();

    for (const ans of input.answers) {
      submittedAnswersMap.set(ans.questionId, ans);
    }

    let calculatedScore = 0;
    let calculatedMaxScore = 0;
    let correctCount = 0;

    const questionResults = authoritativeQuestions.map((q) => {
      const pointsPossible = q.points || 1;
      calculatedMaxScore += pointsPossible;

      const userSubmission = submittedAnswersMap.get(q.id);
      const userSelectedIndex = userSubmission?.selectedIndex ?? null;

      const isCorrect = userSelectedIndex !== null && userSelectedIndex === q.correctIndex;
      const pointsEarned = isCorrect ? pointsPossible : 0;

      if (isCorrect) {
        calculatedScore += pointsEarned;
        correctCount += 1;
      }

      return {
        questionId: q.id,
        question: q.question,
        options: parseOptions(q.options),
        userSelectedIndex,
        correctIndex: q.correctIndex, // Now safe to return post-submission
        isCorrect,
        pointsPossible,
        pointsEarned,
        explanation: q.explanation || null,
      };
    });

    const accuracy =
      calculatedMaxScore > 0
        ? Math.round((calculatedScore / calculatedMaxScore) * 1000) / 10
        : 0;

    // XP Engine: Base XP + points multiplier + perfect score bonus
    const baseXp = 50;
    const scoreXp = calculatedScore * 25;
    const perfectBonus = accuracy >= 100 && calculatedScore > 0 ? 50 : 0;
    const earnedXp = baseXp + scoreXp + perfectBonus;

    const finishedAt = new Date();

    // Atomic transaction: Persist attempt score and update profile XP / stats
    const { updatedAttempt, updatedProfile } = await db.$transaction(async (tx) => {
      const updatedAttempt = await tx.quizAttempt.update({
        where: { id: attemptId },
        data: {
          score: calculatedScore,
          maxScore: calculatedMaxScore,
          timeSpentMs: input.timeSpentMs || 0,
          finishedAt,
        },
      });

      const profile = await tx.profile.findUnique({
        where: { userId },
      });

      const currentXp = profile?.xp || 0;
      const newTotalXp = currentXp + earnedXp;
      const newLevel = Math.max(1, Math.floor(Math.sqrt(newTotalXp / 100)) + 1);
      const currentGamesPlayed = profile?.gamesPlayed || 0;
      const newGamesPlayed = currentGamesPlayed + 1;

      const updatedProfile = await tx.profile.upsert({
        where: { userId },
        create: {
          userId,
          xp: newTotalXp,
          level: newLevel,
          gamesPlayed: 1,
          accuracy,
        },
        update: {
          xp: newTotalXp,
          level: newLevel,
          gamesPlayed: { increment: 1 },
          accuracy: profile?.accuracy
            ? (profile.accuracy * currentGamesPlayed + accuracy) / newGamesPlayed
            : accuracy,
        },
      });

      return { updatedAttempt, updatedProfile };
    });

    return {
      attemptId: updatedAttempt.id,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz.title,
      startedAt: attempt.startedAt,
      finishedAt: updatedAttempt.finishedAt,
      timeSpentMs: updatedAttempt.timeSpentMs,
      score: calculatedScore,
      maxScore: calculatedMaxScore,
      correctCount,
      totalQuestions: authoritativeQuestions.length,
      accuracy,
      earnedXp,
      newTotalXp: updatedProfile.xp,
      newLevel: updatedProfile.level,
      questionResults,
    };
  }

  /**
   * Get historical attempt result by attempt ID
   */
  async getAttemptResult(attemptId: string, userId: string) {
    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { orderNum: "asc" },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!attempt) {
      throw notFound("Quiz attempt not found");
    }

    const isAttemptOwner = attempt.userId === userId;
    const isQuizOwner = attempt.quiz.teacherId === userId;

    if (!isAttemptOwner && !isQuizOwner) {
      throw forbidden("You are not authorized to view this attempt result");
    }

    if (!attempt.finishedAt) {
      return {
        attemptId: attempt.id,
        status: "in_progress",
        quizId: attempt.quizId,
        quizTitle: attempt.quiz.title,
        startedAt: attempt.startedAt,
      };
    }

    const accuracy =
      attempt.maxScore > 0
        ? Math.round((attempt.score / attempt.maxScore) * 1000) / 10
        : 0;

    return {
      attemptId: attempt.id,
      status: "completed",
      quizId: attempt.quizId,
      quizTitle: attempt.quiz.title,
      category: attempt.quiz.category,
      difficulty: attempt.quiz.difficulty,
      user: attempt.user,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      timeSpentMs: attempt.timeSpentMs,
      attemptNumber: attempt.attemptNumber,
      score: attempt.score,
      maxScore: attempt.maxScore,
      accuracy,
      totalQuestions: attempt.quiz.questions.length,
    };
  }
}

export const quizService = new QuizService();
