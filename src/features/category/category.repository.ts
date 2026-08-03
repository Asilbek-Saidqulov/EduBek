/**
 * Category feature — data access layer (repository).
 *
 * The ONLY module that touches Prisma for OrganizationResourceCategory queries.
 *
 * Note: the `assignCategory` operation mutates the Resource table (sets
 * `organizationResourceCategoryId`). The corresponding repo method
 * `resource.assignCategory` lives in the resource feature, and the category
 * service calls it via the resource barrel — keeping "only repositories
 * import db" intact.
 */

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'category-repository' })

// ----------------------------------------------------------------------------
// Slug helper — convert a name to a URL-safe slug.
// Used to generate the slug for new categories. The slug must be unique
// within an org (enforced by the @@unique([orgId, slug]) constraint).
// ----------------------------------------------------------------------------

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars (keep letters, digits, _, -, space)
    .replace(/[\s_-]+/g, '-') // collapse whitespace/underscores to a single hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}

// ----------------------------------------------------------------------------
// CRUD
// ----------------------------------------------------------------------------

export async function createCategory(data: {
  orgId: string
  name: string
  slug: string
  sortOrder?: number
}) {
  log.info('createCategory', { orgId: data.orgId, slug: data.slug })
  return db.organizationResourceCategory.create({
    data: {
      orgId: data.orgId,
      name: data.name,
      slug: data.slug,
      sortOrder: data.sortOrder ?? 0,
    },
    include: { _count: { select: { resources: true } } },
  })
}

export async function findCategoryById(id: string) {
  log.debug('findCategoryById', { id })
  return db.organizationResourceCategory.findUnique({
    where: { id },
    include: { _count: { select: { resources: true } } },
  })
}

export async function findCategoriesByOrg(orgId: string) {
  log.debug('findCategoriesByOrg', { orgId })
  return db.organizationResourceCategory.findMany({
    where: { orgId },
    include: { _count: { select: { resources: true } } },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function findCategoryBySlug(orgId: string, slug: string) {
  log.debug('findCategoryBySlug', { orgId, slug })
  return db.organizationResourceCategory.findUnique({
    where: { orgId_slug: { orgId, slug } },
  })
}

export async function updateCategory(id: string, data: { name?: string; slug?: string }) {
  log.info('updateCategory', { id })
  return db.organizationResourceCategory.update({
    where: { id },
    data,
    include: { _count: { select: { resources: true } } },
  })
}

/**
 * Delete a category. First unassigns all resources currently in this
 * category (sets their `organizationResourceCategoryId` to null), then
 * deletes the category row.
 */
export async function deleteCategory(id: string): Promise<void> {
  log.info('deleteCategory', { id })
  await db.$transaction([
    // Unassign resources — set their categoryId to null.
    db.resource.updateMany({
      where: { organizationResourceCategoryId: id },
      data: { organizationResourceCategoryId: null },
    }),
    // Delete the category.
    db.organizationResourceCategory.delete({ where: { id } }),
  ])
}

/** Reorder categories within an org. Each category's sortOrder is updated. */
export async function reorderCategories(
  orgId: string,
  categories: Array<{ id: string; sortOrder: number }>,
): Promise<void> {
  log.info('reorderCategories', { orgId, count: categories.length })
  await db.$transaction(
    categories.map((c) =>
      db.organizationResourceCategory.update({
        where: { id: c.id },
        data: { sortOrder: c.sortOrder },
      }),
    ),
  )
}

/** Count existing categories in an org — used to set sortOrder for new ones. */
export async function countCategoriesInOrg(orgId: string): Promise<number> {
  return db.organizationResourceCategory.count({ where: { orgId } })
}
