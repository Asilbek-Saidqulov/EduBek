/**
 * EduBek — Auto-grading pipeline.
 *
 * Given a question and a student's answer, returns the awarded points and
 * correctness flag. Six question types support auto-grading; essays and
 * short answers fall back to manual grading (the function returns
 * `autoGradable: false` for those).
 *
 * The pipeline is intentionally pure — no DB access, no side effects. The
 * assessment service composes this with the persistence layer.
 *
 * Future AI grading can plug into the same interface: implement
 * `gradeWithAI()` and dispatch to it from `gradeResponse` when the
 * question type is `essay` and a rubric is attached.
 */
import { badRequest } from "@/lib/errors";
import type {
  EssayPayload,
  FillBlankPayload,
  MatchingPayload,
  MultipleChoicePayload,
  MultipleSelectPayload,
  OrderingPayload,
  QuestionPayload,
  ShortAnswerPayload,
  TrueFalsePayload,
} from "@/features/question-bank/types";

export interface GradeResult {
  autoGradable: boolean;
  pointsAwarded: number;
  pointsMax: number;
  isCorrect: boolean;
  feedback?: string;
}

// ---------------------------------------------------------------------------
// Per-type graders
// ---------------------------------------------------------------------------

function arraysEqualUnordered(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((v, i) => v === sortedB[i]);
}

function gradeMultipleChoice(
  payload: MultipleChoicePayload,
  answer: unknown,
  pointsMax: number,
): GradeResult {
  if (typeof answer !== "number" || !Number.isInteger(answer)) {
    return {
      autoGradable: true,
      pointsAwarded: 0,
      pointsMax,
      isCorrect: false,
      feedback: "Answer must be a single option index.",
    };
  }
  const isCorrect = answer === payload.correctIndex;
  return {
    autoGradable: true,
    pointsAwarded: isCorrect ? pointsMax : 0,
    pointsMax,
    isCorrect,
    feedback: isCorrect
      ? payload.explanation ?? undefined
      : `Correct answer was option ${payload.correctIndex + 1}.`,
  };
}

function gradeMultipleSelect(
  payload: MultipleSelectPayload,
  answer: unknown,
  pointsMax: number,
): GradeResult {
  if (!Array.isArray(answer)) {
    return {
      autoGradable: true,
      pointsAwarded: 0,
      pointsMax,
      isCorrect: false,
      feedback: "Answer must be an array of option indices.",
    };
  }
  const selected = answer.filter((x): x is number => typeof x === "number" && Number.isInteger(x));
  const isCorrect = arraysEqualUnordered(selected, payload.correctIndices);
  return {
    autoGradable: true,
    pointsAwarded: isCorrect ? pointsMax : 0,
    pointsMax,
    isCorrect,
    feedback: isCorrect
      ? payload.explanation ?? undefined
      : `Correct answers were options ${payload.correctIndices.map((i) => i + 1).join(", ")}.`,
  };
}

function gradeTrueFalse(
  payload: TrueFalsePayload,
  answer: unknown,
  pointsMax: number,
): GradeResult {
  if (typeof answer !== "boolean") {
    return {
      autoGradable: true,
      pointsAwarded: 0,
      pointsMax,
      isCorrect: false,
      feedback: "Answer must be true or false.",
    };
  }
  const isCorrect = answer === payload.correct;
  return {
    autoGradable: true,
    pointsAwarded: isCorrect ? pointsMax : 0,
    pointsMax,
    isCorrect,
    feedback: isCorrect ? payload.explanation ?? undefined : `Correct answer was ${payload.correct}.`,
  };
}

