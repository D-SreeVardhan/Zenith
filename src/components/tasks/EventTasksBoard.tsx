"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowUpDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { TaskListDnd } from "./TaskListDnd";
import type { TaskSortMode, Priority } from "@/lib/types";

interface EventTasksBoardProps {
  eventId: string;
}

const sortModeLabels: Record<TaskSortMode, string> = {
  custom: "Custom order",
  "date-added-asc": "Oldest first",
  "date-added-desc": "Newest first",
  priority: "By priority",
};

export function EventTasksBoard({ eventId }: EventTasksBoardProps) {
  const {
    loadTasksForEvent,
    createTask,
    taskSortMode,
    setTaskSortMode,
    getSortedTasks,
  } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority | null>(null);

  useEffect(() => {
    loadTasksForEvent(eventId);
  }, [eventId, loadTasksForEvent]);

  const tasks = getSortedTasks(eventId);
  const completedCount = tasks.filter((t) => t.done).length;

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    const payload = {
      eventId,
      title: newTaskTitle.trim(),
      done: false,
      priority: newTaskPriority,
    };

    // Close immediately on submit (even if network is slow).
    setNewTaskTitle("");
    setNewTaskPriority(null);
    setIsAdding(false);

    try {
      await createTask(payload);
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with sort and add controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-medium text-text-secondary">Tasks</h4>
          {tasks.length > 0 && (
            <span className="text-xs text-text-muted">
              {completedCount}/{tasks.length} completed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="btn-ghost inline-flex items-center gap-1.5 text-xs">
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortModeLabels[taskSortMode]}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[160px] rounded-lg border border-border bg-surface-elevated p-1 shadow-lg animate-scale-in"
                sideOffset={5}
                align="end"
              >
                {(Object.keys(sortModeLabels) as TaskSortMode[]).map((mode) => (
                  <DropdownMenu.Item
                    key={mode}
                    className={`flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors ${
                      taskSortMode === mode
                        ? "bg-accent-muted text-accent"
                        : "text-text-primary hover:bg-surface-hover"
                    }`}
                    onClick={() => setTaskSortMode(mode)}
                  >
                    {sortModeLabels[mode]}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <button
            onClick={() => {
              setIsAdding(true);
            }}
            className="btn-primary inline-flex items-center gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Add task form */}
      {isAdding && (
        <div className="card p-4 space-y-3 animate-slide-in-up">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task description..."
            className="input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTask();
              if (e.key === "Escape") setIsAdding(false);
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Priority:</span>
              {([null, "high", "medium", "low"] as (Priority | null)[]).map(
                (p) => (
                  <button
                    key={p ?? "none"}
                    type="button"
                    onClick={() => setNewTaskPriority(p)}
                    className={`rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors ${
                      newTaskPriority === p
                        ? p === "high"
                          ? "bg-priority-high-muted text-priority-high"
                          : p === "medium"
                          ? "bg-priority-medium-muted text-priority-medium"
                          : p === "low"
                          ? "bg-priority-low-muted text-priority-low"
                          : "bg-surface-elevated text-text-primary"
                        : "text-text-muted hover:bg-surface-hover"
                    }`}
                  >
                    {p ?? "None"}
                  </button>
                )
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="btn-primary text-xs disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks list with drag and drop */}
      {tasks.length === 0 && !isAdding ? (
        <div className="card px-4 py-8 text-center">
          <p className="text-sm text-text-muted">No tasks yet.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-2 text-sm text-accent hover:underline"
          >
            Add your first task
          </button>
        </div>
      ) : (
        <TaskListDnd
          eventId={eventId}
          tasks={tasks}
          isDragEnabled={taskSortMode === "custom"}
        />
      )}
    </div>
  );
}
