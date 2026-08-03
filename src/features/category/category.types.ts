/**
 * Category feature — domain types (DTOs).
 *
 * Framework-agnostic. No Prisma types, no Next.js types.
 *
 * An OrganizationResourceCategory is an org-scoped label for resources
 * (e.g. "Mathematics", "Science"). It replaces the hardcoded subject lists
 * used in earlier prototypes — orgs can define their own category taxonomy.
 *
 * A resource can be assigned to at most one category in its org.
 */

/** A category — returned by list/create/update endpoints. */
export interface CategoryDto {
  id: string
  orgId: string
  name: string
  slug: string
  sortOrder: number
  resourceCount: number
  createdAt: string
}
