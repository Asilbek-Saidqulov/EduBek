/**
 * Infra — Resource event listeners.
 *
 * Subscribes to resource domain events and writes audit log entries.
 * The resource service doesn't know about audit — it just publishes events.
 *
 * Phase 2B additions: collection events, sharing events, version-restored,
 * bulk-operation-completed, import/export events.
 *
 * Registered in `src/infra/listeners/register.ts`.
 */

import { auditLogger } from '@/infra/audit'
import { eventBus } from '@/infra/event-bus'
import { logger } from '@/lib/logger'
import {
  // Phase 2A — resource lifecycle
  RESOURCE_CREATED,
  RESOURCE_UPDATED,
  RESOURCE_ARCHIVED,
  RESOURCE_RESTORED,
  RESOURCE_DUPLICATED,
  // Phase 2B — collections
  COLLECTION_CREATED,
  COLLECTION_UPDATED,
  COLLECTION_DELETED,
  // Phase 2B — sharing / import-export / version / bulk
  RESOURCE_SHARED,
  RESOURCE_EXPORTED,
  RESOURCE_IMPORTED,
  VERSION_RESTORED,
  BULK_OPERATION_COMPLETED,
  // Types
  type ResourceCreatedEvent,
  type ResourceUpdatedEvent,
  type ResourceArchivedEvent,
  type ResourceRestoredEvent,
  type ResourceDuplicatedEvent,
  type CollectionCreatedEvent,
  type CollectionUpdatedEvent,
  type CollectionDeletedEvent,
  type ResourceSharedEvent,
  type ResourceExportedEvent,
  type ResourceImportedEvent,
  type VersionRestoredEvent,
  type BulkOperationCompletedEvent,
} from '@/infra/event-bus/events'

const log = logger.child({ module: 'resource-listeners' })

/** Subscribe resource audit listeners to the event bus. Called once at startup. */
export function registerResourceListeners(): void {
  log.info('registering resource listeners')

  // --------------------------------------------------------------------------
  // Phase 2A — resource lifecycle
  // --------------------------------------------------------------------------

  eventBus.subscribe<ResourceCreatedEvent>(RESOURCE_CREATED, (event) => {
    return auditLogger.log({
      action: 'resource.created',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'resource',
      entityId: event.resourceId,
      metadata: {
        resourceType: event.resourceType,
        title: event.title,
        orgId: event.orgId,
      },
    })
  })

  eventBus.subscribe<ResourceUpdatedEvent>(RESOURCE_UPDATED, (event) => {
    return auditLogger.log({
      action: 'resource.updated',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'resource',
      entityId: event.resourceId,
      metadata: {
        version: event.version,
        changes: event.changes,
      },
    })
  })

  eventBus.subscribe<ResourceArchivedEvent>(RESOURCE_ARCHIVED, (event) => {
    return auditLogger.log({
      action: 'resource.archived',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'resource',
      entityId: event.resourceId,
      metadata: { title: event.title },
    })
  })

  eventBus.subscribe<ResourceRestoredEvent>(RESOURCE_RESTORED, (event) => {
    return auditLogger.log({
      action: 'resource.restored',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'resource',
      entityId: event.resourceId,
      metadata: { title: event.title },
    })
  })

  eventBus.subscribe<ResourceDuplicatedEvent>(RESOURCE_DUPLICATED, (event) => {
    return auditLogger.log({
      action: 'resource.duplicated',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'resource',
      entityId: event.resourceId,
      metadata: {
        originalResourceId: event.originalResourceId,
        title: event.title,
        resourceType: event.resourceType,
      },
    })
  })

  // --------------------------------------------------------------------------
  // Phase 2B — collections
  // --------------------------------------------------------------------------

  eventBus.subscribe<CollectionCreatedEvent>(COLLECTION_CREATED, (event) => {
    return auditLogger.log({
      action: 'collection.created',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'collection',
      entityId: event.collectionId,
      metadata: {
        name: event.name,
        orgId: event.orgId,
      },
    })
  })

  eventBus.subscribe<CollectionUpdatedEvent>(COLLECTION_UPDATED, (event) => {
    return auditLogger.log({
      action: 'collection.updated',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'collection',
      entityId: event.collectionId,
      metadata: { changes: event.changes },
    })
  })

  eventBus.subscribe<CollectionDeletedEvent>(COLLECTION_DELETED, (event) => {
    return auditLogger.log({
      action: 'collection.deleted',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'collection',
      entityId: event.collectionId,
    })
  })

  // --------------------------------------------------------------------------
  // Phase 2B — sharing / import-export / version / bulk
  // --------------------------------------------------------------------------

  eventBus.subscribe<ResourceSharedEvent>(RESOURCE_SHARED, (event) => {
    return auditLogger.log({
      action: 'resource.shared',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'resource',
      entityId: event.resourceId,
      metadata: {
        // Don't log the full token — just a prefix for correlation.
        shareTokenPrefix: event.shareToken.slice(0, 8),
        expiresAt: event.expiresAt,
      },
    })
  })

  eventBus.subscribe<ResourceExportedEvent>(RESOURCE_EXPORTED, (event) => {
    return auditLogger.log({
      action: 'resource.exported',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'resource',
      entityId: event.resourceId,
      metadata: { format: event.format },
    })
  })

  eventBus.subscribe<ResourceImportedEvent>(RESOURCE_IMPORTED, (event) => {
    return auditLogger.log({
      action: 'resource.imported',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'resource',
      entityId: event.resourceId,
      metadata: {
        resourceType: event.resourceType,
        title: event.title,
        source: event.source,
      },
    })
  })

  eventBus.subscribe<VersionRestoredEvent>(VERSION_RESTORED, (event) => {
    return auditLogger.log({
      action: 'resource.version_restored',
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'resource',
      entityId: event.resourceId,
      metadata: {
        restoredVersion: event.restoredVersion,
        newVersion: event.newVersion,
      },
    })
  })

  eventBus.subscribe<BulkOperationCompletedEvent>(BULK_OPERATION_COMPLETED, (event) => {
    return auditLogger.log({
      action: `resource.bulk_${event.operation}`,
      actorId: event.actorId,
      actorType: 'user',
      entityType: 'resource',
      // No single entityId for a bulk op — record counts + IDs in metadata.
      metadata: {
        operation: event.operation,
        total: event.resourceIds.length,
        succeeded: event.succeeded.length,
        failed: event.failed.length,
        succeededIds: event.succeeded,
        failedIds: event.failed,
      },
    })
  })
}
