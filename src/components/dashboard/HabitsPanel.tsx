"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Check, Trash2, MoreVertical, Sparkles } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { cn, toISODateString } from "@/lib/utils";
import type { TimeframePreset, Habit } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function HabitsPanel() {
  const { habits, loadHabits, createHabit, toggleHabitCompletion, deleteHabit } =
    useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newTimeframe, setNewTimeframe] = useState<TimeframePreset>("month");
  const [customDays, setCustomDays] = useState(30);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [showAllDoneBurst, setShowAllDoneBurst] = useState(false);
  const [prevAllComplete, setPrevAllComplete] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const today = toISODateString(new Date());
  const activeHabits = habits.filter((h) => h.active);

  const completedCount = useMemo(() => {
    return activeHabits.filter((h) => h.completions.includes(today)).length;
  }, [activeHabits, today]);

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
        preset: newTimeframe,
        customDays: newTimeframe === "custom" ? customDays : undefined,
      },
    });

    setNewHabitTitle("");
    setNewTimeframe("month");
    setCustomDays(30);
    setIsAdding(false);
  };

  const handleToggle = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit && !habit.completions.includes(today)) {
      setJustCompleted(habitId);
      setTimeout(() => setJustCompleted(null), 600);
    }
    await toggleHabitCompletion(habitId, today);
  };

  const isCompletedToday = (habit: typeof habits[0]) => {
    return habit.completions.includes(today);
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
          <h3 className="text-sm font-medium text-text-secondary">
            Today&apos;s Habits
          </h3>
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
          {activeHabits.map((habit, index) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center justify-between px-4 py-3 group relative"
            >
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => handleToggle(habit.id)}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-lg border transition-all relative overflow-hidden",
                    isCompletedToday(habit)
                      ? "border-success bg-success/20 text-success"
                      : "border-border hover:border-accent/50 hover:bg-accent/5"
                  )}
                  aria-label={
                    isCompletedToday(habit)
                      ? "Mark as incomplete"
                      : "Mark as complete"
                  }
                  whileTap={{ scale: 0.9 }}
                >
                  <AnimatePresence mode="wait">
                    {isCompletedToday(habit) && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Completion ripple effect */}
                  {justCompleted === habit.id && (
                    <motion.div
                      className="absolute inset-0 bg-success rounded-lg"
                      initial={{ scale: 0, opacity: 0.6 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </motion.button>
                <span
                  className={cn(
                    "text-sm transition-all duration-300",
                    isCompletedToday(habit)
                      ? "text-text-muted line-through"
                      : "text-text-primary"
                  )}
                >
                  {habit.title}
                </span>
              </div>

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
            </motion.div>
          ))}
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
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">Timeframe:</label>
                <select
                  value={newTimeframe}
                  onChange={(e) =>
                    setNewTimeframe(e.target.value as TimeframePreset)
                  }
                  className="input flex-1 py-1.5"
                >
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="custom">Custom</option>
                </select>
                {newTimeframe === "custom" && (
                  <input
                    type="number"
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                    min={1}
                    className="input w-20 py-1.5"
                    placeholder="Days"
                  />
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddHabit}
                  disabled={!newHabitTitle.trim()}
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
