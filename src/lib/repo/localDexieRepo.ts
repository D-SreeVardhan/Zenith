import { nanoid } from "nanoid";
import { db } from "./db";
import type { Repository } from "./Repository";
import type {
  Habit,
  Event,
  EventTask,
  ActivityLog,
  CreateHabitInput,
  UpdateHabitInput,
  CreateEventInput,
  UpdateEventInput,
  CreateEventTaskInput,
  UpdateEventTaskInput,
} from "../types";

// Local-first repository implementation using Dexie (IndexedDB)
export const localDexieRepo: Repository = {
  // ========================
  // HABITS
  // ========================
  async getAllHabits(): Promise<Habit[]> {
    return db.habits.toArray();
  },

  async getHabit(id: string): Promise<Habit | undefined> {
    return db.habits.get(id);
  },

  async createHabit(input: CreateHabitInput): Promise<Habit> {
    const habit: Habit = {
      id: nanoid(),
      ...input,
      createdAt: new Date().toISOString(),
      completions: [],
    };
    await db.habits.add(habit);
    return habit;
  },

  async updateHabit(id: string, input: UpdateHabitInput): Promise<Habit> {
    await db.habits.update(id, input);
    const updated = await db.habits.get(id);
    if (!updated) throw new Error(`Habit ${id} not found`);
    return updated;
  },

  async deleteHabit(id: string): Promise<void> {
    await db.habits.delete(id);
  },

  async toggleHabitCompletion(id: string, date: string): Promise<Habit> {
    const habit = await db.habits.get(id);
    if (!habit) throw new Error(`Habit ${id} not found`);

    const dateStr = date.split("T")[0]; // Normalize to date only
    const completions = new Set(habit.completions);

    if (completions.has(dateStr)) {
      completions.delete(dateStr);
    } else {
      completions.add(dateStr);
    }

    const updated: Habit = {
      ...habit,
      completions: Array.from(completions),
    };

    await db.habits.put(updated);
    return updated;
  },

  // ========================
  // EVENTS
  // ========================
  async getAllEvents(): Promise<Event[]> {
    return db.events.toArray();
  },

  async getEvent(id: string): Promise<Event | undefined> {
    return db.events.get(id);
  },

  async createEvent(input: CreateEventInput): Promise<Event> {
    const now = new Date().toISOString();
    const event: Event = {
      id: nanoid(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    await db.events.add(event);
    return event;
  },

  async updateEvent(id: string, input: UpdateEventInput): Promise<Event> {
    await db.events.update(id, {
      ...input,
      updatedAt: new Date().toISOString(),
    });
    const updated = await db.events.get(id);
    if (!updated) throw new Error(`Event ${id} not found`);
    return updated;
  },

  async deleteEvent(id: string): Promise<void> {
    // Delete all tasks associated with this event first
    await db.eventTasks.where("eventId").equals(id).delete();
    await db.events.delete(id);
  },

  // ========================
  // EVENT TASKS
  // ========================
  async getTasksForEvent(eventId: string): Promise<EventTask[]> {
    return db.eventTasks.where("eventId").equals(eventId).toArray();
  },

  async getTask(id: string): Promise<EventTask | undefined> {
    return db.eventTasks.get(id);
  },

  async createTask(input: CreateEventTaskInput): Promise<EventTask> {
    // Get the max order for this event's tasks
    const existingTasks = await db.eventTasks
      .where("eventId")
      .equals(input.eventId)
      .toArray();
    const maxOrder = existingTasks.reduce(
      (max, t) => Math.max(max, t.order),
      -1
    );

    const now = new Date().toISOString();
    const task: EventTask = {
      id: nanoid(),
      ...input,
      createdAt: now,
      updatedAt: now,
      order: maxOrder + 1,
    };
    await db.eventTasks.add(task);
    return task;
  },

  async updateTask(id: string, input: UpdateEventTaskInput): Promise<EventTask> {
    await db.eventTasks.update(id, {
      ...input,
      updatedAt: new Date().toISOString(),
    });
    const updated = await db.eventTasks.get(id);
    if (!updated) throw new Error(`Task ${id} not found`);
    return updated;
  },

  async deleteTask(id: string): Promise<void> {
    await db.eventTasks.delete(id);
  },

  async reorderTasks(eventId: string, taskIds: string[]): Promise<void> {
    // Update each task with its new order
    await db.transaction("rw", db.eventTasks, async () => {
      for (let i = 0; i < taskIds.length; i++) {
        await db.eventTasks.update(taskIds[i], {
          order: i,
          updatedAt: new Date().toISOString(),
        });
      }
    });
  },

  // Restore methods for undo functionality
  async restoreHabit(habit: Habit): Promise<Habit> {
    await db.habits.put(habit);
    return habit;
  },

  async restoreEvent(event: Event): Promise<Event> {
    await db.events.put(event);
    return event;
  },

  async restoreTask(task: EventTask): Promise<EventTask> {
    await db.eventTasks.put(task);
    return task;
  },

  // ========================
  // ACTIVITY LOGS
  // ========================
  async getAllActivityLogs(): Promise<ActivityLog[]> {
    return db.activityLogs.orderBy("timestamp").reverse().toArray();
  },

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return db.activityLogs.orderBy("timestamp").reverse().limit(limit).toArray();
  },

  async createActivityLog(log: ActivityLog): Promise<ActivityLog> {
    await db.activityLogs.add(log);
    return log;
  },

  async deleteActivityLog(id: string): Promise<void> {
    await db.activityLogs.delete(id);
  },

  async clearOldActivityLogs(olderThanDays: number): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const cutoffStr = cutoff.toISOString();
    await db.activityLogs.where("timestamp").below(cutoffStr).delete();
  },
};
