"use client";

export const dynamic = 'force-dynamic';

import Link from "next/link";
import { ListChecks, ArrowRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export default function TasksIndexPage() {
  const { events } = useAppStore();

  // Get events sorted by due date
  const sortedEvents = [...events]
    .filter((e) => e.dueAt)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime());

  const upcomingEvents = sortedEvents.slice(0, 5);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
          <ListChecks className="h-8 w-8 text-text-muted" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-text-primary">
          Select an Event
        </h3>
        <p className="text-sm text-text-secondary">
          Choose an event from the list below or from the Events tab to manage its tasks.
        </p>
      </div>

      {upcomingEvents.length > 0 && (
        <div className="card">
          <div className="border-b border-border px-4 py-3">
            <h4 className="text-sm font-medium text-text-secondary">
              Recent Events
            </h4>
          </div>
          <div className="divide-y divide-border">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/tasks/${event.id}`}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-hover"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      event.priority === "high" && "bg-priority-high",
                      event.priority === "medium" && "bg-priority-medium",
                      event.priority === "low" && "bg-priority-low"
                    )}
                  />
                  <span className="text-sm text-text-primary">{event.title}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center">
          <p className="text-sm text-text-muted">
            No events yet.{" "}
            <Link href="/events" className="text-accent hover:underline">
              Create your first event
            </Link>{" "}
            to start adding tasks.
          </p>
        </div>
      )}
    </div>
  );
}
