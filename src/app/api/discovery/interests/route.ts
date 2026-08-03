/** GET /api/discovery/interests — Get the authenticated user's interest profile */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getInterestProfile } from "@/features/semantic-search";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  const profile = await getInterestProfile(ctx.userId);

  return NextResponse.json({
    userId: profile.userId,
    interests: profile.interests,
    mastery: profile.mastery,
    topicAffinity: profile.topicAffinity,
    signals: profile.signals,
    lastComputedAt: profile.lastComputedAt,
    summary: {
      topInterests: Object.entries(profile.interests)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic, weight]) => ({ topic, weight: Math.round(weight * 100) / 100 })),
      masteredCount: Object.values(profile.mastery).filter((l) => l === "mastered").length,
      learningCount: Object.values(profile.mastery).filter((l) => l === "learning").length,
      weakCount: Object.values(profile.mastery).filter((l) => l === "weak").length,
    },
  });
});
