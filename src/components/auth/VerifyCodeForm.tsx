"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, KeyRound, RotateCw } from "lucide-react";
import { instantDb } from "@/lib/instantdb";

export function VerifyCodeForm({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => code.trim().length >= 4, [code]);

  const submit = async () => {
    setError(null);
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setIsSubmitting(true);
    try {
      await instantDb.auth.signInWithMagicCode({ email, code: cleanCode });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid code.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    setError(null);
    setIsResending(true);
    try {
      await instantDb.auth.sendMagicCode({ email });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to resend code.";
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <button
          type="button"
          className="btn-ghost -ml-2 inline-flex items-center gap-2 px-2 py-1 text-sm"
          onClick={onBack}
          disabled={isSubmitting || isResending}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Enter your code
        </h1>
        <p className="text-sm text-text-secondary">
          We sent a code to <span className="text-text-primary">{email}</span>.
        </p>
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="code">
          Code
        </label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            className="input pl-10 tracking-[0.2em]"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            disabled={isSubmitting}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <button
        type="button"
        className="btn-primary w-full"
        onClick={submit}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>

      <button
        type="button"
        className="btn-secondary w-full"
        onClick={resend}
        disabled={isSubmitting || isResending}
      >
        <RotateCw className="h-4 w-4" />
        <span className="ml-2">{isResending ? "Resending…" : "Resend code"}</span>
      </button>
    </div>
  );
}

