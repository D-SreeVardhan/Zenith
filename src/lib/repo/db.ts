import Dexie, { type EntityTable } from "dexie";
import type { Habit, Event, EventTask, ActivityLog } from "../types";

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

export { db };
