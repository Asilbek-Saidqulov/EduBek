/**
 * Infra — Background job queue abstraction.
 *
 * The JobQueue lets services defer work to run later (e.g. sending an
 * email, generating a report, aggregating analytics). The service
 * enqueues a job; a handler processes it asynchronously.
 *
 * Interface-first design: the `JobQueue` interface lets us swap the
 * in-memory implementation for BullMQ / RabbitMQ / SQS later without
 * changing any service code.
 *
 * Current implementation: InMemoryJobQueue
 *   - Jobs run immediately in the same process (no real queueing)
 *   - Fire-and-forget (failures are logged, not retried)
 *   - Single-instance (not distributed)
 *
 * Future implementations (no service code changes):
 *   - BullMqJobQueue — Redis-backed, retries, scheduled jobs, concurrency
 *   - SqsJobQueue — AWS-managed, at-least-once, visibility timeout
 *   - PgBossJobQueue — Postgres-backed, transactional outbox pattern
 *
 * Usage:
 *   import { jobQueue } from '@/infra/jobs'
 *   await jobQueue.enqueue('send-welcome-email', { userId, email })
 *
 *   // At startup (in a handler registration file):
 *   jobQueue.register('send-welcome-email', async (payload) => {
 *     await emailService.sendWelcome(payload.email)
 *   })
 */

import { logger } from '@/lib/logger'

const log = logger.child({ module: 'job-queue' })

// ----------------------------------------------------------------------------
// JobQueue interface — the contract.
// ----------------------------------------------------------------------------

export type JobHandler<P = unknown> = (payload: P) => Promise<void> | void

export interface JobQueue {
  /**
   * Register a handler for a job type. Only one handler per type
   * (last registration wins). Returns an unregister function.
   */
  register<P>(type: string, handler: JobHandler<P>): () => void

  /**
   * Enqueue a job for background processing. Returns immediately —
   * the job will be processed by the registered handler.
   */
  enqueue<P>(type: string, payload: P): void
}

// ----------------------------------------------------------------------------
// InMemoryJobQueue — the default implementation.
// ----------------------------------------------------------------------------

export class InMemoryJobQueue implements JobQueue {
  private handlers = new Map<string, JobHandler>()

  register<P>(type: string, handler: JobHandler<P>): () => void {
    this.handlers.set(type, handler as JobHandler)
    log.debug('job handler registered', { jobType: type })
    return () => {
      this.handlers.delete(type)
      log.debug('job handler unregistered', { jobType: type })
    }
  }

  enqueue<P>(type: string, payload: P): void {
    const handler = this.handlers.get(type)
    if (!handler) {
      log.warn('job enqueued with no handler', { jobType: type })
      return
    }

    log.debug('job enqueued', { jobType: type })
    // Fire-and-forget — run the handler asynchronously, catch errors.
    Promise.resolve()
      .then(() => handler(payload))
      .then(() => log.debug('job completed', { jobType: type }))
      .catch((err) => {
        log.error('job failed', {
          jobType: type,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        })
      })
  }
}

// ----------------------------------------------------------------------------
// Singleton instance — the default job queue for the app.
// ----------------------------------------------------------------------------

export const jobQueue: JobQueue = new InMemoryJobQueue()
