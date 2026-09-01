import { z } from "zod";
import { db } from "@/lib/db";
import { forbidden, notFound, unauthorized } from "@/lib/errors";
import type { AuthContext } from "@/features/auth";

const favorites = new Map<string, Set<string>>();

export const createListingBodySchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  contentType: z.string().default("resource"),
  contentId: z.string().default("manual"),
  categoryId: z.string().optional(),
  priceEduTokens: z.number().int().min(0).optional(),
  priceFiat: z.number().min(0).optional(),
  currency: z.string().default("UZS"),
});
export const updateListingBodySchema = createListingBodySchema.partial();
export const browseListingsQuerySchema = z.object({}).passthrough();
export const createCategoryBodySchema = z.object({ name: z.string().min(1) });
export const listMarketplaceQuizzesQuerySchema = z.object({}).passthrough();

function uid(ctx: AuthContext) {
  if (!ctx.userId) throw unauthorized();
  return ctx.userId;
}

export async function createListing(ctx: AuthContext, input: z.infer<typeof createListingBodySchema>) {
  const sellerId = uid(ctx);
  return db.marketplaceListing.create({
    data: {
      sellerId,
      contentType: input.contentType,
      contentId: input.contentId,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      priceEduTokens: input.priceEduTokens ?? 0,
      priceFiat: input.priceFiat ?? 0,
      currency: input.currency || "UZS",
      status: "draft",
    },
  });
}

export async function browseListings(_ctx: AuthContext, _query?: any) {
  const items = await db.marketplaceListing.findMany({
    where: { status: { in: ["published", "approved"] } },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });
  return { success: true, items, data: items, list: items };
}

export async function getListing(_ctx: AuthContext, id: string, _full?: boolean) {
  const listing = await db.marketplaceListing.findUnique({ where: { id } });
  if (!listing) throw notFound("Listing not found");
  return listing;
}

export async function updateListing(ctx: AuthContext, id: string, input: any) {
  const listing = await getListing(ctx, id);
  if (listing.sellerId !== ctx.userId) throw forbidden();
  return db.marketplaceListing.update({ where: { id }, data: input });
}

export async function deleteListing(ctx: AuthContext, id: string) {
  const listing = await getListing(ctx, id);
  if (listing.sellerId !== ctx.userId) throw forbidden();
  await db.marketplaceListing.delete({ where: { id } });
}

async function setStatus(ctx: AuthContext, id: string, status: string) {
  const listing = await getListing(ctx, id);
  if (listing.sellerId !== ctx.userId && !ctx.platformRoles.includes("ADMIN")) throw forbidden();
  return db.marketplaceListing.update({
    where: { id },
    data: { status, publishedAt: status === "published" ? new Date() : listing.publishedAt },
  });
}

export const publishListing = (c: AuthContext, id: string) => setStatus(c, id, "published");
export const unpublishListing = (c: AuthContext, id: string) => setStatus(c, id, "draft");
export const submitListing = (c: AuthContext, id: string) => setStatus(c, id, "submitted");
export const archiveListing = (c: AuthContext, id: string) => setStatus(c, id, "archived");
export async function approveListing(ctx: AuthContext, id: string) {
  if (!ctx.platformRoles.includes("ADMIN")) throw forbidden();
  return setStatus(ctx, id, "published");
}

export async function getCategories() {
  const items = await db.marketplaceCategory.findMany({ take: 100 }).catch(() => []);
  return { success: true, items, data: items };
}
export async function createCategory(_ctx: AuthContext, input: { name: string }) {
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  return db.marketplaceCategory.create({
    data: { slug, nameI18n: JSON.stringify({ en: input.name, uz: input.name }) },
  });
}

export async function getFeatured() {
  const items = await db.marketplaceListing.findMany({ where: { status: "published" }, take: 12 });
  return { success: true, items };
}
export const getNew = getFeatured;
export const getPopular = getFeatured;

export async function getCreatorDashboard(ctx: AuthContext) {
  const sellerId = uid(ctx);
  const listings = await db.marketplaceListing.findMany({ where: { sellerId } });
  const sales = await db.marketplacePurchase.findMany({ where: { listing: { sellerId } } });
  const tokensEarned = sales.reduce((s, p) => s + Math.floor((p.eduTokensSpent || 0) * 0.8), 0);
  return { success: true, listings, saleCount: sales.length, tokensEarned };
}

export async function toggleFavorite(ctx: AuthContext, id: string) {
  const userId = uid(ctx);
  const set = favorites.get(userId) || new Set();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  favorites.set(userId, set);
  return { success: true, favorited: set.has(id) };
}

export async function listFavoriteListings(ctx: AuthContext) {
  const userId = uid(ctx);
  const ids = [...(favorites.get(userId) || [])];
  const items = ids.length ? await db.marketplaceListing.findMany({ where: { id: { in: ids } } }) : [];
  return { success: true, items };
}

export async function listQuizzes() {
  const items = await db.quiz.findMany({ where: { isPublished: true }, take: 50 });
  return { success: true, items };
}
