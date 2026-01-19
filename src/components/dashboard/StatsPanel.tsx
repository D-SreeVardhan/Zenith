"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Minus, Target, Calendar, CheckCircle2, Clock } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { toISODateString, getDaysInRange } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon: React.ReactNode;
  color: "amber" | "teal" | "sage" | "neutral";
  delay?: number;
}

function StatCard({ title, value, subtitle, trend, trendValue, icon, color, delay = 0 }: StatCardProps) {
  const colorClasses = {
    amber: "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20",
    teal: "from-teal-500/20 to-teal-600/5 text-teal-400 border-teal-500/20",
    sage: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20",
    neutral: "from-slate-400/20 to-slate-500/5 text-slate-400 border-slate-400/20",
  };

  const iconBgClasses = {
    amber: "bg-amber-500/10",
    teal: "bg-teal-500/10",
    sage: "bg-emerald-500/10",
    neutral: "bg-slate-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-4",
        colorClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </div>
        <div className={cn("rounded-lg p-2", iconBgClasses[color])}>
          {icon}
        </div>
      </div>
      
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-success" />}
          {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-priority-high" />}
          {trend === "neutral" && <Minus className="h-3.5 w-3.5 text-text-muted" />}
          <span className={cn(
            "text-xs font-medium",
            trend === "up" && "text-success",
            trend === "down" && "text-priority-high",
            trend === "neutral" && "text-text-muted"
          )}>
            {trendValue}
          </span>
          <span className="text-xs text-text-muted">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}

export function StatsPanel() {
  const { habits, events, eventTasks } = useAppStore();

  const stats = useMemo(() => {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 6);
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 13);
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 7);

    const activeHabits = habits.filter((h) => h.active);
    
    // This week's habit completions
    const thisWeekDays = getDaysInRange(thisWeekStart, today);
    const thisWeekDates = thisWeekDays.map((d) => toISODateString(d));
    
    let thisWeekCompletions = 0;
    activeHabits.forEach((habit) => {
      thisWeekDates.forEach((date) => {
        if (habit.completions.includes(date)) {
          thisWeekCompletions++;
        }
      });
    });
    
    // Last week's habit completions
    const lastWeekDays = getDaysInRange(lastWeekStart, lastWeekEnd);
    const lastWeekDates = lastWeekDays.map((d) => toISODateString(d));
    
    let lastWeekCompletions = 0;
    activeHabits.forEach((habit) => {
      lastWeekDates.forEach((date) => {
        if (habit.completions.includes(date)) {
          lastWeekCompletions++;
        }
      });
    });

    // Completion rate
    const maxPossibleThisWeek = activeHabits.length * 7;
    const completionRate = maxPossibleThisWeek > 0 
      ? Math.round((thisWeekCompletions / maxPossibleThisWeek) * 100)
      : 0;

    const lastWeekRate = activeHabits.length * 7 > 0
      ? Math.round((lastWeekCompletions / (activeHabits.length * 7)) * 100)
      : 0;

    const rateDiff = completionRate - lastWeekRate;

    // Active events count
    const activeEvents = events.filter((e) => {
      if (!e.dueAt) return true;
      return new Date(e.dueAt) >= today;
    });

    // Overdue events
    const overdueEvents = events.filter((e) => {
      if (!e.dueAt) return false;
      return new Date(e.dueAt) < today;
    });

    // Tasks completed this week
    const allTasks = Object.values(eventTasks).flat();
    const completedTasks = allTasks.filter((t) => t.done);

    // Best day calculation (most habit completions)
    const dayCompletions: Record<string, number> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    activeHabits.forEach((habit) => {
      habit.completions.forEach((dateStr) => {
        const date = new Date(dateStr);
        const dayName = dayNames[date.getDay()];
        dayCompletions[dayName] = (dayCompletions[dayName] || 0) + 1;
      });
    });

    const bestDay = Object.entries(dayCompletions).sort((a, b) => b[1] - a[1])[0];

    return {
      completionRate,
      rateTrend: rateDiff > 0 ? "up" : rateDiff < 0 ? "down" : "neutral",
      rateDiff: rateDiff > 0 ? `+${rateDiff}%` : `${rateDiff}%`,
      activeEventsCount: activeEvents.length,
      overdueCount: overdueEvents.length,
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      bestDay: bestDay ? bestDay[0] : "N/A",
      activeHabitsCount: activeHabits.length,
      thisWeekCompletions,
    };
  }, [habits, events, eventTasks]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Weekly Insights</h3>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          subtitle={`${stats.thisWeekCompletions} habits completed`}
          trend={stats.rateTrend as "up" | "down" | "neutral"}
          trendValue={stats.rateDiff}
          icon={<Target className="h-5 w-5" />}
          color="amber"
          delay={0}
        />
        
        <StatCard
          title="Active Events"
          value={stats.activeEventsCount}
          subtitle={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : "All on track"}
          icon={<Calendar className="h-5 w-5" />}
          color={stats.overdueCount > 0 ? "neutral" : "teal"}
          delay={0.1}
        />
        
        <StatCard
          title="Tasks Progress"
          value={`${stats.completedTasks}/${stats.totalTasks}`}
          subtitle={stats.totalTasks > 0 
            ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% complete`
            : "No tasks yet"}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="sage"
          delay={0.2}
        />
        
        <StatCard
          title="Best Day"
          value={stats.bestDay}
          subtitle="Most productive"
          icon={<Clock className="h-5 w-5" />}
          color="neutral"
          delay={0.3}
        />
      </div>
    </motion.div>
  );
}
