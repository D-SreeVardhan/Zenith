import { instantDb } from "@/lib/instantdb";
import type { Repository } from "@/lib/repo/Repository";
import { getScheduledDaysInWeek, getWeekStartDate, normalizeScheduledWeekdays } from "@/lib/utils";
import type {
  ActivityLog,
  CreateEventInput,
  CreateEventTaskInput,
  CreateHabitInput,
  Event,
  EventTask,
  Habit,
  UpdateEventInput,
  UpdateEventTaskInput,
  UpdateHabitInput,
} from "@/lib/types";

async function requireUserId(): Promise<string> {
  const auth = await instantDb.getAuth();
  if (!auth?.id) throw new Error("Not authenticated");
  return auth.id;
}

function normalizeHabit(raw: Habit): Habit {
  const now = new Date();
  const weekStartDate =
    typeof raw.weekStartDate === "string" && raw.weekStartDate
      ? raw.weekStartDate
      : getWeekStartDate(now);

  const scheduledWeekdays = normalizeScheduledWeekdays(raw.scheduledWeekdays);

  const completions = Array.isArray(raw.completions)
    ? Array.from(new Set(raw.completions.filter((d) => typeof d === "string")))
    : [];

  const scheduledKeys = new Set(
    getScheduledDaysInWeek(now, scheduledWeekdays).map((d) => d.dateKey)
  );

  const weeklyCompletionCount =
    typeof raw.weeklyCompletionCount === "number"
      ? raw.weeklyCompletionCount
      : completions.filter((k) => scheduledKeys.has(k)).length;

  return {
    ...raw,
    completions,
    weekStartDate,
    weeklyCompletionCount,
    scheduledWeekdays,
  };
}

