"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Trash2, MoreVertical } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { EventTask, Priority } from "@/lib/types";

interface TaskListDndProps {
  eventId: string;
  tasks: EventTask[];
  isDragEnabled: boolean;
}

interface SortableTaskItemProps {
  task: EventTask;
  isDragEnabled: boolean;
}

function SortableTaskItem({ task, isDragEnabled }: SortableTaskItemProps) {
  const { updateTask, deleteTask } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !isDragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const handleToggleDone = async () => {
    await updateTask(task.id, { done: !task.done });
  };

  const handleDelete = async () => {
    await deleteTask(task.id, task.eventId);
  };

  const handleSaveEdit = async () => {
    if (editTitle.trim() && editTitle !== task.title) {
      await updateTask(task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handlePriorityChange = async (priority: Priority | null) => {
    await updateTask(task.id, { priority });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors will-change-transform",
        isDragging && "opacity-60 shadow-lg",
        task.done && "opacity-60"
      )}
    >
      {/* Drag handle */}
      {isDragEnabled && (
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 touch-none cursor-grab text-text-muted hover:text-text-secondary active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Checkbox */}
      <button
        onClick={handleToggleDone}
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all",
          task.done
            ? "border-success bg-success-muted text-success"
            : "border-border hover:border-text-muted"
        )}
        aria-label={task.done ? "Mark as incomplete" : "Mark as complete"}
      >
        {task.done && <Check className="h-3 w-3" />}
      </button>

      {/* Task title */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") {
                setEditTitle(task.title);
                setIsEditing(false);
              }
            }}
            className="input py-1 text-sm"
            autoFocus
          />
        ) : (
          <span
            className={cn(
              "text-sm cursor-pointer",
              task.done
                ? "text-text-muted line-through"
                : "text-text-primary"
            )}
            onClick={() => setIsEditing(true)}
          >
            {task.title}
          </span>
        )}
      </div>

      {/* Priority badge */}
      {task.priority && (
        <span
          className={cn(
            "flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            task.priority === "high" &&
              "bg-priority-high-muted text-priority-high",
            task.priority === "medium" &&
              "bg-priority-medium-muted text-priority-medium",
            task.priority === "low" &&
              "bg-priority-low-muted text-priority-low"
          )}
        >
          {task.priority}
        </span>
      )}

      {/* Actions */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-text-muted opacity-0 group-hover:opacity-100 hover:bg-surface-hover hover:text-text-primary transition-all"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[160px] rounded-lg border border-border bg-surface-elevated p-1 shadow-lg animate-scale-in"
            sideOffset={5}
            align="end"
          >
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary outline-none hover:bg-surface-hover">
                Set priority
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="min-w-[120px] rounded-lg border border-border bg-surface-elevated p-1 shadow-lg animate-scale-in"
                  sideOffset={5}
                >
                  {([null, "high", "medium", "low"] as (Priority | null)[]).map(
                    (p) => (
                      <DropdownMenu.Item
                        key={p ?? "none"}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
                          task.priority === p
                            ? "bg-surface-hover text-text-primary"
                            : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                        )}
                        onClick={() => handlePriorityChange(p)}
                      >
                        {p ? (
                          <>
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                p === "high" && "bg-priority-high",
                                p === "medium" && "bg-priority-medium",
                                p === "low" && "bg-priority-low"
                              )}
                            />
                            <span className="capitalize">{p}</span>
                          </>
                        ) : (
                          "None"
                        )}
                      </DropdownMenu.Item>
                    )
                  )}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-400 outline-none hover:bg-surface-hover"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

export function TaskListDnd({ eventId, tasks, isDragEnabled }: TaskListDndProps) {
  const { reorderTasks } = useAppStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      const newOrder = arrayMove(tasks, oldIndex, newIndex);
      const taskIds = newOrder.map((t) => t.id);

      await reorderTasks(eventId, taskIds);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              isDragEnabled={isDragEnabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
