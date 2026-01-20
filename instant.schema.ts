import { i } from "@instantdb/react";

// InstantDB schema for Daily Tracker (multi-user).
//
// We keep the data model close to the existing local Dexie model, but add a
// `userId` field to every entity so rules can scope access to `auth.id`.
const _schema = i.schema({
  entities: {
    habits: i.entity({
      userId: i.string().indexed(),
      title: i.string(),
      createdAt: i.string().indexed(), // ISO datetime
      active: i.boolean(),
      targetTimeframe: i.json(),
      completions: i.json(), // string[] (YYYY-MM-DD)
      // Weekly tracking (client derives + updates)
      weekStartDate: i.string().optional(), // YYYY-MM-DD (local Monday)
      weeklyCompletionCount: i.number().optional(),
      // Optional per-habit weekly schedule (0=Mon .. 6=Sun)
      scheduledWeekdays: i.json().optional(), // number[]
    }),

    events: i.entity({
      userId: i.string().indexed(),
      title: i.string(),
      dueAt: i.string().optional(), // ISO datetime or null-ish
      priority: i.string(),
      notes: i.string(),
      createdAt: i.string(), // ISO datetime
      updatedAt: i.string(), // ISO datetime
    }),

    eventTasks: i.entity({
      userId: i.string().indexed(),
      eventId: i.string().indexed(),
      title: i.string(),
      done: i.boolean(),
      priority: i.string().optional(), // Priority | null
      createdAt: i.string(), // ISO datetime
      updatedAt: i.string(), // ISO datetime
      order: i.number(),
    }),

    activityLogs: i.entity({
      userId: i.string().indexed(),
      action: i.string(),
      entityType: i.string(),
      entityId: i.string().indexed(),
      entityTitle: i.string(),
      timestamp: i.string().indexed(), // ISO datetime
      snapshot: i.string().optional(),
      canUndo: i.boolean(),
    }),
  },
});

type _AppSchema = typeof _schema;
export interface AppSchema extends _AppSchema {}

const schema: AppSchema = _schema;
export default schema;

