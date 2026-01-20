"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { AppHeader } from "@/components/shell/AppHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { instantDb } from "@/lib/instantdb";
import { migrateLocalDataToInstant } from "@/lib/migration/migrateLocalData";
import { useAppStore } from "@/store/useAppStore";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = instantDb.useAuth();
  const { loadEvents } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Collapsed by default
  const [hydrated, setHydrated] = useState(false);
  const [migrationReady, setMigrationReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Detect mobile and force collapse sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Force collapse on mobile
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarCollapsed]);

  const marginLeft = useMemo(() => {
    // During first paint (before hydration), start collapsed.
    if (!hydrated) return "64px";
    // On mobile, use minimal margin or 0 when collapsed
    if (isMobile) return sidebarCollapsed ? "0px" : "240px";
    return sidebarCollapsed ? "64px" : "240px";
  }, [hydrated, sidebarCollapsed, isMobile]);

  useEffect(() => {
    if (!user?.id) {
      router.replace("/auth/login");
    }
  }, [router, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        await migrateLocalDataToInstant(user.id);
      } finally {
        if (!cancelled) setMigrationReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Ensure global data needed for cross-page navigation is ready.
  // (e.g. Tasks pages need `events` to resolve `eventId` to an event.)
  useEffect(() => {
    if (!migrationReady) return;
    loadEvents();
  }, [loadEvents, migrationReady]);

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-base">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
          <div className="card-glow w-full p-6">
            <div className="flex items-center justify-center gap-3">
              <LoadingSpinner />
              <p className="text-sm text-text-secondary">Checking session…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!migrationReady) {
    return (
      <div className="min-h-screen bg-base">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
          <div className="card-glow w-full p-6">
            <div className="flex items-center justify-center gap-3">
              <LoadingSpinner />
              <p className="text-sm text-text-secondary">Migrating your data…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
