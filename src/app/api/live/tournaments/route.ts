/**
 * POST /api/live/tournaments  — create a tournament
 * GET  /api/live/tournaments  — list tournaments
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  createTournament,
  listTournaments,
  createTournamentBodySchema,
  listTournamentsQuerySchema,
} from "@/features/tournament";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = createTournamentBodySchema.parse(await req.json());
  const tournament = await createTournament(ctx, body);
  return NextResponse.json(tournament, { status: 201 });
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = listTournamentsQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listTournaments(ctx, query);
  return NextResponse.json(result);
});
