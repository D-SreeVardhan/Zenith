"use client";

import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatDate, toLocalYmd } from "@/lib/utils";

function parseLocalYmd(ymd: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined;
  const [y, m, d] = ymd.split("-").map(Number);
  // Use midday local to avoid timezone rollover issues.
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const selected = useMemo(() => parseLocalYmd(value), [value]);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => selected ?? new Date());

  const label = selected ? formatDate(selected) : placeholder;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setMonth(selected ?? new Date());
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "input flex items-center justify-between gap-2 text-left",
            !selected && "text-text-muted",
            disabled && "opacity-50"
          )}
          aria-label="Pick a due date"
        >
          <span className={cn("truncate", selected && "text-text-primary")}>{label}</span>
          <Calendar className="h-4 w-4 flex-shrink-0 text-text-muted" />
        </button>
      </Popover.Trigger>

      <AnimatePresence>
        {open && (
          <Popover.Portal forceMount>
            <Popover.Content asChild sideOffset={10} align="start">
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className={cn(
                  "z-50 w-[308px] rounded-2xl border border-border bg-surface-elevated p-3 shadow-2xl",
                  "relative overflow-hidden"
                )}
              >
                {/* soft top glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,98,0.08),transparent_60%)]" />

                <div className="relative">
                  <DayPicker
                    mode="single"
                    month={month}
                    onMonthChange={setMonth}
                    selected={selected}
                    showOutsideDays
                    onSelect={(d) => {
                      if (!d) return;
                      onChange(toLocalYmd(d));
                      setOpen(false);
                    }}
                    className="mx-auto"
                    classNames={{
                      months: "flex flex-col",
                      month: "space-y-3",
                      caption: "flex justify-center pt-1 relative items-center mb-2",
                      caption_label: "text-sm font-medium text-text-primary",
                      nav: "space-x-1 flex items-center",
                      nav_button: cn(
                        "h-8 w-8 bg-transparent p-0 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg inline-flex items-center justify-center transition-all duration-200"
                      ),
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell:
                        "text-text-muted rounded-md w-10 font-normal text-[0.75rem] tracking-tight",
                      row: "flex w-full mt-1.5",
                      cell: "h-10 w-10 text-center text-sm p-0 relative",
                      day: cn(
                        "h-10 w-10 p-0 font-normal rounded-xl",
                        "hover:bg-surface-hover transition-all duration-200 inline-flex items-center justify-center",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      ),
                      day_selected:
                        "bg-gradient-to-br from-accent/25 to-accent/10 text-accent border border-accent/25",
                      day_today:
                        "bg-surface border border-border-subtle text-text-primary font-semibold",
                      day_outside: "text-text-muted opacity-35",
                      day_disabled: "text-text-muted opacity-25",
                      day_hidden: "invisible",
                    }}
                    components={{
                      IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                      IconRight: () => <ChevronRight className="h-4 w-4" />,
                    }}
                  />

                  <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-2">
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
                      onClick={() => {
                        onChange("");
                        setOpen(false);
                      }}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs text-accent hover:bg-accent/10 transition-colors"
                      onClick={() => {
                        const now = new Date();
                        onChange(toLocalYmd(now));
                        setOpen(false);
                      }}
                    >
                      Today
                    </button>
                  </div>
                </div>

                <Popover.Arrow className="fill-border" />
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        )}
      </AnimatePresence>
    </Popover.Root>
  );
}

