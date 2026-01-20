import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export type DayInfo = {
  date: Date;
  dateKey: string; // YYYY-MM-DD (local)
  abbr: string; // M T W T F S S
  full: string;
  dayIndex: number; // 0..6 where 0=Mon
};

export function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(12, 0, 0, 0); // midday local to avoid timezone rollover
  return toLocalYmd(d);
}

export function isNewWeek(lastWeekStart: string, now: Date = new Date()): boolean {
  return lastWeekStart !== getWeekStartDate(now);
}

const FULL_WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const WEEKDAY_ABBR_BY_DAY = ["S", "M", "T", "W", "T", "F", "S"] as const; // index by Date.getDay()

export function getRemainingDaysInWeek(now: Date = new Date()): DayInfo[] {
  const start = new Date(now);
  start.setHours(12, 0, 0, 0);

  const day = start.getDay(); // 0..6
  const daysUntilSunday = (7 - 1 - day + 7) % 7; // 0 if Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + daysUntilSunday);
  end.setHours(12, 0, 0, 0);

  const days = getDaysInRange(start, end);
  return days.map((d) => {
    const jsDay = d.getDay(); // 0..6
    const dayIndex = (jsDay + 6) % 7; // 0..6 where 0=Mon
    return {
      date: d,
      dateKey: toLocalYmd(d),
      abbr: WEEKDAY_ABBR_BY_DAY[jsDay],
      full: FULL_WEEKDAY[jsDay],
      dayIndex,
    };
  });
}

export function getMonBasedWeekdayIndex(date: Date): number {
  // 0..6 where 0=Mon
  return (date.getDay() + 6) % 7;
}

export function normalizeScheduledWeekdays(input?: number[]): number[] {
  if (!Array.isArray(input) || input.length === 0) return [0, 1, 2, 3, 4, 5, 6];
  const set = new Set<number>();
  for (const n of input) {
    if (Number.isInteger(n) && n >= 0 && n <= 6) set.add(n);
  }
  return set.size ? Array.from(set).sort((a, b) => a - b) : [0, 1, 2, 3, 4, 5, 6];
}

export function getScheduledRemainingDaysInWeek(
  now: Date,
  scheduledWeekdays?: number[]
): DayInfo[] {
  const schedule = new Set(normalizeScheduledWeekdays(scheduledWeekdays));
  return getRemainingDaysInWeek(now).filter((d) => schedule.has(d.dayIndex));
}

function getLocalMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(12, 0, 0, 0); // midday local
  return d;
}

export function getScheduledDaysInWeek(
  now: Date,
  scheduledWeekdays?: number[]
): DayInfo[] {
  const schedule = normalizeScheduledWeekdays(scheduledWeekdays);
  const monday = getLocalMonday(now);

  return schedule.map((dayIndex) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + dayIndex);
    d.setHours(12, 0, 0, 0);
    const jsDay = d.getDay(); // 0..6
    return {
      date: d,
      dateKey: toLocalYmd(d),
      abbr: WEEKDAY_ABBR_BY_DAY[jsDay],
      full: FULL_WEEKDAY[jsDay],
      dayIndex,
    };
  });
}

export function getWeekCompletionTarget(now: Date = new Date()): number {
  return getRemainingDaysInWeek(now).length;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return toISODateString(date1) === toISODateString(date2);
}

export function getDaysInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}
