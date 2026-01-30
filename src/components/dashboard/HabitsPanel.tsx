"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, MoreVertical, Sparkles, Pencil } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import {
  cn,
  getScheduledDaysInWeek,
  normalizeScheduledWeekdays,
  toLocalYmd,
} from "@/lib/utils";
import type { CreateHabitInput, Habit } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { WeeklyCheckboxGrid } from "@/components/dashboard/WeeklyCheckboxGrid";

const WEEKDAY_OPTIONS: Array<{ label: string; weekdayIndex: number }> = [
  { label: "S", weekdayIndex: 6 }, // Sun (0=Mon .. 6=Sun)
  { label: "M", weekdayIndex: 0 },
  { label: "T", weekdayIndex: 1 },
  { label: "W", weekdayIndex: 2 },
  { label: "T", weekdayIndex: 3 },
  { label: "F", weekdayIndex: 4 },
  { label: "S", weekdayIndex: 5 }, // Sat
];

function orderWeekdaysSunFirst(input?: number[]): number[] {
  const normalized = normalizeScheduledWeekdays(input); // 0..6 (Mon..Sun)
  const set = new Set(normalized);
  const sunFirst = [6, 0, 1, 2, 3, 4, 5].filter((d) => set.has(d));
  return sunFirst.length ? sunFirst : [6, 0, 1, 2, 3, 4, 5];
}

