import { i } from "@instantdb/react";

// InstantDB schema for Daily Tracker (multi-user).
//
// We keep the data model close to the existing local Dexie model, but add a
// `userId` field to every entity so rules can scope access to `auth.id`.
const _schema = i.schema({
  entities: {
    habits: i.entity({
      userId: i.string().indexed(),
      userEmail: i.string().optional(),
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
      // Completion mode: strict blocks past/future days, flexible allows any day in week view
      completionMode: i.string().optional(), // "strict" | "flexible"
    }),

    events: i.entity({
      userId: i.string().indexed(),
      userEmail: i.string().optional(),
      title: i.string(),
      dueAt: i.string().optional(), // ISO datetime or null-ish
      priority: i.string(),
      notes: i.string(),
      createdAt: i.string(), // ISO datetime
      updatedAt: i.string(), // ISO datetime
    }),

    eventTasks: i.entity({
      userId: i.string().indexed(),
      userEmail: i.string().optional(),
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
      userEmail: i.string().optional(),
      action: i.string(),
      entityType: i.string(),
      entityId: i.string().indexed(),
      entityTitle: i.string(),
      timestamp: i.string().indexed(), // ISO datetime
      snapshot: i.string().optional(),
      canUndo: i.boolean(),
    }),

    profiles: i.entity({
      userId: i.string().indexed(),
      userEmail: i.string().optional(),
      username: i.string().optional(),
      avatarUrl: i.string().optional(),
      // Theme settings (hex strings like "#c9a962")
      themePrimary: i.string().optional(),
      themeAccent: i.string().optional(),
      themeMode: i.string().optional(), // "dark" | "light"
      timeFormat: i.string().optional(), // "12h" | "24h"
      timeFont: i.string().optional(), // "system" | "mono" | "serif" | "rounded"
      updatedAt: i.string().optional(), // ISO datetime
    }),
  },
});

type _AppSchema = typeof _schema;
export interface AppSchema extends _AppSchema {}

const schema: AppSchema = _schema;
export default schema;

