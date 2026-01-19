"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  Undo2,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  Target,
  ListTodo,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { ActivityLog, ActivityAction } from "@/lib/types";

// Helper to get human-readable action labels
function getActionLabel(action: ActivityAction): string {
  const labels: Record<ActivityAction, string> = {
    habit_created: "Created habit",
    habit_deleted: "Deleted habit",
    habit_completed: "Completed habit",
    habit_uncompleted: "Uncompleted habit",
    event_created: "Created event",
    event_deleted: "Deleted event",
    event_updated: "Updated event",
    task_created: "Created task",
    task_deleted: "Deleted task",
    task_completed: "Completed task",
    task_uncompleted: "Uncompleted task",
  };
  return labels[action] || action;
}

// Helper to get action icon
function getActionIcon(action: ActivityAction) {
  if (action.includes("created")) return Plus;
  if (action.includes("deleted")) return Trash2;
  if (action.includes("completed")) return CheckCircle2;
  if (action.includes("uncompleted")) return Circle;
  return History;
}

// Helper to get entity icon
function getEntityIcon(entityType: "habit" | "event" | "task") {
  switch (entityType) {
    case "habit":
      return Target;
    case "event":
      return Calendar;
    case "task":
      return ListTodo;
  }
}

// Helper to format relative time
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Group logs by date
function groupLogsByDate(logs: ActivityLog[]): Map<string, ActivityLog[]> {
  const groups = new Map<string, ActivityLog[]>();

  for (const log of logs) {
    const date = new Date(log.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Yesterday";
    } else {
      key = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(log);
  }

  return groups;
}

function ActivityItem({ log, onUndo, onDismiss }: {
  log: ActivityLog;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const ActionIcon = getActionIcon(log.action);
  const EntityIcon = getEntityIcon(log.entityType);

  const isDestructive = log.action.includes("deleted");
  const isCreation = log.action.includes("created");
  const isCompletion = log.action.includes("completed") && !log.action.includes("uncompleted");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border p-4 transition-all",
        isDestructive
          ? "border-red-500/20 bg-red-500/5"
          : isCreation
          ? "border-success/20 bg-success/5"
          : isCompletion
          ? "border-accent/20 bg-accent/5"
          : "border-border bg-surface"
      )}
    >
      {/* Action Icon */}
      <div
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
          isDestructive
            ? "bg-red-500/15 text-red-400"
            : isCreation
            ? "bg-success/15 text-success"
            : isCompletion
            ? "bg-accent/15 text-accent"
            : "bg-surface-elevated text-text-muted"
        )}
      >
        <ActionIcon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">
            {getActionLabel(log.action)}
          </span>
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <EntityIcon className="h-3 w-3" />
            {log.entityType}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-text-secondary">
          {log.entityTitle}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {formatRelativeTime(log.timestamp)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {log.canUndo && (
          <motion.button
            onClick={onUndo}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
              isDestructive || isCreation
                ? "bg-accent/10 text-accent hover:bg-accent/20"
                : "bg-surface-hover text-text-secondary hover:text-text-primary"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </motion.button>
        )}
        <button
          onClick={onDismiss}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function ActivityPage() {
  const { activityLogs, loadActivityLogs, undoActivity, clearActivityLog } =
    useAppStore();

  useEffect(() => {
    loadActivityLogs();
  }, [loadActivityLogs]);

  const groupedLogs = useMemo(() => groupLogsByDate(activityLogs), [activityLogs]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Activity</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Recent actions and changes. Undo mistakes before they&apos;re permanent.
          </p>
        </div>
        {activityLogs.length > 0 && (
          <span className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-medium text-text-muted">
            {activityLogs.length} {activityLogs.length === 1 ? "action" : "actions"}
          </span>
        )}
      </motion.div>

      {/* Activity List */}
      {activityLogs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
            <History className="h-8 w-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-medium text-text-primary">No recent activity</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Your actions will appear here. You&apos;ll be able to undo deletions and creations.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedLogs.entries()).map(([dateLabel, logs]) => (
            <motion.div
              key={dateLabel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="mb-3 text-sm font-medium text-text-muted">
                {dateLabel}
              </h2>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {logs.map((log) => (
                    <ActivityItem
                      key={log.id}
                      log={log}
                      onUndo={() => undoActivity(log.id)}
                      onDismiss={() => clearActivityLog(log.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Card */}
      {activityLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
        >
          <p className="text-sm text-amber-200/80">
            <strong className="text-amber-200">Tip:</strong> Undo actions to restore deleted items
            with all their data. Activities older than 30 days are automatically cleaned up.
          </p>
        </motion.div>
      )}
    </div>
  );
}
