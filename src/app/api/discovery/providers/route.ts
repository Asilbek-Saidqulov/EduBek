/**
 * GET /api/discovery/providers — List available embedding providers
 *   (no auth — purely informational)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { listAvailableProviders, getActiveEmbeddingProvider } from "@/features/semantic-search";

export const GET = withErrorHandler(async () => {
  const providers = listAvailableProviders();
  const active = getActiveEmbeddingProvider();
  return NextResponse.json({
    active: {
      name: active.name,
      model: active.model,
      dimensions: active.dimensions,
    },
    available: providers,
  });
});
