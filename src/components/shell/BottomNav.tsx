"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  ListChecks,
  History,
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
    href: "/activity",
    label: "Activity",
    icon: <History className="h-5 w-5" />,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(pathname);
    }
    return pathname === item.href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border bg-surface/95 backdrop-blur-md">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full rounded-lg transition-all",
                active
                  ? "text-accent"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 transition-transform",
                  active && "scale-110"
                )}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
