/** POST /api/platform/installs/:id — Enable / disable / uninstall */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { enableExtension, disableExtension, uninstallExtension } from "@/features/platform-sdk";
import { z } from "zod";

const schema = z.object({ action: z.enum(["enable", "disable", "uninstall"]) });

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const body = schema.parse(await req.json());
  if (body.action === "enable") return NextResponse.json(await enableExtension(id));
  if (body.action === "disable") return NextResponse.json(await disableExtension(id));
  if (body.action === "uninstall") { await uninstallExtension(id); return NextResponse.json({ success: true }); }
  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Unknown action" } }, { status: 400 });
});
