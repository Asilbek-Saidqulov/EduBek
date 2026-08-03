/** GET/POST /api/trust/moderators — Moderator workflow + RBAC */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listModeratorAssignments, assignModerator, completeAssignment, reassignAssignment, escalateAssignment, getModeratorQueue, listModeratorRoles, createModeratorRole, assignModeratorRole, listModeratorRoleAssignments, revokeModeratorRoleAssignment, getModeratorPermissions, moderatorHasPermission, supportsAllModeratorQueueTypes, supportsAllWorkflowPriorities, supportsAllModeratorRoleTypes } from "@/features/trust-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const moderatorId = searchParams.get("moderatorId") ?? undefined;
  const queueType = searchParams.get("queueType") as any;
  const queues = queueType ? [getModeratorQueue(queueType)] : supportsAllModeratorQueueTypes().map(q => getModeratorQueue(q));
  return NextResponse.json({
    assignments: listModeratorAssignments(moderatorId, "active"),
    queues,
    roles: listModeratorRoles(),
    roleAssignments: listModeratorRoleAssignments(moderatorId),
    queueTypes: supportsAllModeratorQueueTypes(), priorities: supportsAllWorkflowPriorities(), roleTypes: supportsAllModeratorRoleTypes(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "complete") return NextResponse.json({ assignment: completeAssignment(body.id) });
  if (body.action === "reassign") return NextResponse.json({ assignment: reassignAssignment(body.id, body.moderatorId, ctx.userId) });
  if (body.action === "escalate") return NextResponse.json({ assignment: escalateAssignment(body.id, ctx.userId, body.reason) });
  if (body.action === "create_role") return NextResponse.json({ role: createModeratorRole(body) });
  if (body.action === "assign_role") return NextResponse.json({ assignment: assignModeratorRole({ ...body, assignedBy: ctx.userId }) });
  if (body.action === "revoke_role") return NextResponse.json({ assignment: revokeModeratorRoleAssignment(body.id, body.reason) });
  if (body.action === "get_permissions") return NextResponse.json({ permissions: getModeratorPermissions(body.moderatorId) });
  if (body.action === "has_permission") return NextResponse.json({ has: moderatorHasPermission(body.moderatorId, body.permission) });
  const assignment = assignModerator({ ...body, assignedBy: ctx.userId });
  return NextResponse.json({ assignment }, { status: 201 });
});