function gradeShortAnswer(
  payload: ShortAnswerPayload,
  answer: unknown,
  pointsMax: number,
): GradeResult {
  // Short answers CAN be auto-graded if the teacher provided a closed set of
  // acceptable answers; we do case-insensitive trimmed comparison. If the
  // acceptable list is empty, fall back to manual grading.
  if (typeof answer !== "string") {
    return {
      autoGradable: true,
      pointsAwarded: 0,
      pointsMax,
      isCorrect: false,
      feedback: "Answer must be a string.",
    };
  }
  if (payload.acceptableAnswers.length === 0) {
    return {
      autoGradable: false,
      pointsAwarded: 0,
      pointsMax,
      isCorrect: false,
      feedback: "Manual grading required.",
    };
  }
  const normalized = answer.trim().toLowerCase();
  const isCorrect = payload.acceptableAnswers.some(
    (a) => a.trim().toLowerCase() === normalized,
  );
  return {
    autoGradable: true,
    pointsAwarded: isCorrect ? pointsMax : 0,
    pointsMax,
    isCorrect,
    feedback: isCorrect ? payload.explanation ?? undefined : "Answer did not match any acceptable response.",
  };
}

function gradeMatching(
  payload: MatchingPayload,
  answer: unknown,
  pointsMax: number,
): GradeResult {
  // Answer shape: { [leftIndex: number]: rightIndex: number }
  // Each pair correct = full marks pro-rated.
  if (!Array.isArray(payload.pairs) || payload.pairs.length === 0) {
    return {
      autoGradable: false,
      pointsAwarded: 0,
      pointsMax,
      isCorrect: false,
      feedback: "Question has no pairs to grade.",
    };
  }
  if (typeof answer !== "object" || answer === null || Array.isArray(answer)) {
    return {
      autoGradable: true,
      pointsAwarded: 0,
      pointsMax,
      isCorrect: false,
      feedback: "Answer must be a mapping object { leftIndex: rightIndex }.",
    };
  }
  const ans = answer as Record<string, number>;
  const totalPairs = payload.pairs.length;
  let correctCount = 0;
  for (let i = 0; i < totalPairs; i++) {
    const given = ans[String(i)];
    if (typeof given === "number" && given === i) {
      correctCount += 1;
    }
  }
  const pointsPerPair = pointsMax / totalPairs;
  const pointsAwarded = Math.round(correctCount * pointsPerPair);
  const isCorrect = correctCount === totalPairs;
  return {
    autoGradable: true,
    pointsAwarded,
    pointsMax,
    isCorrect,
    feedback: isCorrect
      ? payload.explanation ?? undefined
      : `${correctCount}/${totalPairs} pairs matched correctly.`,
  };
}

function gradeOrdering(
  payload: OrderingPayload,
  answer: unknown,
  pointsMax: number,
): GradeResult {
  // Answer shape: number[] (reordered indices of payload.items).
  if (!Array.isArray(answer)) {
    return {
      autoGradable: true,
      pointsAwarded: 0,
      pointsMax,
      isCorrect: false,
      feedback: "Answer must be an array of item indices in order.",
    };
  }
  const expected = payload.items.map((_, i) => i);
  const isCorrect =
    answer.length === expected.length &&
    answer.every((v, i) => v === expected[i]);
  return {
    autoGradable: true,
    pointsAwarded: isCorrect ? pointsMax : 0,
    pointsMax,
    isCorrect,
    feedback: isCorrect
      ? payload.explanation ?? undefined
      : "Items are not in the correct order.",
  };
}

