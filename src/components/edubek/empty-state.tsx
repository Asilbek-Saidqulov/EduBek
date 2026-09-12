import * as React from "react";
import { cn } from "@/lib/utils";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

function isComponentType(value: unknown): value is React.ComponentType<{ className?: string }> {
  if (typeof value === "function") return true;
  if (!value || typeof value !== "object") return false;
  const obj = value as { $$typeof?: unknown; render?: unknown };
  return typeof obj.render === "function" || Boolean(obj.$$typeof);
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  let iconNode: React.ReactNode = <FolderOpen className="h-6 w-6" />;
  if (React.isValidElement(icon)) {
    iconNode = icon;
  } else if (isComponentType(icon)) {
    iconNode = React.createElement(icon, { className: "h-6 w-6" });
  }

  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {iconNode}
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
