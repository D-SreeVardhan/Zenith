"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  Habit,
  Event,
  EventTask,
  ActivityLog,
  ActivityAction,
  CreateHabitInput,
  UpdateHabitInput,
  CreateEventInput,
  UpdateEventInput,
  CreateEventTaskInput,
  UpdateEventTaskInput,
  TaskSortMode,
} from "@/lib/types";
import { instantDbRepo } from "@/lib/repo/instantDbRepo";

interface AppState {
  // Data
  habits: Habit[];
  events: Event[];
  eventTasks: Record<string, EventTask[]>; // eventId -> tasks
  activityLogs: ActivityLog[];

  // UI State
  isLoading: boolean;
  taskSortMode: TaskSortMode;

  // Actions - Habits
  loadHabits: () => Promise<void>;
  createHabit: (input: CreateHabitInput) => Promise<Habit>;
  updateHabit: (id: string, input: UpdateHabitInput) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitCompletion: (id: string, date: string) => Promise<void>;

  // Actions - Events
  loadEvents: () => Promise<void>;
  createEvent: (input: CreateEventInput) => Promise<Event>;
  updateEvent: (id: string, input: UpdateEventInput) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Actions - Tasks
  loadTasksForEvent: (eventId: string) => Promise<void>;
  createTask: (input: CreateEventTaskInput) => Promise<EventTask>;
  updateTask: (id: string, input: UpdateEventTaskInput) => Promise<void>;
  deleteTask: (id: string, eventId: string) => Promise<void>;
  reorderTasks: (eventId: string, taskIds: string[]) => Promise<void>;
  setTaskSortMode: (mode: TaskSortMode) => void;

  // Actions - Activity Log
  loadActivityLogs: () => Promise<void>;
  undoActivity: (logId: string) => Promise<void>;
  clearActivityLog: (logId: string) => Promise<void>;

  // Utilities
  getTasksForEvent: (eventId: string) => EventTask[];
  getSortedTasks: (eventId: string) => EventTask[];
}

