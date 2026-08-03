/**
 * EduBek — Approval Workflows (System 6).
 * Approval pipelines for new prompts, models, provider changes, routing
 * policies, AI agents, extensions, automation. Each workflow: draft → review
 * → approved/rejected → deprecated → archived.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import * as audit from "./audit-engine";
import type { ApprovalRequest, ApprovalType, ApprovalStatus, ApprovalWorkflowReport } from "./types";

const log = getLogger("approval-workflows");

export async function createApproval(input: {
  type: ApprovalType; title: string; description?: string; requestedBy: string;
}): Promise<ApprovalRequest> {
  const row = await repo.createApproval(input);
  await audit.recordAudit({
    action: "approval.created", actorType: "user", actorId: input.requestedBy,
    entityType: "approval", entityId: row.id, scope: "platform",
    details: { type: input.type, title: input.title },
  });
  log.info("approval.created", { id: row.id, type: input.type });
  return mapApproval(row);
}

export async function reviewApproval(input: {
  id: string; reviewedBy: string; status: "approved" | "rejected"; notes?: string;
  riskAssessment?: string;
}): Promise<ApprovalRequest | null> {
  const row = await repo.updateApproval(input.id, {
    status: input.status, reviewedBy: input.reviewedBy,
    reviewNotes: input.notes, riskAssessment: input.riskAssessment,
  });
  if (row) {
    await audit.recordAudit({
      action: `approval.${input.status}`, actorType: "user", actorId: input.reviewedBy,
      entityType: "approval", entityId: input.id, scope: "platform",
      details: { notes: input.notes },
    });
    log.info("approval.reviewed", { id: input.id, status: input.status });
  }
  return row ? mapApproval(row) : null;
}

export async function listApprovals(status?: ApprovalStatus): Promise<ApprovalRequest[]> {
  const rows = await repo.listApprovals(status);
  return rows.map(mapApproval);
}

export async function generateApprovalReport(): Promise<ApprovalWorkflowReport> {
  const requests = await listApprovals();
  const pendingCount = requests.filter(r => r.status === "draft" || r.status === "review").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;
  log.info("approval.report_complete", { total: requests.length, pending: pendingCount, approved: approvedCount });
  return {
    generatedAt: new Date().toISOString(),
    requests, pendingCount, approvedCount, rejectedCount,
  };
}

function mapApproval(row: Awaited<ReturnType<typeof repo.createApproval>>): ApprovalRequest {
  return {
    id: row.id, type: row.type as ApprovalType, title: row.title,
    description: row.description, requestedBy: row.requestedBy,
    status: row.status as ApprovalStatus, reviewedBy: row.reviewedBy,
    reviewNotes: row.reviewNotes, riskAssessment: row.riskAssessment,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  };
}
