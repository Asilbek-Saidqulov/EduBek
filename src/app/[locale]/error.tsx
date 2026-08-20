/**
 * Route-level error boundary.
 *
 * Catches unhandled errors from Server Components in the [locale]
 * segment. The user can retry the route or go back to the home page.
 *
 * Note: must be a Client Component (Next.js convention).
 */
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // Surface the error to the browser console for debugging — not user-visible.
    console.error("[edubek] route error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 inline-flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("unexpectedTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("unexpectedBody")}
        </p>
        {error.digest && (
          <p className="mt-4 inline-block rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
            {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default">
            <RotateCcw className="size-4" aria-hidden />
            {t("tryAgain")}
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="size-4" aria-hidden />
              {t("backHome")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
