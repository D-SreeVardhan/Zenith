"use client";

export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { EventTasksBoard } from "@/components/tasks/EventTasksBoard";
import { cn, formatDate, formatTime } from "@/lib/utils";

interface TasksPageProps {
  params: { eventId: string };
}

export default function TasksPage({ params }: TasksPageProps) {
  const { eventId } = params;

  const { events } = useAppStore();

  const event = events.find((e) => e.id === eventId);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back link and event header */}
      <div className="space-y-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>

        <div className="card p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    event.priority === "high" && "bg-priority-high",
                    event.priority === "medium" && "bg-priority-medium",
                    event.priority === "low" && "bg-priority-low"
                  )}
                />
                <h3 className="text-lg font-semibold text-text-primary">
                  {event.title}
                </h3>
              </div>
              {event.dueAt && (
                <p className="text-sm text-text-secondary">
                  Due: {formatDate(event.dueAt)}
                  {event.dueAt.includes("T") && ` at ${formatTime(event.dueAt)}`}
                </p>
              )}
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                event.priority === "high" && "bg-priority-high-muted text-priority-high",
                event.priority === "medium" && "bg-priority-medium-muted text-priority-medium",
                event.priority === "low" && "bg-priority-low-muted text-priority-low"
              )}
            >
              {event.priority}
            </span>
          </div>
          {event.notes && (
            <div className="mt-4 rounded-md bg-surface-elevated p-3">
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {event.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tasks board */}
      <EventTasksBoard eventId={eventId} />
    </div>
  );
}
