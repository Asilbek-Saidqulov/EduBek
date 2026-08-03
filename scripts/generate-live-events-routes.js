#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const baseDir = "/home/z/my-project/src/app/api/live-events";
const routes = [
  { name: "registry", imports: ["listEvents"], body: "return NextResponse.json({ events: listEvents() });" },
  { name: "campaigns", imports: ["listCampaigns"], body: "return NextResponse.json({ campaigns: listCampaigns() });" },
  { name: "scheduler", imports: ["listScheduledEvents"], body: "return NextResponse.json({ scheduled: listScheduledEvents() });" },
  { name: "templates", imports: ["listTemplates"], body: "return NextResponse.json({ templates: listTemplates() });" },
  { name: "participation", imports: ["getEventParticipations"], body: "const eventId = searchParams.get('eventId'); return NextResponse.json({ participations: eventId ? getEventParticipations(eventId) : [] });" },
  { name: "objectives", imports: ["listObjectives"], body: "return NextResponse.json({ objectives: listObjectives() });" },
  { name: "dashboard", imports: ["generateDashboard"], body: "return NextResponse.json(generateDashboard());" },
  { name: "analytics", imports: ["generateEventAnalytics"], body: "const eventId = searchParams.get('eventId'); if (!eventId) return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'eventId required' } }, { status: 400 }); return NextResponse.json(generateEventAnalytics(eventId));" },
  { name: "operations", imports: ["listAllApprovals"], body: "return NextResponse.json({ approvals: listAllApprovals() });" },
  { name: "organizations", imports: ["listAllOrgCampaigns"], body: "return NextResponse.json({ orgCampaigns: listAllOrgCampaigns() });" },
  { name: "developer", imports: ["getDeveloperIntegration"], body: "return NextResponse.json(getDeveloperIntegration());" },
  { name: "status", imports: ["isLiveEventsSubscribed"], body: "return NextResponse.json({ subscribed: isLiveEventsSubscribed() });" },
];
for (const route of routes) {
  const routeDir = path.join(baseDir, route.name);
  fs.mkdirSync(routeDir, { recursive: true });
  const content = `/** GET /api/live-events/${route.name} — Live events ${route.name} (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { ${route.imports.join(", ")} } from "@/features/live-events-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  ${route.body}
});
`;
  fs.writeFileSync(path.join(routeDir, "route.ts"), content, "utf8");
  console.log(`Created ${route.name}/route.ts`);
}
console.log(`\nAll ${routes.length} routes created.`);
