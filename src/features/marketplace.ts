import { z } from "zod";
import { db } from "@/lib/db";
import { forbidden, notFound, unauthorized } from "@/lib/errors";
import type { AuthContext } from "@/features/auth";

const favorites = new Map<string, Set<string>>();

const VISIBLE_STATUSES = ["published", "approved", "active"] as const;

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

type ListingRow = {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  contentId: string;
  priceEduTokens: number;
  priceFiat: number;
  currency: string;
  tier: string;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  seller?: { name: string | null; username: string | null } | null;
};

const DEMO_CATALOG: Array<{
  id: string;
  title: string;
  description: string;
  resourceType: string;
  price: number;
  currency: string;
  featured: boolean;
  creatorName: string;
  ratingAverage: number;
  ratingCount: number;
  categories: string[];
  contentId: string;
}> = [
  {
    id: "demo-algebra",
    title: "Algebra Fundamentals: Linear Equations",
    description: "Grade 8–9 linear equations, slopes, and intercepts. Five practice items with explanations.",
    resourceType: "quiz",
    price: 0,
    currency: "EDU",
    featured: true,
    creatorName: "Sarah Chen",
    ratingAverage: 4.8,
    ratingCount: 124,
    categories: ["mathematics"],
    contentId: "demo-algebra",
  },
  {
    id: "demo-photosynthesis",
    title: "Photosynthesis: Energy from Sunlight",
    description: "Chloroplasts, light reactions, and the Calvin cycle for Grade 10 biology.",
    resourceType: "quiz",
    price: 5,
    currency: "EDU",
    featured: true,
    creatorName: "Akmal Karimov",
    ratingAverage: 4.9,
    ratingCount: 86,
    categories: ["science"],
    contentId: "demo-photosynthesis",
  },
  {
    id: "demo-newton",
    title: "Newton's Laws of Motion",
    description: "Inertia, F=ma, and action–reaction with worked numeric items.",
    resourceType: "quiz",
    price: 8,
    currency: "EDU",
    featured: true,
    creatorName: "David Park",
    ratingAverage: 4.9,
    ratingCount: 63,
    categories: ["science"],
    contentId: "demo-newton",
  },
  {
    id: "demo-python",
    title: "Python Programming Basics",
    description: "Variables, types, functions, and lists for first-year CS students.",
    resourceType: "quiz",
    price: 0,
    currency: "EDU",
    featured: false,
    creatorName: "James Okafor",
    ratingAverage: 4.8,
    ratingCount: 341,
    categories: ["technology"],
    contentId: "demo-python",
  },
  {
    id: "demo-tenses",
    title: "English Grammar: Tenses Mastery",
    description: "Twelve English tenses with B1–B2 examples.",
    resourceType: "quiz",
    price: 0,
    currency: "EDU",
    featured: false,
    creatorName: "Maria Silva",
    ratingAverage: 4.7,
    ratingCount: 210,
    categories: ["language"],
    contentId: "demo-tenses",
  },
  {
    id: "demo-cells",
    title: "Cell Biology: Structure and Function",
    description: "Organelles and membrane transport for Grade 10–12.",
    resourceType: "quiz",
    price: 10,
    currency: "EDU",
    featured: false,
    creatorName: "Akmal Karimov",
    ratingAverage: 4.9,
    ratingCount: 41,
    categories: ["science"],
    contentId: "demo-cells",
  },
];

function toDto(row: ListingRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnailUrl: null,
    resourceType: row.contentType || "quiz",
    price: row.priceEduTokens ?? 0,
    currency: row.currency === "USD" ? "EDU" : row.currency || "EDU",
    featured: row.tier === "featured" || (row.priceEduTokens ?? 0) === 0,
    viewCount: 0,
    favoriteCount: 0,
    ratingAverage: 4.8,
    ratingCount: 0,
    creatorName: row.seller?.name || row.seller?.username || "EduBek Creator",
    categories: [] as string[],
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    contentId: row.contentId,
    contentType: row.contentType,
  };
}

function uidSafe(ctx?: AuthContext | null) {
  return ctx?.userId ?? null;
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
      status: "published",
      publishedAt: new Date(),
    },
  });
}

