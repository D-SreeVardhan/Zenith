"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string; // HH:MM format (24-hour)
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimePicker({ value, onChange, disabled, placeholder = "Select time" }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  
  // Parse current value
  const [hours, minutes] = value ? value.split(':').map(Number) : [12, 0];
  
  // Generate hour and minute options
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 15, 30, 45];
  
  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  const formatDisplay = (timeStr: string) => {
    if (!timeStr) return placeholder;
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  };
  
  const handleHourClick = (h: number) => {
    const newTime = formatTime(h, minutes);
    onChange(newTime);
  };
  
  const handleMinuteClick = (m: number) => {
    const newTime = formatTime(hours, m);
    onChange(newTime);
  };
  
  const handleClear = () => {
    onChange('');
    setOpen(false);
  };
  
  const handleNow = () => {
    const now = new Date();
    const newTime = formatTime(now.getHours(), now.getMinutes());
    onChange(newTime);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "input flex items-center justify-between gap-2 text-left",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Pick a time"
        >
          <span className={cn("truncate", value && "text-text-primary")}>{formatDisplay(value)}</span>
          <Clock className="h-4 w-4 flex-shrink-0 text-text-muted" />
        </button>
      </Popover.Trigger>

      <AnimatePresence>
        {open && (
          <Popover.Portal forceMount>
            <Popover.Content 
              asChild 
              sideOffset={10} 
              align="start"
              collisionPadding={16}
              avoidCollisions={true}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className={cn(
                  "z-[60] w-[min(280px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface-elevated p-3 sm:p-4 shadow-2xl",
                  "relative overflow-hidden"
                )}
              >
                {/* Soft top glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,98,0.08),transparent_60%)]" />

                <div className="relative space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-text-primary tracking-tight">
                      {formatDisplay(value || formatTime(12, 0))}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Select hour and minute
                    </div>
                  </div>

                  {/* Hour Selection */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-text-secondary">Hour</div>
                    <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto">
                      {hourOptions.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleHourClick(h)}
                          className={cn(
                            "flex items-center justify-center h-8 rounded-lg text-sm font-medium transition-colors",
                            hours === h
                              ? "bg-accent text-base"
                              : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                          )}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Minute Selection */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-text-secondary">Minute</div>
                    <div className="grid grid-cols-4 gap-2">
                      {minuteOptions.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleMinuteClick(m)}
                          className={cn(
                            "flex items-center justify-center h-9 rounded-lg text-sm font-medium transition-colors",
                            minutes === m
                              ? "bg-accent text-base"
                              : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                          )}
                        >
                          {m.toString().padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="flex-1 h-9 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleNow}
                      className="flex-1 h-9 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      Now
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
