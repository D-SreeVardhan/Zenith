"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { VerifyCodeForm } from "@/components/auth/VerifyCodeForm";
import { instantDb } from "@/lib/instantdb";

export default function LoginPage() {
  const router = useRouter();
  const { user } = instantDb.useAuth();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      router.replace("/");
    }
  }, [router, user?.id]);

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

