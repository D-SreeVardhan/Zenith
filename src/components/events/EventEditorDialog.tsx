"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Event, Priority } from "@/lib/types";

interface EventEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
}

export function EventEditorDialog({
  open,
  onOpenChange,
  event,
}: EventEditorDialogProps) {
  const { createEvent, updateEvent } = useAppStore();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!event;

  // Reset form when dialog opens/closes or event changes
  useEffect(() => {
    if (open) {
      if (event) {
        setTitle(event.title);
        setPriority(event.priority);
        if (event.dueAt) {
          const [date, time] = event.dueAt.split("T");
          setDueDate(date);
          setDueTime(time?.slice(0, 5) || "");
        } else {
          setDueDate("");
          setDueTime("");
        }
        setNotes(event.notes);
      } else {
        setTitle("");
        setPriority("medium");
        setDueDate("");
        setDueTime("");
        setNotes("");
      }
    }
  }, [open, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // Construct dueAt from date and time
      let dueAt: string | null = null;
      if (dueDate) {
        dueAt = dueTime ? `${dueDate}T${dueTime}:00` : dueDate;
      }

      // Close immediately on submit (even if network is slow).
      onOpenChange(false);

      if (isEditing) {
        await updateEvent(event.id, {
          title: title.trim(),
          priority,
          dueAt,
          notes: notes.trim(),
        });
      } else {
        await createEvent({
          title: title.trim(),
          priority,
          dueAt,
          notes: notes.trim(),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-base/80 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface p-4 sm:p-6 shadow-xl animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              {isEditing ? "Edit Event" : "New Event"}
            </Dialog.Title>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="label">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Final Exam, Project Submission..."
                className="input"
                autoFocus
                required
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="label">Priority</label>
              <div className="flex gap-2">
                {(["high", "medium", "low"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors",
                      priority === p
                        ? p === "high"
                          ? "border-priority-high bg-priority-high-muted text-priority-high"
                          : p === "medium"
                          ? "border-priority-medium bg-priority-medium-muted text-priority-medium"
                          : "border-priority-low bg-priority-low-muted text-priority-low"
                        : "border-border text-text-secondary hover:bg-surface-hover"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date and time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="dueDate" className="label">
                  Due Date
                </label>
                <DatePicker value={dueDate} onChange={setDueDate} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="dueTime" className="label">
                  Time (optional)
                </label>
                <input
                  id="dueTime"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="input"
                  disabled={!dueDate}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label htmlFor="notes" className="label">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any relevant details..."
                rows={3}
                className="input resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="btn-secondary w-full sm:w-auto">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="btn-primary disabled:opacity-50 w-full sm:w-auto"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Create Event"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
