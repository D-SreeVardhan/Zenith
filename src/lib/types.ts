// Priority levels for events and tasks
export type Priority = "high" | "medium" | "low";

// Timeframe presets for streaks
export type TimeframePreset = "week" | "month" | "year" | "custom";

export interface TimeframeConfig {
  preset: TimeframePreset;
  customDays?: number; // Only used when preset is "custom"
}

// Habit entity - daily routines to track
export interface Habit {
  id: string;
  userId?: string;
  title: string;
  createdAt: string; // ISO date string
  active: boolean;
  targetTimeframe: TimeframeConfig;
  completions: string[]; // Array of ISO date strings when habit was completed
}

// Event entity - deadlines, exams, project submissions
export interface Event {
  id: string;
  userId?: string;
  title: string;
  dueAt: string | null; // ISO datetime string, null if no specific due date
  priority: Priority;
  notes: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

// EventTask entity - subtasks for each event
export interface EventTask {
  id: string;
  userId?: string;
  eventId: string;
  title: string;
  done: boolean;
  priority: Priority | null; // Optional priority
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  order: number; // For custom ordering via drag-and-drop
}

// Sort modes for tasks
export type TaskSortMode = "custom" | "date-added-asc" | "date-added-desc" | "priority";

// Activity Log types
export type ActivityAction =
  | "habit_created"
  | "habit_deleted"
  | "habit_completed"
  | "habit_uncompleted"
  | "event_created"
  | "event_deleted"
  | "event_updated"
  | "task_created"
  | "task_deleted"
  | "task_completed"
  | "task_uncompleted";

export interface ActivityLog {
  id: string;
  userId?: string;
  action: ActivityAction;
  entityType: "habit" | "event" | "task";
  entityId: string;
  entityTitle: string;
  timestamp: string; // ISO datetime string
  // Snapshot for undo functionality
  snapshot?: string; // JSON stringified entity data
  canUndo: boolean;
}

// Input types for creating/updating entities
export type CreateHabitInput = Omit<Habit, "id" | "createdAt" | "completions">;
export type UpdateHabitInput = Partial<Omit<Habit, "id" | "createdAt">>;

export type CreateEventInput = Omit<Event, "id" | "createdAt" | "updatedAt">;
export type UpdateEventInput = Partial<Omit<Event, "id" | "createdAt" | "updatedAt">>;

export type CreateEventTaskInput = Omit<EventTask, "id" | "createdAt" | "updatedAt" | "order">;
export type UpdateEventTaskInput = Partial<Omit<EventTask, "id" | "eventId" | "createdAt" | "updatedAt">>;
