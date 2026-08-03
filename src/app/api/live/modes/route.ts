/**
 * GET /api/live/modes  — list all available game modes
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { listGameModes } from "@/features/game-mode";

export const GET = withErrorHandler(async () => {
  const modes = listGameModes();
  return NextResponse.json({ modes });
});
