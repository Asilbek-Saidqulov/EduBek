/**
 * EduBek — Platform-admin repository.
 *
 * All DB access for the platform-admin feature lives here. Subscription-plan
 * CRUD is delegated to the subscription feature's repository; this file owns
 * the PlatformCreatorTier CRUD + assignments and the platform-settings
 * primitives.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// PlatformCreatorTier CRUD
// ---------------------------------------------------------------------------

export async function findTierById(id: string) {
  return db.platformCreatorTier.findUnique({ where: { id } });
}

export async function findTierByName(name: string) {
  return db.platformCreatorTier.findUnique({ where: { name } });
}

export async function findTiers() {
  return db.platformCreatorTier.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createTier(data: {
  name: string;
  label: string;
  revenueShare?: number;
  payoutFrequency?: string;
  badgeIcon?: string | null;
  featuredEligible?: boolean;
  marketplacePriority?: number;
  minEarnings?: number;
  minSales?: number;
  sortOrder?: number;
  isSystem?: boolean;
}) {
  return db.platformCreatorTier.create({
    data: {
      name: data.name,
      label: data.label,
      revenueShare: data.revenueShare ?? 90,
      payoutFrequency: data.payoutFrequency ?? "monthly",
      badgeIcon: data.badgeIcon ?? null,
      featuredEligible: data.featuredEligible ?? false,
      marketplacePriority: data.marketplacePriority ?? 0,
      minEarnings: data.minEarnings ?? 0,
      minSales: data.minSales ?? 0,
      sortOrder: data.sortOrder ?? 0,
      isSystem: data.isSystem ?? false,
    },
  });
}

export async function updateTier(
  id: string,
  data: Record<string, unknown>,
) {
  return db.platformCreatorTier.update({ where: { id }, data });
}

export async function deleteTier(id: string) {
  return db.platformCreatorTier.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export async function findAssignmentByCreator(creatorId: string) {
  return db.platformCreatorTierAssignment.findUnique({
    where: { creatorId },
    include: { tier: true },
  });
}

export async function upsertAssignment(data: {
  creatorId: string;
  tierId: string;
  assignedBy?: string;
  metadata?: string | null;
}) {
  return db.platformCreatorTierAssignment.upsert({
    where: { creatorId: data.creatorId },
    create: {
      creatorId: data.creatorId,
      tierId: data.tierId,
      assignedBy: data.assignedBy ?? null,
      metadata: data.metadata ?? null,
    },
    update: {
      tierId: data.tierId,
      assignedBy: data.assignedBy ?? null,
      metadata: data.metadata ?? null,
      assignedAt: new Date(),
    },
    include: { tier: true },
  });
}

export async function findCreator(creatorId: string) {
  return db.creator.findUnique({ where: { userId: creatorId } });
}

// ---------------------------------------------------------------------------
// Revenue breakdown
// ---------------------------------------------------------------------------

export async function revenueByType(): Promise<
  Record<string, number>
> {
  const rows = await db.transaction.groupBy({
    by: ["type"],
    where: { status: "captured" },
    _sum: { grossAmount: true },
  });
  const out: Record<string, number> = {};
  for (const r of rows) {
    out[r.type] = r._sum.grossAmount ?? 0;
  }
  return out;
}

export async function platformEarningsTotal(): Promise<number> {
  const r = await db.transaction.aggregate({
    where: { status: "captured" },
    _sum: { platformFee: true },
  });
  return r._sum.platformFee ?? 0;
}

export async function creatorEarningsTotal(): Promise<number> {
  const r = await db.transaction.aggregate({
    where: { status: "captured" },
    _sum: { sellerAmount: true },
  });
  return r._sum.sellerAmount ?? 0;
}

export async function totalRefunds(): Promise<number> {
  const r = await db.transaction.aggregate({
    where: { status: "refunded" },
    _sum: { grossAmount: true },
  });
  return r._sum.grossAmount ?? 0;
}
