"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight, ChevronRight as ChevronRightSmall } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/store/useAppStore";
import { cn, formatDate, formatTime } from "@/lib/utils";
import type { Event } from "@/lib/types";

function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dueAtToSortDate(dueAt: string): Date {
  // date-only values should be interpreted as a calendar day (local),
  // so use midday local to avoid timezone rollover issues.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueAt)) {
    const [y, m, d] = dueAt.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }
  return new Date(dueAt);
}

export function PriorityCalendar() {
  const { events, loadEvents } = useAppStore();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const todayKey = toLocalYmd(new Date());

  // Group ALL events by date (including low priority)
  const eventsByDate = useMemo(() => {
    return events
      .filter((e) => e.dueAt)
      .reduce((acc, event) => {
        const dateStr = event.dueAt!.split("T")[0];
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(event);
        return acc;
      }, {} as Record<string, Event[]>);
  }, [events]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    // DayPicker gives local dates; using UTC (toISOString) shifts the day
    // for timezones ahead of UTC. Use local YYYY-MM-DD for lookups.
    const dateStr = toLocalYmd(date);
    return eventsByDate[dateStr] || [];
  };

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const horizonDays = 14;
    const horizon = new Date(startOfToday);
    horizon.setDate(horizon.getDate() + (horizonDays - 1));
    horizon.setHours(23, 59, 59, 999);

    const horizonKey = toLocalYmd(horizon);

    const list = events
      .filter((e) => e.dueAt)
      .map((e) => ({
        event: e,
        dueKey: e.dueAt!.split("T")[0],
        dueSort: dueAtToSortDate(e.dueAt!),
      }))
      .filter(({ dueKey }) => dueKey >= todayKey && dueKey <= horizonKey)
      .sort((a, b) => a.dueSort.getTime() - b.dueSort.getTime())
      .map(({ event }) => event);

    return list;
  }, [events, todayKey]);

  // Custom day content renderer
  const renderDayContent = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    const hasHigh = dayEvents.some((e) => e.priority === "high");
    const hasMedium = dayEvents.some((e) => e.priority === "medium");
    const hasLow = dayEvents.some((e) => e.priority === "low");
    const isToday = toLocalYmd(date) === todayKey;

    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <span className={cn(
          "relative z-10",
          isToday && "font-semibold"
        )}>
          {date.getDate()}
        </span>
        
        {/* Stacked priority indicators (max 3) */}
        {(hasHigh || hasMedium || hasLow) && (
          <div className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
            {hasHigh && (
              <span className="h-1.5 w-1.5 rounded-full bg-priority-high shadow-[0_0_4px_var(--color-priority-high)]" />
            )}
            {hasMedium && (
              <span className="h-1.5 w-1.5 rounded-full bg-priority-medium" />
            )}
            {hasLow && (
              <span className="h-1 w-1 rounded-full bg-priority-low opacity-60" />
            )}
          </div>
        )}
      </div>
    );
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    setSelectedDay(undefined);
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 1) {
      router.push(`/tasks/${dayEvents[0].id}`);
    } else if (dayEvents.length > 1) {
      setSelectedDay(date);
    }
  };

  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay) : [];

  return (
    <motion.div 
      className="card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-text-secondary">
          Calendar Overview
        </h3>
        <p className="mt-0.5 text-xs text-text-muted">
          Events and habit completions
        </p>
      </div>

      <div className="p-4">
        <div className="grid gap-4 lg:grid-cols-[auto,280px] lg:items-start">
          {/* Left: calendar */}
          <div>
            <Popover.Root
              open={selectedDay !== undefined && selectedDayEvents.length > 1}
              onOpenChange={(open) => {
                if (!open) setSelectedDay(undefined);
              }}
            >
              <Popover.Anchor className="w-fit mx-auto" />

              <DayPicker
                mode="single"
                month={month}
                onMonthChange={setMonth}
                selected={selectedDay}
                onDayClick={handleDayClick}
                showOutsideDays
                className="mx-auto"
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center mb-4",
                  caption_label: "text-sm font-medium text-text-primary",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-md inline-flex items-center justify-center transition-all duration-200"
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell:
                    "text-text-muted rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative",
                  day: cn(
                    "h-9 w-9 p-0 font-normal rounded-md hover:bg-surface-hover transition-all duration-200 inline-flex items-center justify-center"
                  ),
                  day_selected: "bg-accent-muted text-accent",
                  day_today: "bg-gradient-to-br from-accent/20 to-accent/5 text-accent font-semibold",
                  day_outside: "text-text-muted opacity-40",
                  day_disabled: "text-text-muted opacity-30",
                  day_hidden: "invisible",
                }}
                components={{
                  IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                  IconRight: () => <ChevronRight className="h-4 w-4" />,
                  DayContent: ({ date }) => renderDayContent(date),
                }}
                modifiers={{
                  hasHighPriority: (date) =>
                    getEventsForDate(date).some((e) => e.priority === "high"),
                  hasMediumPriority: (date) =>
                    getEventsForDate(date).some((e) => e.priority === "medium"),
                }}
                modifiersClassNames={{
                  hasHighPriority: "bg-priority-high-muted/30",
                  hasMediumPriority: "bg-priority-medium-muted/20",
                }}
              />

              <AnimatePresence>
                {selectedDay !== undefined && selectedDayEvents.length > 1 && (
                  <Popover.Portal forceMount>
                    <Popover.Content
                      className="w-72 rounded-xl border border-border bg-surface-elevated p-3 shadow-xl"
                      side="top"
                      align="center"
                      sideOffset={8}
                      asChild
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 6 }}
                        transition={{ duration: 0.15 }}
                      >
                        <p className="mb-3 px-1 text-xs font-medium text-text-secondary">
                          Events on {selectedDay && formatDate(selectedDay)}
                        </p>
                        <div className="space-y-1.5">
                          {selectedDayEvents.map((event, index) => (
                            <motion.button
                              key={event.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all duration-200",
                                "hover:bg-surface-hover",
                                event.priority === "high" && "border-l-2 border-priority-high",
                                event.priority === "medium" && "border-l-2 border-priority-medium",
                                event.priority === "low" && "border-l-2 border-priority-low"
                              )}
                              onClick={() => {
                                router.push(`/tasks/${event.id}`);
                                setSelectedDay(undefined);
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-text-primary truncate block">
                                  {event.title}
                                </span>
                                <span className={cn(
                                  "text-xs capitalize",
                                  event.priority === "high" && "text-priority-high",
                                  event.priority === "medium" && "text-priority-medium",
                                  event.priority === "low" && "text-priority-low"
                                )}>
                                  {event.priority} priority
                                </span>
                              </div>
                              <ChevronRightSmall className="h-4 w-4 text-text-muted" />
                            </motion.button>
                          ))}
                        </div>
                        <Popover.Arrow className="fill-border" />
                      </motion.div>
                    </Popover.Content>
                  </Popover.Portal>
                )}
              </AnimatePresence>
            </Popover.Root>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-priority-high shadow-[0_0_4px_var(--color-priority-high)]" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-priority-medium" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-priority-low opacity-60" />
                <span>Low</span>
              </div>
            </div>
          </div>

          {/* Right: upcoming events */}
          <div className="card-elevated p-3 lg:sticky lg:top-20">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-sm font-medium text-text-secondary">Upcoming</p>
              <p className="text-xs text-text-muted">Next 14 days</p>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="rounded-lg border border-border-subtle bg-surface px-3 py-6 text-center">
                <p className="text-sm text-text-muted">No upcoming events.</p>
                <p className="mt-1 text-xs text-text-muted">Add due dates to see them here.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {upcomingEvents.slice(0, 8).map((event) => (
                  <button
                    key={event.id}
                    className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-left hover:bg-surface-hover transition-colors"
                    onClick={() => router.push(`/tasks/${event.id}`)}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 rounded-full flex-shrink-0",
                          event.priority === "high" && "bg-priority-high",
                          event.priority === "medium" && "bg-priority-medium",
                          event.priority === "low" && "bg-priority-low opacity-60"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-primary truncate">
                          {event.title}
                        </p>
                        {event.dueAt && (
                          <p className="mt-0.5 text-xs text-text-muted">
                            {formatDate(event.dueAt)}
                            {event.dueAt.includes("T") ? ` · ${formatTime(event.dueAt)}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {upcomingEvents.length > 8 && (
                  <p className="pt-1 text-center text-xs text-text-muted">
                    +{upcomingEvents.length - 8} more
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
