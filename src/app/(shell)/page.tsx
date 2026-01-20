"use client";

export const dynamic = 'force-dynamic';

import { HabitsPanel } from "@/components/dashboard/HabitsPanel";
import { ConsistencyScore } from "@/components/dashboard/ConsistencyScore";
import { PriorityCalendar } from "@/components/dashboard/PriorityCalendar";
import { StatsPanel } from "@/components/dashboard/StatsPanel";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";

export default function DashboardPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Weekly Insights Stats */}
      <StatsPanel />

      {/* Top row: Habits and Consistency */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <HabitsPanel />
        <ConsistencyScore />
      </div>

      {/* Activity and Calendar row */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <ActivityHeatmap />
        <PriorityCalendar />
      </div>
    </div>
  );
}
