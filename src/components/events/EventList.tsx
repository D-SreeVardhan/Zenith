"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Calendar,
  Clock,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  StickyNote,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { EventEditorDialog } from "./EventEditorDialog";
import { cn, formatDate, formatTime } from "@/lib/utils";
import type { Event, Priority } from "@/lib/types";

type FilterPriority = Priority | "all";
type SortMode = "due-date" | "created" | "priority";

export function EventList() {
  const { events, loadEvents, deleteEvent } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [sortMode, setSortMode] = useState<SortMode>("due-date");

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Filter events
  const filteredEvents =
    filterPriority === "all"
      ? events
      : events.filter((e) => e.priority === filterPriority);

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortMode) {
      case "due-date": {
        if (!a.dueAt && !b.dueAt) return 0;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      case "created":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "priority": {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }
      default:
        return 0;
    }
  });

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this event and all its tasks?")) {
      await deleteEvent(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
  };

  return (
    <div className="space-y-4">
      {/* Header and controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
            className="input w-auto py-1.5 text-sm"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Sort mode */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="input w-auto py-1.5 text-sm"
          >
            <option value="due-date">By due date</option>
            <option value="created">By created</option>
            <option value="priority">By priority</option>
          </select>
        </div>

        <button
          onClick={() => setIsDialogOpen(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>

      {/* Events list */}
      {sortedEvents.length === 0 ? (
        <div className="card px-4 py-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-text-muted" />
          <h3 className="mt-4 text-lg font-medium text-text-primary">
            No events yet
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Create your first event to start tracking deadlines and submissions.
          </p>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="btn-primary mt-4"
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              className="group flex items-start justify-between gap-4 p-4 hover:bg-surface-hover transition-colors"
            >
              <Link
                href={`/tasks/${event.id}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-start gap-3">
                  {/* Priority indicator */}
                  <div
                    className={cn(
                      "mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full",
                      event.priority === "high" && "bg-priority-high",
                      event.priority === "medium" && "bg-priority-medium",
                      event.priority === "low" && "bg-priority-low"
                    )}
                  />

                  <div className="min-w-0 flex-1">
                    {/* Title and priority badge */}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-text-primary truncate">
                        {event.title}
                      </h4>
                      <span
                        className={cn(
                          "flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          event.priority === "high" &&
                            "bg-priority-high-muted text-priority-high",
                          event.priority === "medium" &&
                            "bg-priority-medium-muted text-priority-medium",
                          event.priority === "low" &&
                            "bg-priority-low-muted text-priority-low"
                        )}
                      >
                        {event.priority}
                      </span>
                    </div>

                    {/* Date and time */}
                    {event.dueAt && (
                      <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.dueAt)}
                        </span>
                        {event.dueAt.includes("T") && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(event.dueAt)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Notes indicator */}
                    {event.notes && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-text-muted">
                        <StickyNote className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">
                          {event.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Link
                  href={`/tasks/${event.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors"
                  title="View tasks"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted opacity-0 group-hover:opacity-100 hover:bg-surface-elevated hover:text-text-primary transition-all"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="min-w-[140px] rounded-lg border border-border bg-surface-elevated p-1 shadow-lg animate-scale-in"
                      sideOffset={5}
                      align="end"
                    >
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary outline-none hover:bg-surface-hover"
                        onClick={() => handleEdit(event)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-400 outline-none hover:bg-surface-hover"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event editor dialog */}
      <EventEditorDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        event={editingEvent}
      />
    </div>
  );
}
