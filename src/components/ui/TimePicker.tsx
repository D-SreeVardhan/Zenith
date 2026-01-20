"use client";

import { useState, useRef, useEffect } from "react";
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
  
  const { hour: initialHour, minute: initialMinute, period: initialPeriod } = parse24HourTime(value);
  
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initialPeriod as 'AM' | 'PM');
  
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  
  // Generate options
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods: Array<'AM' | 'PM'> = ['AM', 'PM'];
  
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
  
  // Update parent when selection changes
  useEffect(() => {
    if (open) {
      const newTime = formatTime(selectedHour, selectedMinute, selectedPeriod);
      onChange(newTime);
    }
  }, [selectedHour, selectedMinute, selectedPeriod, open]);
  
  // Scroll to selected item when opened
  useEffect(() => {
    if (open) {
      const scrollToSelected = (ref: React.RefObject<HTMLDivElement>, index: number) => {
        if (ref.current) {
          const itemHeight = 40; // Height of each item
          ref.current.scrollTop = index * itemHeight;
        }
      };
      
      setTimeout(() => {
        scrollToSelected(hourRef, selectedHour - 1);
        scrollToSelected(minuteRef, selectedMinute);
        scrollToSelected(periodRef, selectedPeriod === 'AM' ? 0 : 1);
      }, 50);
    }
  }, [open]);
  
  // Handle scroll events to update selection (debounced)
  const handleScroll = (
    ref: React.RefObject<HTMLDivElement>,
    setter: (value: any) => void,
    values: any[]
  ) => {
    if (!ref.current) return;
    
    // Clear any existing timeout
    if (ref.current.dataset.scrollTimeout) {
      clearTimeout(Number(ref.current.dataset.scrollTimeout));
    }
    
    // Set new timeout to update after scroll settles
    const timeoutId = setTimeout(() => {
      if (!ref.current) return;
      
      const itemHeight = 40;
      const scrollTop = ref.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, values.length - 1));
      
      setter(values[clampedIndex]);
      
      // Snap to position
      ref.current.scrollTo({
        top: clampedIndex * itemHeight,
        behavior: 'smooth'
      });
    }, 100);
    
    ref.current.dataset.scrollTimeout = String(timeoutId);
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
              align="center"
              collisionPadding={16}
              avoidCollisions={true}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className={cn(
                  "z-[60] w-[min(300px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface-elevated shadow-2xl",
                  "relative overflow-hidden"
                )}
              >
                {/* Soft top glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,98,0.08),transparent_60%)]" />

                <div className="relative">
                  {/* Header */}
                  <div className="text-center py-3 border-b border-border-subtle">
                    <div className="text-xs text-text-muted">Select time</div>
                  </div>

                  {/* iOS-style wheel pickers */}
                  <div className="flex items-center justify-center gap-2 py-4 px-3">
                    {/* Hour Wheel */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-10 bg-accent/10 border-y border-accent/20 rounded-lg" />
                      </div>
                      <div
                        ref={hourRef}
                        onScroll={() => handleScroll(hourRef, setSelectedHour, hours)}
                        className="h-[160px] overflow-y-scroll scrollbar-hide snap-y snap-mandatory touch-pan-y"
                        style={{ 
                          scrollbarWidth: 'none',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        <div className="h-[60px]" /> {/* Top padding */}
                        {hours.map((h) => (
                          <div
                            key={h}
                            onClick={() => {
                              setSelectedHour(h);
                              if (hourRef.current) {
                                const itemHeight = 40;
                                const index = h - 1;
                                hourRef.current.scrollTo({
                                  top: index * itemHeight,
                                  behavior: 'smooth'
                                });
                              }
                            }}
                            className={cn(
                              "w-full h-10 flex items-center justify-center snap-center transition-all cursor-pointer",
                              selectedHour === h
                                ? "text-accent text-lg font-bold"
                                : "text-text-muted text-base hover:text-text-secondary"
                            )}
                          >
                            {h}
                          </div>
                        ))}
                        <div className="h-[60px]" /> {/* Bottom padding */}
                      </div>
                    </div>

                    <div className="text-2xl font-bold text-text-muted">:</div>

                    {/* Minute Wheel */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-10 bg-accent/10 border-y border-accent/20 rounded-lg" />
                      </div>
                      <div
                        ref={minuteRef}
                        onScroll={() => handleScroll(minuteRef, setSelectedMinute, minutes)}
                        className="h-[160px] overflow-y-scroll scrollbar-hide snap-y snap-mandatory touch-pan-y"
                        style={{ 
                          scrollbarWidth: 'none',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        <div className="h-[60px]" /> {/* Top padding */}
                        {minutes.map((m) => (
                          <div
                            key={m}
                            onClick={() => {
                              setSelectedMinute(m);
                              if (minuteRef.current) {
                                const itemHeight = 40;
                                minuteRef.current.scrollTo({
                                  top: m * itemHeight,
                                  behavior: 'smooth'
                                });
                              }
                            }}
                            className={cn(
                              "w-full h-10 flex items-center justify-center snap-center transition-all cursor-pointer",
                              selectedMinute === m
                                ? "text-accent text-lg font-bold"
                                : "text-text-muted text-base hover:text-text-secondary"
                            )}
                          >
                            {m.toString().padStart(2, '0')}
                          </div>
                        ))}
                        <div className="h-[60px]" /> {/* Bottom padding */}
                      </div>
                    </div>

                    {/* AM/PM Wheel */}
                    <div className="w-16 relative">
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-10 bg-accent/10 border-y border-accent/20 rounded-lg" />
                      </div>
                      <div
                        ref={periodRef}
                        onScroll={() => handleScroll(periodRef, setSelectedPeriod, periods)}
                        className="h-[160px] overflow-y-scroll scrollbar-hide snap-y snap-mandatory touch-pan-y"
                        style={{ 
                          scrollbarWidth: 'none',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        <div className="h-[60px]" /> {/* Top padding */}
                        {periods.map((p, index) => (
                          <div
                            key={p}
                            onClick={() => {
                              setSelectedPeriod(p);
                              if (periodRef.current) {
                                const itemHeight = 40;
                                periodRef.current.scrollTo({
                                  top: index * itemHeight,
                                  behavior: 'smooth'
                                });
                              }
                            }}
                            className={cn(
                              "w-full h-10 flex items-center justify-center snap-center transition-all cursor-pointer",
                              selectedPeriod === p
                                ? "text-accent text-lg font-bold"
                                : "text-text-muted text-base hover:text-text-secondary"
                            )}
                          >
                            {p}
                          </div>
                        ))}
                        <div className="h-[60px]" /> {/* Bottom padding */}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 px-3 pb-3 border-t border-border-subtle pt-3">
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