export async function browseListings(_ctx: AuthContext, query?: Record<string, unknown>) {
  const search = typeof query?.search === "string" ? query.search.trim() : "";
  const categoryId = typeof query?.categoryId === "string" ? query.categoryId : undefined;
  const free = query?.free === true || query?.free === "true";
  const paid = query?.paid === true || query?.paid === "true";
  const sort = typeof query?.sort === "string" ? query.sort : "newest";
  const limit = Math.min(50, Math.max(1, Number(query?.limit ?? 20) || 20));
  const offset = Math.max(0, Number(query?.offset ?? 0) || 0);

  let items: ReturnType<typeof toDto>[] = [];
  try {
    const where: Record<string, unknown> = {
      status: { in: [...VISIBLE_STATUSES] },
    };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (free && !paid) where.priceEduTokens = 0;
    if (paid && !free) where.priceEduTokens = { gt: 0 };

    const orderBy =
      sort === "alphabetical"
        ? { title: "asc" as const }
        : { publishedAt: "desc" as const };

    const rows = await db.marketplaceListing.findMany({
      where,
      include: { seller: { select: { name: true, username: true } } },
      orderBy,
      take: limit,
      skip: offset,
    });
    items = rows.map((row) => toDto(row));
  } catch (error) {
    console.warn("[marketplace] browse fell back to demo catalog", error);
  }

  if (items.length === 0 && offset === 0) {
    items = DEMO_CATALOG.filter((item) => {
      if (search && !`${item.title} ${item.description}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (free && !paid && item.price !== 0) return false;
      if (paid && !free && item.price === 0) return false;
      return true;
    }).map((item) => ({
      ...item,
      thumbnailUrl: null,
      viewCount: 0,
      favoriteCount: 0,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      contentType: item.resourceType,
    }));
  }

  return {
    success: true,
    listings: items,
    total: items.length,
    items,
    data: items,
    list: items,
  };
}

export async function getListing(_ctx: AuthContext, id: string, _full?: boolean) {
  if (id.startsWith("demo-")) {
    const demo = DEMO_CATALOG.find((item) => item.id === id);
    if (!demo) throw notFound("Listing not found");
    return {
      id: demo.id,
      sellerId: "demo",
      title: demo.title,
      description: demo.description,
      contentType: demo.resourceType,
      contentId: demo.contentId,
      priceEduTokens: demo.price,
      priceFiat: 0,
      currency: "EDU",
      status: "published",
      publishedAt: new Date(),
    };
  }
  const listing = await db.marketplaceListing.findUnique({ where: { id } });
  if (!listing) throw notFound("Listing not found");
  return listing;
}

export async function updateListing(ctx: AuthContext, id: string, input: Record<string, unknown>) {
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
  try {
    const items = await db.marketplaceCategory.findMany({ take: 100 });
    if (items.length > 0) {
      return items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: safeName(item.nameI18n) || item.slug,
        description: null,
        icon: null,
        sortOrder: 0,
      }));
    }
  } catch {
    // fall through to demo subjects
  }
  return [
    { id: "mathematics", slug: "mathematics", name: "Mathematics", description: null, icon: null, sortOrder: 1 },
    { id: "science", slug: "science", name: "Science", description: null, icon: null, sortOrder: 2 },
    { id: "language", slug: "language", name: "Language", description: null, icon: null, sortOrder: 3 },
    { id: "technology", slug: "technology", name: "Computer Science", description: null, icon: null, sortOrder: 4 },
    { id: "history", slug: "history", name: "History", description: null, icon: null, sortOrder: 5 },
  ];
}

function safeName(raw: string | null | undefined) {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as { en?: string; uz?: string };
    return parsed.en || parsed.uz || raw;
  } catch {
    return raw;
  }
}

export async function createCategory(_ctx: AuthContext, input: { name: string }) {
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  return db.marketplaceCategory.create({
    data: { slug, nameI18n: JSON.stringify({ en: input.name, uz: input.name }) },
  });
}

export async function getFeatured(limit = 10) {
  const result = await browseListings({ userId: null, email: null, platformRoles: [], isAuthenticated: false }, { limit, sort: "newest" });
  return result.listings.slice(0, limit);
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

export { uidSafe };
