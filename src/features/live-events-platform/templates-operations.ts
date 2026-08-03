/** Systems 7, 14 — Event Templates + Organization Operations. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeTemplate, getTemplate, getAllTemplates, storeOrgCampaign, getOrgCampaign, getAllOrgCampaigns } from "./repository";
import type { EventTemplate, LiveEventType, OrganizationCampaign, OrganizationType, EventApprovalStatus } from "./types";

const log = getLogger("live-events.templates");

// ===== System 7 — Event Templates =====

export const EVENT_TEMPLATES: EventTemplate[] = [
  { id: "tpl_academic_week", name: "Academic Week", description: "A week-long academic celebration with daily objectives", type: "academic", defaultObjectives: ["attend_5_sessions", "complete_10_quizzes"], defaultRewards: ["badge_academic_week", "xp_500"], defaultSchedule: null, category: "academic", tags: ["academic", "week"] },
  { id: "tpl_stem_week", name: "STEM Week", description: "Science, Technology, Engineering, and Mathematics focus week", type: "academic", defaultObjectives: ["complete_stem_challenges", "win_3_stem_matches"], defaultRewards: ["badge_stem", "frame_stem"], defaultSchedule: null, category: "stem", tags: ["stem", "science"] },
  { id: "tpl_math_olympiad", name: "Math Olympiad", description: "Mathematics competition with progressive difficulty", type: "academic", defaultObjectives: ["solve_20_problems", "reach_top_100"], defaultRewards: ["title_mathlete", "certificate_olympiad"], defaultSchedule: null, category: "math", tags: ["math", "olympiad"] },
  { id: "tpl_economics_challenge", name: "Economics Challenge", description: "Economics and financial literacy competition", type: "academic", defaultObjectives: ["complete_econ_quiz", "win_5_econ_matches"], defaultRewards: ["badge_economist", "xp_300"], defaultSchedule: null, category: "economics", tags: ["economics", "finance"] },
  { id: "tpl_national_holiday", name: "National Holiday Event", description: "Celebrate national holidays with themed activities", type: "national", defaultObjectives: ["play_3_holiday_matches", "join_holiday_club"], defaultRewards: ["banner_holiday", "badge_holiday"], defaultSchedule: null, category: "holiday", tags: ["holiday", "national"] },
  { id: "tpl_university_week", name: "University Week", description: "Inter-university competition and collaboration week", type: "university", defaultObjectives: ["represent_university", "win_5_matches"], defaultRewards: ["frame_university", "title_scholar"], defaultSchedule: null, category: "university", tags: ["university", "competition"] },
  { id: "tpl_school_championship", name: "School Championship", description: "School-wide championship with brackets and finals", type: "organization", defaultObjectives: ["qualify_for_finals", "win_championship"], defaultRewards: ["badge_champion", "trophy_school"], defaultSchedule: null, category: "championship", tags: ["school", "championship"] },
  { id: "tpl_reading_week", name: "Reading Week", description: "Literature and reading comprehension focused week", type: "academic", defaultObjectives: ["read_5_books", "complete_reading_quizzes"], defaultRewards: ["badge_bookworm", "avatar_reader"], defaultSchedule: null, category: "reading", tags: ["reading", "literature"] },
  { id: "tpl_programming_month", name: "Programming Month", description: "Month-long programming and coding challenge", type: "monthly", defaultObjectives: ["solve_30_coding_problems", "publish_extension"], defaultRewards: ["title_developer", "badge_coder", "frame_code"], defaultSchedule: null, category: "programming", tags: ["programming", "coding"] },
  { id: "tpl_teacher_campaign", name: "Teacher Campaign", description: "Campaign for teachers to engage students", type: "organization", defaultObjectives: ["host_10_sessions", "engage_50_students"], defaultRewards: ["badge_teacher", "certificate_campaign"], defaultSchedule: null, category: "teacher", tags: ["teacher", "campaign"] },
];

export function initializeTemplates(): void {
  for (const t of EVENT_TEMPLATES) storeTemplate(t);
  log.info("templates.initialized", { count: EVENT_TEMPLATES.length });
}

export function getTemplateById(id: string): EventTemplate | null { return getTemplate(id); }
export function listTemplates(category?: string): EventTemplate[] {
  const all = getAllTemplates();
  return category ? all.filter(t => t.category === category) : all;
}

export function createCustomTemplate(input: {
  name: string; description: string; type: LiveEventType;
  defaultObjectives?: string[]; defaultRewards?: string[];
  category: string; tags?: string[];
}): EventTemplate {
  const template: EventTemplate = {
    id: randomUUID(), name: input.name, description: input.description,
    type: input.type, defaultObjectives: input.defaultObjectives ?? [],
    defaultRewards: input.defaultRewards ?? [], defaultSchedule: null,
    category: input.category, tags: input.tags ?? [],
  };
  storeTemplate(template);
  return template;
}

// ===== System 14 — Organization Operations =====
export function createOrganizationCampaign(input: {
  organizationId: string; organizationType: OrganizationType;
  campaignId: string; eventId?: string | null;
  participationTarget?: number;
}): OrganizationCampaign {
  const orgCampaign: OrganizationCampaign = {
    id: randomUUID(), organizationId: input.organizationId,
    organizationType: input.organizationType, campaignId: input.campaignId,
    eventId: input.eventId ?? null, status: "draft",
    participationTarget: input.participationTarget ?? 100,
    actualParticipation: 0, createdAt: new Date().toISOString(),
  };
  storeOrgCampaign(orgCampaign);
  log.info("org_campaign.created", { orgId: input.organizationId, campaignId: input.campaignId });
  return orgCampaign;
}

export function getOrgCampaignById(id: string): OrganizationCampaign | null { return getOrgCampaign(id); }
export function listOrgCampaigns(orgType?: OrganizationType): OrganizationCampaign[] {
  const all = getAllOrgCampaigns();
  return orgType ? all.filter(o => o.organizationType === orgType) : all;
}

export function updateOrgCampaignStatus(id: string, status: EventApprovalStatus): OrganizationCampaign | null {
  const o = getOrgCampaign(id);
  if (!o) return null;
  o.status = status;
  return o;
}

export function updateOrgParticipation(id: string, actual: number): OrganizationCampaign | null {
  const o = getOrgCampaign(id);
  if (!o) return null;
  o.actualParticipation = actual;
  return o;
}

export function listAllOrgCampaigns(): OrganizationCampaign[] { return getAllOrgCampaigns(); }
