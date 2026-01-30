"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { VerifyCodeForm } from "@/components/auth/VerifyCodeForm";
import { instantDb } from "@/lib/instantdb";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = instantDb.useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const devBypassLogin =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_BYPASS_LOGIN === "1";

  useEffect(() => {
    if (user?.id) {
      router.replace("/");
    }
  }, [router, user?.id]);

  useEffect(() => {
    if (!devBypassLogin) return;
    if (user?.id) return;
    if (authLoading) return;
    instantDb.auth.signInAsGuest().catch((e) => {
      console.error("Dev guest sign-in failed", e);
    });
  }, [devBypassLogin, user?.id, authLoading]);

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <div className="card-glow w-full p-6">
          {email ? (
            <VerifyCodeForm email={email} onBack={() => setEmail(null)} />
          ) : (
            <LoginForm onSent={setEmail} />
          )}
        </div>
      </div>
    </div>
  );
}

