/**
 * Category feature — business logic layer (service).
 *
 * The public API of the category feature. Manages org-scoped resource
 * categories (an org-defined taxonomy that replaces hardcoded subject lists).
 *
 * Responsibilities:
 *   - Create / list / rename / delete org categories
 *   - Assign a resource to a category (or unassign)
 *   - Reorder categories within an org
 *
 * Authorization:
 *   - Creating / renaming / deleting / reordering categories requires
 *     OrgPermission.ORG_UPDATE (org admin or higher).
 *   - Assigning a resource to a category requires the user to be able to
 *     UPDATE the resource (delegated to the resource service's assignCategory)
 *     AND to be a member of the category's org. The resource must belong to
 *     the same org as the category.
 *
 * No events are published for category operations — they're administrative
 * metadata changes, not domain events that downstream listeners care about.
 * (If we later want analytics on category usage, we can add events then.)
 */

import { logger } from '@/lib/logger'
import { badRequest, notFound, forbidden, unauthorized, conflict } from '@/lib/errors'
import {
  canInOrg,
  isOrgMember,
  OrgPermission,
  type AuthContext,
} from '@/features/rbac'
// Use the resource barrel (never the resource repository directly).
import { assignCategory as resourceAssignCategory, getResource } from '@/features/resource'
import type { CategoryDto } from './category.types'
import type {
  CreateCategoryBody,
  UpdateCategoryBody,
  ReorderCategoriesBody,
} from './category.schema'
import * as repo from './category.repository'

const log = logger.child({ module: 'category-service' })

// ----------------------------------------------------------------------------
// Mappers
// ----------------------------------------------------------------------------

function mapToDto(
  raw: Awaited<ReturnType<typeof repo.findCategoryById>>,
): CategoryDto | null {
  if (!raw) return null
  return {
    id: raw.id,
    orgId: raw.orgId,
    name: raw.name,
    slug: raw.slug,
    sortOrder: raw.sortOrder,
    resourceCount: raw._count?.resources ?? 0,
    createdAt: raw.createdAt.toISOString(),
  }
}

// ----------------------------------------------------------------------------
// Public service functions
// ----------------------------------------------------------------------------

/**
 * Create a new category in an org. The slug is derived from the name and
 * must be unique within the org.
 *
 * Authorization: requires OrgPermission.ORG_UPDATE in the org.
 */
export async function createCategory(
  ctx: AuthContext,
  orgId: string,
  input: CreateCategoryBody,
): Promise<CategoryDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')

  if (!isOrgMember(ctx, orgId)) {
    throw forbidden('You are not a member of this organization')
  }
  if (!canInOrg(ctx, orgId, OrgPermission.ORG_UPDATE)) {
    throw forbidden('You do not have permission to manage categories in this organization')
  }

  const slug = repo.slugify(input.name)
  if (!slug) {
    throw badRequest('Category name must contain at least one letter or number')
  }

  // Check slug uniqueness within the org.
  const existing = await repo.findCategoryBySlug(orgId, slug)
  if (existing) {
    throw conflict('A category with this name already exists in this organization')
  }

  // New categories go to the end of the sort order.
  const sortOrder = await repo.countCategoriesInOrg(orgId)

  const raw = await repo.createCategory({
    orgId,
    name: input.name,
    slug,
    sortOrder,
  })

  log.info('createCategory.success', { categoryId: raw.id, orgId })

  return mapToDto(raw)!
}

/** List all categories in an org (sorted by sortOrder). */
export async function listCategories(
  ctx: AuthContext,
  orgId: string,
): Promise<CategoryDto[]> {
  if (!ctx.userId) throw unauthorized('Authentication required')

  if (!isOrgMember(ctx, orgId)) {
    throw forbidden('You are not a member of this organization')
  }
  // Any org member can view categories — no special permission required.

  const categories = await repo.findCategoriesByOrg(orgId)
  return categories.map((c) => mapToDto(c)!)
}

/** Rename a category (also updates the slug). */
export async function updateCategory(
  ctx: AuthContext,
  categoryId: string,
  input: UpdateCategoryBody,
): Promise<CategoryDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')

  const existing = await repo.findCategoryById(categoryId)
  if (!existing) throw notFound('Category not found')

  if (!canInOrg(ctx, existing.orgId, OrgPermission.ORG_UPDATE)) {
    throw forbidden('You do not have permission to manage categories in this organization')
  }

  const slug = repo.slugify(input.name)
  if (!slug) {
    throw badRequest('Category name must contain at least one letter or number')
  }

  // Check slug uniqueness (excluding the current category).
  if (slug !== existing.slug) {
    const conflicting = await repo.findCategoryBySlug(existing.orgId, slug)
    if (conflicting && conflicting.id !== categoryId) {
      throw conflict('A category with this name already exists in this organization')
    }
  }

  const updated = await repo.updateCategory(categoryId, { name: input.name, slug })

  log.info('updateCategory.success', { categoryId })

  return mapToDto(updated)!
}

/**
 * Delete a category. Resources currently assigned to it are unassigned
 * (their `organizationResourceCategoryId` is set to null) — they're not
 * deleted.
 */
export async function deleteCategory(
  ctx: AuthContext,
  categoryId: string,
): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')

  const existing = await repo.findCategoryById(categoryId)
  if (!existing) throw notFound('Category not found')

  if (!canInOrg(ctx, existing.orgId, OrgPermission.ORG_UPDATE)) {
    throw forbidden('You do not have permission to manage categories in this organization')
  }

  await repo.deleteCategory(categoryId)

  log.info('deleteCategory.success', { categoryId })
}

/**
 * Assign a resource to a category (or unassign, if categoryId is null).
 *
 * Authorization:
 *   - The user must be a member of the category's org (if assigning).
 *   - The resource must belong to the same org as the category.
 *   - The user must be able to UPDATE the resource (checked by the resource
 *     service's assignCategory method).
 */
export async function assignCategory(
  ctx: AuthContext,
  resourceId: string,
  categoryId: string | null,
): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')

  if (categoryId !== null) {
    const category = await repo.findCategoryById(categoryId)
    if (!category) throw notFound('Category not found')

    // The user must be a member of the category's org.
    if (!isOrgMember(ctx, category.orgId)) {
      throw forbidden('You are not a member of this category\'s organization')
    }

    // Fetch the resource to verify it belongs to the same org as the category.
    // getResource does a canRead check (if you can't read, you can't update).
    const resource = await getResource(ctx, resourceId)
    if (resource.orgId !== category.orgId) {
      throw badRequest('Resource and category must belong to the same organization')
    }
  }

  // Delegate the actual mutation + canUpdate check to the resource service.
  await resourceAssignCategory(ctx, resourceId, categoryId)

  log.info('assignCategory.success', { resourceId, categoryId })
}

/** Reorder categories within an org. */
export async function reorderCategories(
  ctx: AuthContext,
  orgId: string,
  input: ReorderCategoriesBody,
): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')

  if (!isOrgMember(ctx, orgId)) {
    throw forbidden('You are not a member of this organization')
  }
  if (!canInOrg(ctx, orgId, OrgPermission.ORG_UPDATE)) {
    throw forbidden('You do not have permission to manage categories in this organization')
  }

  await repo.reorderCategories(orgId, input.categories)

  log.info('reorderCategories.success', { orgId, count: input.categories.length })
}
