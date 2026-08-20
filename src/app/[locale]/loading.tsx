/**
 * Loading fallback for the [locale] segment.
 * Shown automatically by Next.js App Router while a route is loading.
 */
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] w-full items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <p className="text-sm">Loading…</p>
      </div>
    </div>
  );
}
