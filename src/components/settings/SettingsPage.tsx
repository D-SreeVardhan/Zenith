"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogOut, Palette, User, History } from "lucide-react";
import { instantDb } from "@/lib/instantdb";
import { cn } from "@/lib/utils";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { useAppStore } from "@/store/useAppStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProfilePhotoPicker } from "@/components/settings/ProfilePhotoPicker";

type SettingsTab = "profile" | "theme" | "activity" | "account";

const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "theme", label: "Theme", icon: <Palette className="h-4 w-4" /> },
  { id: "activity", label: "Activity", icon: <History className="h-4 w-4" /> },
  { id: "account", label: "Account", icon: <LogOut className="h-4 w-4" /> },
];

export function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loadProfile, updateProfile } = useAppStore();

  const initialTab = useMemo<SettingsTab>(() => {
    const t = (searchParams.get("tab") || "").toLowerCase();
    if (t === "profile" || t === "theme" || t === "activity" || t === "account") return t;
    return "profile";
  }, [searchParams]);

  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [themePrimary, setThemePrimary] = useState("#c9a962");
  const [themeAccent, setThemeAccent] = useState("#7c9a7a");
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [savingTheme, setSavingTheme] = useState(false);
  const [confirmLightOpen, setConfirmLightOpen] = useState(false);
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [timeFont, setTimeFont] = useState<"system" | "mono" | "serif" | "rounded">("system");

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setUsername(profile?.username ?? "");
    setAvatarUrl(profile?.avatarUrl ?? "");
    setThemePrimary(profile?.themePrimary ?? "#c9a962");
    setThemeAccent(profile?.themeAccent ?? "#7c9a7a");
    setThemeMode(profile?.themeMode === "light" ? "light" : "dark");
    setTimeFormat(profile?.timeFormat === "24h" ? "24h" : "12h");
    setTimeFont(
      profile?.timeFont === "mono" || profile?.timeFont === "serif" || profile?.timeFont === "rounded"
        ? profile.timeFont
        : "system"
    );
  }, [
    profile?.username,
    profile?.avatarUrl,
    profile?.themePrimary,
    profile?.themeAccent,
    profile?.themeMode,
    profile?.timeFormat,
    profile?.timeFont,
  ]);

  const setTabAndUrl = (next: SettingsTab) => {
    setTab(next);
    router.replace(`/settings?tab=${next}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Personalize your experience. Changes sync to your account.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTabAndUrl(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "profile" && (
        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">Profile</h2>
          <p className="text-sm text-text-secondary">
            Add a username and profile picture (optional). If you leave this empty, the app will keep using your initials.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="label">Username</label>
              <input
                className="input"
                value={username}
                placeholder="Optional"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="label">Profile photo</label>
              <ProfilePhotoPicker
                value={avatarUrl || undefined}
                onChange={(dataUrl) => setAvatarUrl(dataUrl ?? "")}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => {
                setUsername(profile?.username ?? "");
                setAvatarUrl(profile?.avatarUrl ?? "");
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn-primary text-sm disabled:opacity-50"
              disabled={savingProfile}
              onClick={async () => {
                setSavingProfile(true);
                try {
                  await updateProfile({
                    username: username.trim() || undefined,
                    avatarUrl: avatarUrl.trim() || undefined,
                  });
                } finally {
                  setSavingProfile(false);
                }
              }}
            >
              {savingProfile ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {tab === "theme" && (
        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">Theme</h2>
          <p className="text-sm text-text-secondary">
            Choose your Primary and Secondary (accent) colors.
          </p>

          {/* Dark / Light toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated p-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Mode</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={themeMode === "light"}
              onClick={() => {
                const next = themeMode === "dark" ? "light" : "dark";
                if (next === "light") {
                  setConfirmLightOpen(true);
                } else {
                  setThemeMode("dark");
                  updateProfile({ themeMode: "dark" });
                }
              }}
              className={cn(
                "relative h-7 w-12 rounded-full border transition-colors",
                themeMode === "light"
                  ? "border-accent/30 bg-accent/15"
                  : "border-border bg-surface"
              )}
            >
              <span
                className={cn(
                  "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-text-primary shadow-sm ring-1 ring-border transition-all",
                  themeMode === "light" ? "left-6" : "left-1"
                )}
              />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="label">Primary</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-10 rounded-lg border border-border bg-surface"
                  value={themePrimary}
                  onChange={(e) => setThemePrimary(e.target.value)}
                  aria-label="Pick primary color"
                />
                <input
                  className="input flex-1"
                  value={themePrimary}
                  onChange={(e) => setThemePrimary(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="label">Secondary (accent)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-10 rounded-lg border border-border bg-surface"
                  value={themeAccent}
                  onChange={(e) => setThemeAccent(e.target.value)}
                  aria-label="Pick secondary accent color"
                />
                <input
                  className="input flex-1"
                  value={themeAccent}
                  onChange={(e) => setThemeAccent(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Clock settings */}
          <div className="mt-2 rounded-lg border border-border bg-surface-elevated p-3 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Clock</p>
                <p className="text-xs text-text-muted">Shown in the top header.</p>
              </div>
              <div className="text-sm font-semibold text-accent tabular-nums">
                {new Date().toLocaleTimeString("en-US", {
                  hour: timeFormat === "24h" ? "2-digit" : "numeric",
                  minute: "2-digit",
                  hour12: timeFormat !== "24h",
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-muted">Format</span>
              <div className="flex items-center gap-1.5">
                {(["12h", "24h"] as const).map((f) => {
                  const active = timeFormat === f;
                  return (
                    <button
                      key={`timefmt-${f}`}
                      type="button"
                      onClick={() => setTimeFormat(f)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-[11px] font-semibold transition-all",
                        active
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border bg-surface text-text-muted hover:border-accent/30 hover:bg-accent/5"
                      )}
                    >
                      {f.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-text-muted">Font</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  { id: "system", label: "System", cls: "" },
                  { id: "mono", label: "Mono", cls: "font-mono" },
                  { id: "serif", label: "Serif", cls: "font-serif" },
                  { id: "rounded", label: "Rounded", cls: "font-sans tracking-tight" },
                ] as const).map((opt) => {
                  const active = timeFont === opt.id;
                  return (
                    <button
                      key={`timefont-${opt.id}`}
                      type="button"
                      onClick={() => setTimeFont(opt.id)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                        active
                          ? "border-accent/30 bg-accent/10"
                          : "border-border bg-surface hover:bg-surface-hover"
                      )}
                    >
                      <span className={cn("text-sm font-medium", active ? "text-accent" : "text-text-primary")}>
                        {opt.label}
                      </span>
                      <span className={cn("text-sm text-text-secondary tabular-nums", opt.cls)}>
                        12:34
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => {
                // Reset colors to defaults (does not change light/dark mode).
                setThemePrimary("#c9a962");
                setThemeAccent("#7c9a7a");
                updateProfile({ themePrimary: "#c9a962", themeAccent: "#7c9a7a" });
              }}
            >
              Reset to default
            </button>
            <button
              type="button"
              className="btn-primary text-sm disabled:opacity-50"
              disabled={savingTheme}
              onClick={async () => {
                setSavingTheme(true);
                try {
                  await updateProfile({
                    themePrimary: themePrimary.trim() || undefined,
                    themeAccent: themeAccent.trim() || undefined,
                    themeMode,
                    timeFormat,
                    timeFont,
                  });
                } finally {
                  setSavingTheme(false);
                }
              }}
            >
              {savingTheme ? "Saving…" : "Save"}
            </button>
          </div>

          <ConfirmDialog
            open={confirmLightOpen}
            onOpenChange={setConfirmLightOpen}
            title="Really Bro?"
            description="Are you sure you want to switch to light mode?"
            confirmLabel="Yes"
            cancelLabel="No"
            variant="warning"
            onConfirm={() => {
              setThemeMode("light");
              updateProfile({ themeMode: "light" });
            }}
            onCancel={() => {
              // Do nothing; keep current mode.
            }}
          />
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-text-primary">Activity</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Recent actions and changes. Undo mistakes before they&apos;re permanent.
            </p>
          </div>
          <ActivityFeed compact />
        </div>
      )}

      {tab === "account" && (
        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">Account</h2>
          <p className="text-sm text-text-secondary">
            Redundant logout button for convenience.
          </p>
          <button
            type="button"
            className="btn-ghost inline-flex items-center gap-2"
            onClick={async () => {
              await instantDb.auth.signOut();
              router.replace("/auth/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

