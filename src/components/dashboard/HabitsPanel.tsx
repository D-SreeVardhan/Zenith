"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, MoreVertical, Sparkles } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import {
  cn,
  getScheduledDaysInWeek,
  normalizeScheduledWeekdays,
  toLocalYmd,
} from "@/lib/utils";
import type { Habit } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { WeeklyCheckboxGrid } from "@/components/dashboard/WeeklyCheckboxGrid";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function HabitsPanel() {
  const { habits, loadHabits, createHabit, toggleHabitCompletion, deleteHabit } =
    useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newScheduledWeekdays, setNewScheduledWeekdays] = useState<number[]>(
    [0, 1, 2, 3, 4, 5, 6]
  );
  const [justCompleted, setJustCompleted] = useState<{
    habitId: string;
    dateKey: string;
  } | null>(null);
  const [showAllDoneBurst, setShowAllDoneBurst] = useState(false);
  const [prevAllComplete, setPrevAllComplete] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const activeHabits = habits.filter((h) => h.active);
  const todayKey = toLocalYmd(new Date());
  // Keep a stable todayKey for rerendering as days change.
  const fullWeekDays = useMemo(
    () => getScheduledDaysInWeek(new Date(), [0, 1, 2, 3, 4, 5, 6]),
    [todayKey]
  );

  const completedCount = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    return activeHabits.filter((h) => {
      const schedDays = getScheduledDaysInWeek(new Date(), h.scheduledWeekdays);
      const targetKeys = new Set(schedDays.map((d) => d.dateKey));
      const checked = new Set(h.completions.filter((k) => targetKeys.has(k)));
      return schedDays.every((d) => checked.has(d.dateKey));
    }).length;
  }, [activeHabits, todayKey]);

  const allComplete = completedCount === activeHabits.length && activeHabits.length > 0;

  useEffect(() => {
    // Trigger a small celebration once when crossing into the "all complete" state.
    if (allComplete && !prevAllComplete) {
      setShowAllDoneBurst(true);
      const t = window.setTimeout(() => setShowAllDoneBurst(false), 1100);
      return () => window.clearTimeout(t);
    }
    setPrevAllComplete(allComplete);
  }, [allComplete, prevAllComplete]);

  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) return;

    await createHabit({
      title: newHabitTitle.trim(),
      active: true,
      targetTimeframe: {
        preset: "week",
      },
      scheduledWeekdays: normalizeScheduledWeekdays(newScheduledWeekdays),
    });

    setNewHabitTitle("");
    setNewScheduledWeekdays([0, 1, 2, 3, 4, 5, 6]);
    setIsAdding(false);
  };

  const handleToggle = async (habitId: string, dateKey: string) => {
    const habit = habits.find((h) => h.id === habitId);
    const already = habit?.completions.includes(dateKey) ?? false;
    if (!already) {
      setJustCompleted({ habitId, dateKey });
      window.setTimeout(() => setJustCompleted(null), 600);
    }
    await toggleHabitCompletion(habitId, dateKey);
  };

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-text-secondary">Weekly Habits</h3>
          {activeHabits.length > 0 && (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
              allComplete 
                ? "bg-success/20 text-success" 
                : "bg-surface-elevated text-text-muted"
            )}>
              {completedCount}/{activeHabits.length}
            </span>
          )}
        </div>
        <motion.button
          onClick={() => setIsAdding(true)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
          aria-label="Add habit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>

      <div className="divide-y divide-border-subtle relative">
        {/* All-done burst (no persistent text) */}
        <AnimatePresence>
          {showAllDoneBurst && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative">
                {/* center sparkle */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
                  animate={{ scale: [0.6, 1.15, 1], opacity: [0, 1, 0.9], rotate: [0, 10, 0] }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 border border-success/25 backdrop-blur-sm"
                >
                  <Sparkles className="h-5 w-5 text-success" />
                </motion.div>

                {/* particles */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <motion.span
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-success"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0.6],
                      x: Math.cos((i / 10) * Math.PI * 2) * (32 + (i % 3) * 6),
                      y: Math.sin((i / 10) * Math.PI * 2) * (32 + (i % 3) * 6),
                    }}
                    transition={{ duration: 0.85, ease: "easeOut", delay: 0.05 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeHabits.length === 0 && !isAdding && (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated">
              <Plus className="h-6 w-6 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">No habits yet.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-2 text-sm text-accent hover:underline"
            >
              Add your first habit
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {activeHabits.map((habit, index) => {
            const scheduledDays = getScheduledDaysInWeek(new Date(), habit.scheduledWeekdays);
            const remainingKeys = new Set(scheduledDays.map((d) => d.dateKey));
            const checkedKeys = new Set(
              habit.completions.filter((k) => remainingKeys.has(k))
            );
            const weekDone = scheduledDays.every((d) => checkedKeys.has(d.dateKey));

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center justify-between gap-3 px-4 py-3 group relative"
              >
                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm transition-all duration-300",
                      weekDone
                        ? "text-text-muted line-through"
                        : "text-text-primary"
                    )}
                  >
                    {habit.title}
                  </span>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <WeeklyCheckboxGrid
                    days={scheduledDays}
                    checkedKeys={checkedKeys}
                    onToggle={(dateKey) => handleToggle(habit.id, dateKey)}
                    className="justify-end"
                  />

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:bg-surface-hover hover:text-text-primary transition-all"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="min-w-[140px] rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl"
                        sideOffset={5}
                        align="end"
                        asChild
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <DropdownMenu.Item
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-400 outline-none hover:bg-red-500/10 transition-colors"
                            onClick={() => setHabitToDelete(habit)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenu.Item>
                        </motion.div>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>

                {/* Completion ripple effect (subtle) */}
                {justCompleted?.habitId === habit.id && (
                  <motion.div
                    className="pointer-events-none absolute right-12 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-success/15"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 space-y-3"
            >
              <input
                type="text"
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                placeholder="Habit name..."
                className="input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddHabit();
                  if (e.key === "Escape") setIsAdding(false);
                }}
              />
              <p className="text-xs text-text-muted">
                Weekly habit (resets every Monday)
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Schedule</span>
                  <div className="flex items-center gap-1.5">
                    {WEEKDAY_LABELS.map((label, idx) => {
                      const active = newScheduledWeekdays.includes(idx);
                      return (
                        <button
                          key={`${label}-${idx}`}
                          type="button"
                          onClick={() => {
                            setNewScheduledWeekdays((prev) => {
                              const set = new Set(prev);
                              if (set.has(idx)) set.delete(idx);
                              else set.add(idx);
                              return Array.from(set).sort((a, b) => a - b);
                            });
                          }}
                          className={cn(
                            "grid h-6 w-6 place-items-center rounded-md border text-[11px] font-semibold transition-all",
                            active
                              ? "border-accent/40 bg-accent/10 text-accent"
                              : "border-border bg-surface text-text-muted hover:border-accent/30 hover:bg-accent/5"
                          )}
                          aria-label={`Toggle ${label}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setNewScheduledWeekdays([0, 1, 2, 3, 4, 5, 6])}
                  className="text-xs text-accent hover:underline"
                >
                  All days
                </button>
              </div>
              {newScheduledWeekdays.length === 0 && (
                <p className="text-xs text-red-400">
                  Pick at least 1 day.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddHabit}
                  disabled={!newHabitTitle.trim() || newScheduledWeekdays.length === 0}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  Add Habit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={habitToDelete !== null}
        onOpenChange={(open) => !open && setHabitToDelete(null)}
        title="Delete Habit?"
        description={
          habitToDelete
            ? `Are you sure you want to delete "${habitToDelete.title}"? This will permanently remove all your progress and streak data (${habitToDelete.completions.length} completions). You can undo this from the Activity tab.`
            : ""
        }
        confirmLabel="Delete Habit"
        variant="danger"
        onConfirm={() => {
          if (habitToDelete) {
            deleteHabit(habitToDelete.id);
            setHabitToDelete(null);
          }
        }}
      />
    </motion.div>
  );
}
