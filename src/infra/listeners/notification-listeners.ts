/**
 * EduBek — notification listeners.
 *
 * Subscribes to a curated set of domain events and turns them into
 * user-facing notifications via the `NotificationService`.
 *
 * Phase 4E.3: Every notification now includes `titleKey`, `bodyKey`, and
 * `params` inside the `data` JSON column, alongside the existing English
 * `title` and `body` text (which remain as backward-compatible fallback).
 * The frontend resolves `titleKey` + `params` to a localized string.
 */

import { eventBus } from "@/infra/event-bus";
import {
  INVITATION_ACCEPTED,
  ORGANIZATION_CREATED,
  type InvitationAcceptedEvent,
  type OrganizationCreatedEvent,
} from "@/infra/event-bus/events";
import { notificationService } from "@/infra/notifications";

export function registerNotificationListeners(): void {
  // ORGANIZATION_CREATED — owner gets a welcome notification.
  eventBus.subscribe<OrganizationCreatedEvent>(
    ORGANIZATION_CREATED,
    (event) => {
      if (!event.ownerId) return;
      void notificationService.send({
        userId: event.ownerId,
        type: "organization.created",
        title: "Your organization is ready",
        body: `"${event.name}" (${event.slug}) has been created. You can now invite members and start building your library.`,
        data: {
          orgId: event.orgId,
          slug: event.slug,
          name: event.name,
          // Phase 4E.3: i18n keys + params (stored in the data JSON column)
          titleKey: "backend.notifications.orgCreated.title",
          bodyKey: "backend.notifications.orgCreated.body",
          params: { name: event.name, slug: event.slug },
        },
      });
    },
  );

  // INVITATION_ACCEPTED — new member gets a welcome notification.
  eventBus.subscribe<InvitationAcceptedEvent>(
    INVITATION_ACCEPTED,
    (event) => {
      void notificationService.send({
        userId: event.userId,
        type: "organization.invitation_accepted",
        title: "Welcome to the organization",
        body: `You have successfully joined "${event.orgSlug}".`,
        data: {
          orgId: event.orgId,
          orgSlug: event.orgSlug,
          roleName: event.roleName,
          // Phase 4E.3: i18n keys + params
          titleKey: "backend.notifications.invitationAccepted.title",
          bodyKey: "backend.notifications.invitationAccepted.body",
          params: { orgSlug: event.orgSlug },
        },
      });
    },
  );
}
