"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn, type DayInfo } from "@/lib/utils";

type WeeklyCheckboxGridProps = {
  days: DayInfo[];
  checkedKeys: Set<string>;
  onToggle: (dateKey: string) => void;
  disabled?: boolean;
  disabledKeys?: Set<string>;
  className?: string;
};

export function WeeklyCheckboxGrid({
  days,
  checkedKeys,
  onToggle,
  disabled,
  disabledKeys,
  className,
}: WeeklyCheckboxGridProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {days.map((day) => {
        const checked = checkedKeys.has(day.dateKey);
        const isDisabled = disabled || (disabledKeys?.has(day.dateKey) ?? false);
        return (
          <motion.button
            key={day.dateKey}
            type="button"
            onClick={() => onToggle(day.dateKey)}
            disabled={isDisabled}
            className={cn(
              "relative grid h-6 w-6 place-items-center rounded-md border text-[11px] font-semibold transition-all",
              checked
                ? "border-success/40 bg-success/20 text-success"
                : isDisabled
                ? "border-border bg-surface text-text-muted opacity-40 cursor-not-allowed"
                : "border-border bg-surface hover:border-accent/40 hover:bg-accent/5 text-text-muted",
              isDisabled && "hover:bg-surface"
            )}
            aria-label={`${checked ? "Uncheck" : "Check"} ${day.full}`}
            whileTap={isDisabled ? undefined : { scale: 0.92 }}
          >
            {checked ? <Check className="h-3.5 w-3.5" /> : day.abbr}
          </motion.button>
        );
      })}
    </div>
  );
}

