/** GET/POST /api/notifications/registry — Notification registry */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listRegistryEntries, createRegistryEntry, activateRegistryEntry, deprecateRegistryEntry, retireRegistryEntry, supportsAllCategories, supportsAllPriorities, supportsAllRegistryStatuses } from "@/features/notifications-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as any;
  const status = searchParams.get("status") as any;
  return NextResponse.json({
    entries: listRegistryEntries(category ?? undefined, status ?? undefined),
    categories: supportsAllCategories(),
    priorities: supportsAllPriorities(),
    statuses: supportsAllRegistryStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "activate") return NextResponse.json({ entry: activateRegistryEntry(body.id) });
  if (body.action === "deprecate") return NextResponse.json({ entry: deprecateRegistryEntry(body.id) });
  if (body.action === "retire") return NextResponse.json({ entry: retireRegistryEntry(body.id) });
  const entry = createRegistryEntry(body);
  return NextResponse.json({ entry }, { status: 201 });
});
