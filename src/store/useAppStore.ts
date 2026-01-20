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
import { localDexieRepo } from "@/lib/repo/localDexieRepo";
import { getWeekStartDate, normalizeScheduledWeekdays, toLocalYmd } from "@/lib/utils";

function dateKeyToMonDayIndex(dateKey: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
  return (dt.getDay() + 6) % 7; // 0..6 where 0=Mon
}

function parseLocalYmd(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function getWeekRangeKeys(mondayKey: string): { mondayKey: string; sundayKey: string } {
  const monday = parseLocalYmd(mondayKey);
  if (!monday) return { mondayKey, sundayKey: mondayKey };
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { mondayKey, sundayKey: toLocalYmd(sunday) };
}

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
      const habits = await localDexieRepo.getAllHabits();
      const currentWeekStart = getWeekStartDate(new Date());
      const { mondayKey, sundayKey } = getWeekRangeKeys(currentWeekStart);

      const normalized = await Promise.all(
        habits.map(async (h) => {
          const completions = Array.isArray(h.completions) ? h.completions : [];
          const schedule = new Set(normalizeScheduledWeekdays(h.scheduledWeekdays));
          const weeklyCompletionCount = completions.filter((d) => {
            if (!(d >= mondayKey && d <= sundayKey)) return false;
            const idx = dateKeyToMonDayIndex(d);
            return idx !== null && schedule.has(idx);
          }).length;

          const needsWeekStart = h.weekStartDate !== currentWeekStart;
          const needsCount = h.weeklyCompletionCount !== weeklyCompletionCount;
          const needsInit =
            typeof h.weekStartDate !== "string" ||
            typeof h.weeklyCompletionCount !== "number" ||
            !Array.isArray(h.scheduledWeekdays);

          if (needsInit || needsWeekStart || needsCount) {
            return await localDexieRepo.updateHabit(h.id, {
              weekStartDate: currentWeekStart,
              weeklyCompletionCount,
              scheduledWeekdays: normalizeScheduledWeekdays(h.scheduledWeekdays),
            });
          }
          return h;
        })
      );

      set({ habits: normalized });
    } finally {
      set({ isLoading: false });
    }
  },

  createHabit: async (input) => {
    const habit = await localDexieRepo.createHabit(input);
    set((state) => ({ habits: [...state.habits, habit] }));

    // Log activity
    const log = createActivityLogEntry("habit_created", "habit", habit.id, habit.title, habit);
    await localDexieRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));

    return habit;
  },

  updateHabit: async (id, input) => {
    const updated = await localDexieRepo.updateHabit(id, input);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? updated : h)),
    }));
  },

  deleteHabit: async (id) => {
    // Get habit before deleting for undo snapshot
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;

    await localDexieRepo.deleteHabit(id);
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    }));

    // Log activity with snapshot for undo
    const log = createActivityLogEntry("habit_deleted", "habit", id, habit.title, habit, true);
    await localDexieRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
  },

  toggleHabitCompletion: async (id, date) => {
    const habit = get().habits.find((h) => h.id === id);
    const wasCompleted = habit?.completions.includes(date.split("T")[0]);

    const updated = await localDexieRepo.toggleHabitCompletion(id, date);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? updated : h)),
    }));

    // Log activity
    const action = wasCompleted ? "habit_uncompleted" : "habit_completed";
    const log = createActivityLogEntry(action, "habit", id, updated.title, { date }, false);
    await localDexieRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
  },

  // ========================
  // EVENTS
  // ========================
  loadEvents: async () => {
    set({ isLoading: true });
    try {
      const events = await localDexieRepo.getAllEvents();
      set({ events });
    } finally {
      set({ isLoading: false });
    }
  },

  createEvent: async (input) => {
    const event = await localDexieRepo.createEvent(input);
    set((state) => ({ events: [...state.events, event] }));

    // Log activity
    const log = createActivityLogEntry("event_created", "event", event.id, event.title, event);
    await localDexieRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));

    return event;
  },

  updateEvent: async (id, input) => {
    const updated = await localDexieRepo.updateEvent(id, input);
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? updated : e)),
    }));

    // Log activity (no undo for updates)
    const log = createActivityLogEntry("event_updated", "event", id, updated.title, null, false);
    await localDexieRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
  },

  deleteEvent: async (id) => {
    // Get event and tasks before deleting for undo snapshot
    const event = get().events.find((e) => e.id === id);
    const tasks = get().eventTasks[id] || [];
    if (!event) return;

    await localDexieRepo.deleteEvent(id);
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      eventTasks: Object.fromEntries(
        Object.entries(state.eventTasks).filter(([key]) => key !== id)
      ),
    }));

    // Log activity with snapshot for undo
    const log = createActivityLogEntry("event_deleted", "event", id, event.title, { event, tasks }, true);
    await localDexieRepo.createActivityLog(log);
    set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
  },

  // ========================
  // TASKS
  // ========================
  loadTasksForEvent: async (eventId) => {
    const tasks = await localDexieRepo.getTasksForEvent(eventId);
    set((state) => ({
      eventTasks: { ...state.eventTasks, [eventId]: tasks },
    }));
  },

  createTask: async (input) => {
    const task = await localDexieRepo.createTask(input);
    set((state) => ({
      eventTasks: {
        ...state.eventTasks,
        [input.eventId]: [...(state.eventTasks[input.eventId] || []), task],
      },
    }));

    // Log activity
    const log = createActivityLogEntry("task_created", "task", task.id, task.title, task);
    await localDexieRepo.createActivityLog(log);
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

    const updated = await localDexieRepo.updateTask(id, input);
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
      await localDexieRepo.createActivityLog(log);
      set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
    }
  },

  deleteTask: async (id, eventId) => {
    // Get task before deleting for undo snapshot
    const task = (get().eventTasks[eventId] || []).find((t) => t.id === id);

    await localDexieRepo.deleteTask(id);
    set((state) => ({
      eventTasks: {
        ...state.eventTasks,
        [eventId]: (state.eventTasks[eventId] || []).filter((t) => t.id !== id),
      },
    }));

    // Log activity with snapshot for undo
    if (task) {
      const log = createActivityLogEntry("task_deleted", "task", id, task.title, task, true);
      await localDexieRepo.createActivityLog(log);
      set((state) => ({ activityLogs: [log, ...state.activityLogs] }));
    }
  },

  reorderTasks: async (eventId, taskIds) => {
    await localDexieRepo.reorderTasks(eventId, taskIds);
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
    const logs = await localDexieRepo.getRecentActivityLogs(100);
    set({ activityLogs: logs });
  },

  undoActivity: async (logId) => {
    const log = get().activityLogs.find((l) => l.id === logId);
    if (!log || !log.canUndo || !log.snapshot) return;

    const snapshot = JSON.parse(log.snapshot);

    switch (log.action) {
      case "habit_deleted": {
        const habit = snapshot as Habit;
        const restored = await localDexieRepo.restoreHabit(habit);
        set((state) => ({ habits: [...state.habits, restored] }));
        break;
      }
      case "event_deleted": {
        const { event, tasks } = snapshot as { event: Event; tasks: EventTask[] };
        const restoredEvent = await localDexieRepo.restoreEvent(event);
        // Restore all tasks
        for (const task of tasks) {
          await localDexieRepo.restoreTask(task);
        }
        set((state) => ({
          events: [...state.events, restoredEvent],
          eventTasks: { ...state.eventTasks, [event.id]: tasks },
        }));
        break;
      }
      case "task_deleted": {
        const task = snapshot as EventTask;
        const restored = await localDexieRepo.restoreTask(task);
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
        await localDexieRepo.deleteHabit(habit.id);
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== habit.id),
        }));
        break;
      }
      case "event_created": {
        const event = snapshot as Event;
        await localDexieRepo.deleteEvent(event.id);
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
        await localDexieRepo.deleteTask(task.id);
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
    await localDexieRepo.deleteActivityLog(logId);
    set((state) => ({
      activityLogs: state.activityLogs.filter((l) => l.id !== logId),
    }));
  },

  clearActivityLog: async (logId) => {
    await localDexieRepo.deleteActivityLog(logId);
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
