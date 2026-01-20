"use client";

import { useState, useEffect } from "react";
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
  
  // Parse current value and convert to 12-hour format
  const parse24HourTime = (timeStr: string) => {
    if (!timeStr) return { hour: 12, minute: 0, period: 'AM' };
    const [h24, m] = timeStr.split(':').map(Number);
    const period = h24 >= 12 ? 'PM' : 'AM';
    const hour = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    return { hour, minute: m, period };
  };
  
  // Manual input states - initialize from value
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  
  // Update inputs when value changes or popover opens
  useEffect(() => {
    if (open || value) {
      const { hour, minute, period } = parse24HourTime(value);
      setHourInput(hour.toString());
      setMinuteInput(minute.toString().padStart(2, '0'));
      setSelectedPeriod(period as 'AM' | 'PM');
    }
  }, [value, open]);
  
  // Convert 12-hour format to 24-hour format
  const to24Hour = (hour12: number, period: 'AM' | 'PM') => {
    if (period === 'AM') {
      return hour12 === 12 ? 0 : hour12;
    } else {
      return hour12 === 12 ? 12 : hour12 + 12;
    }
  };
  
  const formatTime = (hour12: number, minute: number, period: 'AM' | 'PM') => {
    const hour24 = to24Hour(hour12, period);
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };
  
  const formatDisplay = (timeStr: string) => {
    if (!timeStr) return placeholder;
    const { hour, minute, period } = parse24HourTime(timeStr);
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
  };
  
  const handleApply = () => {
    const hour = parseInt(hourInput) || 12;
    const minute = parseInt(minuteInput) || 0;
    
    // Validate
    const validHour = Math.max(1, Math.min(12, hour));
    const validMinute = Math.max(0, Math.min(59, minute));
    
    setHourInput(validHour.toString());
    setMinuteInput(validMinute.toString().padStart(2, '0'));
    
    const newTime = formatTime(validHour, validMinute, selectedPeriod);
    onChange(newTime);
    setOpen(false);
  };
  
  const handleCancel = () => {
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
                  "z-[60] w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface-elevated p-4 shadow-2xl",
                  "relative overflow-hidden"
                )}
              >
                {/* Soft top glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,98,0.08),transparent_60%)]" />

                <div className="relative space-y-4">
                  {/* Header */}
                  <div className="text-center">
                    <div className="text-xs text-text-muted">Enter time</div>
                  </div>

                  {/* Manual Input */}
                  <div className="flex items-center justify-center gap-2.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="1"
                      max="12"
                      value={hourInput}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                          setHourInput(value);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="w-20 h-14 rounded-lg bg-surface border border-border text-text-primary text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                      placeholder="HH"
                      maxLength={2}
                    />
                    <span className="text-3xl font-bold text-text-muted">:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      max="59"
                      value={minuteInput}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                          setMinuteInput(value);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="w-20 h-14 rounded-lg bg-surface border border-border text-text-primary text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                      placeholder="MM"
                      maxLength={2}
                    />
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value as 'AM' | 'PM')}
                      className="w-20 h-14 rounded-lg bg-surface border border-border text-text-primary text-center text-lg font-bold cursor-pointer hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>

                  <div className="text-xs text-center text-text-muted">
                    Type hour (1-12) and minute (0-59)
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 border-t border-border-subtle">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 h-10 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors border border-border"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApply}
                      className="flex-1 h-10 rounded-lg text-sm font-medium bg-accent text-base hover:bg-accent-hover transition-colors"
                    >
                      Apply
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
