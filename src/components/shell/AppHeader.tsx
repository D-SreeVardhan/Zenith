"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { UserProfileDropdown } from "@/components/shell/UserProfileDropdown";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/events": "Events",
  "/tasks": "Tasks",
};

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { text: "Good morning", icon: <Sunrise className="h-4 w-4 text-amber-400" /> };
  } else if (hour >= 12 && hour < 17) {
    return { text: "Good afternoon", icon: <Sun className="h-4 w-4 text-amber-400" /> };
  } else if (hour >= 17 && hour < 21) {
    return { text: "Good evening", icon: <Sunset className="h-4 w-4 text-amber-500" /> };
  } else {
    return { text: "Good night", icon: <Moon className="h-4 w-4 text-slate-400" /> };
  }
}

export function AppHeader() {
  const pathname = usePathname();
  const profile = useAppStore((s) => s.profile);
  
  const greeting = useMemo(() => getGreeting(), []);
  const devBypassLogin =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_BYPASS_LOGIN === "1";
  
  const getPageTitle = () => {
    // Check for exact match
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    // Check for tasks detail page
    if (pathname.startsWith("/tasks/")) {
      return "Event Tasks";
    }
    return "Daily Tracker";
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const isDashboard = pathname === "/";

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const timeFormat = profile?.timeFormat === "24h" ? "24h" : "12h";
  const timeText =
    timeFormat === "24h"
      ? now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

  const timeFont = profile?.timeFont ?? "system";
  const timeFontClass =
    timeFont === "mono"
      ? "font-mono"
      : timeFont === "serif"
      ? "font-serif"
      : timeFont === "rounded"
      ? "font-sans tracking-tight"
      : "";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-base/80 px-6 backdrop-blur-md">
      <div className="space-y-0.5">
        {isDashboard ? (
          <>
            <div className="flex items-center gap-2">
              {greeting.icon}
              <h2 className="text-lg font-semibold tracking-tight text-text-primary">
                {greeting.text}
              </h2>
            </div>
            <p className="text-xs text-text-muted">{today}</p>
          </>
        ) : (
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">
            {getPageTitle()}
          </h2>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "hidden sm:inline-flex items-center rounded-lg border border-accent/20 bg-accent/10 px-2.5 py-1 text-sm font-semibold text-accent tabular-nums",
            timeFontClass
          )}
          aria-label="Current time"
          title="Current time"
        >
          {timeText}
        </div>
        {!isDashboard && (
          <div className="hidden md:block text-sm text-text-secondary">{today}</div>
        )}
        {devBypassLogin && (
          <span className="hidden sm:inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-200">
            Dev guest mode
          </span>
        )}
        <UserProfileDropdown />
      </div>
    </header>
  );
}
