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
  const [manualMode, setManualMode] = useState(false);
  
  // Parse current value and convert to 12-hour format
  const parse24HourTime = (timeStr: string) => {
    if (!timeStr) return { hour: 12, minute: 0, period: 'AM' };
    const [h24, m] = timeStr.split(':').map(Number);
    const period = h24 >= 12 ? 'PM' : 'AM';
    const hour = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    return { hour, minute: m, period };
  };
  
  const { hour: initialHour, minute: initialMinute, period: initialPeriod } = parse24HourTime(value);
  
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initialPeriod as 'AM' | 'PM');
  
  // Manual input states
  const [hourInput, setHourInput] = useState(initialHour.toString());
  const [minuteInput, setMinuteInput] = useState(initialMinute.toString().padStart(2, '0'));
  
  // Generate options
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55
  
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
  
  const handleDropdownChange = (hour: number, minute: number, period: 'AM' | 'PM') => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    const newTime = formatTime(hour, minute, period);
    onChange(newTime);
  };
  
  const handleManualSubmit = () => {
    const hour = parseInt(hourInput) || 12;
    const minute = parseInt(minuteInput) || 0;
    
    // Validate
    const validHour = Math.max(1, Math.min(12, hour));
    const validMinute = Math.max(0, Math.min(59, minute));
    
    setSelectedHour(validHour);
    setSelectedMinute(validMinute);
    setHourInput(validHour.toString());
    setMinuteInput(validMinute.toString().padStart(2, '0'));
    
    const newTime = formatTime(validHour, validMinute, selectedPeriod);
    onChange(newTime);
    setManualMode(false);
  };
  
  const handleClear = () => {
    onChange('');
    setOpen(false);
  };
  
  const handleNow = () => {
    const now = new Date();
    const hour24 = now.getHours();
    const minute = now.getMinutes();
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    
    setSelectedHour(hour12);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    setHourInput(hour12.toString());
    setMinuteInput(minute.toString().padStart(2, '0'));
    
    const newTime = formatTime(hour12, minute, period);
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
                  "z-[60] w-[min(300px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface-elevated p-3 sm:p-4 shadow-2xl",
                  "relative overflow-hidden"
                )}
              >
                {/* Soft top glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,98,0.08),transparent_60%)]" />

                <div className="relative space-y-3">
                  {/* Header with mode toggle */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-text-muted">
                      {manualMode ? "Type time" : "Select time"}
                    </div>
                    <button
                      type="button"
                      onClick={() => setManualMode(!manualMode)}
                      className="text-xs text-accent hover:text-accent-hover transition-colors"
                    >
                      {manualMode ? "Use dropdowns" : "Type manually"}
                    </button>
                  </div>

                  {!manualMode ? (
                    /* Dropdown Mode */
                    <div className="space-y-3">
                      {/* Display */}
                      <div className="text-center py-2">
                        <div className="text-2xl font-bold text-accent tracking-tight">
                          {selectedHour}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
                        </div>
                      </div>

                      {/* Dropdowns */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Hour Select */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-text-secondary block text-center">
                            Hour
                          </label>
                          <select
                            value={selectedHour}
                            onChange={(e) => handleDropdownChange(Number(e.target.value), selectedMinute, selectedPeriod)}
                            className="w-full h-10 rounded-lg bg-surface border border-border text-text-primary text-center text-sm font-medium cursor-pointer hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
                          >
                            {hours.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Minute Select */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-text-secondary block text-center">
                            Minute
                          </label>
                          <select
                            value={selectedMinute}
                            onChange={(e) => handleDropdownChange(selectedHour, Number(e.target.value), selectedPeriod)}
                            className="w-full h-10 rounded-lg bg-surface border border-border text-text-primary text-center text-sm font-medium cursor-pointer hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
                          >
                            {minutes.map((m) => (
                              <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                            ))}
                          </select>
                        </div>

                        {/* Period Select */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-text-secondary block text-center">
                            Period
                          </label>
                          <select
                            value={selectedPeriod}
                            onChange={(e) => handleDropdownChange(selectedHour, selectedMinute, e.target.value as 'AM' | 'PM')}
                            className="w-full h-10 rounded-lg bg-surface border border-border text-text-primary text-center text-sm font-medium cursor-pointer hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Manual Input Mode */
                    <div className="space-y-3">
                      {/* Manual Inputs */}
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={hourInput}
                          onChange={(e) => setHourInput(e.target.value)}
                          onBlur={handleManualSubmit}
                          className="w-16 h-12 rounded-lg bg-surface border border-border text-text-primary text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-accent/40"
                          placeholder="HH"
                        />
                        <span className="text-2xl font-bold text-text-muted">:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={minuteInput}
                          onChange={(e) => setMinuteInput(e.target.value)}
                          onBlur={handleManualSubmit}
                          className="w-16 h-12 rounded-lg bg-surface border border-border text-text-primary text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-accent/40"
                          placeholder="MM"
                        />
                        <select
                          value={selectedPeriod}
                          onChange={(e) => {
                            setSelectedPeriod(e.target.value as 'AM' | 'PM');
                            handleDropdownChange(selectedHour, selectedMinute, e.target.value as 'AM' | 'PM');
                          }}
                          className="w-16 h-12 rounded-lg bg-surface border border-border text-text-primary text-center text-sm font-bold cursor-pointer hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>

                      <div className="text-xs text-center text-text-muted">
                        Press Enter or click outside to apply
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border-subtle">
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
