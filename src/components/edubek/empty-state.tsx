/**
 * EmptyState — reusable empty-data UI.
 * Dashed-border card with muted circle icon, heading, helper text,
 * optional CTA button.
 */
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center gap-3 border-dashed border-border/60 bg-card/30 p-8 text-center",
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {ctaLabel && ctaHref && (
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </Card>
  );
}
