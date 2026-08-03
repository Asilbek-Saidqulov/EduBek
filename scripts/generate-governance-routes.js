#!/usr/bin/env node
/**
 * Generates the 12 read-only API routes for /api/event-governance/*
 */
const fs = require("fs");
const path = require("path");

const baseDir = "/home/z/my-project/src/app/api/event-governance";

const routes = [
  { name: "policies", imports: ["getPolicies", "getPolicyStats"], body: "return NextResponse.json({ policies: getPolicies(), stats: getPolicyStats() });" },
  { name: "delivery", imports: ["getAllRules", "getDeliveryStats"], body: "return NextResponse.json({ rules: getAllRules(), stats: getDeliveryStats() });" },
  { name: "classification", imports: ["getAllClassifiedEvents", "getCatalogStats"], body: "return NextResponse.json({ classifications: getAllClassifiedEvents(), stats: getCatalogStats() });" },
  { name: "catalog", imports: ["generateCatalog"], body: "return NextResponse.json(generateCatalog());" },
  { name: "correlation", imports: ["getAllNodes", "getAllEdges", "getCorrelationStats"], body: "return NextResponse.json({ nodes: getAllNodes(), edges: getAllEdges(), stats: getCorrelationStats() });" },
  { name: "producers", imports: ["getAllProducerHealthRecords", "getOverallHealthStats"], body: "return NextResponse.json({ producers: getAllProducerHealthRecords(), stats: getOverallHealthStats() });" },
  { name: "consumers", imports: ["getAllConsumerHealthRecords", "getOverallHealthStats"], body: "return NextResponse.json({ consumers: getAllConsumerHealthRecords(), stats: getOverallHealthStats() });" },
  { name: "metrics", imports: ["getAllMetrics", "getMetricsStats"], body: "return NextResponse.json({ metrics: getAllMetrics(), stats: getMetricsStats() });" },
  { name: "versions", imports: ["generateLifecycleDashboard"], body: "return NextResponse.json(generateLifecycleDashboard());" },
  { name: "dashboard", imports: ["generateObservabilityDashboard", "generateGovernanceDashboard", "generatePlatformHealth"], body: "return NextResponse.json({ observability: generateObservabilityDashboard(), governance: generateGovernanceDashboard(), health: generatePlatformHealth() });" },
  { name: "documentation", imports: ["generateGovernanceDocumentation", "generateMarkdownDocumentation", "generateJsonDocumentation"], body: "const format = searchParams.get('format'); if (format === 'markdown') { return new NextResponse(generateMarkdownDocumentation(), { headers: { 'Content-Type': 'text/markdown' } }); } if (format === 'json') { return new NextResponse(generateJsonDocumentation(), { headers: { 'Content-Type': 'application/json' } }); } return NextResponse.json(generateGovernanceDocumentation());" },
  { name: "health", imports: ["generatePlatformHealth"], body: "return NextResponse.json(generatePlatformHealth());" },
];

for (const route of routes) {
  const routeDir = path.join(baseDir, route.name);
  fs.mkdirSync(routeDir, { recursive: true });
  const content = `/** GET /api/event-governance/${route.name} — Event governance ${route.name} (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { ${route.imports.join(", ")} } from "@/features/event-governance-platform";

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
