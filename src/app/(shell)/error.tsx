"use client";

import { useEffect } from "react";

export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/39f67edb-5359-4afa-af41-b72b25689195", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "run2",
        hypothesisId: "H5",
        location: "src/app/(shell)/error.tsx",
        message: "Shell error boundary caught an error",
        data: {
          name: error?.name,
          message: error?.message,
          digest: (error as any)?.digest,
          stack: error?.stack?.split("\n").slice(0, 8).join("\n"),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-16">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          A runtime error occurred. I captured a debug log so we can fix it.
        </p>
        <button onClick={() => reset()} className="btn-primary mt-4">
          Try again
        </button>
      </div>
    </div>
  );
}

