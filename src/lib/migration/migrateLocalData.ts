"use client";

import { instantDb } from "@/lib/instantdb";
import { localDexieRepo } from "@/lib/repo/localDexieRepo";
import type { ActivityLog, Event, EventTask, Habit } from "@/lib/types";

const MIGRATION_KEY_PREFIX = "dt.instant.migrated.v1.";

async function transactInBatches(steps: unknown[], batchSize = 100) {
  for (let i = 0; i < steps.length; i += batchSize) {
    // eslint-disable-next-line no-await-in-loop
    await instantDb.transact(steps.slice(i, i + batchSize) as never);
  }
}

export async function migrateLocalDataToInstant(userId: string) {
  if (typeof window === "undefined") return;

  const key = `${MIGRATION_KEY_PREFIX}${userId}`;
  if (localStorage.getItem(key) === "1") return;

  // If the user already has data in InstantDB, don't duplicate.
  const existing = await instantDb.queryOnce({
    habits: { $: { where: { userId }, limit: 1 } },
  });
  if ((existing.data.habits?.length ?? 0) > 0) {
    localStorage.setItem(key, "1");
    return;
  }

  const [habits, events, logs] = await Promise.all([
    localDexieRepo.getAllHabits(),
    localDexieRepo.getAllEvents(),
    localDexieRepo.getRecentActivityLogs(1000),
  ]);

  const tasksByEventId: Record<string, EventTask[]> = {};
  await Promise.all(
    events.map(async (e) => {
      const tasks = await localDexieRepo.getTasksForEvent(e.id);
      tasksByEventId[e.id] = tasks;
    })
  );

  const total =
    habits.length +
    events.length +
    Object.values(tasksByEventId).reduce((sum, t) => sum + t.length, 0) +
    logs.length;

  if (total === 0) {
    localStorage.setItem(key, "1");
    return;
  }

  const habitSteps = (habits as Habit[]).map((h) =>
    instantDb.tx.habits[h.id].update({
      ...h,
      userId,
      targetTimeframe: h.targetTimeframe,
      completions: h.completions,
    })
  );

  const eventSteps = (events as Event[]).map((e) =>
    instantDb.tx.events[e.id].update({
      ...e,
      userId,
    })
  );

  const taskSteps = Object.values(tasksByEventId)
    .flat()
    .map((t) =>
      instantDb.tx.eventTasks[t.id].update({
        ...t,
        userId,
      })
    );

  const logSteps = (logs as ActivityLog[]).map((l) =>
    instantDb.tx.activityLogs[l.id].update({
      ...l,
      userId,
    })
  );

  await transactInBatches([...habitSteps, ...eventSteps, ...taskSteps, ...logSteps], 75);

  localStorage.setItem(key, "1");
}

