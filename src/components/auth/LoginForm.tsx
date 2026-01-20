"use client";

import { useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { instantDb } from "@/lib/instantdb";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginForm({
  onSent,
}: {
  onSent: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => isValidEmail(email.trim()), [email]);

  const submit = async () => {
    const clean = email.trim().toLowerCase();
    setError(null);
    if (!isValidEmail(clean)) {
      setError("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      await instantDb.auth.sendMagicCode({ email: clean });
      onSent(clean);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to send code.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Sign in
        </h1>
        <p className="text-sm text-text-secondary">
          We’ll email you a one-time code to log in.
        </p>
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="input pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        {isSubmitting ? "Sending…" : "Send code"}
      </button>

      <p className="text-xs text-text-muted">
        By continuing, you agree to store your progress in the cloud so it syncs
        across devices.
      </p>
    </div>
  );
}

