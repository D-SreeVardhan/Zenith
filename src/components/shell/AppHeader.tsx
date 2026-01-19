"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Sun, Moon, Sunrise, Sunset } from "lucide-react";

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
  
  const greeting = useMemo(() => getGreeting(), []);
  
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
      {!isDashboard && (
        <div className="text-sm text-text-secondary">{today}</div>
      )}
    </header>
  );
}
