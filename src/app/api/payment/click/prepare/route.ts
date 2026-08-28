import { NextRequest, NextResponse } from "next/server";
import { handleProviderWebhook } from "@/features/economy/payments";

async function parseClickPayload(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const payload: Record<string, any> = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });
    return payload;
  }
  return await req.json().catch(() => ({}));
}

export async function POST(req: NextRequest) {
  try {
    const payload = await parseClickPayload(req);
    // Explicitly enforce action=0 for /prepare endpoint if not present
    if (payload.action === undefined) {
      payload.action = 0;
    }

    const response = await handleProviderWebhook("CLICK", payload);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[Click Prepare error]:", error);
    return NextResponse.json({
      error: -8,
      error_note: error.message || "Internal server error",
    });
  }
}
