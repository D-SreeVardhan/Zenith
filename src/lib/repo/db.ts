import Dexie, { type EntityTable } from "dexie";
import type { Habit, Event, EventTask, ActivityLog } from "../types";

function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLocalMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  // Use midday local to avoid timezone rollovers.
  d.setHours(12, 0, 0, 0);
  return d;
}

// Define the database schema
const db = new Dexie("DailyTrackerDB") as Dexie & {
  habits: EntityTable<Habit, "id">;
  events: EntityTable<Event, "id">;
  eventTasks: EntityTable<EventTask, "id">;
  activityLogs: EntityTable<ActivityLog, "id">;
};

// Schema version 2 - added activity logs
db.version(1).stores({
  habits: "id, title, createdAt, active",
  events: "id, title, dueAt, priority, createdAt",
  eventTasks: "id, eventId, done, priority, createdAt, order",
});

db.version(2).stores({
  habits: "id, title, createdAt, active",
  events: "id, title, dueAt, priority, createdAt",
  eventTasks: "id, eventId, done, priority, createdAt, order",
  activityLogs: "id, action, entityType, entityId, timestamp",
});

// Schema version 3 - add weekly habit tracking fields
db.version(3)
  .stores({
    habits: "id, title, createdAt, active, weekStartDate, weeklyCompletionCount",
    events: "id, title, dueAt, priority, createdAt",
    eventTasks: "id, eventId, done, priority, createdAt, order",
    activityLogs: "id, action, entityType, entityId, timestamp",
  })
  .upgrade(async (tx) => {
    const now = new Date();
    const monday = getLocalMonday(now);
    const mondayKey = toLocalYmd(monday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayKey = toLocalYmd(sunday);

    await tx
      .table("habits")
      .toCollection()
      .modify((habit: any) => {
        if (!habit.weekStartDate || typeof habit.weekStartDate !== "string") {
          habit.weekStartDate = mondayKey;
        }

        // Derive current-week count from stored completions if missing/invalid.
        if (typeof habit.weeklyCompletionCount !== "number") {
          const unique = new Set<string>(
            Array.isArray(habit.completions) ? habit.completions : []
          );
          habit.weeklyCompletionCount = Array.from(unique).filter(
            (d) => typeof d === "string" && d >= mondayKey && d <= sundayKey
          ).length;
        }
      });
  });

// Schema version 4 - add scheduled weekdays (weekly recurring schedules)
db.version(4)
  .stores({
    habits: "id, title, createdAt, active, weekStartDate, weeklyCompletionCount",
    events: "id, title, dueAt, priority, createdAt",
    eventTasks: "id, eventId, done, priority, createdAt, order",
    activityLogs: "id, action, entityType, entityId, timestamp",
  })
  .upgrade(async (tx) => {
    await tx
      .table("habits")
      .toCollection()
      .modify((habit: any) => {
        if (!Array.isArray(habit.scheduledWeekdays)) {
          habit.scheduledWeekdays = [0, 1, 2, 3, 4, 5, 6]; // default: all days
        }
      });
  });

export { db };
