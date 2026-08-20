/**
 * Generic placeholder page for routes the AppShell links to that don't
 * have a real implementation in Sprint 1.
 *
 * Pages import this and pass a title + description.
 */
import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

import { AppShell } from "@/components/edubek/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PlaceholderPage({
  title,
  description,
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
}: {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden border-border/60">
          <div className="h-1.5 w-full bg-gradient-to-r from-teacher via-ai to-student" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-md bg-warning/10 text-warning">
                <Construction className="size-5" aria-hidden />
              </span>
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="mt-1">{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This screen is part of Sprint 2+. The backend APIs are
              ready — only the UI hasn&apos;t been built yet.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href={backHref}>
                <ArrowLeft className="size-4" aria-hidden />
                {backLabel}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