// Helper to create activity log entries
function createActivityLogEntry(
  action: ActivityAction,
  entityType: "habit" | "event" | "task",
  entityId: string,
  entityTitle: string,
  snapshot?: unknown,
  canUndo = true
): ActivityLog {
  return {
    id: nanoid(),
    action,
    entityType,
    entityId,
    entityTitle,
    timestamp: new Date().toISOString(),
    snapshot: snapshot ? JSON.stringify(snapshot) : undefined,
    canUndo,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  habits: [],
  events: [],
  eventTasks: {},
  activityLogs: [],
  isLoading: false,
  taskSortMode: "custom",

  // ========================
  // HABITS
  // ========================
  loadHabits: async () => {
    set({ isLoading: true });
    try {
      const habits = await instantDbRepo.getAllHabits();
      set({ habits });
    } finally {
      set({ isLoading: false });
    }
  },

  createHabit: async (input) => {
    const habit = await instantDbRepo.createHabit(input);
    set((state) => ({ habits: [...state.habits, habit] }));

    // Log activity
    const log = createActivityLogEntry("habit_created", "habit", habit.id, habit.title, habit);
    await instantDbRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));

    return habit;
  },

  updateHabit: async (id, input) => {
    const updated = await instantDbRepo.updateHabit(id, input);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? updated : h)),
    }));
  },

  deleteHabit: async (id) => {
    // Get habit before deleting for undo snapshot
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;

    await instantDbRepo.deleteHabit(id);
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    }));

    // Log activity with snapshot for undo
    const log = createActivityLogEntry("habit_deleted", "habit", id, habit.title, habit, true);
    await instantDbRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
  },

  toggleHabitCompletion: async (id, date) => {
    const habit = get().habits.find((h) => h.id === id);
    const wasCompleted = habit?.completions.includes(date.split("T")[0]);

    const updated = await instantDbRepo.toggleHabitCompletion(id, date);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? updated : h)),
    }));

    // Log activity
    const action = wasCompleted ? "habit_uncompleted" : "habit_completed";
    const log = createActivityLogEntry(action, "habit", id, updated.title, { date }, false);
    await instantDbRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
  },

  // ========================
  // EVENTS
  // ========================
  loadEvents: async () => {
    set({ isLoading: true });
    try {
      const events = await instantDbRepo.getAllEvents();
      set({ events });
    } finally {
      set({ isLoading: false });
    }
  },

  createEvent: async (input) => {
    const event = await instantDbRepo.createEvent(input);
    set((state) => ({ events: [...state.events, event] }));

    // Log activity
    const log = createActivityLogEntry("event_created", "event", event.id, event.title, event);
    await instantDbRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));

    return event;
  },

  updateEvent: async (id, input) => {
    const updated = await instantDbRepo.updateEvent(id, input);
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? updated : e)),
    }));

    // Log activity (no undo for updates)
    const log = createActivityLogEntry("event_updated", "event", id, updated.title, null, false);
    await instantDbRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
  },

  deleteEvent: async (id) => {
    // Get event and tasks before deleting for undo snapshot
    const event = get().events.find((e) => e.id === id);
    const tasks = get().eventTasks[id] || [];
    if (!event) return;

    await instantDbRepo.deleteEvent(id);
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      eventTasks: Object.fromEntries(
        Object.entries(state.eventTasks).filter(([key]) => key !== id)
      ),
    }));

    // Log activity with snapshot for undo
    const log = createActivityLogEntry("event_deleted", "event", id, event.title, { event, tasks }, true);
    await instantDbRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
  },

  // ========================
  // TASKS
  // ========================
  loadTasksForEvent: async (eventId) => {
    const tasks = await instantDbRepo.getTasksForEvent(eventId);
    set((state) => ({
      eventTasks: { ...state.eventTasks, [eventId]: tasks },
    }));
  },

  createTask: async (input) => {
    const task = await instantDbRepo.createTask(input);
    set((state) => ({
      eventTasks: {
        ...state.eventTasks,
        [input.eventId]: [...(state.eventTasks[input.eventId] || []), task],
      },
    }));

    // Log activity
    const log = createActivityLogEntry("task_created", "task", task.id, task.title, task);
    await instantDbRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));

    return task;
  },

  updateTask: async (id, input) => {
    // Find task before update to check completion status
    let taskBefore: EventTask | undefined;
    for (const tasks of Object.values(get().eventTasks)) {
      taskBefore = tasks.find((t) => t.id === id);
      if (taskBefore) break;
    }

    const updated = await instantDbRepo.updateTask(id, input);
    set((state) => {
      const newEventTasks = { ...state.eventTasks };
      for (const eventId of Object.keys(newEventTasks)) {
        newEventTasks[eventId] = newEventTasks[eventId].map((t) =>
          t.id === id ? updated : t
        );
      }
      return { eventTasks: newEventTasks };
    });

    // Log completion status changes
    if (input.done !== undefined && taskBefore && input.done !== taskBefore.done) {
      const action = input.done ? "task_completed" : "task_uncompleted";
      const log = createActivityLogEntry(action, "task", id, updated.title, null, false);
      await instantDbRepo.createActivityLog(log);
      set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
    }
  },

  deleteTask: async (id, eventId) => {
    // Get task before deleting for undo snapshot
    const task = (get().eventTasks[eventId] || []).find((t) => t.id === id);

    await instantDbRepo.deleteTask(id);
    set((state) => ({
      eventTasks: {
        ...state.eventTasks,
        [eventId]: (state.eventTasks[eventId] || []).filter((t) => t.id !== id),
      },
    }));

    // Log activity with snapshot for undo
    if (task) {
      const log = createActivityLogEntry("task_deleted", "task", id, task.title, task, true);
      await instantDbRepo.createActivityLog(log);
      set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
    }
  },

  reorderTasks: async (eventId, taskIds) => {
    await instantDbRepo.reorderTasks(eventId, taskIds);
    // Update local state with new order
    set((state) => {
      const tasks = state.eventTasks[eventId] || [];
      const taskMap = new Map(tasks.map((t) => [t.id, t]));
      const reordered = taskIds
        .map((id, index) => {
          const task = taskMap.get(id);
          return task ? { ...task, order: index } : null;
        })
        .filter(Boolean) as EventTask[];
      return {
        eventTasks: { ...state.eventTasks, [eventId]: reordered },
      };
    });
  },

  setTaskSortMode: (mode) => {
    set({ taskSortMode: mode });
  },

  // ========================
  // ACTIVITY LOGS
  // ========================
  loadActivityLogs: async () => {
    const logs = await instantDbRepo.getRecentActivityLogs(100);
    set({ activityLogs: logs });
  },

  undoActivity: async (logId) => {
    const log = get().activityLogs.find((l) => l.id === logId);
    if (!log || !log.canUndo || !log.snapshot) return;

    const snapshot = JSON.parse(log.snapshot);

    switch (log.action) {
      case "habit_deleted": {
        const habit = snapshot as Habit;
        const restored = await instantDbRepo.restoreHabit(habit);
        set((state) => ({ habits: [...state.habits, restored] }));
        break;
      }
      case "event_deleted": {
        const { event, tasks } = snapshot as { event: Event; tasks: EventTask[] };
        const restoredEvent = await instantDbRepo.restoreEvent(event);
        // Restore all tasks
        for (const task of tasks) {
          await instantDbRepo.restoreTask(task);
        }
        set((state) => ({
          events: [...state.events, restoredEvent],
          eventTasks: { ...state.eventTasks, [event.id]: tasks },
        }));
        break;
      }
      case "task_deleted": {
        const task = snapshot as EventTask;
        const restored = await instantDbRepo.restoreTask(task);
        set((state) => ({
          eventTasks: {
            ...state.eventTasks,
            [task.eventId]: [...(state.eventTasks[task.eventId] || []), restored],
          },
        }));
        break;
      }
      case "habit_created": {
        const habit = snapshot as Habit;
        await instantDbRepo.deleteHabit(habit.id);
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== habit.id),
        }));
        break;
      }
      case "event_created": {
        const event = snapshot as Event;
        await instantDbRepo.deleteEvent(event.id);
        set((state) => ({
          events: state.events.filter((e) => e.id !== event.id),
          eventTasks: Object.fromEntries(
            Object.entries(state.eventTasks).filter(([key]) => key !== event.id)
          ),
        }));
        break;
      }
      case "task_created": {
        const task = snapshot as EventTask;
        await instantDbRepo.deleteTask(task.id);
        set((state) => ({
          eventTasks: {
            ...state.eventTasks,
            [task.eventId]: (state.eventTasks[task.eventId] || []).filter((t) => t.id !== task.id),
          },
        }));
        break;
      }
    }

    // Remove the log entry after undo
    await instantDbRepo.deleteActivityLog(logId);
    set((state) => ({
      activityLogs: state.activityLogs.filter((l) => l.id !== logId),
    }));
  },

  clearActivityLog: async (logId) => {
    await instantDbRepo.deleteActivityLog(logId);
    set((state) => ({
      activityLogs: state.activityLogs.filter((l) => l.id !== logId),
    }));
  },

  // ========================
  // UTILITIES
  // ========================
  getTasksForEvent: (eventId) => {
    return get().eventTasks[eventId] || [];
  },

  getSortedTasks: (eventId) => {
    const tasks = get().eventTasks[eventId] || [];
    const mode = get().taskSortMode;

    switch (mode) {
      case "custom":
        return [...tasks].sort((a, b) => a.order - b.order);
      case "date-added-asc":
        return [...tasks].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "date-added-desc":
        return [...tasks].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "priority": {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return [...tasks].sort((a, b) => {
          const aPriority = a.priority ? priorityOrder[a.priority] : 3;
          const bPriority = b.priority ? priorityOrder[b.priority] : 3;
          return aPriority - bPriority;
        });
      }
      default:
        return tasks;
    }
  },
}));
