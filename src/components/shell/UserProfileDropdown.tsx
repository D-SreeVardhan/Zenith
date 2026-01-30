"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { instantDb } from "@/lib/instantdb";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

function initialsFromEmail(email?: string | null) {
  if (!email) return "U";
  const [name] = email.split("@");
  const parts = name.split(/[._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? name[0] ?? "u";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return (first + second).toUpperCase();
}

export function UserProfileDropdown({ className }: { className?: string }) {
  const router = useRouter();
  const { user } = instantDb.useAuth();
  const profile = useAppStore((s) => s.profile);

  const email = user?.email ?? "";
  const initials = initialsFromEmail(email);
  const displayName = profile?.username?.trim() || email;

  if (!user?.id) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            "group inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary",
            className
          )}
          aria-label="Open user menu"
        >
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent ring-1 ring-accent/25">
              {initials}
            </span>
          )}
          <span className="hidden max-w-[180px] truncate sm:block">{displayName}</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl"
          sideOffset={8}
          align="end"
        >
          <div className="px-2.5 py-2">
            <div className="flex items-center gap-2">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent ring-1 ring-accent/25">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">Signed in</p>
                <p className="truncate text-xs text-text-secondary">{email}</p>
                {profile?.username && (
                  <p className="truncate text-[11px] text-text-muted">{profile.username}</p>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-text-primary outline-none hover:bg-surface-hover"
            onClick={() => router.push("/")}
          >
            <User className="h-4 w-4 text-text-muted" />
            Dashboard
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-400 outline-none hover:bg-red-500/10"
            onClick={async () => {
              await instantDb.auth.signOut();
              router.replace("/auth/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

