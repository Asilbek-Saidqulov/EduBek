import type { AuthContext } from "@/features/auth";
import { db } from "@/lib/db";

export type ListResourcesQuery = {
  limit?: number;
  offset?: number;
  search?: string;
  resourceType?: string;
  status?: string;
};

export async function listMyResources(ctx: AuthContext, query: ListResourcesQuery = {}) {
  if (!ctx.userId) {
    return { resources: [], total: 0 };
  }

  const limit = Math.min(Math.max(query.limit ?? 9, 1), 50);
  const offset = Math.max(query.offset ?? 0, 0);

  const where: any = { ownerId: ctx.userId };
  if (query.resourceType) where.resourceType = query.resourceType;
  if (query.status) where.status = query.status;
  if (query.search?.trim()) {
    const q = query.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    db.resource.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: offset,
      take: limit,
      include: { tags: { select: { tag: true } } },
    }),
    db.resource.count({ where }),
  ]);

  return {
    resources: rows.map((r) => ({
      id: r.id,
      ownerId: r.ownerId,
      orgId: r.orgId,
      resourceType: r.resourceType,
      title: r.title,
      description: r.description,
      subject: r.subject,
      grade: r.grade,
      language: r.language,
      visibility: r.visibility,
      status: r.status,
      tags: r.tags.map((t) => t.tag),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    total,
  };
}

export async function exportResource(ctx: AuthContext, resourceId: string) {
  if (!ctx.userId) {
    throw new Error("UNAUTHORIZED");
  }

  const row = await db.resource.findFirst({
    where: {
      id: resourceId,
      OR: [{ ownerId: ctx.userId }, { visibility: "public" }],
    },
    include: { tags: { select: { tag: true } } },
  });

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    resourceType: row.resourceType,
    subject: row.subject,
    grade: row.grade,
    language: row.language,
    status: row.status,
    content: row.content,
    tags: row.tags.map((t) => t.tag),
  };
}