/**
 * EduBek — Real-time Monitoring.
 *
 * Phase 4F.7: Lightweight monitoring layer that periodically checks
 * platform health + alerting hooks. Designed to be called by a cron
 * job or scheduled task — not a long-running process.
 *
 * Reuses:
 *   • Phase 4F.7 Health module (subsystem health checks)
 *   • Phase 4F.7 Audit module (alert recording)
 *   • Phase 4E Notification infra (alert delivery)
 */
import { getLogger } from "@/lib/logger";
import { checkAllSubsystems } from "./health";
import { recordAudit } from "./audit";
import { notificationService } from "@/infra/notifications";
import type { PlatformHealthDto } from "./types";

const log = getLogger("monitoring");

// ---------------------------------------------------------------------------
// Main entry point: run a monitoring cycle
// ---------------------------------------------------------------------------

export async function runMonitoringCycle(): Promise<{
  health: PlatformHealthDto;
  alertsTriggered: number;
}> {
  log.info("monitoring.cycle_started");

  const health = await checkAllSubsystems();

  // Trigger alerts for degraded / down subsystems
  let alertsTriggered = 0;
  for (const subsystem of health.subsystems) {
    if (subsystem.status === "down" || (subsystem.status === "degraded" && subsystem.score < 0.4)) {
      // Record an audit event
      await recordAudit({
        actionType: "optimization_applied",
        actorType: "system",
        actorId: "monitoring",
        entityType: "subsystem",
        entityId: subsystem.subsystem,
        reasoning: {
          inputs: { subsystem: subsystem.subsystem, status: subsystem.status, score: subsystem.score },
          reasoning: `Subsystem ${subsystem.subsystem} is ${subsystem.status} (score: ${subsystem.score.toFixed(2)}).`,
          confidence: 0.9,
          affectedModules: [subsystem.subsystem],
        },
        confidence: 0.9,
        outcome: "success",
      }).catch(() => undefined);
      alertsTriggered += 1;
    }
  }

  // Notify platform admins if any subsystem is down
  const downSubsystems = health.subsystems.filter((s) => s.status === "down");
  if (downSubsystems.length > 0) {
    const { db } = await import("@/lib/db");
    // Find users with platform admin roles via UserRole table
    const adminRoles = await db.userRole.findMany({
      where: { role: { in: ["platform_admin", "platform_superadmin"] } },
      select: { userId: true },
    }).catch(() => []);
    const adminIds = Array.from(new Set(adminRoles.map((r) => r.userId)));
    for (const adminId of adminIds) {
      await notificationService.send({
        userId: adminId,
        type: "platform_intelligence.subsystem_down",
        title: `${downSubsystems.length} subsystem(s) are down`,
        body: `The following subsystems are down: ${downSubsystems.map((s) => s.subsystem).join(", ")}.`,
        data: { subsystems: downSubsystems.map((s) => s.subsystem) },
      }).catch(() => undefined);
    }
  }

  log.info("monitoring.cycle_completed", {
    overallStatus: health.overallStatus,
    alertsTriggered,
    downSubsystems: downSubsystems.length,
  });

  return { health, alertsTriggered };
}

// ---------------------------------------------------------------------------
// Alert thresholds (configurable)
// ---------------------------------------------------------------------------

export const ALERT_THRESHOLDS = {
  /** Subsystem score below this triggers a 'degraded' alert. */
  degradedThreshold: 0.5,
  /** Subsystem score below this triggers a 'down' alert. */
  downThreshold: 0.2,
  /** CTR below this triggers a recommendation effectiveness alert. */
  lowCtrThreshold: 0.05,
  /** Search abandonment rate above this triggers a search alert. */
  highAbandonmentThreshold: 0.3,
  /** Refund rate above this triggers a marketplace alert. */
  highRefundRateThreshold: 0.2,
} as const;
