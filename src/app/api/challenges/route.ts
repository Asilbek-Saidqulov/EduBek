/**
 * GET  /api/challenges — List challenges
 * POST /api/challenges — Create a challenge (org admin / teacher)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { createChallenge, listChallenges } from "@/features/collaboration";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["weekly", "monthly", "tournament", "season", "department"]),
  metric: z.enum(["xp", "questions_correct", "topics_mastered", "streak_days", "study_minutes"]),
  targetValue: z.number().int().min(1),
  organizationId: z.string().optional(),
  classroomId: z.string().optional(),
  groupId: z.string().optional(),
  department: z.string().optional(),
  rewardType: z.enum(["xp", "badge", "certificate", "marketplace_reward", "org_points"]).default("xp"),
  rewardValue: z.number().int().min(0).default(100),
  secondRewardType: z.enum(["xp", "badge", "certificate", "marketplace_reward", "org_points"]).optional(),
  secondRewardValue: z.number().int().min(0).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const challenges = await listChallenges({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    classroomId: url.searchParams.get("classroomId") ?? undefined,
    groupId: url.searchParams.get("groupId") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ challenges, total: challenges.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId || (!can(ctx, PlatformPermission.PLATFORM_ADMIN) && !ctx.isSuperadmin)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }
  const body = createSchema.parse(await req.json());
  const challenge = await createChallenge({
    ...body,
    startsAt: new Date(body.startsAt),
    endsAt: new Date(body.endsAt),
  });
  return NextResponse.json(challenge, { status: 201 });
});
