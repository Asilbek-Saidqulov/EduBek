/** In-memory repository for Live Events Platform. All Maps can swap to Redis. */
import type {
  LiveEvent, Campaign, ScheduledEvent, EventParticipation,
  ObjectiveDefinition, RewardMapping, EventTemplate,
  FeatureFlag, ApprovalWorkflow, OrganizationCampaign, NotificationRequest,
} from "./types";

const events = new Map<string, LiveEvent>();
const campaigns = new Map<string, Campaign>();
const scheduledEvents = new Map<string, ScheduledEvent>();
const participations = new Map<string, EventParticipation[]>();
const objectives = new Map<string, ObjectiveDefinition>();
const rewardMappings = new Map<string, RewardMapping>();
const templates = new Map<string, EventTemplate>();
const featureFlags = new Map<string, FeatureFlag>();
const approvals = new Map<string, ApprovalWorkflow>();
const orgCampaigns = new Map<string, OrganizationCampaign>();
const notifications = new Map<string, NotificationRequest[]>();

export const storeEvent = (e: LiveEvent) => events.set(e.id, e);
export const getEvent = (id: string) => events.get(id) ?? null;
export const getAllEvents = () => Array.from(events.values());
export const storeCampaign = (c: Campaign) => campaigns.set(c.id, c);
export const getCampaign = (id: string) => campaigns.get(id) ?? null;
export const getAllCampaigns = () => Array.from(campaigns.values());
export const storeScheduledEvent = (s: ScheduledEvent) => scheduledEvents.set(s.id, s);
export const getScheduledEvent = (id: string) => scheduledEvents.get(id) ?? null;
export const getAllScheduledEvents = () => Array.from(scheduledEvents.values());
export const storeParticipation = (p: EventParticipation) => { const l = participations.get(p.eventId) ?? []; l.push(p); participations.set(p.eventId, l); };
export const getParticipations = (eventId: string) => participations.get(eventId) ?? [];
export const getParticipationForUser = (eventId: string, userId: string) => (participations.get(eventId) ?? []).find(p => p.userId === userId) ?? null;
export const storeObjective = (o: ObjectiveDefinition) => objectives.set(o.id, o);
export const getObjective = (id: string) => objectives.get(id) ?? null;
export const getAllObjectives = () => Array.from(objectives.values());
export const storeRewardMapping = (r: RewardMapping) => rewardMappings.set(r.id, r);
export const getRewardMapping = (id: string) => rewardMappings.get(id) ?? null;
export const getAllRewardMappings = () => Array.from(rewardMappings.values());
export const storeTemplate = (t: EventTemplate) => templates.set(t.id, t);
export const getTemplate = (id: string) => templates.get(id) ?? null;
export const getAllTemplates = () => Array.from(templates.values());
export const storeFeatureFlag = (f: FeatureFlag) => featureFlags.set(f.id, f);
export const getFeatureFlag = (id: string) => featureFlags.get(id) ?? null;
export const getAllFeatureFlags = () => Array.from(featureFlags.values());
export const storeApproval = (a: ApprovalWorkflow) => approvals.set(a.id, a);
export const getApproval = (id: string) => approvals.get(id) ?? null;
export const getAllApprovals = () => Array.from(approvals.values());
export const storeOrgCampaign = (o: OrganizationCampaign) => orgCampaigns.set(o.id, o);
export const getOrgCampaign = (id: string) => orgCampaigns.get(id) ?? null;
export const getAllOrgCampaigns = () => Array.from(orgCampaigns.values());
export const storeNotification = (n: NotificationRequest) => { const l = notifications.get(n.eventId) ?? []; l.push(n); notifications.set(n.eventId, l); };
export const getNotifications = (eventId: string) => notifications.get(eventId) ?? [];

export function _resetRepositoryForTesting() {
  events.clear(); campaigns.clear(); scheduledEvents.clear(); participations.clear();
  objectives.clear(); rewardMappings.clear(); templates.clear(); featureFlags.clear();
  approvals.clear(); orgCampaigns.clear(); notifications.clear();
}
