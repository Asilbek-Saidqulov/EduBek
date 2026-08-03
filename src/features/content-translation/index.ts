/**
 * EduBek — Content translation feature barrel export.
 *
 * Phase 4E.5: Universal multilingual content architecture.
 */
export {
  getResourceTranslations,
  getResourceTranslation,
  createResourceTranslation,
  updateResourceTranslation,
  deleteResourceTranslation,
  buildMultilingualMetadata,
  getCategoryTranslations,
  upsertCategoryTranslation,
  resolveCategoryName,
  getPlanTranslations,
  upsertPlanTranslation,
  resolvePlanName,
  createAiTranslation,
} from "./service";

export {
  createResourceTranslationBodySchema,
  updateResourceTranslationBodySchema,
  upsertCategoryTranslationBodySchema,
  upsertPlanTranslationBodySchema,
  aiTranslateBodySchema,
  translationStatusSchema,
  translationProviderSchema,
  type CreateResourceTranslationBody,
  type UpdateResourceTranslationBody,
  type UpsertCategoryTranslationBody,
  type UpsertPlanTranslationBody,
  type AiTranslateBody,
} from "./schema";

export type {
  TranslationStatus,
  TranslationProvider,
  TranslatableEntityType,
  ResourceTranslationDto,
  CategoryTranslationDto,
  PlanTranslationDto,
  MultilingualMetadata,
} from "./types";

export { defaultMultilingualMetadata } from "./types";
