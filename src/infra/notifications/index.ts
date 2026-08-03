/**
 * EduBek — notifications.
 *
 * Producers hand a `NotificationPayload` to `notificationService.send()`.
 * The service fans the payload out to every registered `NotificationProvider`
 * (in-app, email, push, …). Each provider runs in isolation: a failure in
 * one channel is logged but does not block the others.
 *
 * Phase R0 ships a single provider — `InAppNotificationProvider` — which
 * writes a row to `UserNotification`. Email / push / SMS providers will be
 * added in later phases; the API surface here is stable enough to absorb
 * them without changes to producers.
 */

import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";

const log = getLogger("notifications");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationPayload {
  userId: string;
  /** Free-form type tag, e.g. "org.invitation_received", "payout.completed". */
  type: string;
  title: string;
  body?: string;
  /** Arbitrary structured data, JSON-serialized by the in-app provider. */
  data?: Record<string, unknown>;
}

export interface NotificationProvider {
  /** Channel name — used in logs and metrics. Must be unique per service. */
  channel: string;
  send(payload: NotificationPayload): Promise<void>;
}

// ---------------------------------------------------------------------------
// In-app provider
// ---------------------------------------------------------------------------

export class InAppNotificationProvider implements NotificationProvider {
  readonly channel = "in_app";

  async send(payload: NotificationPayload): Promise<void> {
    await db.userNotification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
        data: payload.data ? JSON.stringify(payload.data) : null,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// NotificationService
// ---------------------------------------------------------------------------

export class NotificationService {
  private readonly providers: NotificationProvider[] = [];

  /** Register a provider. Idempotent — re-registering the same channel is a no-op. */
  register(provider: NotificationProvider): void {
    if (this.providers.some((p) => p.channel === provider.channel)) {
      return;
    }
    this.providers.push(provider);
  }

  /** Fan-out a payload to every registered provider. Isolated per provider. */
  async send(payload: NotificationPayload): Promise<void> {
    if (this.providers.length === 0) {
      log.debug("notifications.no_providers", { type: payload.type });
      return;
    }
    await Promise.all(
      this.providers.map(async (provider) => {
        try {
          await provider.send(payload);
        } catch (err) {
          // Never let one channel block another.
          log.error("notifications.send_failed", {
            channel: provider.channel,
            type: payload.type,
            userId: payload.userId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const notificationService = new NotificationService();
notificationService.register(new InAppNotificationProvider());
