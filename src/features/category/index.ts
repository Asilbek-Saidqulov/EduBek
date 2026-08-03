/**
 * Category feature — barrel export.
 */

export {
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
  assignCategory,
  reorderCategories,
} from './category.service'

export type { CategoryDto } from './category.types'

export {
  createCategoryBodySchema,
  updateCategoryBodySchema,
  assignCategoryBodySchema,
  reorderCategoriesBodySchema,
  categoryIdParamsSchema,
  type CreateCategoryBody,
  type UpdateCategoryBody,
  type AssignCategoryBody,
  type ReorderCategoriesBody,
} from './category.schema'
