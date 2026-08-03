#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const baseDir = "/home/z/my-project/src/app/api/social";
const routes = [
  { name: "profiles", imports: ["getSocialProfile", "listAllProfiles"], body: "const targetId = searchParams.get('userId') ?? ctx.userId; const profile = getSocialProfile(targetId); if (!profile) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Profile not found' } }, { status: 404 }); return NextResponse.json(profile);" },
  { name: "friends", imports: ["getFriends", "getPendingRequests"], body: "const targetId = searchParams.get('userId') ?? ctx.userId; return NextResponse.json({ friends: getFriends(targetId), pending: getPendingRequests(targetId) });" },
  { name: "presence", imports: ["getPresenceForUser", "getPresenceCount"], body: "const targetId = searchParams.get('userId') ?? ctx.userId; return NextResponse.json({ presence: getPresenceForUser(targetId), counts: getPresenceCount() });" },
  { name: "clubs", imports: ["listClubs", "getClubById"], body: "const clubId = searchParams.get('clubId'); if (clubId) { const c = getClubById(clubId); if (!c) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Club not found' } }, { status: 404 }); return NextResponse.json(c); } return NextResponse.json({ clubs: listClubs() });" },
  { name: "roles", imports: ["ROLE_PERMISSIONS"], body: "return NextResponse.json({ roles: ROLE_PERMISSIONS });" },
  { name: "teams", imports: ["listTeams"], body: "return NextResponse.json({ teams: listTeams() });" },
  { name: "activity", imports: ["getActivityFeed", "getRecentActivity"], body: "const targetId = searchParams.get('userId') ?? ctx.userId; const limit = parseInt(searchParams.get('limit') ?? '50', 10); return NextResponse.json({ feed: getActivityFeed(targetId, limit), recent: getRecentActivity(20) });" },
  { name: "reputation", imports: ["getReputationForUser", "getTopReputableUsers"], body: "const targetId = searchParams.get('userId') ?? ctx.userId; return NextResponse.json({ reputation: getReputationForUser(targetId), top: getTopReputableUsers(10) });" },
  { name: "privacy", imports: ["getPrivacy"], body: "const targetId = searchParams.get('userId') ?? ctx.userId; return NextResponse.json({ privacy: getPrivacy(targetId) });" },
  { name: "discovery", imports: ["generateDiscovery"], body: "return NextResponse.json(generateDiscovery(ctx.userId));" },
  { name: "moderation", imports: ["listReports", "listAppeals"], body: "return NextResponse.json({ reports: listReports(), appeals: listAppeals() });" },
  { name: "analytics", imports: ["generateSocialAnalytics"], body: "return NextResponse.json(generateSocialAnalytics());" },
  { name: "rankings", imports: ["generateRanking"], body: "const type = (searchParams.get('type') ?? 'top_clubs') as 'top_clubs' | 'top_schools' | 'top_universities' | 'top_organizations' | 'top_teams' | 'most_active' | 'most_helpful' | 'most_competitive'; return NextResponse.json(generateRanking(type));" },
  { name: "health", imports: ["getAllClubHealth"], body: "return NextResponse.json({ health: getAllClubHealth() });" },
  { name: "dashboard", imports: ["generateCommunityDashboard"], body: "return NextResponse.json(generateCommunityDashboard(ctx.userId));" },
  { name: "developer", imports: ["getDeveloperIntegration"], body: "return NextResponse.json(getDeveloperIntegration());" },
];
for (const route of routes) {
  const routeDir = path.join(baseDir, route.name);
  fs.mkdirSync(routeDir, { recursive: true });
  const content = `/** GET /api/social/${route.name} — Social platform ${route.name} (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { ${route.imports.join(", ")} } from "@/features/social-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  ${route.body}
});
`;
  fs.writeFileSync(path.join(routeDir, "route.ts"), content, "utf8");
  console.log(`Created ${route.name}/route.ts`);
}
console.log(`\nAll ${routes.length} routes created.`);
