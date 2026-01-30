"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { BottomNav } from "@/components/shell/BottomNav";
import { AppHeader } from "@/components/shell/AppHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { instantDb } from "@/lib/instantdb";
import { migrateLocalDataToInstant } from "@/lib/migration/migrateLocalData";
import { useAppStore } from "@/store/useAppStore";
import { applyTheme } from "@/lib/theme";
import { backfillUserEmail } from "@/lib/repo/instantDbRepo";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = instantDb.useAuth();
  const devBypassLogin =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_BYPASS_LOGIN === "1";
  const { loadEvents, loadProfile } = useAppStore();
  const profile = useAppStore((s) => s.profile);
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
      if (devBypassLogin && !authLoading) {
        // Dev-only: bypass email login for local testing.
        instantDb.auth.signInAsGuest().catch((e) => {
          console.error("Dev guest sign-in failed", e);
        });
        return;
      }
      router.replace("/auth/login");
    }
  }, [router, user?.id, authLoading, devBypassLogin]);

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

  // Load profile/settings after auth is ready.
  useEffect(() => {
    if (!user?.id) return;
    loadProfile();
  }, [user?.id, loadProfile]);

  // Apply theme from profile (if set).
  useEffect(() => {
    applyTheme({
      mode: profile?.themeMode === "light" ? "light" : "dark",
      primaryHex: profile?.themePrimary,
      accentHex: profile?.themeAccent,
    });
  }, [profile?.themeMode, profile?.themePrimary, profile?.themeAccent]);

  // Backfill userEmail for older rows after email login.
  useEffect(() => {
    if (!user?.id) return;
    if (!user.email) return; // guest sessions have no email
    const key = `dt.backfillEmail.${user.id}.${user.email}`;
    try {
      if (localStorage.getItem(key) === "1") return;
      localStorage.setItem(key, "1");
    } catch {
      // ignore
    }
    backfillUserEmail().catch((e) => {
      console.error("userEmail backfill failed", e);
    });
  }, [user?.id, user?.email]);

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
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      </div>
      
      <main
        className="transition-all duration-300 ease-in-out pb-16 lg:pb-0"
        style={{
          marginLeft: isMobile ? "0px" : marginLeft,
        }}
      >
        <AppHeader />
        <div className="p-4 sm:p-6">{children}</div>
      </main>
      
      {/* Bottom Navigation - shown only on mobile */}
      <BottomNav />
    </div>
  );
}
