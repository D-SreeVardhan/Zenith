"use client";

import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Flame, TrendingUp } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { StreakCard } from "./StreakCard";
import { toISODateString, getDaysInRange } from "@/lib/utils";

export function StreaksPanel() {
  const { habits, loadHabits } = useAppStore();

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const activeHabits = habits.filter((h) => h.active);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    if (activeHabits.length === 0) return null;

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const weekDays = getDaysInRange(weekStart, today);
    const weekDates = weekDays.map(d => toISODateString(d));

    let totalCompletions = 0;
    const maxPossible = activeHabits.length * 7;

    activeHabits.forEach(habit => {
      weekDates.forEach(date => {
        if (habit.completions.includes(date)) {
          totalCompletions++;
        }
      });
    });

    const weeklyRate = Math.round((totalCompletions / maxPossible) * 100);

    return { weeklyRate, totalCompletions, maxPossible };
  }, [activeHabits]);

  if (activeHabits.length === 0) {
    return (
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-text-secondary">Streaks</h3>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated">
            <Flame className="h-6 w-6 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted">
            Add habits to track your streaks.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-text-secondary">Streaks</h3>
          {overallStats && (
            <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              <TrendingUp className="h-3 w-3" />
              {overallStats.weeklyRate}% this week
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">Click to toggle</span>
      </div>
      <div className="divide-y divide-border-subtle">
        {activeHabits.map((habit, index) => (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <StreakCard habit={habit} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
