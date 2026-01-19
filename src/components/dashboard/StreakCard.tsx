"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Trophy, Zap, Star, Award } from "lucide-react";
import type { Habit } from "@/lib/types";
import { cn, toISODateString, getDaysInRange } from "@/lib/utils";

interface StreakCardProps {
  habit: Habit;
}

// Motivational messages based on progress
const getMotivationalMessage = (percentage: number, streak: number): { message: string; icon: React.ReactNode } | null => {
  if (streak >= 30) return { message: "Legendary! 30+ days!", icon: <Trophy className="h-3.5 w-3.5" /> };
  if (streak >= 14) return { message: "Two weeks strong!", icon: <Award className="h-3.5 w-3.5" /> };
  if (streak >= 7) return { message: "Week warrior!", icon: <Star className="h-3.5 w-3.5" /> };
  if (percentage >= 80) return { message: "Crushing it!", icon: <Zap className="h-3.5 w-3.5" /> };
  if (percentage >= 50) return { message: "Great momentum!", icon: <Flame className="h-3.5 w-3.5" /> };
  if (streak >= 3) return { message: "Keep it up!", icon: <Star className="h-3.5 w-3.5" /> };
  return null;
};

// Calculate current streak (consecutive days)
const calculateStreak = (completions: string[]): number => {
  if (completions.length === 0) return 0;
  
  const today = new Date();
  const sortedDates = [...completions].sort().reverse();
  
  let streak = 0;
  let currentDate = new Date(today);
  
  // Check if today or yesterday is in completions (allow for not yet completed today)
  const todayStr = toISODateString(today);
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = toISODateString(yesterdayDate);
  
  if (!completions.includes(todayStr) && !completions.includes(yesterdayStr)) {
    return 0;
  }
  
  // Start from today or yesterday
  if (!completions.includes(todayStr)) {
    currentDate = yesterdayDate;
  }
  
  // Count consecutive days
  while (true) {
    const dateStr = toISODateString(currentDate);
    if (completions.includes(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

export function StreakCard({ habit }: StreakCardProps) {
  const [showPercentage, setShowPercentage] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevStreak, setPrevStreak] = useState<number | null>(null);

  // Calculate the target days based on timeframe
  const { targetDays, label } = useMemo(() => {
    let days: number;
    let periodLabel: string;

    switch (habit.targetTimeframe.preset) {
      case "week":
        days = 7;
        periodLabel = "week";
        break;
      case "month":
        days = 30;
        periodLabel = "month";
        break;
      case "year":
        days = 365;
        periodLabel = "year";
        break;
      case "custom":
        days = habit.targetTimeframe.customDays || 30;
        periodLabel = `${days} days`;
        break;
      default:
        days = 30;
        periodLabel = "month";
    }

    return { targetDays: days, label: periodLabel };
  }, [habit.targetTimeframe]);

  // Calculate completions within the timeframe
  const { completed, percentage, currentStreak, longestStreak } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - targetDays + 1);

    const daysInRange = getDaysInRange(startDate, today);
    const dateStrings = daysInRange.map((d) => toISODateString(d));
    const completionSet = new Set(habit.completions);

    const completedCount = dateStrings.filter((date) =>
      completionSet.has(date)
    ).length;
    const percentageValue = Math.round((completedCount / targetDays) * 100);
    
    const streak = calculateStreak(habit.completions);
    
    // Calculate longest streak
    const sortedCompletions = [...habit.completions].sort();
    let longest = 0;
    let current = 1;
    
    for (let i = 1; i < sortedCompletions.length; i++) {
      const prevDate = new Date(sortedCompletions[i - 1]);
      const currDate = new Date(sortedCompletions[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        current++;
      } else {
        longest = Math.max(longest, current);
        current = 1;
      }
    }
    longest = Math.max(longest, current);

    return { 
      completed: completedCount, 
      percentage: percentageValue, 
      currentStreak: streak,
      longestStreak: longest
    };
  }, [habit.completions, targetDays]);

  // Trigger celebration animation when streak increases to milestone
  useEffect(() => {
    if (prevStreak !== null && currentStreak > prevStreak) {
      const milestones = [3, 7, 14, 21, 30, 50, 100];
      if (milestones.includes(currentStreak)) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
    }
    setPrevStreak(currentStreak);
  }, [currentStreak, prevStreak]);

  const motivational = getMotivationalMessage(percentage, currentStreak);

  // Determine visual state based on percentage
  const getProgressColor = () => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 50) return "text-accent";
    if (percentage >= 25) return "text-priority-medium";
    return "text-text-muted";
  };

  const getProgressBg = () => {
    if (percentage >= 80) return "bg-gradient-to-br from-success/20 to-success/5";
    if (percentage >= 50) return "bg-gradient-to-br from-accent/20 to-accent/5";
    if (percentage >= 25) return "bg-gradient-to-br from-amber-500/20 to-amber-600/5";
    return "bg-surface-elevated";
  };

  const getFlameAnimation = () => {
    if (currentStreak >= 7) return { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] };
    if (currentStreak >= 3) return { scale: [1, 1.1, 1] };
    return {};
  };

  return (
    <motion.div
      className="relative flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors overflow-hidden"
      onClick={() => setShowPercentage(!showPercentage)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setShowPercentage(!showPercentage);
        }
      }}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Celebration particles */}
      <AnimatePresence>
        {showCelebration && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-accent"
                initial={{ 
                  x: 30, 
                  y: 20, 
                  scale: 0,
                  opacity: 1 
                }}
                animate={{ 
                  x: 30 + Math.cos(i * 45 * Math.PI / 180) * 60,
                  y: 20 + Math.sin(i * 45 * Math.PI / 180) * 60,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <motion.div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            getProgressBg()
          )}
          animate={getFlameAnimation()}
          transition={{ duration: 0.5, repeat: currentStreak >= 3 ? Infinity : 0, repeatDelay: 2 }}
        >
          <Flame className={cn("h-5 w-5", getProgressColor())} />
        </motion.div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-text-primary">{habit.title}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-text-muted">{label}</p>
            {currentStreak >= 3 && (
              <span className="flex items-center gap-1 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                <Zap className="h-2.5 w-2.5" />
                {currentStreak} day streak
              </span>
            )}
          </div>
          
          {/* Motivational message */}
          <AnimatePresence>
            {motivational && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1 text-[10px] font-medium text-accent"
              >
                {motivational.icon}
                <span>{motivational.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="text-right">
        <motion.p
          key={showPercentage ? "percentage" : "count"}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "text-xl font-bold tabular-nums",
            getProgressColor()
          )}
        >
          {showPercentage ? `${percentage}%` : `${completed}/${targetDays}`}
        </motion.p>
        <p className="text-xs text-text-muted">
          {showPercentage ? "completion" : "days"}
        </p>
        {longestStreak > currentStreak && longestStreak >= 3 && (
          <p className="text-[10px] text-text-muted mt-0.5">
            Best: {longestStreak} days
          </p>
        )}
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-elevated">
        <motion.div
          className={cn(
            "h-full",
            percentage >= 80 ? "bg-success" : percentage >= 50 ? "bg-accent" : "bg-amber-500/60"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
