"use client";

import { useEffect } from "react";

export default function GlobalError({
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
        location: "src/app/error.tsx",
        message: "Global error boundary caught an error",
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
    <html>
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,sans-serif",
          background: "#0a0a0b",
          color: "#e8e6e3",
        }}
      >
        <div style={{ maxWidth: 560, margin: "64px auto", padding: 24 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Something went wrong</h2>
          <p style={{ margin: "0 0 16px", color: "#a8a5a0" }}>
            A runtime error occurred. I captured a debug log so we can fix it.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "rgba(201, 169, 98, 0.15)",
              color: "#c9a962",
              border: "1px solid #2a2a2f",
              borderRadius: 10,
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

