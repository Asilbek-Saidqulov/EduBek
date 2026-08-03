/**
 * EduBek — Platform-admin service.
 *
 * Centralizes every admin-only operation: platform settings, subscription-
 * plan management, platform-creator-tier management, revenue breakdown, and
 * creator-tier assignment. Every method checks `PlatformPermission.PLATFORM_ADMIN`
 * (or a more specific admin permission) before performing any work.
 *
 * Events published:
 *   • CREATOR_TIER_CHANGED — when a creator's platform tier is reassigned
 */
import { logger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import { can, PlatformPermission, type AuthContext } from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  CREATOR_TIER_CHANGED,
  type CreatorTierChangedEvent,
} from "@/infra/event-bus/events";
import { PLATFORM_CONFIG } from "@/config/platform";
import * as adminRepo from "./repository";
import * as subRepo from "@/features/subscription/repository";
import type { UpdatePlanBody } from "@/features/subscription";
import type {
  CreateCreatorTierBody,
  UpdateCreatorTierBody,
  UpdatePlatformSettingsBody,
} from "./schema";
import type {
  AdminAction,
  PlatformCreatorTierAssignmentDto,
  PlatformCreatorTierDto,
  PlatformRevenueDto,
  PlatformSettingsDto,
} from "./types";

const log = logger.child({ module: "platform-admin-service" });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireAdmin(ctx: AuthContext): void {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PlatformPermission.PLATFORM_ADMIN)) {
    throw forbidden("Platform admin permission required");
  }
}

function mapTier(t: any): PlatformCreatorTierDto {
  return {
    id: t.id,
    name: t.name,
    label: t.label,
    revenueShare: t.revenueShare,
    payoutFrequency: t.payoutFrequency,
    badgeIcon: t.badgeIcon ?? null,
    featuredEligible: t.featuredEligible,
    marketplacePriority: t.marketplacePriority,
    minEarnings: t.minEarnings,
    minSales: t.minSales,
    sortOrder: t.sortOrder,
    isSystem: t.isSystem,
    createdAt: t.createdAt.toISOString(),
  };
}

function mapAssignment(a: any): PlatformCreatorTierAssignmentDto {
  return {
    id: a.id,
    creatorId: a.creatorId,
    tierId: a.tierId,
    tierName: a.tier?.name ?? "",
    assignedAt: a.assignedAt.toISOString(),
    assignedBy: a.assignedBy ?? null,
  };
}

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

export async function getPlatformSettings(
  ctx: AuthContext,
): Promise<PlatformSettingsDto> {
  requireAdmin(ctx);
  return {
    marketplaceFeePercent: PLATFORM_CONFIG.MARKETPLACE_PLATFORM_FEE_PERCENT,
    refundWindowDays: PLATFORM_CONFIG.REFUND_WINDOW_DAYS,
    allowDuplicatePurchases: PLATFORM_CONFIG.ALLOW_DUPLICATE_PURCHASES,
    platformWalletUserId: PLATFORM_CONFIG.PLATFORM_WALLET_USER_ID,
    defaultCurrency: "USD",
    requireListingApproval: true,
    freeTierAiCredits: 5,
  };
}

export async function updatePlatformSettings(
  ctx: AuthContext,
  _input: UpdatePlatformSettingsBody,
): Promise<PlatformSettingsDto> {
  requireAdmin(ctx);
  // The sandbox config is read-only at runtime (it's a frozen object sourced
  // from env vars). A real implementation would persist overrides in a
  // PlatformSettings table; here we log the attempt and return the current
  // settings so the API contract is honoured.
  log.warn("platform.settings_update_ignored_in_sandbox", {
    requestedKeys: Object.keys(_input),
    userId: ctx.userId,
  });
  return getPlatformSettings(ctx);
}

// ---------------------------------------------------------------------------
// Subscription-plan management
// ---------------------------------------------------------------------------

export async function manageSubscriptionPlans(
  ctx: AuthContext,
  action: AdminAction,
  data: { id?: string } & Record<string, unknown>,
): Promise<{ action: AdminAction; id?: string; success: boolean }> {
  requireAdmin(ctx);
  if (!can(ctx, PlatformPermission.SUBSCRIPTION_MANAGE)) {
    throw forbidden("subscription.manage required");
  }
  switch (action) {
    case "create": {
      const plan = await subRepo.createPlan({
        name: String(data.name ?? ""),
        tier: String(data.tier ?? ""),
        priceMonthly: Number(data.priceMonthly ?? 0),
        priceYearly: Number(data.priceYearly ?? 0),
        currency: String(data.currency ?? "USD"),
        features: data.features as Record<string, unknown> | undefined,
        aiCreditsMonthly: Number(data.aiCreditsMonthly ?? 0),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      });
      log.info("plan.created", { id: plan.id, tier: plan.tier });
      return { action, id: plan.id, success: true };
    }
    case "update": {
      if (!data.id) throw badRequest("id is required for update");
      // Strip the id (used for routing) before forwarding to the repo, which
      // takes a typed UpdatePlanBody. The cast is safe because the caller is
      // already an admin and the repo further sanitises the payload.
      const { id: _planId, ...planFields } = data;
      const updated = await subRepo.updatePlan(
        data.id,
        planFields as UpdatePlanBody,
      );
      log.info("plan.updated", { id: updated.id });
      return { action, id: updated.id, success: true };
    }
    case "delete": {
      if (!data.id) throw badRequest("id is required for delete");
      await subRepo.deletePlan(data.id);
      log.info("plan.deleted", { id: data.id });
      return { action, id: data.id, success: true };
    }
    case "activate":
    case "deactivate": {
      if (!data.id) throw badRequest("id is required");
      const updated = await subRepo.updatePlan(data.id, {
        isActive: action === "activate",
      });
      log.info(`plan.${action}d`, { id: updated.id });
      return { action, id: updated.id, success: true };
    }
    default:
      throw badRequest(`Unknown action: ${action as string}`);
  }
}