function gradeFillBlank(
  payload: FillBlankPayload,
  answer: unknown,
  pointsMax: number,
): GradeResult {
  // Answer shape: string[] (one per blank, in order).
  if (!Array.isArray(answer)) {
    return {
      autoGradable: true,
      pointsAwarded: 0,
      pointsMax,
      isCorrect: false,
      feedback: "Answer must be an array of strings, one per blank.",
    };
  }
  const totalBlanks = payload.blanks.length;
  if (answer.length !== totalBlanks) {
    return {
      autoGradable: true,
      pointsAwarded: 0,
      pointsMax,
      isCorrect: false,
      feedback: `Expected ${totalBlanks} answers, received ${answer.length}.`,
    };
  }
  let correctCount = 0;
  for (let i = 0; i < totalBlanks; i++) {
    const given = String(answer[i] ?? "").trim().toLowerCase();
    const expected = payload.blanks[i]!.trim().toLowerCase();
    if (given === expected) correctCount += 1;
  }
  const pointsPerBlank = pointsMax / totalBlanks;
  const pointsAwarded = Math.round(correctCount * pointsPerBlank);
  const isCorrect = correctCount === totalBlanks;
  return {
    autoGradable: true,
    pointsAwarded,
    pointsMax,
    isCorrect,
    feedback: isCorrect
      ? payload.explanation ?? undefined
      : `${correctCount}/${totalBlanks} blanks filled correctly.`,
  };
}

function gradeEssay(
  _payload: EssayPayload,
  _answer: unknown,
  pointsMax: number,
): GradeResult {
  // Essays always require manual grading (or future AI grading).
  return {
    autoGradable: false,
    pointsAwarded: 0,
    pointsMax,
    isCorrect: false,
    feedback: "Essay requires manual grading.",
  };
}

// ---------------------------------------------------------------------------
// Public dispatch function
// ---------------------------------------------------------------------------

export function gradeResponse(
  questionType: string,
  payload: QuestionPayload,
  answer: unknown,
  pointsMax: number,
): GradeResult {
  switch (questionType) {
    case "multiple_choice":
      return gradeMultipleChoice(payload as MultipleChoicePayload, answer, pointsMax);
    case "multiple_select":
      return gradeMultipleSelect(payload as MultipleSelectPayload, answer, pointsMax);
    case "true_false":
      return gradeTrueFalse(payload as TrueFalsePayload, answer, pointsMax);
    case "short_answer":
      return gradeShortAnswer(payload as ShortAnswerPayload, answer, pointsMax);
    case "matching":
      return gradeMatching(payload as MatchingPayload, answer, pointsMax);
    case "ordering":
      return gradeOrdering(payload as OrderingPayload, answer, pointsMax);
    case "fill_blank":
      return gradeFillBlank(payload as FillBlankPayload, answer, pointsMax);
    case "essay":
      return gradeEssay(payload as EssayPayload, answer, pointsMax);
    default:
      throw badRequest(`Unknown question type: ${questionType}`);
  }
}

// ---------------------------------------------------------------------------
// Batch helper — grades all auto-gradable responses in a single pass.
// Returns the summary stats the service uses to update the attempt row.
// ---------------------------------------------------------------------------

export interface BatchGradeItem {
  responseId: string;
  questionType: string;
  payload: QuestionPayload;
  answer: unknown;
  pointsMax: number;
}

export interface BatchGradeOutput {
  updates: Array<{
    id: string;
    pointsAwarded: number;
    isCorrect: boolean;
    gradedBy: "auto";
    feedback?: string;
  }>;
  totalAwarded: number;
  totalMax: number;
  needsManualCount: number;
}

export function batchGradeResponses(items: BatchGradeItem[]): BatchGradeOutput {
  const updates: BatchGradeOutput["updates"] = [];
  let totalAwarded = 0;
  let totalMax = 0;
  let needsManualCount = 0;

  for (const item of items) {
    const result = gradeResponse(item.questionType, item.payload, item.answer, item.pointsMax);
    totalMax += item.pointsMax;
    if (!result.autoGradable) {
      needsManualCount += 1;
      continue; // leave the response ungraded; teacher will pick it up
    }
    totalAwarded += result.pointsAwarded;
    updates.push({
      id: item.responseId,
      pointsAwarded: result.pointsAwarded,
      isCorrect: result.isCorrect,
      gradedBy: "auto",
      feedback: result.feedback,
    });
  }

  return { updates, totalAwarded, totalMax, needsManualCount };
}
