"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useAppStore } from "@/store/useAppStore";
import { toISODateString, toLocalYmd } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface WeekDayDotProps {
  dayIndex: number;
  isCompleted: boolean;
  isToday: boolean;
  date: Date;
  count: number;
}

function WeekDayDot({ dayIndex, isCompleted, isToday, date, count }: WeekDayDotProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const dayNames = ["M", "T", "W", "T", "F", "S", "S"];
  
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="relative flex flex-col items-center gap-2">
      <span className="text-[10px] font-medium text-text-muted tracking-wider">
        {dayNames[dayIndex]}
      </span>
      
      <motion.div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1 }}
      >
        <motion.div
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-300 cursor-pointer",
            isCompleted 
              ? "bg-text-primary shadow-[0_0_8px_rgba(232,230,227,0.4)]" 
              : "bg-text-muted/20"
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: dayIndex * 0.05, type: "spring", stiffness: 300 }}
        />
        
        {isToday && (
          <motion.div
            className="absolute inset-0 rounded-full border border-accent"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>

      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 z-50 whitespace-nowrap"
        >
          <div className="rounded-lg bg-surface-elevated border border-border px-2.5 py-1.5 text-xs shadow-lg">
            <p className="font-medium text-text-primary">
              {count > 0 ? `${count} habit${count !== 1 ? "s" : ""} completed` : "No activity"}
            </p>
            <p className="text-text-muted">{formattedDate}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function ActivityHeatmap() {
  const { habits } = useAppStore();

  const weekData = useMemo(() => {
    const today = new Date();
    const todayStr = toISODateString(today);
    const todayLocalKey = toLocalYmd(today);
    
    // Get current week (Monday to Sunday)
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysSinceMonday = (currentDay + 6) % 7; // 0 if Monday, 6 if Sunday
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0); // Monday at 12:00 AM (start of day)
    weekStart.setDate(today.getDate() - daysSinceMonday);
    
    // Build completion map
    const completionMap: Record<string, number> = {};
    habits.forEach((habit) => {
      if (habit.active) {
        habit.completions.forEach((dateStr) => {
          completionMap[dateStr] = (completionMap[dateStr] || 0) + 1;
        });
      }
    });

    const activeHabitsCount = habits.filter(h => h.active).length;
    
    // Build week data
    const week: { date: Date; count: number; isCompleted: boolean; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      date.setHours(12, 0, 0, 0); // midday local
      const dateKey = toLocalYmd(date);
      const count = completionMap[dateKey] || 0;
      
      week.push({
        date,
        count,
        isCompleted: activeHabitsCount > 0 && count === activeHabitsCount,
        isToday: dateKey === todayLocalKey,
      });
    }

    const completedDays = week.filter(d => d.isCompleted).length;
    const completionRate = Math.round((completedDays / 7) * 100);

    return { week, completedDays, totalDays: 7, completionRate, activeHabitsCount };
  }, [habits]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-text-secondary">This Week</h3>
        <p className="mt-0.5 text-xs text-text-muted">
          Daily completion status
        </p>
      </div>

      <div className="p-6">
        {/* Week visualization */}
        <div className="grid grid-cols-7 place-items-center gap-3 sm:gap-6 mb-6">
          {weekData.week.map((day, index) => (
            <WeekDayDot
              key={index}
              dayIndex={index}
              isCompleted={day.isCompleted}
              isToday={day.isToday}
              date={day.date}
              count={day.count}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {weekData.completedDays}
            </p>
            <p className="text-xs text-text-muted mt-0.5">Perfect days</p>
          </div>
          
          <div className="h-10 w-px bg-border-subtle" />
          
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {weekData.completionRate}%
            </p>
            <p className="text-xs text-text-muted mt-0.5">Completion</p>
          </div>
          
          <div className="h-10 w-px bg-border-subtle" />
          
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {weekData.activeHabitsCount}
            </p>
            <p className="text-xs text-text-muted mt-0.5">Habits</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
