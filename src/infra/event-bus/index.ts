/**
 * EduBek — in-process event bus.
 *
 * Producers call `eventBus.publish(event)`; consumers register themselves
 * with `eventBus.subscribe(type, handler)` or `eventBus.subscribe("*", handler)`
 * (wildcard — receives every event).
 *
 * Delivery semantics:
 *   • Fire-and-forget — `publish()` does not await handlers.
 *   • Isolated — a thrown error in one handler does NOT prevent other
 *     handlers from receiving the event. Errors are logged and swallowed.
 *   • In-order per type — handlers for a given event type are invoked in
 *     the order they subscribed. Cross-type ordering is not guaranteed.
 *
 * Why not use Node's EventEmitter directly? Three reasons:
 *   1. We want typed handlers (the `EventHandler<T>` type below).
 *   2. We want a single, well-known seam that a later phase can replace
 *      with an out-of-process transport (NATS, SQS, …) without touching
 *      producers or consumers.
 *   3. We want explicit, isolated error handling so a buggy listener
 *      can never crash the producer.
 *
 * The lazy registration flag (`listenersRegistered`) is set the first time
 * `publish()` is called. At that point we dynamically `require()` the
 * listener registration module so that producers don't pay the cost of
 * loading every listener (and transitively every service) until the first
 * event is actually published — and so that the event-bus module itself
 * stays free of circular imports with the listeners folder.
 */

import { createRequire } from "node:module";
import { getLogger } from "@/lib/logger";
import type { DomainEvent, DomainEventType } from "@/infra/event-bus/events";

const log = getLogger("event-bus");

// `createRequire` lets us lazily resolve the listeners folder without
// creating a top-level import cycle (the listeners folder imports this
// module to subscribe). We guard the call so the event bus still works in
// runtimes that don't expose `node:module` (e.g. Edge) — listeners simply
// won't be registered, and events are delivered to no-one.
const nodeRequire: NodeRequire | null = (() => {
  try {
    if (typeof createRequire !== "function") return null;
    const url =
      typeof import.meta !== "undefined" && import.meta.url
        ? import.meta.url
        : "file:///edubek/event-bus.ts";
    return createRequire(url);
  } catch {
    return null;
  }
})();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventHandler<T extends DomainEvent = DomainEvent> = (
  event: T,
) => void | Promise<void>;

export interface EventBus {
  subscribe<T extends DomainEvent>(
    type: DomainEventType | "*",
    handler: EventHandler<T>,
  ): () => void;
  publish<T extends DomainEvent>(event: T): void;
}

// ---------------------------------------------------------------------------
// InMemoryEventBus
// ---------------------------------------------------------------------------

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<DomainEventType | "*", Set<EventHandler>>();

  /**
   * Subscribe to a specific event type or to `*` (all events). Returns an
   * unsubscribe function — callers should invoke it on teardown to avoid
   * leaks in long-running processes (e.g. hot-reload loops in dev).
   */
  subscribe<T extends DomainEvent>(
    type: DomainEventType | "*",
    handler: EventHandler<T>,
  ): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as EventHandler);
    return () => {
      set?.delete(handler as EventHandler);
    };
  }

  /**
   * Publish an event. All matching handlers (specific + wildcard) are
   * invoked. Each handler is isolated: if it throws, the error is logged
   * and the next handler runs normally.
   *
   * Listeners are registered lazily on the first publish to keep the event
   * bus module free of circular imports with the listeners folder.
   */
  publish<T extends DomainEvent>(event: T): void {
    this.ensureListenersRegistered();

    const specific = this.handlers.get(event.type as DomainEventType);
    const wildcard = this.handlers.get("*");

    if (!specific && !wildcard) return;

    const dispatch = (handler: EventHandler): void => {
      try {
        const result = handler(event);
        if (result && typeof (result as Promise<void>).catch === "function") {
          (result as Promise<void>).catch((err: unknown) => {
            log.error("event.handler.async_error", {
              type: event.type,
              error: err instanceof Error ? err.message : String(err),
            });
          });
        }
      } catch (err) {
        log.error("event.handler.sync_error", {
          type: event.type,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };

    if (specific) specific.forEach(dispatch);
    if (wildcard) wildcard.forEach(dispatch);
  }

  // --- listener registration (lazy) --------------------------------------

  private listenersRegistered = false;

  private ensureListenersRegistered(): void {
    if (this.listenersRegistered) return;
    this.listenersRegistered = true;
    try {
      // Dynamic require to break the circular dependency: the listeners
      // module imports the event bus (to subscribe), and we'd otherwise
      // import the listeners module from here at top-level.
      if (nodeRequire) {
        const mod = nodeRequire("../listeners/register");
        if (mod && typeof mod.registerAllListeners === "function") {
          mod.registerAllListeners();
          log.debug("event.listeners_registered");
        }
      }
    } catch (err) {
      // Don't crash publish() if the listeners module is unavailable
      // (e.g. in tests that only exercise the bus in isolation).
      log.warn("event.listeners_register_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const eventBus: EventBus = new InMemoryEventBus();
