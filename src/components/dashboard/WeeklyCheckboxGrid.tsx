"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn, type DayInfo } from "@/lib/utils";

type WeeklyCheckboxGridProps = {
  days: DayInfo[];
  checkedKeys: Set<string>;
  onToggle: (dateKey: string) => void;
  disabled?: boolean;
  className?: string;
};

export function WeeklyCheckboxGrid({
  days,
  checkedKeys,
  onToggle,
  disabled,
  className,
}: WeeklyCheckboxGridProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {days.map((day) => {
        const checked = checkedKeys.has(day.dateKey);
        return (
          <motion.button
            key={day.dateKey}
            type="button"
            onClick={() => onToggle(day.dateKey)}
            disabled={disabled}
            className={cn(
              "relative grid h-6 w-6 place-items-center rounded-md border text-[11px] font-semibold transition-all",
              checked
                ? "border-success/40 bg-success/20 text-success"
                : "border-border bg-surface hover:border-accent/40 hover:bg-accent/5 text-text-muted",
              disabled && "cursor-not-allowed opacity-60 hover:bg-surface"
            )}
            aria-label={`${checked ? "Uncheck" : "Check"} ${day.full}`}
            whileTap={disabled ? undefined : { scale: 0.92 }}
          >
            {checked ? <Check className="h-3.5 w-3.5" /> : day.abbr}
          </motion.button>
        );
      })}
    </div>
  );
}

