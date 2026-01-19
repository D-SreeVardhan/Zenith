"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("card px-4 py-12 text-center", className)}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-elevated">
        <Icon className="h-7 w-7 text-text-muted" />
      </div>
      <h3 className="mb-1 text-lg font-medium text-text-primary">{title}</h3>
      {description && (
        <p className="mb-4 text-sm text-text-secondary">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}