export const instantDbRepo: Repository = {
  // ========================
  // HABITS
  // ========================
  async getAllHabits(): Promise<Habit[]> {
    const userId = await requireUserId();
    const { data } = await instantDb.queryOnce({
      habits: {
        $: { where: { userId } },
      },
    });
    return ((data.habits ?? []) as Habit[]).map(normalizeHabit);
  },

  async getHabit(id: string): Promise<Habit | undefined> {
    const userId = await requireUserId();
    const { data } = await instantDb.queryOnce({
      habits: {
        $: { where: { userId, id } },
      },
    });
    const raw = (data.habits?.[0] as Habit | undefined) ?? undefined;
    return raw ? normalizeHabit(raw) : undefined;
  },

  async createHabit(input: CreateHabitInput): Promise<Habit> {
    const userId = await requireUserId();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const completions: string[] = [];
    const weekStartDate = getWeekStartDate(new Date());
    const scheduledWeekdays = normalizeScheduledWeekdays(
      (input as unknown as { scheduledWeekdays?: number[] }).scheduledWeekdays
    );
    const weeklyCompletionCount = 0;

    await instantDb.transact(
      instantDb.tx.habits[id].create({
        userId,
        title: input.title,
        active: input.active,
        createdAt,
        targetTimeframe: input.targetTimeframe,
        completions,
        weekStartDate,
        weeklyCompletionCount,
        scheduledWeekdays,
      })
    );

    return normalizeHabit({
      id,
      userId,
      ...input,
      createdAt,
      completions,
      weekStartDate,
      weeklyCompletionCount,
      scheduledWeekdays,
    } as Habit);
  },

  async updateHabit(id: string, input: UpdateHabitInput): Promise<Habit> {
    const userId = await requireUserId();
    await instantDb.transact(
      instantDb.tx.habits[id].update({
        ...input,
        userId,
      })
    );
    const updated = await this.getHabit(id);
    if (!updated) throw new Error(`Habit ${id} not found`);
    return updated;
  },

  async deleteHabit(id: string): Promise<void> {
    await requireUserId();
    await instantDb.transact(instantDb.tx.habits[id].delete());
  },

  async toggleHabitCompletion(id: string, date: string): Promise<Habit> {
    const habit = await this.getHabit(id);
    if (!habit) throw new Error(`Habit ${id} not found`);

    const dateStr = date.split("T")[0];
    const completions = new Set(habit.completions ?? []);
    if (completions.has(dateStr)) completions.delete(dateStr);
    else completions.add(dateStr);

    const now = new Date();
    const weekStartDate = getWeekStartDate(now);
    const scheduledWeekdays = normalizeScheduledWeekdays(habit.scheduledWeekdays);
    const scheduledKeys = new Set(
      getScheduledDaysInWeek(now, scheduledWeekdays).map((d) => d.dateKey)
    );
    const weeklyCompletionCount = Array.from(completions).filter((k) =>
      scheduledKeys.has(k)
    ).length;

    await instantDb.transact(
      instantDb.tx.habits[id].update({
        completions: Array.from(completions),
        weekStartDate,
        weeklyCompletionCount,
        scheduledWeekdays,
      })
    );

    const updated = await this.getHabit(id);
    if (!updated) throw new Error(`Habit ${id} not found`);
    return updated;
  },

  async restoreHabit(habit: Habit): Promise<Habit> {
    const userId = habit.userId ?? (await requireUserId());
    const normalized = normalizeHabit({ ...habit, userId });
    await instantDb.transact(
      instantDb.tx.habits[habit.id].update({
        ...normalized,
        targetTimeframe: normalized.targetTimeframe,
        completions: normalized.completions,
      })
    );
    return normalized;
  },

  // ========================
  // EVENTS
  // ========================
  async getAllEvents(): Promise<Event[]> {
    const userId = await requireUserId();
    const { data } = await instantDb.queryOnce({
      events: {
        $: { where: { userId } },
      },
    });
    return (data.events ?? []) as Event[];
  },

  async getEvent(id: string): Promise<Event | undefined> {
    const userId = await requireUserId();
    const { data } = await instantDb.queryOnce({
      events: {
        $: { where: { userId, id } },
      },
    });
    return (data.events?.[0] as Event | undefined) ?? undefined;
  },

  async createEvent(input: CreateEventInput): Promise<Event> {
    const userId = await requireUserId();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await instantDb.transact(
      instantDb.tx.events[id].create({
        userId,
        title: input.title,
        dueAt: input.dueAt,
        priority: input.priority,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      })
    );

    return {
      id,
      userId,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
  },

  async updateEvent(id: string, input: UpdateEventInput): Promise<Event> {
    const userId = await requireUserId();
    await instantDb.transact(
      instantDb.tx.events[id].update({
        ...input,
        userId,
        updatedAt: new Date().toISOString(),
      })
    );
    const updated = await this.getEvent(id);
    if (!updated) throw new Error(`Event ${id} not found`);
    return updated;
  },

  async deleteEvent(id: string): Promise<void> {
    const userId = await requireUserId();
    const { data } = await instantDb.queryOnce({
      eventTasks: {
        $: { where: { userId, eventId: id } },
      },
    });
    const tasks = (data.eventTasks ?? []) as EventTask[];

    await instantDb.transact([
      ...tasks.map((t) => instantDb.tx.eventTasks[t.id].delete()),
      instantDb.tx.events[id].delete(),
    ]);
  },

  async restoreEvent(event: Event): Promise<Event> {
    const userId = event.userId ?? (await requireUserId());
    await instantDb.transact(instantDb.tx.events[event.id].update({ ...event, userId }));
    return { ...event, userId };
  },

  // ========================
  // EVENT TASKS
  // ========================
  async getTasksForEvent(eventId: string): Promise<EventTask[]> {
    const userId = await requireUserId();
    const { data } = await instantDb.queryOnce({
      eventTasks: {
        $: { where: { userId, eventId } },
      },
    });
    return (data.eventTasks ?? []) as EventTask[];
  },

  async getTask(id: string): Promise<EventTask | undefined> {
    const userId = await requireUserId();
    const { data } = await instantDb.queryOnce({
      eventTasks: {
        $: { where: { userId, id } },
      },
    });
    return (data.eventTasks?.[0] as EventTask | undefined) ?? undefined;
  },

  async createTask(input: CreateEventTaskInput): Promise<EventTask> {
    const userId = await requireUserId();
    const existing = await this.getTasksForEvent(input.eventId);
    const maxOrder = existing.reduce((max, t) => Math.max(max, t.order), -1);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const order = maxOrder + 1;

    await instantDb.transact(
      instantDb.tx.eventTasks[id].create({
        userId,
        eventId: input.eventId,
        title: input.title,
        done: input.done,
        priority: input.priority,
        createdAt: now,
        updatedAt: now,
        order,
      })
    );

    return {
      id,
      userId,
      ...input,
      createdAt: now,
      updatedAt: now,
      order,
    };
  },

  async updateTask(id: string, input: UpdateEventTaskInput): Promise<EventTask> {
    const userId = await requireUserId();
    await instantDb.transact(
      instantDb.tx.eventTasks[id].update({
        ...input,
        userId,
        updatedAt: new Date().toISOString(),
      })
    );
    const updated = await this.getTask(id);
    if (!updated) throw new Error(`Task ${id} not found`);
    return updated;
  },

  async deleteTask(id: string): Promise<void> {
    await requireUserId();
    await instantDb.transact(instantDb.tx.eventTasks[id].delete());
  },

  async reorderTasks(eventId: string, taskIds: string[]): Promise<void> {
    const tasks = await this.getTasksForEvent(eventId);
    const known = new Set(tasks.map((t) => t.id));
    const steps = taskIds
      .filter((id) => known.has(id))
      .map((id, index) => instantDb.tx.eventTasks[id].update({ order: index }));
    if (steps.length === 0) return;
    await instantDb.transact(steps);
  },

  async restoreTask(task: EventTask): Promise<EventTask> {
    const userId = task.userId ?? (await requireUserId());
    await instantDb.transact(instantDb.tx.eventTasks[task.id].update({ ...task, userId }));
    return { ...task, userId };
  },

  // ========================
  // ACTIVITY LOGS
  // ========================
  async getAllActivityLogs(): Promise<ActivityLog[]> {
    const userId = await requireUserId();
    const { data } = await instantDb.queryOnce({
      activityLogs: {
        $: { where: { userId }, order: { timestamp: "desc" } },
      },
    });
    return (data.activityLogs ?? []) as ActivityLog[];
  },

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    const userId = await requireUserId();
    const { data } = await instantDb.queryOnce({
      activityLogs: {
        $: { where: { userId }, order: { timestamp: "desc" }, limit },
      },
    });
    return (data.activityLogs ?? []) as ActivityLog[];
  },

  async createActivityLog(log: ActivityLog): Promise<ActivityLog> {
    const userId = log.userId ?? (await requireUserId());
    const payload = { ...log, userId };
    await instantDb.transact(instantDb.tx.activityLogs[log.id].create(payload));
    return payload;
  },

  async deleteActivityLog(id: string): Promise<void> {
    await requireUserId();
    await instantDb.transact(instantDb.tx.activityLogs[id].delete());
  },

  async clearOldActivityLogs(olderThanDays: number): Promise<void> {
    const userId = await requireUserId();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const cutoffStr = cutoff.toISOString();
    const { data } = await instantDb.queryOnce({
      activityLogs: {
        $: { where: { userId, timestamp: { $lt: cutoffStr } } },
      },
    });
    const old = (data.activityLogs ?? []) as ActivityLog[];
    if (old.length === 0) return;
    await instantDb.transact(old.map((l) => instantDb.tx.activityLogs[l.id].delete()));
  },
};

