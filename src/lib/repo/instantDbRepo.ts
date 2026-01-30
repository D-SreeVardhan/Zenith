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
  UserProfile,
  UpdateEventInput,
  UpdateEventTaskInput,
  UpdateHabitInput,
} from "@/lib/types";

async function requireAuth(): Promise<{ userId: string; userEmail?: string }> {
  const auth = await instantDb.getAuth();
  if (!auth?.id) throw new Error("Not authenticated");
  return { userId: auth.id, userEmail: auth.email ?? undefined };
}

async function requireEmailAuth(): Promise<{ userId: string; userEmail: string }> {
  const auth = await requireAuth();
  if (!auth.userEmail) throw new Error("No email available for this session");
  return { userId: auth.userId, userEmail: auth.userEmail };
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
    completionMode: raw.completionMode === "strict" ? "strict" : "flexible",
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
    const { userId } = await requireAuth();
    const { data } = await instantDb.queryOnce({
      habits: {
        $: { where: { userId } },
      },
    });
    return ((data.habits ?? []) as Habit[]).map(normalizeHabit);
  },

  async getHabit(id: string): Promise<Habit | undefined> {
    const { userId } = await requireAuth();
    const { data } = await instantDb.queryOnce({
      habits: {
        $: { where: { userId, id } },
      },
    });
    const raw = (data.habits?.[0] as Habit | undefined) ?? undefined;
    return raw ? normalizeHabit(raw) : undefined;
  },

  async createHabit(input: CreateHabitInput): Promise<Habit> {
    const { userId, userEmail } = await requireAuth();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const completions: string[] = [];
    const weekStartDate = getWeekStartDate(new Date());
    const scheduledWeekdays = normalizeScheduledWeekdays(
      (input as unknown as { scheduledWeekdays?: number[] }).scheduledWeekdays
    );
    const weeklyCompletionCount = 0;
    const completionMode = input.completionMode === "strict" ? "strict" : "flexible";

    await instantDb.transact(
      instantDb.tx.habits[id].create({
        userId,
        userEmail,
        title: input.title,
        active: input.active,
        createdAt,
        targetTimeframe: input.targetTimeframe,
        completions,
        weekStartDate,
        weeklyCompletionCount,
        scheduledWeekdays,
        completionMode,
      })
    );

    return normalizeHabit({
      id,
      userId,
      userEmail,
      ...input,
      createdAt,
      completions,
      weekStartDate,
      weeklyCompletionCount,
      scheduledWeekdays,
      completionMode,
    } as Habit);
  },

  async updateHabit(id: string, input: UpdateHabitInput): Promise<Habit> {
    const { userId, userEmail } = await requireAuth();
    await instantDb.transact(
      instantDb.tx.habits[id].update({
        ...input,
        userId,
        userEmail,
      })
    );
    const updated = await this.getHabit(id);
    if (!updated) throw new Error(`Habit ${id} not found`);
    return updated;
  },

  async deleteHabit(id: string): Promise<void> {
    await requireAuth();
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
    const auth = await requireAuth();
    const userId = habit.userId ?? auth.userId;
    const userEmail = habit.userEmail ?? auth.userEmail;
    const normalized = normalizeHabit({ ...habit, userId, userEmail });
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
    const { userId } = await requireAuth();
    const { data } = await instantDb.queryOnce({
      events: {
        $: { where: { userId } },
      },
    });
    return (data.events ?? []) as Event[];
  },

  async getEvent(id: string): Promise<Event | undefined> {
    const { userId } = await requireAuth();
    const { data } = await instantDb.queryOnce({
      events: {
        $: { where: { userId, id } },
      },
    });
    return (data.events?.[0] as Event | undefined) ?? undefined;
  },

  async createEvent(input: CreateEventInput): Promise<Event> {
    const { userId, userEmail } = await requireAuth();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await instantDb.transact(
      instantDb.tx.events[id].create({
        userId,
        userEmail,
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
      userEmail,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
  },

  async updateEvent(id: string, input: UpdateEventInput): Promise<Event> {
    const { userId, userEmail } = await requireAuth();
    await instantDb.transact(
      instantDb.tx.events[id].update({
        ...input,
        userId,
        userEmail,
        updatedAt: new Date().toISOString(),
      })
    );
    const updated = await this.getEvent(id);
    if (!updated) throw new Error(`Event ${id} not found`);
    return updated;
  },

  async deleteEvent(id: string): Promise<void> {
    const { userId } = await requireAuth();
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
    const auth = await requireAuth();
    const userId = event.userId ?? auth.userId;
    const userEmail = event.userEmail ?? auth.userEmail;
    await instantDb.transact(
      instantDb.tx.events[event.id].update({ ...event, userId, userEmail })
    );
    return { ...event, userId, userEmail };
  },

  // ========================
  // EVENT TASKS
  // ========================
  async getTasksForEvent(eventId: string): Promise<EventTask[]> {
    const { userId } = await requireAuth();
    const { data } = await instantDb.queryOnce({
      eventTasks: {
        $: { where: { userId, eventId } },
      },
    });
    return (data.eventTasks ?? []) as EventTask[];
  },

  async getTask(id: string): Promise<EventTask | undefined> {
    const { userId } = await requireAuth();
    const { data } = await instantDb.queryOnce({
      eventTasks: {
        $: { where: { userId, id } },
      },
    });
    return (data.eventTasks?.[0] as EventTask | undefined) ?? undefined;
  },

  async createTask(input: CreateEventTaskInput): Promise<EventTask> {
    const { userId, userEmail } = await requireAuth();
    const existing = await this.getTasksForEvent(input.eventId);
    const maxOrder = existing.reduce((max, t) => Math.max(max, t.order), -1);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const order = maxOrder + 1;

    await instantDb.transact(
      instantDb.tx.eventTasks[id].create({
        userId,
        userEmail,
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
      userEmail,
      ...input,
      createdAt: now,
      updatedAt: now,
      order,
    };
  },

  async updateTask(id: string, input: UpdateEventTaskInput): Promise<EventTask> {
    const { userId, userEmail } = await requireAuth();
    await instantDb.transact(
      instantDb.tx.eventTasks[id].update({
        ...input,
        userId,
        userEmail,
        updatedAt: new Date().toISOString(),
      })
    );
    const updated = await this.getTask(id);
    if (!updated) throw new Error(`Task ${id} not found`);
    return updated;
  },

  async deleteTask(id: string): Promise<void> {
    await requireAuth();
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
    const auth = await requireAuth();
    const userId = task.userId ?? auth.userId;
    const userEmail = task.userEmail ?? auth.userEmail;
    await instantDb.transact(
      instantDb.tx.eventTasks[task.id].update({ ...task, userId, userEmail })
    );
    return { ...task, userId, userEmail };
  },

  // ========================
  // ACTIVITY LOGS
  // ========================
  async getAllActivityLogs(): Promise<ActivityLog[]> {
    const { userId } = await requireAuth();
    const { data } = await instantDb.queryOnce({
      activityLogs: {
        $: { where: { userId }, order: { timestamp: "desc" } },
      },
    });
    return (data.activityLogs ?? []) as ActivityLog[];
  },

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    const { userId } = await requireAuth();
    const { data } = await instantDb.queryOnce({
      activityLogs: {
        $: { where: { userId }, order: { timestamp: "desc" }, limit },
      },
    });
    return (data.activityLogs ?? []) as ActivityLog[];
  },

  async createActivityLog(log: ActivityLog): Promise<ActivityLog> {
    const auth = await requireAuth();
    const userId = log.userId ?? auth.userId;
    const userEmail = log.userEmail ?? auth.userEmail;
    const payload = { ...log, userId, userEmail };
    await instantDb.transact(instantDb.tx.activityLogs[log.id].create(payload));
    return payload;
  },

  async deleteActivityLog(id: string): Promise<void> {
    await requireAuth();
    await instantDb.transact(instantDb.tx.activityLogs[id].delete());
  },

  async clearOldActivityLogs(olderThanDays: number): Promise<void> {
    const { userId } = await requireAuth();
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

  // ========================
  // PROFILE / SETTINGS
  // ========================
  async getProfile(): Promise<UserProfile | undefined> {
    const { userId } = await requireAuth();
    const { data } = await instantDb.queryOnce({
      profiles: {
        $: { where: { userId } },
      },
    });
    return (data.profiles?.[0] as UserProfile | undefined) ?? undefined;
  },

  async upsertProfile(
    input: Partial<Omit<UserProfile, "id" | "userId">>
  ): Promise<UserProfile> {
    const { userId, userEmail } = await requireAuth();
    const now = new Date().toISOString();
    const existing = await this.getProfile();
    const id = existing?.id ?? userId;
    const payload: UserProfile = {
      id,
      userId,
      userEmail,
      username: existing?.username,
      avatarUrl: existing?.avatarUrl,
      themePrimary: existing?.themePrimary,
      themeAccent: existing?.themeAccent,
      updatedAt: now,
      ...existing,
      ...input,
    };

    if (existing) {
      await instantDb.transact(instantDb.tx.profiles[id].update(payload));
    } else {
      await instantDb.transact(instantDb.tx.profiles[id].create(payload));
    }

    return payload;
  },
};

export async function backfillUserEmail(): Promise<void> {
  const { userId, userEmail } = await requireEmailAuth();

  // Habits
  {
    const { data } = await instantDb.queryOnce({
      habits: { $: { where: { userId } } },
    });
    const habits = (data.habits ?? []) as Array<{ id: string; userEmail?: string }>;
    const steps = habits
      .filter((h) => !h.userEmail)
      .slice(0, 200)
      .map((h) => instantDb.tx.habits[h.id].update({ userEmail }));
    if (steps.length) await instantDb.transact(steps);
  }

  // Events
  {
    const { data } = await instantDb.queryOnce({
      events: { $: { where: { userId } } },
    });
    const events = (data.events ?? []) as Array<{ id: string; userEmail?: string }>;
    const steps = events
      .filter((e) => !e.userEmail)
      .slice(0, 200)
      .map((e) => instantDb.tx.events[e.id].update({ userEmail }));
    if (steps.length) await instantDb.transact(steps);
  }

  // Event tasks
  {
    const { data } = await instantDb.queryOnce({
      eventTasks: { $: { where: { userId } } },
    });
    const tasks = (data.eventTasks ?? []) as Array<{ id: string; userEmail?: string }>;
    const steps = tasks
      .filter((t) => !t.userEmail)
      .slice(0, 400)
      .map((t) => instantDb.tx.eventTasks[t.id].update({ userEmail }));
    if (steps.length) await instantDb.transact(steps);
  }

  // Activity logs
  {
    const { data } = await instantDb.queryOnce({
      activityLogs: { $: { where: { userId } } },
    });
    const logs = (data.activityLogs ?? []) as Array<{ id: string; userEmail?: string }>;
    const steps = logs
      .filter((l) => !l.userEmail)
      .slice(0, 400)
      .map((l) => instantDb.tx.activityLogs[l.id].update({ userEmail }));
    if (steps.length) await instantDb.transact(steps);
  }

  // Profile
  {
    const { data } = await instantDb.queryOnce({
      profiles: { $: { where: { userId } } },
    });
    const p = (data.profiles?.[0] as { id: string; userEmail?: string } | undefined) ?? undefined;
    if (p && !p.userEmail) {
      await instantDb.transact(instantDb.tx.profiles[p.id].update({ userEmail }));
    }
  }
}