export function HabitsPanel() {
  const { habits, loadHabits, createHabit, toggleHabitCompletion, deleteHabit, updateHabit } =
    useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newScheduledWeekdays, setNewScheduledWeekdays] = useState<number[]>(
    [0, 1, 2, 3, 4, 5, 6]
  );
  const [newCompletionMode, setNewCompletionMode] = useState<"strict" | "flexible">(
    "flexible"
  );
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editHabitTitle, setEditHabitTitle] = useState("");
  const [editScheduledWeekdays, setEditScheduledWeekdays] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);
  const [editCompletionMode, setEditCompletionMode] = useState<"strict" | "flexible">(
    "flexible"
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState<{
    habitId: string;
    dateKey: string;
  } | null>(null);
  const [showAllDoneBurst, setShowAllDoneBurst] = useState(false);
  const [prevAllComplete, setPrevAllComplete] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const openAddHabit = () => setIsAdding(true);

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
      const schedDays = getScheduledDaysInWeek(new Date(), orderWeekdaysSunFirst(h.scheduledWeekdays));
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

    const payload: CreateHabitInput = {
      title: newHabitTitle.trim(),
      active: true,
      targetTimeframe: {
        preset: "week",
      },
      scheduledWeekdays: normalizeScheduledWeekdays(newScheduledWeekdays),
      completionMode: newCompletionMode,
    };

    // Close immediately on submit (even if network is slow).
    setNewHabitTitle("");
    setNewScheduledWeekdays([0, 1, 2, 3, 4, 5, 6]);
    setNewCompletionMode("flexible");
    setIsAdding(false);

    try {
      await createHabit(payload);
    } catch (err) {
      // Keep UI responsive; log for debugging.
      console.error("Failed to create habit", err);
    }
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

  const beginEditHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditHabitTitle(habit.title);
    setEditScheduledWeekdays(normalizeScheduledWeekdays(habit.scheduledWeekdays));
    setEditCompletionMode(habit.completionMode === "strict" ? "strict" : "flexible");
    setEditError(null);
  };

  const saveEditHabit = async (habit: Habit) => {
    const nextTitle = editHabitTitle.trim();
    const nextDays = normalizeScheduledWeekdays(editScheduledWeekdays);
    const nextMode = editCompletionMode === "strict" ? "strict" : "flexible";

    if (!nextTitle) {
      setEditError("Habit name can't be empty.");
      return;
    }
    if (nextDays.length === 0) {
      setEditError("Pick at least 1 day.");
      return;
    }

    setEditingHabitId(null);
    setEditError(null);
    if (
      nextTitle === habit.title &&
      JSON.stringify(nextDays) ===
        JSON.stringify(normalizeScheduledWeekdays(habit.scheduledWeekdays)) &&
      nextMode === (habit.completionMode === "strict" ? "strict" : "flexible")
    ) {
      return;
    }
    try {
      await updateHabit(habit.id, {
        title: nextTitle,
        scheduledWeekdays: nextDays,
        completionMode: nextMode,
      });
    } catch (err) {
      console.error("Failed to update habit", err);
    }
  };

  const cancelEditHabit = (habit: Habit) => {
    setEditingHabitId(null);
    setEditHabitTitle(habit.title);
    setEditScheduledWeekdays(normalizeScheduledWeekdays(habit.scheduledWeekdays));
    setEditCompletionMode(habit.completionMode === "strict" ? "strict" : "flexible");
    setEditError(null);
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
          onClick={openAddHabit}
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
            <button
              type="button"
              onClick={openAddHabit}
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label="Create your first habit"
            >
              <Plus className="h-6 w-6 text-text-muted" />
            </button>
            <p className="text-sm text-text-muted">No habits yet.</p>
            <button
              onClick={openAddHabit}
              className="mt-2 text-sm text-accent hover:underline"
            >
              Add your first habit
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {activeHabits.map((habit, index) => {
            const scheduledDays = getScheduledDaysInWeek(new Date(), orderWeekdaysSunFirst(habit.scheduledWeekdays));
            const remainingKeys = new Set(scheduledDays.map((d) => d.dateKey));
            const checkedKeys = new Set(
              habit.completions.filter((k) => remainingKeys.has(k))
            );
            const weekDone = scheduledDays.every((d) => checkedKeys.has(d.dateKey));
            const strictDisabledKeys =
              habit.completionMode === "strict"
                ? new Set(scheduledDays.map((d) => d.dateKey).filter((k) => k !== todayKey))
                : undefined;

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
                  {editingHabitId === habit.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editHabitTitle}
                        onChange={(e) => {
                          setEditHabitTitle(e.target.value);
                          if (editError) setEditError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditHabit(habit);
                          if (e.key === "Escape") cancelEditHabit(habit);
                        }}
                        className="input py-1 text-sm"
                        autoFocus
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-text-muted">Schedule</span>
                        <div className="flex items-center gap-1.5">
                          {WEEKDAY_OPTIONS.map(({ label, weekdayIndex }) => {
                            const active = editScheduledWeekdays.includes(weekdayIndex);
                            return (
                              <button
                                key={`edit-${habit.id}-${label}-${weekdayIndex}`}
                                type="button"
                                onClick={() => {
                                  setEditScheduledWeekdays((prev) => {
                                    const set = new Set(prev);
                                    if (set.has(weekdayIndex)) set.delete(weekdayIndex);
                                    else set.add(weekdayIndex);
                                    return Array.from(set).sort((a, b) => a - b);
                                  });
                                  if (editError) setEditError(null);
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

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-text-muted">Mode</span>
                        <div className="flex items-center gap-1.5">
                          {(["strict", "flexible"] as const).map((mode) => {
                            const active = editCompletionMode === mode;
                            return (
                              <button
                                key={`edit-mode-${habit.id}-${mode}`}
                                type="button"
                                onClick={() => {
                                  setEditCompletionMode(mode);
                                  if (editError) setEditError(null);
                                }}
                                className={cn(
                                  "rounded-md border px-2 py-1 text-[11px] font-semibold transition-all capitalize",
                                  active
                                    ? "border-accent/40 bg-accent/10 text-accent"
                                    : "border-border bg-surface text-text-muted hover:border-accent/30 hover:bg-accent/5"
                                )}
                                aria-label={`Set mode ${mode}`}
                              >
                                {mode}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {editError && (
                        <p className="text-xs text-red-400">{editError}</p>
                      )}

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => cancelEditHabit(habit)}
                          className="btn-ghost text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEditHabit(habit)}
                          disabled={editScheduledWeekdays.length === 0 || !editHabitTitle.trim()}
                          className="btn-primary text-xs disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="min-w-0">
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
                      <div className="mt-0.5 text-[11px] text-text-muted">
                        {habit.completionMode === "strict" ? "Strict" : "Flexible"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <WeeklyCheckboxGrid
                    days={scheduledDays}
                    checkedKeys={checkedKeys}
                    onToggle={(dateKey) => handleToggle(habit.id, dateKey)}
                    disabledKeys={strictDisabledKeys}
                    className="justify-end"
                  />

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-text-muted opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-surface-hover hover:text-text-primary transition-all"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="min-w-[140px] max-w-[90vw] rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl z-50"
                        sideOffset={5}
                        align="end"
                        collisionPadding={16}
                        avoidCollisions={true}
                        asChild
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <DropdownMenu.Item
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-text-primary outline-none hover:bg-surface-hover transition-colors"
                            onClick={() => beginEditHabit(habit)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </DropdownMenu.Item>
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
                    {WEEKDAY_OPTIONS.map(({ label, weekdayIndex }) => {
                      const active = newScheduledWeekdays.includes(weekdayIndex);
                      return (
                        <button
                          key={`${label}-${weekdayIndex}`}
                          type="button"
                          onClick={() => {
                            setNewScheduledWeekdays((prev) => {
                              const set = new Set(prev);
                              if (set.has(weekdayIndex)) set.delete(weekdayIndex);
                              else set.add(weekdayIndex);
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Mode</span>
                  <div className="flex items-center gap-1.5">
                    {(["strict", "flexible"] as const).map((mode) => {
                      const active = newCompletionMode === mode;
                      return (
                        <button
                          key={`new-mode-${mode}`}
                          type="button"
                          onClick={() => setNewCompletionMode(mode)}
                          className={cn(
                            "rounded-md border px-2 py-1 text-[11px] font-semibold transition-all capitalize",
                            active
                              ? "border-accent/40 bg-accent/10 text-accent"
                              : "border-border bg-surface text-text-muted hover:border-accent/30 hover:bg-accent/5"
                          )}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                </div>
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