// ---------------------------------------------------------------------------
// Platform creator-tier management
// ---------------------------------------------------------------------------

export async function listCreatorTiers(
  ctx: AuthContext,
): Promise<PlatformCreatorTierDto[]> {
  requireAdmin(ctx);
  const tiers = await adminRepo.findTiers();
  return tiers.map(mapTier);
}

export async function manageCreatorTiers(
  ctx: AuthContext,
  action: AdminAction,
  data: { id?: string } & Record<string, unknown>,
): Promise<{ action: AdminAction; id?: string; success: boolean }> {
  requireAdmin(ctx);
  if (!can(ctx, PlatformPermission.CREATOR_TIER_MANAGE)) {
    throw forbidden("creator.tier.manage required");
  }
  switch (action) {
    case "create": {
      const input = data as unknown as CreateCreatorTierBody;
      const existing = await adminRepo.findTierByName(input.name);
      if (existing) throw badRequest("Tier name already exists");
      const tier = await adminRepo.createTier({
        name: input.name,
        label: input.label,
        revenueShare: input.revenueShare,
        payoutFrequency: input.payoutFrequency,
        badgeIcon: input.badgeIcon,
        featuredEligible: input.featuredEligible,
        marketplacePriority: input.marketplacePriority,
        minEarnings: input.minEarnings,
        minSales: input.minSales,
        sortOrder: input.sortOrder,
        isSystem: input.isSystem,
      });
      log.info("tier.created", { id: tier.id, name: tier.name });
      return { action, id: tier.id, success: true };
    }
    case "update": {
      if (!data.id) throw badRequest("id is required for update");
      const input = data as unknown as UpdateCreatorTierBody & { id: string };
      const { id, ...rest } = input;
      const updated = await adminRepo.updateTier(id, rest);
      log.info("tier.updated", { id: updated.id });
      return { action, id: updated.id, success: true };
    }
    case "delete": {
      if (!data.id) throw badRequest("id is required for delete");
      const tier = await adminRepo.findTierById(data.id);
      if (tier?.isSystem) throw badRequest("Cannot delete system tier");
      await adminRepo.deleteTier(data.id);
      log.info("tier.deleted", { id: data.id });
      return { action, id: data.id, success: true };
    }
    case "activate":
    case "deactivate": {
      // PlatformCreatorTier has no `isActive` field — we use sortOrder as a
      // soft toggle (sortOrder = -1 hides the tier from default listings).
      if (!data.id) throw badRequest("id is required");
      const updated = await adminRepo.updateTier(data.id, {
        sortOrder: action === "activate" ? 0 : -1,
      });
      log.info(`tier.${action}d`, { id: updated.id });
      return { action, id: updated.id, success: true };
    }
    default:
      throw badRequest(`Unknown action: ${action as string}`);
  }
}

// ---------------------------------------------------------------------------
// Revenue breakdown
// ---------------------------------------------------------------------------

export async function getPlatformRevenue(
  ctx: AuthContext,
): Promise<PlatformRevenueDto> {
  requireAdmin(ctx);
  const [byType, platformEarnings, creatorEarnings, refunds] = await Promise.all([
    adminRepo.revenueByType(),
    adminRepo.platformEarningsTotal(),
    adminRepo.creatorEarningsTotal(),
    adminRepo.totalRefunds(),
  ]);
  const total = Object.values(byType).reduce((s, v) => s + v, 0);
  return {
    total,
    marketplace: byType["purchase"] ?? 0,
    subscriptions: byType["subscription"] ?? 0,
    topups: byType["topup"] ?? 0,
    payouts: byType["payout"] ?? 0,
    refunds,
    platformEarnings,
    creatorEarnings,
  };
}

// ---------------------------------------------------------------------------
// Creator-tier assignment
// ---------------------------------------------------------------------------

export async function assignCreatorTier(
  ctx: AuthContext,
  creatorId: string,
  tierName: string,
): Promise<PlatformCreatorTierAssignmentDto> {
  requireAdmin(ctx);
  if (!can(ctx, PlatformPermission.CREATOR_TIER_MANAGE)) {
    throw forbidden("creator.tier.manage required");
  }
  const creator = await adminRepo.findCreator(creatorId);
  if (!creator) throw notFound("Creator not found");
  const tier = await adminRepo.findTierByName(tierName);
  if (!tier) throw notFound(`Tier '${tierName}' not found`);

  const previous = await adminRepo.findAssignmentByCreator(creatorId);
  const assignment = await adminRepo.upsertAssignment({
    creatorId,
    tierId: tier.id,
    assignedBy: ctx.userId,
  });
  const dto = mapAssignment(assignment);

  eventBus.publish(
    buildEvent<CreatorTierChangedEvent>({
      type: CREATOR_TIER_CHANGED,
      actorId: ctx.userId,
      creatorId,
      fromTierId: previous?.tierId,
      toTierId: tier.id,
      reason: "admin_assignment",
      occurredAt: new Date(),
    }),
  );
  log.info("creator.tier_changed", {
    creatorId,
    fromTier: previous?.tierId,
    toTier: tier.id,
    actorId: ctx.userId,
  });
  return dto;
}
