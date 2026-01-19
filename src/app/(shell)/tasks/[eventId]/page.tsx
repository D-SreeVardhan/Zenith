"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { EventTasksBoard } from "@/components/tasks/EventTasksBoard";
import { cn, formatDate, formatTime } from "@/lib/utils";

interface TasksPageProps {
  params: { eventId: string } | Promise<{ eventId: string }>;
}

export default function TasksPage({ params }: TasksPageProps) {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/39f67edb-5359-4afa-af41-b72b25689195", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "pre-fix",
      hypothesisId: "H1_H2",
      location: "src/app/(shell)/tasks/[eventId]/page.tsx",
      message: "TasksPage entry: inspect params shape before use(params)",
      data: {
        typeofParams: typeof params,
        isNull: params === null,
        isArray: Array.isArray(params),
        ctorName: (params as any)?.constructor?.name,
        hasThen: typeof (params as any)?.then === "function",
        directEventId: (params as any)?.eventId,
        directKeys: params && typeof params === "object" ? Object.keys(params as any) : null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  let eventId: string | undefined;
  const paramsAny = params as any;
  if (typeof paramsAny?.then === "function") {
    try {
      const resolved = (use as any)(params);
      eventId = resolved?.eventId;
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/39f67edb-5359-4afa-af41-b72b25689195", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "pre-fix",
          hypothesisId: "H2",
          location: "src/app/(shell)/tasks/[eventId]/page.tsx",
          message: "use(params) succeeded",
          data: {
            resolvedType: typeof resolved,
            resolvedCtor: resolved?.constructor?.name,
            resolvedKeys: resolved && typeof resolved === "object" ? Object.keys(resolved) : null,
            eventId,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    } catch (err) {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/39f67edb-5359-4afa-af41-b72b25689195", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "pre-fix",
          hypothesisId: "H1",
          location: "src/app/(shell)/tasks/[eventId]/page.tsx",
          message: "use(params) threw",
          data: {
            errName: (err as any)?.name,
            errMessage: (err as any)?.message,
            errString: String(err),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      throw err;
    }
  } else {
    eventId = paramsAny?.eventId;
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/39f67edb-5359-4afa-af41-b72b25689195", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "post-fix",
        hypothesisId: "H1",
        location: "src/app/(shell)/tasks/[eventId]/page.tsx",
        message: "params is non-thenable; using direct params.eventId",
        data: { eventId },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }

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
