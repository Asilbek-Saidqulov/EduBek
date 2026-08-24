import * as React from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: IconProp,
  action,
  ctaLabel,
  ctaHref,
  className,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!IconProp) return <FolderOpen className="h-6 w-6" />;
    if (React.isValidElement(IconProp)) return IconProp;
    if (typeof IconProp === "function" || typeof IconProp === "object") {
      const Comp = IconProp as React.ComponentType<{ className?: string }>;
      return <Comp className="h-6 w-6" />;
    }
    return <FolderOpen className="h-6 w-6" />;
  };

  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
        {renderIcon()}
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
      {!action && ctaLabel && ctaHref && (
        <div className="mt-4">
          <Button asChild size="sm">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

