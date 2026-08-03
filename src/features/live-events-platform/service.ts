/** Live Events Platform service — composes all 15 systems. */
export {
  createEvent, getEventById, listEvents, updateEvent,
  createCampaign, getCampaignById, listCampaigns,
  addCampaignStage, completeCampaignStage, addCampaignMilestone, updateMilestoneProgress,
  scheduleEvent, getScheduledById, listScheduledEvents,
  startScheduledEvent, completeScheduledEvent, isInBlackoutPeriod,
  transitionApproval, getApprovalForEvent, listAllApprovals, canTransition,
} from "./campaign-scheduler";
export {
  enrollParticipant, activateParticipant, completeParticipant, abandonParticipant, expireParticipant,
  updateParticipationObjective, getEventParticipations, getUserParticipation,
  createObjective, getObjectiveById, listObjectives, setObjectiveActive, checkObjectiveCompletion,
  createRewardMapping, getRewardMappingById, listRewardMappings, getRewardsForObjective,
} from "./participation-objectives";
export {
  initializeTemplates, getTemplateById, listTemplates, createCustomTemplate,
  EVENT_TEMPLATES,
  createOrganizationCampaign, getOrgCampaignById, listOrgCampaigns,
  updateOrgCampaignStatus, updateOrgParticipation, listAllOrgCampaigns,
} from "./templates-operations";
export {
  generateDashboard, generateEventAnalytics, getDeveloperIntegration,
} from "./dashboard-analytics";
export {
  createNotificationRequest, getNotificationsForEvent, cancelNotification,
  createFeatureFlag, getFeatureFlagById, listFeatureFlags,
  enableFeatureFlag, disableFeatureFlag, emergencyStop,
  setGradualRollout, setOrganizationRollout, setCountryRollout, setSchoolRollout, setABTestRollout,
  isFeatureFlagActive,
} from "./feature-flags-notifications";
export {
  subscribeLiveEvents, unsubscribeLiveEvents, isLiveEventsSubscribed,
  getBridgeProcessedCount, publishLiveOpsEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";
export { _resetRepositoryForTesting } from "./repository";
