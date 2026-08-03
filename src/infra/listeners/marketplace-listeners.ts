/** Marketplace event listeners — audit logging for all marketplace events. */

import { auditLogger } from '@/infra/audit'
import { eventBus } from '@/infra/event-bus'
import { logger } from '@/lib/logger'
import {
  LISTING_CREATED, LISTING_UPDATED, LISTING_SUBMITTED, LISTING_APPROVED, LISTING_PUBLISHED,
  LISTING_UNPUBLISHED, LISTING_ARCHIVED, LISTING_FAVORITED, LISTING_UNFAVORITED, LISTING_VIEWED,
  type ListingCreatedEvent, type ListingUpdatedEvent, type ListingSubmittedEvent, type ListingApprovedEvent,
  type ListingPublishedEvent, type ListingUnpublishedEvent, type ListingArchivedEvent,
  type ListingFavoritedEvent, type ListingUnfavoritedEvent, type ListingViewedEvent,
} from '@/infra/event-bus/events'

const log = logger.child({ module: 'mp-listeners' })

export function registerMarketplaceListeners(): void {
  log.info('registering marketplace listeners')

  eventBus.subscribe<ListingCreatedEvent>(LISTING_CREATED, (e) =>
    auditLogger.log({ action: 'marketplace.listing_created', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId, metadata: { title: e.title, resourceId: e.resourceId } }))

  eventBus.subscribe<ListingUpdatedEvent>(LISTING_UPDATED, (e) =>
    auditLogger.log({ action: 'marketplace.listing_updated', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId, metadata: { changes: e.changes } }))

  eventBus.subscribe<ListingSubmittedEvent>(LISTING_SUBMITTED, (e) =>
    auditLogger.log({ action: 'marketplace.listing_submitted', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId, metadata: { title: e.title } }))

  eventBus.subscribe<ListingApprovedEvent>(LISTING_APPROVED, (e) =>
    auditLogger.log({ action: 'marketplace.listing_approved', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId, metadata: { title: e.title, approvedById: e.approvedById } }))

  eventBus.subscribe<ListingPublishedEvent>(LISTING_PUBLISHED, (e) =>
    auditLogger.log({ action: 'marketplace.listing_published', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId, metadata: { title: e.title, resourceVersion: e.resourceVersion } }))

  eventBus.subscribe<ListingUnpublishedEvent>(LISTING_UNPUBLISHED, (e) =>
    auditLogger.log({ action: 'marketplace.listing_unpublished', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId, metadata: { title: e.title } }))

  eventBus.subscribe<ListingArchivedEvent>(LISTING_ARCHIVED, (e) =>
    auditLogger.log({ action: 'marketplace.listing_archived', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId, metadata: { title: e.title } }))

  eventBus.subscribe<ListingFavoritedEvent>(LISTING_FAVORITED, (e) =>
    auditLogger.log({ action: 'marketplace.favorite_added', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId, metadata: { userId: e.userId } }))

  eventBus.subscribe<ListingUnfavoritedEvent>(LISTING_UNFAVORITED, (e) =>
    auditLogger.log({ action: 'marketplace.favorite_removed', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId, metadata: { userId: e.userId } }))

  eventBus.subscribe<ListingViewedEvent>(LISTING_VIEWED, (e) =>
    auditLogger.log({ action: 'marketplace.listing_viewed', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId }))
}
