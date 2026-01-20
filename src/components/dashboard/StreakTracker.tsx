"use client";

import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Flame, Trophy } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { toLocalYmd } from "@/lib/utils";

export function StreakTracker() {
  const { habits, loadHabits } = useAppStore();

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const streaks = useMemo(() => {
    const today = new Date();
    const activeHabits = habits.filter((h) => h.active);
    
    if (activeHabits.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    // Get all completion dates across all habits
    const allCompletions = new Set<string>();
    activeHabits.forEach((habit) => {
      habit.completions.forEach((dateStr) => {
        allCompletions.add(dateStr);
      });
    });

    // Sort dates
    const sortedDates = Array.from(allCompletions).sort();
    
    // Calculate current streak (consecutive days from today backwards)
    let currentStreak = 0;
    const todayStr = toLocalYmd(today);
    
    // Check if today is completed
    let checkDate = new Date(today);
    let dateStr = toLocalYmd(checkDate);
    
    // Count backwards from today
    while (allCompletions.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      dateStr = toLocalYmd(checkDate);
    }
    
    // Calculate longest streak ever
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;
    
    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr + 'T12:00:00'); // noon to avoid timezone issues
      
      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const daysDiff = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      prevDate = currentDate;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
    };
  }, [habits]);

  const activeHabitsCount = habits.filter((h) => h.active).length;

  if (activeHabitsCount === 0) {
    return (
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-text-secondary">Streak</h3>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated">
            <Flame className="h-6 w-6 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted">
            Add habits to track streaks
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
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-text-secondary">Streak</h3>
        <p className="mt-0.5 text-xs text-text-muted">Keep the momentum going</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Streak */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 mb-3">
            <Flame className="h-8 w-8 text-orange-400" />
          </div>
          <div>
            <motion.p
              className="text-4xl font-bold text-text-primary tabular-nums"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              {streaks.currentStreak}
            </motion.p>
            <p className="text-sm text-text-secondary mt-1">
              Day{streaks.currentStreak !== 1 ? 's' : ''} streak
            </p>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="pt-6 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <Trophy className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Best Streak</p>
                <p className="text-xl font-bold text-text-primary tabular-nums">
                  {streaks.longestStreak}
                </p>
              </div>
            </div>
            {streaks.currentStreak === streaks.longestStreak && streaks.currentStreak > 0 && (
              <div className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                Personal Best! 🎉
              </div>
            )}
          </div>
        </div>

        {/* Motivation message */}
        {streaks.currentStreak === 0 && (
          <div className="text-center text-xs text-text-muted bg-surface-elevated rounded-lg px-3 py-2">
            Complete a habit today to start your streak! 💪
          </div>
        )}
        {streaks.currentStreak > 0 && streaks.currentStreak < 7 && (
          <div className="text-center text-xs text-text-muted bg-surface-elevated rounded-lg px-3 py-2">
            {7 - streaks.currentStreak} more day{7 - streaks.currentStreak !== 1 ? 's' : ''} to reach 7-day streak! 🔥
          </div>
        )}
        {streaks.currentStreak >= 7 && (
          <div className="text-center text-xs text-accent bg-accent/10 rounded-lg px-3 py-2">
            Amazing! Keep this streak alive! 🌟
          </div>
        )}
      </div>
    </motion.div>
  );
}
