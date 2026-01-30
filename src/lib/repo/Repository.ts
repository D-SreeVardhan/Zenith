import type {
  Habit,
  Event,
  EventTask,
  ActivityLog,
  UserProfile,
  CreateHabitInput,
  UpdateHabitInput,
  CreateEventInput,
  UpdateEventInput,
  CreateEventTaskInput,
  UpdateEventTaskInput,
} from "../types";

// Repository interface - abstracts data access for future InstantDB migration
export interface Repository {
  // Habits
  getAllHabits(): Promise<Habit[]>;
  getHabit(id: string): Promise<Habit | undefined>;
  createHabit(input: CreateHabitInput): Promise<Habit>;
  updateHabit(id: string, input: UpdateHabitInput): Promise<Habit>;
  deleteHabit(id: string): Promise<void>;
  toggleHabitCompletion(id: string, date: string): Promise<Habit>;
  restoreHabit(habit: Habit): Promise<Habit>;

  // Events
  getAllEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(input: CreateEventInput): Promise<Event>;
  updateEvent(id: string, input: UpdateEventInput): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  restoreEvent(event: Event): Promise<Event>;

  // Event Tasks
  getTasksForEvent(eventId: string): Promise<EventTask[]>;
  getTask(id: string): Promise<EventTask | undefined>;
  createTask(input: CreateEventTaskInput): Promise<EventTask>;
  updateTask(id: string, input: UpdateEventTaskInput): Promise<EventTask>;
  deleteTask(id: string): Promise<void>;
  reorderTasks(eventId: string, taskIds: string[]): Promise<void>;
  restoreTask(task: EventTask): Promise<EventTask>;

  // Activity Logs
  getAllActivityLogs(): Promise<ActivityLog[]>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
  createActivityLog(log: ActivityLog): Promise<ActivityLog>;
  deleteActivityLog(id: string): Promise<void>;
  clearOldActivityLogs(olderThanDays: number): Promise<void>;

  // Profile / Settings
  getProfile(): Promise<UserProfile | undefined>;
  upsertProfile(
    input: Partial<Omit<UserProfile, "id" | "userId">>
  ): Promise<UserProfile>;
}
