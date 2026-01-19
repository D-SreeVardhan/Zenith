"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { AppHeader } from "@/components/shell/AppHeader";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const saved = localStorage.getItem("dt.sidebarCollapsed");
      if (saved === "1") setSidebarCollapsed(true);
      if (saved === "0") setSidebarCollapsed(false);
    } catch {
      // ignore
    }
  }, []);

  const marginLeft = useMemo(() => {
    // During first paint (before hydration), keep layout stable (expanded width).
    if (!hydrated) return "240px";
    return sidebarCollapsed ? "64px" : "240px";
  }, [hydrated, sidebarCollapsed]);

  return (
    <div className="min-h-screen bg-base">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <main
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft,
        }}
      >
        <AppHeader />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
