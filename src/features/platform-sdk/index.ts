/** EduBek — Platform SDK barrel export. Phase 5B.2. */
export {
  publishExtension, getExtension, getExtensionBySlug, listExtensions, approveExtension, rejectExtension,
  installExtension, uninstallExtension, disableExtension, enableExtension, listInstalls,
  executeHooks, listHooks, listExecutions,
  executeInSandbox, listSandboxes,
  listSdks, listCliCommands,
  getGraphQLSchemaInfo,
  reviewExtension, listReviews, subscribeToExtension, listSubscriptions,
  listApiVersions, checkCompatibility, listCompatibilityEntries,
  getDeveloperPortalInfo,
} from "./service";

export type {
  ExtensionType, ExtensionStatus, InstallStatus, ExtensionDto, ExtensionVersionDto, ExtensionInstallDto,
  ExtensionHookDto, ExtensionExecutionDto, SandboxSessionDto, ExtensionPermission,
  SdkDefinition, CliCommand, UiExtensionDefinition, GraphQlSchemaInfo,
  ExtensionReviewDto, ExtensionSubscriptionDto, ApiVersionDto, CompatibilityEntry, DeveloperPortalInfo,
} from "./types";
