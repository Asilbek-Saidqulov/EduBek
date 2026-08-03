/** GET /api/platform/sdks — List SDKs; GET /api/platform/cli — List CLI commands; GET /api/platform/graphql — GraphQL schema info; GET /api/platform/developer — Developer portal info */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSdks, listCliCommands, getGraphQLSchemaInfo, getDeveloperPortalInfo } from "@/features/platform-sdk";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const resource = url.searchParams.get("resource");

  if (resource === "sdks") return NextResponse.json({ sdks: listSdks() });
  if (resource === "cli") return NextResponse.json({ commands: listCliCommands() });
  if (resource === "graphql") return NextResponse.json(getGraphQLSchemaInfo());
  if (resource === "developer") return NextResponse.json(await getDeveloperPortalInfo());

  // Default: return all info
  const [devInfo, graphql] = await Promise.all([getDeveloperPortalInfo(), getGraphQLSchemaInfo()]);
  return NextResponse.json({ ...devInfo, graphql });
});
