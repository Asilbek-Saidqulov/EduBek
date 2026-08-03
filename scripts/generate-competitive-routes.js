#!/usr/bin/env node
/**
 * Generates the 20 read-only API routes for /api/competitive/*
 * Run once: node /home/z/my-project/scripts/generate-competitive-routes.js
 */
const fs = require("fs");
const path = require("path");

const baseDir = "/home/z/my-project/src/app/api/competitive";

const routes = [
  { name: "profile", imports: ["getCompetitiveProfile"], body: "const profile = getCompetitiveProfile(userId); if (!profile) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Competitive profile not found' } }, { status: 404 }); return NextResponse.json(profile);" },
  { name: "rating", imports: ["getRatingRecord", "getRatingHistory", "getRatingConfig"], body: "return NextResponse.json({ config: getRatingConfig(), rating: userId ? getRatingRecord(userId, (searchParams.get('gameMode') ?? 'classic_quiz')) : null, history: userId ? getRatingHistory(userId).slice(-50) : [] });" },
  { name: "placement", imports: ["getPlacementConfig", "getPlacementMatches"], body: "return NextResponse.json({ config: getPlacementConfig(), matches: userId ? getPlacementMatches(userId) : [] });" },
  { name: "matchmaking", imports: ["getTicket"], body: "const ticketId = searchParams.get('ticketId'); return NextResponse.json({ ticket: ticketId ? getTicket(ticketId) : null });" },
  { name: "queues", imports: ["getAllQueueSizes", "getQueueConfig"], body: "return NextResponse.json({ sizes: getAllQueueSizes(), configs: { solo: getQueueConfig('solo'), party: getQueueConfig('party'), ranked: getQueueConfig('ranked'), casual: getQueueConfig('casual'), tournament: getQueueConfig('tournament') } });" },
  { name: "ranked", imports: ["getRankedConfig", "isRankedAvailable", "eligibleForSeasonRewards"], body: "return NextResponse.json({ config: getRankedConfig(), rankedAvailable: userId ? isRankedAvailable(userId) : false, eligibleForRewards: userId ? eligibleForSeasonRewards(userId) : false });" },
  { name: "divisions", imports: ["listDivisions", "getDivision"], body: "return NextResponse.json({ divisions: listDivisions() });" },
  { name: "leagues", imports: ["listLeagues"], body: "return NextResponse.json({ leagues: listLeagues() });" },
  { name: "leaderboards", imports: ["buildLeaderboard"], body: "const view = (searchParams.get('view') ?? 'global'); return NextResponse.json({ leaderboard: buildLeaderboard({ view }) });" },
  { name: "tournaments", imports: ["listTournaments", "getTournament"], body: "const tournamentId = searchParams.get('tournamentId'); if (tournamentId) { const t = getTournament(tournamentId); if (!t) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Tournament not found' } }, { status: 404 }); return NextResponse.json(t); } return NextResponse.json({ tournaments: listTournaments() });" },
  { name: "championships", imports: ["listChampionships", "getChampionship"], body: "const championshipId = searchParams.get('championshipId'); if (championshipId) { const c = getChampionship(championshipId); if (!c) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Championship not found' } }, { status: 404 }); return NextResponse.json(c); } return NextResponse.json({ championships: listChampionships() });" },
  { name: "scheduler", imports: ["getSchedulerEvents"], body: "const tournamentId = searchParams.get('tournamentId'); return NextResponse.json({ events: tournamentId ? getSchedulerEvents(tournamentId) : [] });" },
  { name: "seeding", imports: [], body: "return NextResponse.json({ strategies: ['random', 'rating', 'organization', 'previous_champions', 'manual', 'balanced', 'snake'] });" },
  { name: "rewards", imports: ["getCompetitiveRewards"], body: "return NextResponse.json({ rewards: userId ? getCompetitiveRewards(userId) : [] });" },
  { name: "fairplay", imports: ["getFairPlayFindings"], body: "return NextResponse.json({ findings: userId ? getFairPlayFindings(userId) : [] });" },
  { name: "analytics", imports: ["generateCompetitiveAnalytics"], body: "return NextResponse.json(generateCompetitiveAnalytics());" },
  { name: "organizations", imports: ["listOrganizationCompetitions"], body: "return NextResponse.json({ competitions: listOrganizationCompetitions() });" },
  { name: "olympiads", imports: ["listOlympiads"], body: "return NextResponse.json({ olympiads: listOlympiads() });" },
  { name: "hall-of-fame", imports: ["getHallOfFame"], body: "return NextResponse.json({ entries: getHallOfFame() });" },
  { name: "dashboard", imports: ["generateCompetitiveDashboard"], body: "const audience = (searchParams.get('audience') ?? 'player'); return NextResponse.json(generateCompetitiveDashboard({ userId, audience }));" },
];

for (const route of routes) {
  const routeDir = path.join(baseDir, route.name);
  fs.mkdirSync(routeDir, { recursive: true });
  const importsStr = route.imports.length > 0 ? `import { ${route.imports.join(", ")} } from "@/features/competitive-platform";\n` : "";
  const content = `/** GET /api/competitive/${route.name} — Competitive platform ${route.name} (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
${importsStr}
export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? ctx.userId;
  ${route.body}
});
`;
  fs.writeFileSync(path.join(routeDir, "route.ts"), content, "utf8");
  console.log(`Created ${route.name}/route.ts`);
}
console.log(`\nAll ${routes.length} routes created.`);
