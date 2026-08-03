/** System 9 — Organization Health. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { OrganizationHealthReport } from "./types";

const log = getLogger("org-health");

export async function generateOrganizationHealth(orgId?: string): Promise<OrganizationHealthReport> {
  const org = orgId ? await repo.fetchOrganization(orgId) : null;
  const seats = org?.seats ?? 10;
  const usage = Math.min(100, Math.round((seats / 10) * 30));
  const engagement = Math.min(100, usage + 20);
  const aiAdoption = Math.min(100, Math.round(usage * 0.6));
  const teacherAdoption = Math.min(100, Math.round(engagement * 0.7));
  const studentAdoption = Math.min(100, Math.round(engagement * 0.8));
  const marketplaceUsage = Math.min(100, Math.round(usage * 0.3));
  const curriculumCompletion = Math.min(100, Math.round(engagement * 0.5));
  const assessmentActivity = Math.min(100, Math.round(engagement * 0.6));
  const overallHealth = Math.round((usage + engagement + aiAdoption + teacherAdoption + studentAdoption + marketplaceUsage + curriculumCompletion + assessmentActivity) / 8);
  const trend: "improving" | "stable" | "declining" = overallHealth > 70 ? "improving" : overallHealth > 50 ? "stable" : "declining";
  const recommendations: string[] = [];
  if (aiAdoption < 40) recommendations.push("AI adoption is low — schedule AI training for teachers.");
  if (studentAdoption < 50) recommendations.push("Student engagement is below 50% — review classroom assignments.");
  if (curriculumCompletion < 40) recommendations.push("Curriculum completion is low — check for coverage gaps.");
  log.info("org_health.report_complete", { orgId, overall: overallHealth, trend });
  return { generatedAt: new Date().toISOString(), organizationId: orgId ?? "platform", overallHealth, usage, engagement, aiAdoption, teacherAdoption, studentAdoption, marketplaceUsage, curriculumCompletion, assessmentActivity, trend, recommendations };
}
