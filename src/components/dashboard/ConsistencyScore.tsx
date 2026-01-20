"use client";

import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { toLocalYmd, getDaysInRange } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function ConsistencyScore() {
  const { habits, loadHabits } = useAppStore();

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const stats = useMemo(() => {
    const today = new Date();
    const activeHabits = habits.filter((h) => h.active);
    
    if (activeHabits.length === 0) {
      return {
        consistencyScore: 0,
        thisWeekRate: 0,
        lastWeekRate: 0,
        trend: "neutral" as const,
        trendValue: 0,
        totalCompletions: 0,
        perfectDays: 0,
      };
    }

    // This week (last 7 days)
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 6);
    const thisWeekDays = getDaysInRange(thisWeekStart, today);
    const thisWeekDates = thisWeekDays.map((d) => toLocalYmd(d));

    // Last week (7 days before this week)
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 13);
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 7);
    const lastWeekDays = getDaysInRange(lastWeekStart, lastWeekEnd);
    const lastWeekDates = lastWeekDays.map((d) => toLocalYmd(d));

    // Calculate completions
    let thisWeekCompletions = 0;
    let lastWeekCompletions = 0;
    let perfectDays = 0;
    let totalCompletions = 0;

    const completionsByDate: Record<string, number> = {};

    activeHabits.forEach((habit) => {
      habit.completions.forEach((dateStr) => {
        completionsByDate[dateStr] = (completionsByDate[dateStr] || 0) + 1;
        
        if (thisWeekDates.includes(dateStr)) {
          thisWeekCompletions++;
        }
        if (lastWeekDates.includes(dateStr)) {
          lastWeekCompletions++;
        }
      });
      totalCompletions += habit.completions.length;
    });

    // Count perfect days (all habits completed)
    thisWeekDates.forEach((date) => {
      if (completionsByDate[date] === activeHabits.length) {
        perfectDays++;
      }
    });

    const maxThisWeek = activeHabits.length * 7;
    const maxLastWeek = activeHabits.length * 7;

    const thisWeekRate = Math.round((thisWeekCompletions / maxThisWeek) * 100);
    const lastWeekRate = Math.round((lastWeekCompletions / maxLastWeek) * 100);

    const trendValue = thisWeekRate - lastWeekRate;
    const trend = trendValue > 0 ? "up" : trendValue < 0 ? "down" : "neutral";

    return {
      consistencyScore: thisWeekRate,
      thisWeekRate,
      lastWeekRate,
      trend,
      trendValue: Math.abs(trendValue),
      totalCompletions,
      perfectDays,
    };
  }, [habits]);

  const activeHabitsCount = habits.filter((h) => h.active).length;

  // Calculate circle progress
  const circumference = 2 * Math.PI * 52; // radius = 52
  const strokeDashoffset = circumference - (stats.consistencyScore / 100) * circumference;

  if (activeHabitsCount === 0) {
    return (
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-text-secondary">Consistency</h3>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated">
            <TrendingUp className="h-6 w-6 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted">
            Add habits to track consistency
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
        <h3 className="text-sm font-medium text-text-secondary">Consistency</h3>
        <p className="mt-0.5 text-xs text-text-muted">This week&apos;s performance</p>
      </div>

      <div className="p-6">
        {/* Circular Progress */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <svg className="transform -rotate-90" width="140" height="140">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r="52"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-surface-elevated"
              />
              {/* Progress circle */}
              <motion.circle
                cx="70"
                cy="70"
                r="52"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className={cn(
                  stats.consistencyScore >= 80
                    ? "text-success"
                    : stats.consistencyScore >= 50
                    ? "text-accent"
                    : "text-text-muted"
                )}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.p
                className="text-4xl font-bold text-text-primary tabular-nums"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {stats.consistencyScore}%
              </motion.p>
              <p className="text-xs text-text-muted mt-0.5">complete</p>
            </div>
          </div>

          {/* Trend indicator */}
          <div className="flex items-center gap-1.5 mt-3">
            {stats.trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-success" />}
            {stats.trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-priority-high" />}
            {stats.trend === "neutral" && <Minus className="h-3.5 w-3.5 text-text-muted" />}
            <span
              className={cn(
                "text-xs font-medium",
                stats.trend === "up" && "text-success",
                stats.trend === "down" && "text-priority-high",
                stats.trend === "neutral" && "text-text-muted"
              )}
            >
              {stats.trend === "neutral" ? "Same as" : `${stats.trendValue}% vs`} last week
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
          <div className="text-center">
            <p className="text-xl font-bold text-text-primary tabular-nums">
              {stats.perfectDays}
            </p>
            <p className="text-xs text-text-muted mt-0.5">Perfect days</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-text-primary tabular-nums">
              {stats.totalCompletions}
            </p>
            <p className="text-xs text-text-muted mt-0.5">All-time</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
