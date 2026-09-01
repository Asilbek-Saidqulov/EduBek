type Handler = (roomId: string, event: string, payload: unknown) => void;
const handlers = new Set<Handler>();

export function onRoomEvent(handler: Handler) {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function notify(roomId: string, event: string, payload: unknown) {
  for (const h of handlers) {
    try { h(roomId, event, payload); } catch (err) {
      console.error("[mp.bus]", err);
    }
  }
}
