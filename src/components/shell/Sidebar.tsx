"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  ListChecks,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPattern?: RegExp;
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/events",
    label: "Events",
    icon: <CalendarClock className="h-5 w-5" />,
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: <ListChecks className="h-5 w-5" />,
    matchPattern: /^\/tasks/,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

type SidebarProps = {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  // Backwards-compatible internal state (but ShellLayout should control this).
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const pathname = usePathname();

  const isCollapsed = collapsed ?? internalCollapsed;

  const setCollapsed = (next: boolean) => {
    onCollapsedChange?.(next);
    if (!onCollapsedChange) setInternalCollapsed(next);
  };

  // Persist (only when controlled externally) so it survives refreshes.
  useEffect(() => {
    if (!onCollapsedChange) return;
    try {
      localStorage.setItem("dt.sidebarCollapsed", isCollapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [isCollapsed, onCollapsedChange]);

  const isActive = (item: NavItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(pathname);
    }
    return pathname === item.href;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-surface transition-all duration-300",
        isCollapsed ? "w-sidebar-collapsed" : "w-sidebar"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-border px-4",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <h1 className="text-lg font-semibold tracking-tight text-text-primary">
              Daily Tracker
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!isCollapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isCollapsed && "justify-center px-2",
                  active
                    ? "bg-accent-muted text-accent"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <span
                  className={cn(
                    "flex-shrink-0",
                    active ? "text-accent" : "text-text-muted"
                  )}
                >
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-border p-4",
            isCollapsed && "flex justify-center"
          )}
        >
          {!isCollapsed && (
            <p className="text-xs text-text-muted">
              Stay focused. Stay organized.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
